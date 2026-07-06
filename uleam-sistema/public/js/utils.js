function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "-";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fechaISO) {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) {
    return formatearFecha(fechaISO.slice(0, 10));
  }
  return fecha.toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function indiceDiaHabil(fechaISO) {
  const diaJs = new Date(`${fechaISO}T00:00:00`).getDay();
  const mapa = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
  return mapa[diaJs] !== undefined ? mapa[diaJs] : -1;
}

function formatearTamano(bytes) {
  if (bytes === undefined || bytes === null) return "-";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const tamanos = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + tamanos[i];
}

function obtenerIconoArchivo(extension) {
  const ext = String(extension || "").toLowerCase();
  const mapa = {
    pdf: "fa-file-pdf text-red-500",
    png: "fa-file-image text-blue-500",
    jpg: "fa-file-image text-blue-500",
    jpeg: "fa-file-image text-blue-500",
    gif: "fa-file-image text-blue-500",
    doc: "fa-file-word text-blue-700",
    docx: "fa-file-word text-blue-700",
    xls: "fa-file-excel text-green-600",
    xlsx: "fa-file-excel text-green-600",
    ppt: "fa-file-powerpoint text-orange-500",
    pptx: "fa-file-powerpoint text-orange-500",
    zip: "fa-file-zipper text-yellow-600",
    rar: "fa-file-zipper text-yellow-600",
    txt: "fa-file-lines text-gray-500",
    json: "fa-file-code text-purple-500",
    js: "fa-file-code text-yellow-500",
    html: "fa-file-code text-orange-600",
    css: "fa-file-code text-blue-400"
  };
  return mapa[ext] || "fa-file text-gray-400";
}

// Exportar de manera que funcione globalmente en navegador sin modules si se desea
window.AppUtils = {
  hoyISO,
  formatearFecha,
  formatearFechaHora,
  indiceDiaHabil,
  formatearTamano,
  obtenerIconoArchivo
};
