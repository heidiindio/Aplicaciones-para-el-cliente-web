const fs = require("fs");
const path = require("path");

const DIR_UPLOADS = path.join(process.cwd(), "uploads");
const ARCHIVO_USUARIOS = path.join(process.cwd(), "data", "usuarios.json");
const ARCHIVO_DOCUMENTOS = path.join(process.cwd(), "data", "documentos.json");
const ARCHIVO_ARCHIVOS = path.join(process.cwd(), "data", "archivos.json");
const ARCHIVO_SOPORTE = path.join(process.cwd(), "data", "soporte.json");
const ARCHIVO_CORREOS = path.join(process.cwd(), "data", "correos.json");
const ARCHIVO_AUDITORIA = path.join(process.cwd(), "data", "auditoria.json");

// Asegurar directorios de forma segura (sin fallar si es de solo lectura)
try {
  fs.mkdirSync(path.dirname(ARCHIVO_USUARIOS), { recursive: true });
  fs.mkdirSync(DIR_UPLOADS, { recursive: true });
} catch (e) {
  console.warn("Advertencia: No se pudieron crear los directorios físicos (entorno de solo lectura):", e.message);
}

// Caché en memoria para evitar errores de escritura en hostings como Vercel (EROFS)
const cacheMemoria = {};

function leerJSON(rutaArchivo, fallback = []) {
  if (cacheMemoria[rutaArchivo]) {
    return cacheMemoria[rutaArchivo];
  }
  if (!fs.existsSync(rutaArchivo)) {
    escribirJSON(rutaArchivo, fallback);
    return fallback;
  }
  try {
    const contenido = fs.readFileSync(rutaArchivo, "utf-8");
    const datos = JSON.parse(contenido);
    cacheMemoria[rutaArchivo] = datos;
    return datos;
  } catch (error) {
    escribirJSON(rutaArchivo, fallback);
    return fallback;
  }
}

function escribirJSON(rutaArchivo, datos) {
  cacheMemoria[rutaArchivo] = datos;
  try {
    fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error al escribir en archivo ${rutaArchivo} (se mantendrá en memoria virtual):`, error.message);
  }
}

function siguienteId(lista) {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function ahoraISO() {
  return new Date().toISOString();
}

function registrarAuditoria(usuario, accion, detalles) {
  const auditorias = leerJSON(ARCHIVO_AUDITORIA);
  const nueva = {
    id: siguienteId(auditorias),
    fecha: ahoraISO(),
    usuario: usuario || "Sistema",
    accion,
    detalles: detalles || ""
  };
  auditorias.push(nueva);
  escribirJSON(ARCHIVO_AUDITORIA, auditorias);
}

module.exports = {
  DIR_UPLOADS,
  ARCHIVO_USUARIOS,
  ARCHIVO_DOCUMENTOS,
  ARCHIVO_ARCHIVOS,
  ARCHIVO_SOPORTE,
  ARCHIVO_CORREOS,
  ARCHIVO_AUDITORIA,
  leerJSON,
  escribirJSON,
  siguienteId,
  hoyISO,
  ahoraISO,
  registrarAuditoria
};
