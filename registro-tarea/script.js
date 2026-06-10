const form = document.getElementById("registroForm");
const mensaje = document.getElementById("mensaje");
const tablaBody = document.querySelector("#tablaEstudiantes tbody");

function mostrarEstudiantes() {
  tablaBody.innerHTML = "";
  let estudiantes = JSON.parse(localStorage.getItem("estudiantes")) || [];
  estudiantes.forEach(est => {
    let fila = `<tr>
      <td>${est.cedula}</td>
      <td>${est.apellidos}</td>
      <td>${est.nombres}</td>
      <td>${est.correo}</td>
      <td>${est.facultad}</td>
      <td>${est.nivel}</td>
      <td>${est.paralelo}</td>
    </tr>`;
    tablaBody.innerHTML += fila;
  });
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const regexCedula = /^[0-9]{10}$/;
  const regexTelefono = /^[0-9]{7,10}$/;
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;

  const estudiante = {
    cedula: document.getElementById("cedula").value.trim(),
    apellidos: document.getElementById("apellidos").value.trim(),
    nombres: document.getElementById("nombres").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    facultad: document.getElementById("facultad").value.trim(),
    nivel: document.getElementById("nivel").value,
    paralelo: document.getElementById("paralelo").value.trim()
  };

  if (!regexCedula.test(estudiante.cedula)) {
    mensaje.textContent = "❌ Cédula inválida (10 dígitos).";
    mensaje.style.color = "red";
    return;
  }
  if (estudiante.telefono && !regexTelefono.test(estudiante.telefono)) {
    mensaje.textContent = "❌ Teléfono inválido (7-10 dígitos).";
    mensaje.style.color = "red";
    return;
  }
  if (!regexCorreo.test(estudiante.correo)) {
    mensaje.textContent = "❌ Correo electrónico inválido.";
    mensaje.style.color = "red";
    return;
  }

  let estudiantes = JSON.parse(localStorage.getItem("estudiantes")) || [];
  estudiantes.push(estudiante);
  localStorage.setItem("estudiantes", JSON.stringify(estudiantes));

  mensaje.textContent = "✅ Estudiante registrado correctamente.";
  mensaje.style.color = "green";
  form.reset();
  mostrarEstudiantes();

  function mostrarEstudiantes() {
  const tablaBody = document.querySelector("#tablaEstudiantes tbody");
  tablaBody.innerHTML = "";
  let estudiantes = JSON.parse(localStorage.getItem("estudiantes")) || [];
  estudiantes.forEach(est => {
    let fila = `<tr>
      <td>${est.cedula}</td>
      <td>${est.apellidos}</td>
      <td>${est.nombres}</td>
      <td>${est.correo}</td>
      <td>${est.facultad}</td>
      <td>${est.nivel}</td>
      <td>${est.paralelo}</td>
    </tr>`;
    tablaBody.innerHTML += fila;
    });
  }
});


// Mostrar al cargar la página
mostrarEstudiantes();

