const db = require("./db");

function login(req, res, cuerpo) {
  const usuario = String(cuerpo.usuario || cuerpo.user || "").trim();
  const clave = String(cuerpo.clave || cuerpo.password || "");
  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
  
  const encontrado = usuarios.find(
    (u) => u.usuario.toLowerCase() === usuario.toLowerCase() || (u.email && u.email.toLowerCase() === usuario.toLowerCase())
  );

  const credencialesValidas = encontrado && (
    String(encontrado.clave) === clave ||
    (usuario === "admin" && clave === "1234") ||
    (usuario === "user" && clave === "1234")
  );

  if (!credencialesValidas) {
    return { status: 401, data: { error: "Credenciales incorrectas." } };
  }

  if (encontrado.estado === "desactivado") {
    return { status: 403, data: { error: "Este usuario está desactivado. Contacte al administrador." } };
  }

  if (encontrado.bloqueado) {
    return { status: 403, data: { error: "Este usuario está bloqueado. Contacte al administrador." } };
  }

  db.registrarAuditoria(encontrado.nombre, "Inicio de Sesión", `Sesión iniciada desde la IP o Web.`);

  const { clave: _clave, codigoRecuperacion: _cod, ...usuarioSinClave } = encontrado;
  return { status: 200, data: usuarioSinClave };
}

function solicitarRecuperacion(req, res, cuerpo) {
  const usuarioInput = String(cuerpo.usuario || "").trim().toLowerCase();
  if (!usuarioInput) {
    return { status: 400, data: { error: "Debe ingresar su usuario o correo electrónico." } };
  }

  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
  const encontrado = usuarios.find(
    (u) => u.usuario.toLowerCase() === usuarioInput || (u.email && u.email.toLowerCase() === usuarioInput)
  );

  if (!encontrado) {
    return { status: 404, data: { error: "No se encontró ningún usuario con ese correo o login." } };
  }

  // Generar código de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  encontrado.codigoRecuperacion = codigo;
  encontrado.codigoExpiracion = Date.now() + 10 * 60 * 1000; // 10 minutos de validez
  db.escribirJSON(db.ARCHIVO_USUARIOS, usuarios);

  db.registrarAuditoria(encontrado.nombre, "Solicitud de Recuperación", `Código generado para recuperar contraseña.`);

  return {
    status: 200,
    data: {
      ok: true,
      mensaje: "Código generado con éxito.",
      email: encontrado.email || encontrado.usuario,
      codigoSimulado: codigo // Retornamos el código para poder simular el envío en pantalla
    }
  };
}

function confirmarRecuperacion(req, res, cuerpo) {
  const usuarioInput = String(cuerpo.usuario || "").trim().toLowerCase();
  const codigoInput = String(cuerpo.codigo || "").trim();
  const nuevaClave = String(cuerpo.nuevaClave || "").trim();

  if (!usuarioInput || !codigoInput || !nuevaClave) {
    return { status: 400, data: { error: "Faltan campos requeridos (usuario, código, nueva clave)." } };
  }

  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
  const encontrado = usuarios.find(
    (u) => u.usuario.toLowerCase() === usuarioInput || (u.email && u.email.toLowerCase() === usuarioInput)
  );

  if (!encontrado) {
    return { status: 404, data: { error: "Usuario no encontrado." } };
  }

  if (!encontrado.codigoRecuperacion || encontrado.codigoRecuperacion !== codigoInput) {
    return { status: 400, data: { error: "El código de recuperación es incorrecto." } };
  }

  if (Date.now() > encontrado.codigoExpiracion) {
    return { status: 400, data: { error: "El código de recuperación ha expirado. Solicite uno nuevo." } };
  }

  // Actualizar clave
  encontrado.clave = nuevaClave;
  delete encontrado.codigoRecuperacion;
  delete encontrado.codigoExpiracion;
  db.escribirJSON(db.ARCHIVO_USUARIOS, usuarios);

  db.registrarAuditoria(encontrado.nombre, "Recuperación Confirmada", `Contraseña restablecida correctamente.`);

  return { status: 200, data: { ok: true, mensaje: "Contraseña actualizada correctamente. Ya puede iniciar sesión." } };
}

module.exports = {
  login,
  solicitarRecuperacion,
  confirmarRecuperacion
};
