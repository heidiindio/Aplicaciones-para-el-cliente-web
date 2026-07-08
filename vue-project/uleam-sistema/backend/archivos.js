const fs = require("fs");
const path = require("path");
const db = require("./db");

function listarArchivos(req, res, urlObj) {
  const usuarioId = urlObj.searchParams.get("usuarioId");
  const archivos = db.leerJSON(db.ARCHIVO_ARCHIVOS);
  if (!usuarioId) return { status: 200, data: archivos };
  const filtrados = archivos.filter((archivo) => 
    Number(archivo.propietarioId) === Number(usuarioId) || Number(archivo.destinatarioId) === Number(usuarioId)
  );
  return { status: 200, data: filtrados };
}

function crearArchivo(req, res, cuerpo) {
  const { 
    nombreOriginal, contenidoBase64, tipo, categoria, facultad, fecha, 
    comentario, destinatarioId, propietarioId, propietarioNombre, titulo, 
    etiquetas, tipoDocumento 
  } = cuerpo;

  if (!nombreOriginal || !contenidoBase64) {
    return { status: 400, data: { error: "Falta el archivo o su contenido." } };
  }

  const archivos = db.leerJSON(db.ARCHIVO_ARCHIVOS);
  const nombreSeguro = `${Date.now()}_${nombreOriginal.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
  const rutaDestino = path.join(db.DIR_UPLOADS, nombreSeguro);
  
  const buffer = Buffer.from(contenidoBase64, "base64");
  try {
    fs.writeFileSync(rutaDestino, buffer);
  } catch (err) {
    console.error("Advertencia: No se pudo guardar el archivo físico en el servidor (entorno de sólo lectura):", err.message);
  }

  const ext = path.extname(nombreOriginal).replace(".", "").toLowerCase() || "bin";
  const tamanoBytes = buffer.length;

  const nuevo = {
    id: db.siguienteId(archivos),
    nombreOriginal,
    nombreStored: nombreSeguro,
    ruta: `/uploads/${nombreSeguro}`,
    tipo: tipo || "application/octet-stream",
    extension: ext,
    tamano: tamanoBytes,
    categoria: categoria || "Documentación",
    facultad: facultad || "",
    fecha: fecha || db.hoyISO(),
    comentario: comentario || "",
    titulo: titulo || nombreOriginal.replace(/\.[^/.]+$/, ""),
    etiquetas: etiquetas || "",
    tipoDocumento: tipoDocumento || "",
    propietarioId: Number(propietarioId) || null,
    propietarioNombre: propietarioNombre || "",
    destinatarioId: destinatarioId ? Number(destinatarioId) : null,
    destinatarioNombre: "",
    estado: destinatarioId ? "enviado" : "registrado",
    fechaRegistro: db.ahoraISO()
  };

  // Buscar nombre del destinatario si existe
  if (nuevo.destinatarioId) {
    const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
    const dest = usuarios.find((u) => u.id === nuevo.destinatarioId);
    if (dest) {
      nuevo.destinatarioNombre = dest.nombre;
    }
  }

  archivos.push(nuevo);
  db.escribirJSON(db.ARCHIVO_ARCHIVOS, archivos);
  db.registrarAuditoria(propietarioNombre, "Archivo Subido", `Subió el archivo ${nuevo.nombreOriginal} (${ext.toUpperCase()}, ${(tamanoBytes / 1024).toFixed(1)} KB)`);

  return { status: 201, data: nuevo };
}

function eliminarArchivo(req, res, id, usuarioNombre) {
  const archivos = db.leerJSON(db.ARCHIVO_ARCHIVOS);
  const indice = archivos.findIndex((a) => a.id === id);
  if (indice === -1) {
    return { status: 404, data: { error: "Archivo no encontrado." } };
  }

  const archivo = archivos[indice];
  const rutaCompleta = path.join(__dirname, "..", "uploads", archivo.nombreStored);

  // Eliminar de disco
  if (fs.existsSync(rutaCompleta)) {
    try {
      fs.unlinkSync(rutaCompleta);
    } catch (e) {
      console.error("Error al eliminar archivo físico:", e);
    }
  }

  archivos.splice(indice, 1);
  db.escribirJSON(db.ARCHIVO_ARCHIVOS, archivos);
  db.registrarAuditoria(usuarioNombre, "Archivo Eliminado", `Eliminó el archivo ${archivo.nombreOriginal}`);

  return { status: 200, data: { ok: true, mensaje: "Archivo eliminado correctamente." } };
}

module.exports = {
  listarArchivos,
  crearArchivo,
  eliminarArchivo
};
