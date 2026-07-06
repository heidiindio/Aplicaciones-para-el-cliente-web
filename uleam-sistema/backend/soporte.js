const db = require("./db");

function listarTickets(req, res) {
  const tickets = db.leerJSON(db.ARCHIVO_SOPORTE);
  return { status: 200, data: tickets };
}

function crearTicket(req, res, cuerpo) {
  const { asunto, descripcion, prioridad, usuarioId, usuarioNombre } = cuerpo;
  if (!asunto || !descripcion) {
    return { status: 400, data: { error: "Complete asunto y descripción." } };
  }

  const tickets = db.leerJSON(db.ARCHIVO_SOPORTE);
  const nuevo = {
    id: db.siguienteId(tickets),
    asunto: asunto.trim(),
    descripcion: descripcion.trim(),
    prioridad: prioridad || "media",
    usuarioId: usuarioId || null,
    usuarioNombre: usuarioNombre || "Usuario",
    fecha: db.ahoraISO(),
    estado: "abierto"
  };

  tickets.push(nuevo);
  db.escribirJSON(db.ARCHIVO_SOPORTE, tickets);
  db.registrarAuditoria(usuarioNombre, "Soporte Creado", `Creó ticket de soporte: ${nuevo.asunto}`);

  return { status: 201, data: nuevo };
}

function actualizarTicket(req, res, id, cambios) {
  const tickets = db.leerJSON(db.ARCHIVO_SOPORTE);
  const ticket = tickets.find((t) => t.id === id);

  if (!ticket) {
    return { status: 404, data: { error: "Ticket no encontrado." } };
  }

  Object.assign(ticket, cambios);
  db.escribirJSON(db.ARCHIVO_SOPORTE, tickets);
  db.registrarAuditoria("Administrador", "Soporte Actualizado", `Ticket de soporte #${id} cambiado a estado: ${ticket.estado}`);

  return { status: 200, data: ticket };
}

module.exports = {
  listarTickets,
  crearTicket,
  actualizarTicket
};
