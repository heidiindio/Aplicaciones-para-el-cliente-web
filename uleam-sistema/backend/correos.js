const fs = require("fs");
const path = require("path");
const db = require("./db");

function listarCorreos(req, res) {
  const correos = db.leerJSON(db.ARCHIVO_CORREOS);
  return { status: 200, data: correos };
}

function enviarCorreo(req, res, cuerpo) {
  const { destinatarioId, asunto, mensaje, adjuntos = [], remitenteId, remitenteNombre } = cuerpo;
  if (!destinatarioId || !asunto || !mensaje) {
    return { status: 400, data: { error: "Complete destinatario, asunto y mensaje." } };
  }

  const correos = db.leerJSON(db.ARCHIVO_CORREOS);
  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
  const destinatario = usuarios.find((u) => Number(u.id) === Number(destinatarioId));
  const adjuntosPersistidos = [];

  const archivos = db.leerJSON(db.ARCHIVO_ARCHIVOS);

  for (const adjunto of adjuntos) {
    if (adjunto?.tipo === "local" && adjunto.contenidoBase64) {
      // Guardar el archivo en disco
      const nombreOriginal = adjunto.nombreOriginal;
      const nombreSeguro = `${Date.now()}_${nombreOriginal.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
      const rutaDestino = path.join(db.DIR_UPLOADS, nombreSeguro);
      
      const buffer = Buffer.from(adjunto.contenidoBase64, "base64");
      fs.writeFileSync(rutaDestino, buffer);

      const ext = path.extname(nombreOriginal).replace(".", "").toLowerCase() || "bin";
      const tamanoBytes = buffer.length;

      const nuevoArchivo = {
        id: db.siguienteId(archivos),
        nombreOriginal,
        nombreStored: nombreSeguro,
        ruta: `/uploads/${nombreSeguro}`,
        tipo: adjunto.tipo || "application/octet-stream",
        extension: ext,
        tamano: tamanoBytes,
        categoria: adjunto.categoria || "Documentación",
        facultad: adjunto.facultad || "",
        fecha: adjunto.fecha || db.hoyISO(),
        comentario: adjunto.comentario || `Adjunto de correo: ${asunto}`,
        titulo: adjunto.titulo || nombreOriginal.replace(/\.[^/.]+$/, ""),
        etiquetas: adjunto.etiquetas || "correo",
        tipoDocumento: adjunto.tipoDocumento || "",
        propietarioId: Number(remitenteId) || null,
        propietarioNombre: remitenteNombre || "",
        destinatarioId: Number(destinatarioId),
        destinatarioNombre: destinatario?.nombre || "",
        estado: "enviado",
        fechaRegistro: db.ahoraISO()
      };

      archivos.push(nuevoArchivo);
      db.escribirJSON(db.ARCHIVO_ARCHIVOS, archivos);

      adjuntosPersistidos.push({
        tipo: "guardado",
        archivoId: nuevoArchivo.id,
        nombreOriginal: nuevoArchivo.nombreOriginal,
        ruta: nuevoArchivo.ruta,
        categoria: nuevoArchivo.categoria,
        facultad: nuevoArchivo.facultad
      });
    } else if (adjunto?.tipo === "guardado" && adjunto.archivoId) {
      const archivo = archivos.find((item) => Number(item.id) === Number(adjunto.archivoId));
      if (archivo) {
        adjuntosPersistidos.push({
          tipo: "guardado",
          archivoId: archivo.id,
          nombreOriginal: archivo.nombreOriginal,
          ruta: archivo.ruta,
          categoria: archivo.categoria,
          facultad: archivo.facultad
        });
      }
    }
  }

  const nuevoCorreo = {
    id: db.siguienteId(correos),
    asunto: asunto.trim(),
    mensaje: mensaje.trim(),
    remitenteId: Number(remitenteId) || null,
    remitenteNombre: remitenteNombre || "",
    destinatarioId: Number(destinatarioId),
    destinatarioNombre: destinatario?.nombre || "",
    fecha: db.ahoraISO(),
    estado: "enviado",
    adjuntos: adjuntosPersistidos
  };

  correos.push(nuevoCorreo);
  db.escribirJSON(db.ARCHIVO_CORREOS, correos);
  db.registrarAuditoria(remitenteNombre, "Correo Enviado", `Envió mensaje interno a ${nuevoCorreo.destinatarioNombre}`);

  return { status: 201, data: nuevoCorreo };
}

module.exports = {
  listarCorreos,
  enviarCorreo
};
