const fs = require("fs");
const path = require("path");

const DIR_UPLOADS = path.join(__dirname, "..", "uploads");
const ARCHIVO_USUARIOS = path.join(__dirname, "..", "data", "usuarios.json");
const ARCHIVO_DOCUMENTOS = path.join(__dirname, "..", "data", "documentos.json");
const ARCHIVO_ARCHIVOS = path.join(__dirname, "..", "data", "archivos.json");
const ARCHIVO_SOPORTE = path.join(__dirname, "..", "data", "soporte.json");
const ARCHIVO_CORREOS = path.join(__dirname, "..", "data", "correos.json");
const ARCHIVO_AUDITORIA = path.join(__dirname, "..", "data", "auditoria.json");

// Asegurar directorios
fs.mkdirSync(path.dirname(ARCHIVO_USUARIOS), { recursive: true });
fs.mkdirSync(DIR_UPLOADS, { recursive: true });

function leerJSON(rutaArchivo, fallback = []) {
  if (!fs.existsSync(rutaArchivo)) {
    escribirJSON(rutaArchivo, fallback);
    return fallback;
  }
  try {
    const contenido = fs.readFileSync(rutaArchivo, "utf-8");
    return JSON.parse(contenido);
  } catch (error) {
    escribirJSON(rutaArchivo, fallback);
    return fallback;
  }
}

function escribirJSON(rutaArchivo, datos) {
  fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2), "utf-8");
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
