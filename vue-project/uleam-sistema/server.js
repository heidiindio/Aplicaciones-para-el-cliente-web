const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// Módulos locales
const db = require("./backend/db");
const auth = require("./backend/auth");
const usuarios = require("./backend/usuarios");
const documentos = require("./backend/documentos");
const archivos = require("./backend/archivos");
const correos = require("./backend/correos");
const soporte = require("./backend/soporte");

const PUERTO = process.env.PORT || 3000;
const DIR_PUBLIC = path.join(process.cwd(), "public");

function leerCuerpoJSON(req) {
  return new Promise((resolve) => {
    let cuerpo = "";
    req.on("data", (chunk) => (cuerpo += chunk));
    req.on("end", () => {
      if (!cuerpo.trim()) return resolve({});
      try {
        resolve(JSON.parse(cuerpo));
      } catch (err) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function aplicarCabecerasCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Name, X-User-Id");
}

function enviarJSON(res, status, data) {
  const cuerpo = JSON.stringify(data);
  aplicarCabecerasCORS(res);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(cuerpo)
  });
  res.end(cuerpo);
}

const TIPOS_MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function servirArchivoEstatico(req, res, pathname) {
  aplicarCabecerasCORS(res);
  const rutaSolicitada = pathname === "/" ? "/index.html" : pathname;

  const rutaAbsoluta = pathname.startsWith("/uploads/")
    ? path.join(process.cwd(), pathname.replace(/^\/+/, ""))
    : path.join(DIR_PUBLIC, rutaSolicitada);

  const raizPermitida = pathname.startsWith("/uploads/") ? process.cwd() : DIR_PUBLIC;

  if (!rutaAbsoluta.startsWith(raizPermitida)) {
    res.writeHead(403);
    return res.end("Prohibido");
  }

  fs.readFile(rutaAbsoluta, (err, contenido) => {
    if (err) {
      // En Vercel, si no se encuentra el archivo estático, servir index.html (SPA fallback)
      if (err.code === "ENOENT" && !pathname.startsWith("/uploads/")) {
        fs.readFile(path.join(DIR_PUBLIC, "index.html"), (err2, html) => {
          if (err2) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            return res.end("404 - No encontrado");
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          return res.end(html);
        });
      } else {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("404 - No encontrado");
      }
      return;
    }
    const ext = path.extname(rutaAbsoluta);
    res.writeHead(200, { "Content-Type": TIPOS_MIME[ext] || "application/octet-stream" });
    res.end(contenido);
  });
}

async function manejarApi(req, res, pathname, urlObj) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, X-User-Name, X-User-Id"
    });
    return res.end();
  }

  let result = { status: 404, data: { error: "Ruta de API no encontrada." } };

  // 1. AUTENTICACIÓN Y RECUPERACIÓN
  if (pathname === "/api/login" && req.method === "POST") {
    const cuerpo = await leerCuerpoJSON(req);
    result = auth.login(req, res, cuerpo);
  }
  else if (pathname === "/api/recuperar-clave/solicitar" && req.method === "POST") {
    const cuerpo = await leerCuerpoJSON(req);
    result = auth.solicitarRecuperacion(req, res, cuerpo);
  }
  else if (pathname === "/api/recuperar-clave/confirmar" && req.method === "POST") {
    const cuerpo = await leerCuerpoJSON(req);
    result = auth.confirmarRecuperacion(req, res, cuerpo);
  }

  // 2. USUARIOS
  else if (pathname === "/api/usuarios") {
    if (req.method === "GET") {
      result = usuarios.listarUsuarios(req, res);
    } else if (req.method === "POST") {
      const cuerpo = await leerCuerpoJSON(req);
      result = usuarios.crearUsuario(req, res, cuerpo);
    }
  }
  else if (pathname.match(/^\/api\/usuarios\/(\d+)$/)) {
    const id = Number(pathname.match(/^\/api\/usuarios\/(\d+)$/)[1]);
    if (req.method === "DELETE") {
      result = usuarios.eliminarUsuario(req, res, id);
    } else if (req.method === "PATCH") {
      const cuerpo = await leerCuerpoJSON(req);
      result = usuarios.actualizarUsuario(req, res, id, cuerpo);
    }
  }

  // 3. DOCUMENTOS / TRÁMITES
  else if (pathname === "/api/documentos") {
    if (req.method === "GET") {
      result = documentos.listarDocumentos(req, res, urlObj);
    } else if (req.method === "POST") {
      const cuerpo = await leerCuerpoJSON(req);
      result = documentos.crearDocumento(req, res, cuerpo);
    }
  }
  else if (pathname.match(/^\/api\/documentos\/(\d+)$/)) {
    const id = Number(pathname.match(/^\/api\/documentos\/(\d+)$/)[1]);
    if (req.method === "PATCH") {
      const cuerpo = await leerCuerpoJSON(req);
      result = documentos.actualizarDocumento(req, res, id, cuerpo);
    }
  }

  // 4. ARCHIVOS DIGITALES
  else if (pathname === "/api/archivos") {
    if (req.method === "GET") {
      result = archivos.listarArchivos(req, res, urlObj);
    } else if (req.method === "POST") {
      const cuerpo = await leerCuerpoJSON(req);
      result = archivos.crearArchivo(req, res, cuerpo);
    }
  }
  else if (pathname.match(/^\/api\/archivos\/(\d+)$/)) {
    const id = Number(pathname.match(/^\/api\/archivos\/(\d+)$/)[1]);
    if (req.method === "DELETE") {
      const userHeader = req.headers["x-user-name"] || "Usuario";
      result = archivos.eliminarArchivo(req, res, id, decodeURIComponent(userHeader));
    }
  }

  // 5. CORREOS / MENSAJES INTERNOS
  else if (pathname === "/api/correos") {
    if (req.method === "GET") {
      result = correos.listarCorreos(req, res);
    } else if (req.method === "POST") {
      const cuerpo = await leerCuerpoJSON(req);
      result = correos.enviarCorreo(req, res, cuerpo);
    }
  }

  // 6. SOPORTE TÉCNICO
  else if (pathname === "/api/soporte") {
    if (req.method === "GET") {
      result = soporte.listarTickets(req, res);
    } else if (req.method === "POST") {
      const cuerpo = await leerCuerpoJSON(req);
      result = soporte.crearTicket(req, res, cuerpo);
    }
  }
  else if (pathname.match(/^\/api\/soporte\/(\d+)$/)) {
    const id = Number(pathname.match(/^\/api\/soporte\/(\d+)$/)[1]);
    if (req.method === "PATCH") {
      const cuerpo = await leerCuerpoJSON(req);
      result = soporte.actualizarTicket(req, res, id, cuerpo);
    }
  }

  // 7. AUDITORÍA GENERAL (Solo Admin)
  else if (pathname === "/api/auditoria" && req.method === "GET") {
    const auditoria = db.leerJSON(db.ARCHIVO_AUDITORIA);
    result = { status: 200, data: auditoria };
  }

  return enviarJSON(res, result.status, result.data);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL — compatible con Vercel Serverless y Node.js local
// ─────────────────────────────────────────────────────────────────────────────
async function handler(req, res) {
  // Normalizar la URL para Vercel (puede llegar sin host en algunos casos)
  const host = req.headers.host || "localhost";
  const base = `http://${host}`;
  let urlObj;
  try {
    urlObj = new URL(req.url, base);
  } catch (e) {
    urlObj = new URL("/", base);
  }
  const pathname = urlObj.pathname;

  try {
    if (pathname.startsWith("/api/")) {
      await manejarApi(req, res, pathname, urlObj);
    } else {
      servirArchivoEstatico(req, res, pathname);
    }
  } catch (error) {
    console.error("Error en el servidor:", error);
    enviarJSON(res, 500, { error: "Error interno del servidor." });
  }
}

// Exportar el handler para Vercel (y cualquier plataforma serverless)
module.exports = handler;

// Solo arrancar el servidor HTTP cuando se ejecuta directamente (desarrollo local)
if (require.main === module) {
  const servidor = http.createServer(handler);
  servidor.listen(PUERTO, () => {
    console.log(`✅ Servidor ULEAM corriendo en http://localhost:${PUERTO}`);
    console.log("   Separación de archivos en backend/ implementada correctamente.");
    console.log("   Módulo de base de datos JSON conectado.");
  });
}
