const db = require("./db");

function listarDocumentos(req, res, urlObj) {
  const usuarioId = urlObj ? urlObj.searchParams.get("usuarioId") : null;
  const rol = urlObj ? urlObj.searchParams.get("rol") : null;
  const documentos = db.leerJSON(db.ARCHIVO_DOCUMENTOS);
  if (!usuarioId || rol === "Administrador") return { status: 200, data: documentos };
  const id = Number(usuarioId);
  const filtrados = documentos.filter((d) =>
    Number(d.usuarioId) === id ||
    Number(d.usuarioDestinoId) === id ||
    Number(d.destinatarioId) === id
  );
  return { status: 200, data: filtrados };
}

function crearDocumento(req, res, cuerpo) {
  const { ticket, categoria, prioridad, remitente, facultad, carrera, asunto, destinatarioId, usuarioId, usuarioNombre } = cuerpo;
  if (!ticket || !categoria || !remitente || !facultad || !asunto) {
    return { status: 400, data: { error: "Faltan campos obligatorios." } };
  }

  // Leer documentos y usuarios desde la base de datos
  const documentos = db.leerJSON(db.ARCHIVO_DOCUMENTOS);

  let destinatarioNombre = null;
  if (destinatarioId) {
    const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
    const dest = usuarios.find((u) => Number(u.id) === Number(destinatarioId));
    if (dest) destinatarioNombre = dest.nombre;
  }

  const nuevo = {
    id: db.siguienteId(documentos),
    ticket: ticket.trim(),
    categoria,
    prioridad: prioridad || "media",
    remitente: remitente.trim(),
    facultad: facultad.trim(),
    carrera: carrera || "",
    asunto: asunto.trim(),
    fecha: db.hoyISO(),
    estado: "pendiente",
    fechaFirma: null,
    resultado: null,
    historial: [{ fecha: db.ahoraISO(), accion: "registrado", usuario: usuarioNombre || "Sistema" }],
    usuarioId: usuarioId || null,
    usuarioNombre: usuarioNombre || null,
    destinatarioId: destinatarioId ? Number(destinatarioId) : null,
    destinatarioNombre: destinatarioNombre || null
  };

  documentos.push(nuevo);
  db.escribirJSON(db.ARCHIVO_DOCUMENTOS, documentos);
  db.registrarAuditoria(usuarioNombre, "Documento Registrado", `Trámite formal ${nuevo.ticket} registrado`);

  return { status: 201, data: nuevo };
}

function actualizarDocumento(req, res, id, cambios) {
  const documentos = db.leerJSON(db.ARCHIVO_DOCUMENTOS);
  const documento = documentos.find((d) => d.id === id);

  if (!documento) {
    return { status: 404, data: { error: "Documento no encontrado." } };
  }

  const accion = cambios.accion || (cambios.estado === "archivado" ? "firmado" : cambios.estado === "denegado" ? "denegado" : "actualizado");
  Object.assign(documento, cambios);
  documento.historial = documento.historial || [];

  let usuarioDestinoNombre = null;
  if (cambios.usuarioDestino) {
    const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
    const destinatario = usuarios.find((u) => Number(u.id) === Number(cambios.usuarioDestino));
    if (destinatario) {
      usuarioDestinoNombre = destinatario.nombre;
      documento.usuarioDestinoId = Number(cambios.usuarioDestino);
      documento.usuarioDestinoNombre = destinatario.nombre;
    }
  }

  const accionTexto = accion === "delegado" && usuarioDestinoNombre
    ? `delegado a ${usuarioDestinoNombre}`
    : accion;
    
  documento.historial.push({ fecha: db.ahoraISO(), accion: accionTexto, usuario: cambios.usuario || "Sistema" });

  if (cambios.estado === "archivado") {
    documento.fechaFirma = db.hoyISO();
    documento.resultado = "firmado";
    db.registrarAuditoria(cambios.usuario, "Documento Firmado", `Trámite ${documento.ticket} firmado`);
  } else if (cambios.estado === "denegado") {
    documento.fechaFirma = db.hoyISO();
    documento.resultado = "denegado";
    db.registrarAuditoria(cambios.usuario, "Documento Denegado", `Trámite ${documento.ticket} rechazado`);
  } else if (accion === "delegado") {
    documento.fechaDelegacion = db.ahoraISO();
    documento.resultado = "delegado";
    db.registrarAuditoria(cambios.usuario, "Documento Delegado", `Trámite ${documento.ticket} delegado a ${usuarioDestinoNombre}`);
  }

  db.escribirJSON(db.ARCHIVO_DOCUMENTOS, documentos);
  return { status: 200, data: documento };
}

module.exports = {
  listarDocumentos,
  crearDocumento,
  actualizarDocumento
};
