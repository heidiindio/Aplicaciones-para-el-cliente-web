async function llamarApi(url, opciones = {}) {
  let respuesta;
  try {
    // Si hay una sesión activa, podemos adjuntar cabeceras personalizadas de auditoría
    const sesion = JSON.parse(localStorage.getItem("uleam_sesion") || "{}");
    if (sesion && sesion.usuario) {
      if (!opciones.headers) {
        opciones.headers = {};
      }
      opciones.headers["X-User-Name"] = encodeURIComponent(sesion.usuario);
      opciones.headers["X-User-Id"] = sesion.id;
    }

    respuesta = await fetch(url, opciones);
  } catch (err) {
    throw new Error('No se pudo conectar con el servidor. Verifique si el servicio está levantado en la nube o local.');
  }

  let datos = {};
  try {
    const texto = await respuesta.text();
    try {
      datos = JSON.parse(texto);
    } catch (e) {
      datos = { error: texto };
    }
  } catch (err) {}

  if (!respuesta.ok) {
    const msgError = datos.error || `Error del servidor (Status: ${respuesta.status}). Por favor, recargue la página.`;
    throw new Error(msgError);
  }
  return datos;
}

window.AppApi = {
  llamarApi
};
