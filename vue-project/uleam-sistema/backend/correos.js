const fs = require("fs");
const path = require("path");
const db = require("./db");

function listarUsuarios(req, res) {
  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS).map(({ clave, codigoRecuperacion, ...resto }) => resto);
  return { status: 200, data: usuarios };
}

function crearUsuario(req, res, cuerpo) {
  const { nombre, facultad, carrera, usuario, clave, rol, email } = cuerpo;
  if (!nombre || !facultad || !usuario || !clave || !rol) {
    return { status: 400, data: { error: "Faltan campos obligatorios." } };
  }

  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
  if (usuarios.some((u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase())) {
    return { status: 409, data: { error: "Ese nombre de usuario ya existe." } };
  }

  const nuevo = {
    id: db.siguienteId(usuarios),
    usuario: usuario.trim().toLowerCase(),
    clave,
    nombre: nombre.trim(),
    email: email ? email.trim() : `${usuario.trim().toLowerCase()}@live.uleam.edu.ec`,
    facultad: facultad.trim(),
    carrera: carrera ? carrera.trim() : "",
    rol,
    permisos: rol === "Administrador" ? "Lectura / Escritura / Gestión" : "Lectura / Escritura Limitada",
    estado: "activo",
    bloqueado: false,
    fotoPerfil: ""
  };

  usuarios.push(nuevo);
  db.escribirJSON(db.ARCHIVO_USUARIOS, usuarios);
  db.registrarAuditoria("Administrador", "Usuario Creado", `Se creó el usuario ${nuevo.usuario}`);

  const { clave: _clave, ...usuarioSinClave } = nuevo;
  return { status: 201, data: usuarioSinClave };
}

function eliminarUsuario(req, res, id) {
  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
  const indice = usuarios.findIndex((u) => u.id === id);
  if (indice === -1) {
    return { status: 404, data: { error: "Usuario no encontrado." } };
  }

  const usuario = usuarios[indice];
  if (usuario.bloqueado) {
    return { status: 403, data: { error: "Este usuario está protegido y no se puede eliminar." } };
  }

  const [usuarioEliminado] = usuarios.splice(indice, 1);
  db.escribirJSON(db.ARCHIVO_USUARIOS, usuarios);
  db.registrarAuditoria("Administrador", "Usuario Eliminado", `Se eliminó el usuario ${usuarioEliminado.usuario}`);

  return { status: 200, data: { ok: true, usuario: usuarioEliminado.usuario } };
}

function actualizarUsuario(req, res, id, cambios) {
  const usuarios = db.leerJSON(db.ARCHIVO_USUARIOS);
  const usuario = usuarios.find((u) => u.id === id);

  if (!usuario) {
    return { status: 404, data: { error: "Usuario no encontrado." } };
  }

  // Si tiene avatar en Base64, lo guardamos
  if (cambios.fotoPerfilBase64 && cambios.fotoPerfilNombre) {
    try {
      const nombreSeguro = `avatar_${usuario.id}_${Date.now()}_${cambios.fotoPerfilNombre.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
      const rutaDestino = path.join(db.DIR_UPLOADS, nombreSeguro);

      fs.writeFileSync(rutaDestino, Buffer.from(cambios.fotoPerfilBase64, "base64"));
      usuario.fotoPerfil = `/uploads/${nombreSeguro}`;
      db.registrarAuditoria(usuario.nombre, "Avatar Actualizado", "El usuario cambió su foto de perfil.");
    } catch (e) {
      console.error("Error al guardar el avatar:", e);
    }
  }

  // Modificaciones normales
  if (cambios.nombre) usuario.nombre = cambios.nombre.trim();
  if (cambios.email) usuario.email = cambios.email.trim();
  if (cambios.clave) usuario.clave = cambios.clave.trim();
  if (cambios.facultad) usuario.facultad = cambios.facultad.trim();
  if (cambios.carrera) usuario.carrera = cambios.carrera.trim();
  if (cambios.rol && !usuario.bloqueado) {
    usuario.rol = cambios.rol;
    usuario.permisos = cambios.rol === "Administrador" ? "Lectura / Escritura / Gestión" : "Lectura / Escritura Limitada";
  }
  if (cambios.estado !== undefined && !usuario.bloqueado) {
    usuario.estado = cambios.estado;
  }

  db.escribirJSON(db.ARCHIVO_USUARIOS, usuarios);

  const { clave: _clave, codigoRecuperacion: _cod, ...usuarioSinClave } = usuario;
  return { status: 200, data: usuarioSinClave };
}

module.exports = {
  listarUsuarios,
  crearUsuario,
  eliminarUsuario,
  actualizarUsuario
};
