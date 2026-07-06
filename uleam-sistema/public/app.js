const { createApp } = Vue;

createApp({
  data() {
    return {
      // Sesión
      sesion: { logueado: false, id: null, usuario: "", rol: "", email: "", facultad: "", carrera: "", fotoPerfil: "" },
      loginForm: { usuario: "", password: "" },
      mensajeLogin: "",
      cargandoLogin: false,
      mensajeError: "",
      
      // Vistas y Pestañas
      vistaActual: "inicio",
      bandejaTab: "recibidos", // "recibidos", "historial", "correo"
      archivosTab: "explorador", // "explorador", "subir", "registrar"
      
      // Menú principal
      menu: [
        { id: "inicio", icono: "fa-chart-pie", texto: "Panel de Control" },
        { id: "bandeja", icono: "fa-inbox", texto: "Mi Bandeja" },
        { id: "archivos", icono: "fa-folder-open", texto: "Archivos" },
        { id: "reportes", icono: "fa-file-chart-column", texto: "Reportes" },
        { id: "ajustes", icono: "fa-sliders", texto: "Ajustes" },
        { id: "ayuda", icono: "fa-question-circle", texto: "Ayuda" }
      ],
      
      // Datos
      documentos: [],
      usuarios: [],
      archivos: [],
      correos: [],
      soporteTickets: [],
      logsAuditoria: [],
      categorias: ["Documentación", "Admisión", "Internos", "Correspondencia"],
      detalleActivoId: null,
      
      // Formularios y filtros
      nuevoDocumento: { ticket: "", categoria: "", prioridad: "media", remitente: "", facultad: "", carrera: "", asunto: "", destinatarioId: "" },
      nuevoUsuario: { nombre: "", facultad: "", carrera: "", usuario: "", clave: "", rol: "", email: "" },
      busquedaUsuario: "",
      filtroEstado: "todos",
      dashboardDetalle: { tipo: "pendientes", items: [] },
      dashboardInicializado: false,
      
      archivoSeleccionado: null,
      nuevoArchivo: { titulo: "", tipoDocumento: "", categoria: "Documentación", facultad: "", carrera: "", fecha: "", destinatarioId: "", comentario: "", etiquetas: "" },
      nuevoCorreo: { destinatarioId: "", asunto: "", mensaje: "", adjuntos: [] },
      
      busquedaArchivos: "",
      filtroFacultad: "todos",
      filtroCategoriaArchivo: "todos",
      filtroFecha: "todos",
      filtroEstadoArchivo: "todos",
      ordenArchivos: "reciente",
      
      mostrarFormularioSoporte: false,
      nuevoTicketSoporte: { asunto: "", descripcion: "", prioridad: "media" },
      
      // Delegación
      facultadDelegada: "",
      carreraDelegada: "",
      usuarioDelegadoId: "",
      
      // Notificaciones Toasts
      toasts: [],
      
      // Recuperación de Contraseña
      mostrandoRecuperar: false,
      recuperarClaveStep: 1, // 1: Solicitar, 2: Confirmar
      recuperarForm: { usuario: "", codigo: "", nuevaClave: "", confirmarClave: "" },
      recuperarMensaje: "",
      recuperarCargando: false,
      codigoRecuperacionSimulado: "",
      
      // Perfil de Usuario
      perfilForm: { nombre: "", email: "", passwordActual: "", passwordNueva: "", passwordConfirmar: "" },
      cargandoPerfil: false,
      avatarPrevisualizacion: null,
      avatarArchivo: null,
      
      // Previsualizador de archivos
      visorActivo: false,
      visorArchivo: null,
      
      // Modo Oscuro
      temaOscuro: false,
      
      // Gráficos
      chartBarra: null,
      chartBarras: null,
      chartPie: null,
      pollingInterval: null
    };
  },

  computed: {
    usuariosFiltrados() {
      const texto = this.busquedaUsuario.trim().toLowerCase();
      return this.usuarios.filter((u) => {
        const textoFila = `${u.usuario} ${u.nombre} ${u.facultad} ${u.rol}`.toLowerCase();
        const coincideTexto = textoFila.includes(texto);
        const coincideEstado = this.filtroEstado === "todos" || this.filtroEstado === u.estado;
        return coincideTexto && coincideEstado;
      });
    },

    documentosBandeja() {
      const id = Number(this.sesion.id);
      const esAdmin = this.sesion.rol === "Administrador";
      return this.documentos
        .filter((d) => {
          if (esAdmin) return !["archivado", "denegado"].includes(d.estado);
          const esMio = Number(d.usuarioId) === id;
          const esDestinatario = Number(d.usuarioDestinoId) === id;
          const esDeDelegacion = Number(d.destinatarioId) === id;
          return (esMio || esDestinatario || esDeDelegacion) && !["archivado", "denegado"].includes(d.estado);
        })
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    },

    historialBandeja() {
      const id = Number(this.sesion.id);
      const esAdmin = this.sesion.rol === "Administrador";
      return this.documentos
        .filter((d) => {
          if (esAdmin) return ["archivado", "denegado"].includes(d.estado);
          const esMio = Number(d.usuarioId) === id;
          const esDestinatario = Number(d.usuarioDestinoId) === id;
          const esDeDelegacion = Number(d.destinatarioId) === id;
          return (esMio || esDestinatario || esDeDelegacion) && ["archivado", "denegado"].includes(d.estado);
        })
        .sort((a, b) => ((a.fechaFirma || a.fecha) < (b.fechaFirma || b.fecha) ? 1 : -1));
    },

    documentoDetalle() {
      return this.documentos.find((d) => d.id === this.detalleActivoId) || null;
    },

    statsDashboard() {
      const hoy = window.AppUtils.hoyISO();
      const id = Number(this.sesion.id);
      const esAdmin = this.sesion.rol === "Administrador";
      const misDocumentos = esAdmin
        ? this.documentos
        : this.documentos.filter((d) => {
            return Number(d.usuarioId) === id || Number(d.usuarioDestinoId) === id || Number(d.destinatarioId) === id;
          });
      return {
        pendientes: misDocumentos.filter((d) => d.estado === "pendiente").length,
        porVencer: misDocumentos.filter((d) => d.estado === "pendiente" && d.prioridad === "alta").length,
        firmasHoy: misDocumentos.filter((d) => d.fechaFirma === hoy).length,
        recibidos: misDocumentos.length
      };
    },

    documentosPendientes() {
      const id = Number(this.sesion.id);
      const esAdmin = this.sesion.rol === "Administrador";
      return this.documentos.filter((d) => {
        if (esAdmin) return d.estado === "pendiente";
        return d.estado === "pendiente" && (Number(d.usuarioId) === id || Number(d.usuarioDestinoId) === id || Number(d.destinatarioId) === id);
      });
    },

    documentosPorVencer() {
      const id = Number(this.sesion.id);
      const esAdmin = this.sesion.rol === "Administrador";
      return this.documentos.filter((d) => {
        if (esAdmin) return d.estado === "pendiente" && d.prioridad === "alta";
        return d.estado === "pendiente" && d.prioridad === "alta" && (Number(d.usuarioId) === id || Number(d.usuarioDestinoId) === id || Number(d.destinatarioId) === id);
      });
    },

    documentosFirmadosHoy() {
      return this.documentos.filter((d) => d.fechaFirma === window.AppUtils.hoyISO());
    },

    archivosVisibles() {
      return this.archivos.filter((archivo) => {
        // Un administrador ve todo. Un usuario estándar ve lo que subió o lo que se le envió.
        if (this.sesion.rol === "Administrador") return true;
        const esPropietario = Number(archivo.propietarioId) === Number(this.sesion.id);
        const esDestinatario = Number(archivo.destinatarioId) === Number(this.sesion.id);
        return esPropietario || esDestinatario;
      });
    },

    archivosFiltrados() {
      const texto = this.busquedaArchivos.trim().toLowerCase();
      return this.archivosVisibles
        .filter((archivo) => {
          const textoArchivo = `${archivo.nombreOriginal} ${archivo.titulo || ""} ${archivo.categoria} ${archivo.facultad} ${archivo.comentario} ${archivo.tipoDocumento || ""} ${archivo.etiquetas || ""}`.toLowerCase();
          const coincideTexto = textoArchivo.includes(texto);
          const coincideFacultad = this.filtroFacultad === "todos" || archivo.facultad === this.filtroFacultad;
          const coincideCategoria = this.filtroCategoriaArchivo === "todos" || archivo.categoria === this.filtroCategoriaArchivo;
          const coincideFecha = this.filtroFecha === "todos" || archivo.fecha === this.filtroFecha;
          const coincideEstado = this.filtroEstadoArchivo === "todos" || archivo.estado === this.filtroEstadoArchivo;
          return coincideTexto && coincideFacultad && coincideCategoria && coincideFecha && coincideEstado;
        })
        .sort((a, b) => {
          if (this.ordenArchivos === "nombre") return (a.nombreOriginal || "").localeCompare(b.nombreOriginal || "");
          if (this.ordenArchivos === "antiguo") return new Date(a.fecha || 0) - new Date(b.fecha || 0);
          return new Date(b.fecha || 0) - new Date(a.fecha || 0);
        });
    },

    correosRecibidos() {
      return this.correos
        .filter((correo) => Number(correo.destinatarioId) === Number(this.sesion.id))
        .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    },

    correosEnviados() {
      return this.correos
        .filter((correo) => Number(correo.remitenteId) === Number(this.sesion.id))
        .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    },

    opcionesFacultad() {
      const facultades = new Set(this.usuarios.map((u) => u.facultad).filter(Boolean));
      // Si el set está vacío, usar las de delegación
      if (facultades.size === 0) {
        return this.facultadesParaDelegacion;
      }
      return [...facultades].sort();
    },

    usuariosParaEnvio() {
      return this.usuarios.filter((u) => u.id !== this.sesion.id);
    },

    facultadesParaDelegacion() {
      return [
        "Facultad Ciencias de la Salud",
        "Facultad Ciencias Administrativas, Contables y Comercio",
        "Facultad de Educación Turismo y Humanidades",
        "Facultad Ingeniería, Industria y Arquitectura",
        "Facultad Ciencias de la Vida y Tecnologías",
        "Facultad de Ciencias Sociales Derecho y Bienestar",
        "Facultad de Artes",
        "Unidad de Formación Técnicas y Tecnológicas"
      ];
    },

    usuariosParaDelegacion() {
      return this.usuarios.filter((u) => {
        const mismoUsuario = Number(u.id) !== Number(this.sesion.id);
        const mismaFacultad = !this.facultadDelegada || u.facultad === this.facultadDelegada;
        const mismaCarrera = !this.carreraDelegada || u.carrera === this.carreraDelegada;
        return mismoUsuario && mismaFacultad && mismaCarrera;
      });
    },

    soporteAbierto() {
      return this.soporteTickets.filter((ticket) => ticket.estado !== "atendido");
    },

    datosFlujoSemanal() {
      const labels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      const recibidos = [0, 0, 0, 0, 0];
      const despachados = [0, 0, 0, 0, 0];
      this.documentos.forEach((d) => {
        const i = window.AppUtils.indiceDiaHabil(d.fecha);
        if (i === -1) return;
        recibidos[i]++;
        if (["archivado", "denegado"].includes(d.estado)) despachados[i]++;
      });
      return { labels, recibidos, despachados };
    },

    datosPorCategoria() {
      const recibidos = this.categorias.map((cat) => this.documentos.filter((d) => d.categoria === cat).length);
      const despachados = this.categorias.map((cat) => this.documentos.filter((d) => d.categoria === cat && ["archivado", "denegado"].includes(d.estado)).length);
      return { labels: this.categorias, recibidos, despachados };
    },

    datosDistribucionEstados() {
      return {
        cerrados: this.documentos.filter((d) => d.estado === "archivado").length,
        esperando: this.documentos.filter((d) => d.estado === "en_proceso").length,
        pendientes: this.documentos.filter((d) => d.estado === "pendiente").length,
        denegados: this.documentos.filter((d) => d.estado === "denegado").length
      };
    },

    resumenGeneral() {
      const d = this.datosDistribucionEstados;
      const totalDigitales = this.archivosVisibles.length;
      const totalMails = this.correos.length;
      return {
        recibidos: this.documentos.length,
        atendidos: d.cerrados + d.denegados,
        enProceso: d.esperando + d.pendientes,
        totalDigitales,
        totalMails,
        total: this.documentos.length
      };
    }
  },

  methods: {
    // Utilidades importadas
    formatearFecha: window.AppUtils.formatearFecha,
    formatearFechaHora: window.AppUtils.formatearFechaHora,
    formatearTamano: window.AppUtils.formatearTamano,
    obtenerIconoArchivo: window.AppUtils.obtenerIconoArchivo,

    // Toasts
    mostrarToast(mensaje, tipo = "success") {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, mensaje, tipo });
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
      }, 4000);
    },

    // Autenticación
    async iniciarSesion() {
      this.mensajeLogin = "";
      this.mensajeError = "";
      this.cargandoLogin = true;
      try {
        const respuesta = await window.AppApi.llamarApi("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: this.loginForm.usuario, clave: this.loginForm.password })
        });

        this.sesion = {
          logueado: true,
          id: respuesta.id,
          usuario: respuesta.nombre,
          rol: respuesta.rol,
          email: respuesta.email || "",
          facultad: respuesta.facultad || "",
          carrera: respuesta.carrera || "",
          fotoPerfil: respuesta.fotoPerfil || ""
        };

        // Guardar sesión en LocalStorage
        localStorage.setItem("uleam_sesion", JSON.stringify(this.sesion));

        this.loginForm = { usuario: "", password: "" };
        this.vistaActual = "inicio";
        this.dashboardInicializado = false;
        
        await this.cargarDatosIniciales();
        this.iniciarPolling();
        this.mostrarToast("¡Inicio de sesión exitoso! Bienvenido.", "success");
        this.$nextTick(() => this.inicializarGraficos());
      } catch (err) {
        this.mensajeLogin = `${err.message} ❌`;
        this.mostrarToast(err.message, "error");
      } finally {
        this.cargandoLogin = false;
      }
    },

    cerrarSesion() {
      this.detenerPolling();
      this.sesion = { logueado: false, id: null, usuario: "", rol: "", email: "", facultad: "", carrera: "", fotoPerfil: "" };
      localStorage.removeItem("uleam_sesion");
      this.loginForm = { usuario: "", password: "" };
      this.mensajeLogin = "";
      this.destruirGraficos();
      this.mostrarToast("Sesión cerrada correctamente.", "info");
    },

    // ----------------------------------------------------
    // METODOS DE DATOS DINAMICOS
    // ----------------------------------------------------
    obtenerCarreras(facultad) {
      if (!facultad) return [];
      const mapa = {
        "Facultad Ciencias de la Salud": ["Enfermería", "Fisioterapia", "Laboratorio Clínico", "Medicina", "Nutrición y Dietética", "Odontología", "Psicología", "Terapia Ocupacional"],
        "Facultad Ciencias Administrativas, Contables y Comercio": ["Administración de Empresas", "Auditoría y Control de Gestión", "Comercio Exterior", "Contabilidad y Auditoría", "Gestión de Talento Humano", "Finanzas", "Gestión de la Información Gerencial", "Mercadotecnia o Marketing"],
        "Facultad de Educación Turismo y Humanidades": ["Educación Inicial", "Educación Básica", "Educación Básica Bilingüe", "Educación Inicial Bilingüe", "Educación Inclusiva", "Entrenamiento Deportivo", "Gestión Hotelera Internacional", "Pedagogía de la Lengua y la Literatura", "Pedagogía de los Idiomas Nacionales y Extranjeros", "Psicología Educativa", "Pedagogía de la Actividad Física y el Deporte", "Turismo Sostenible"],
        "Facultad Ingeniería, Industria y Arquitectura": ["Arquitectura", "Electricidad", "Ingeniería Civil", "Ingeniería Industrial", "Ingeniería Marítima"],
        "Facultad Ciencias de la Vida y Tecnologías": ["Agroindustria", "Agronegocios", "Agropecuaria", "Alimentos", "Biología", "Ingeniería Ambiental", "Software", "Tecnologías de la Información"],
        "Facultad de Ciencias Sociales Derecho y Bienestar": ["Comunicación", "Ciencias Políticas y Relaciones Internacionales", "Criminología y Ciencias Forenses", "Derecho", "Economía", "Trabajo Social", "Gestión Pública y Desarrollo"],
        "Facultad de Artes": ["Arqueología", "Artes Escénicas", "Artes Plásticas", "Diseño Textil e Indumentaria", "Sociología"],
        "Unidad de Formación Técnicas y Tecnológicas": ["Bienes Raíces", "Construcción Sismo Resistente", "Gastronomía", "Metalmecánica", "Comunicación para Televisión, Relaciones Públicas y Protocolo"]
      };
      return mapa[facultad] || [];
    },

    // Carga de datos iniciales
    async cargarDatosIniciales() {
      try {
        const [documentos, usuarios, archivos, correos, soporte] = await Promise.all([
          window.AppApi.llamarApi(`/api/documentos?usuarioId=${this.sesion.id || ""}&rol=${encodeURIComponent(this.sesion.rol || "")}`),
          window.AppApi.llamarApi("/api/usuarios"),
          window.AppApi.llamarApi(`/api/archivos?usuarioId=${this.sesion.id || ""}`),
          window.AppApi.llamarApi("/api/correos"),
          window.AppApi.llamarApi("/api/soporte")
        ]);
        this.documentos = documentos;
        this.usuarios = usuarios;
        this.archivos = archivos;
        this.correos = correos;
        this.soporteTickets = soporte;

        // Cargar logs de auditoría si es Admin y la vista es Ajustes
        if (this.sesion.rol === "Administrador" && this.vistaActual === "ajustes") {
          this.cargarAuditorias();
        }

        if (!this.detalleActivoId && this.documentos.length) {
          this.detalleActivoId = this.documentosBandeja[0]?.id ?? null;
        }
        if (!this.dashboardInicializado) {
          this.seleccionarDetalleDashboard("pendientes");
          this.dashboardInicializado = true;
        }
      } catch (err) {
        this.mensajeError = err.message;
        this.mostrarToast("Error al sincronizar datos del servidor.", "error");
      }
    },

    async cargarAuditorias() {
      try {
        const logs = await window.AppApi.llamarApi("/api/auditoria");
        this.logsAuditoria = logs.reverse().slice(0, 50); // Últimos 50 logs
      } catch (e) {
        console.error("Error al cargar auditoría:", e);
      }
    },

    iniciarPolling() {
      this.detenerPolling();
      this.pollingInterval = window.setInterval(() => {
        if (this.sesion.logueado) {
          this.cargarDatosIniciales().catch(() => {});
        }
      }, 5000);
    },

    detenerPolling() {
      if (this.pollingInterval) {
        window.clearInterval(this.pollingInterval);
      }
      this.pollingInterval = null;
    },

    cambiarVista(idSeccion) {
      this.vistaActual = idSeccion;
      if (idSeccion === "ajustes" && this.sesion.rol === "Administrador") {
        this.cargarAuditorias();
      }
      this.$nextTick(() => {
        if (idSeccion === "inicio" && this.chartBarra) this.chartBarra.resize();
        if (idSeccion === "reportes") {
          if (this.chartBarras) this.chartBarras.resize();
          if (this.chartPie) this.chartPie.resize();
        }
      });
    },

    // Dashboard e Interacción
    seleccionarDetalleDashboard(tipo) {
      if (tipo === "pendientes") {
        this.dashboardDetalle = { tipo, items: this.documentosPendientes.slice(0, 8) };
      } else if (tipo === "porVencer") {
        this.dashboardDetalle = { tipo, items: this.documentosPorVencer.slice(0, 8) };
      } else if (tipo === "firmasHoy") {
        this.dashboardDetalle = { tipo, items: this.documentosFirmadosHoy.slice(0, 8) };
      } else {
        this.dashboardDetalle = { tipo, items: this.documentos.slice(0, 8) };
      }
    },

    mostrarDetalle(id) {
      this.detalleActivoId = id;
    },

    // Gestión de Trámites / Documentos
    async actualizarDocumento(doc, estado, accion, comentario = "") {
      try {
        const actualizado = await window.AppApi.llamarApi(`/api/documentos/${doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estado,
            accion,
            comentario,
            usuario: this.sesion.usuario,
            usuarioDestino: this.usuarioDelegadoId || null
          })
        });

        this.reemplazarDocumentoLocal(actualizado);
        this.detalleActivoId = this.documentosBandeja[0]?.id ?? null;
        
        const textoNotif = accion === "delegado"
          ? `Trámite ${doc.ticket} delegado con éxito.`
          : accion === "firmado"
            ? `Trámite ${doc.ticket} firmado digitalmente.`
            : `Trámite ${doc.ticket} denegado correctamente.`;

        this.mostrarToast(textoNotif, "success");

        this.usuarioDelegadoId = "";
        this.facultadDelegada = "";
        this.carreraDelegada = "";
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    async firmarDocumento(doc) {
      if (!confirm(`¿Está seguro que desea FIRMAR el documento ${doc.ticket}?`)) return;
      await this.actualizarDocumento(doc, "archivado", "firmado");
    },

    async denegarDocumento(doc) {
      const comentario = prompt("Escriba la razón de la denegación (opcional):");
      if (comentario === null) return; // Cancelado
      await this.actualizarDocumento(doc, "denegado", "denegado", comentario);
    },

    async delegarDocumento(doc) {
      if (!this.usuarioDelegadoId) {
        this.mostrarToast("Seleccione un usuario de la lista para delegar.", "warning");
        return;
      }
      await this.actualizarDocumento(doc, "en_proceso", "delegado");
    },

    async agregarDocumento() {
      const { ticket, categoria, remitente, facultad, carrera, asunto, destinatarioId } = this.nuevoDocumento;
      if (!ticket || !categoria || !remitente || !facultad || !asunto || !destinatarioId) {
        this.mostrarToast("Por favor, complete todos los campos obligatorios, incluyendo el destinatario.", "warning");
        return;
      }
      try {
        const creado = await window.AppApi.llamarApi("/api/documentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...this.nuevoDocumento,
            usuarioId: this.sesion.id,
            usuarioNombre: this.sesion.usuario
          })
        });
        this.documentos.push(creado);
        this.nuevoDocumento = { ticket: "", categoria: "", prioridad: "media", remitente: "", facultad: "", carrera: "", asunto: "", destinatarioId: "" };
        this.mostrarToast(`Trámite "${creado.ticket}" indexado con éxito.`, "success");
        // Volver al listado
        this.archivosTab = "explorador";
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    // Gestión de Archivos Digitales
    async seleccionarArchivo(event) {
      const archivo = event.target.files[0];
      if (!archivo) return;
      this.archivoSeleccionado = archivo;
      if (!this.nuevoArchivo.titulo) {
        this.nuevoArchivo.titulo = archivo.name.replace(/\.[^.]+$/, "");
      }
      this.nuevoArchivo.categoria = this.nuevoArchivo.categoria || "Documentación";
      this.nuevoArchivo.facultad = this.nuevoArchivo.facultad || this.sesion.facultad || "";
      this.nuevoArchivo.fecha = window.AppUtils.hoyISO();
    },

    async leerArchivoComoBase64(archivo) {
      return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result.split(",")[1] || "");
        lector.onerror = reject;
        lector.readAsDataURL(archivo);
      });
    },

    async subirArchivoDigital() {
      if (!this.archivoSeleccionado) {
        this.mostrarToast("Seleccione un archivo para subir.", "warning");
        return;
      }
      if (!this.nuevoArchivo.titulo || !this.nuevoArchivo.categoria || !this.nuevoArchivo.facultad || !this.nuevoArchivo.fecha) {
        this.mostrarToast("Complete los campos obligatorios del archivo.", "warning");
        return;
      }
      try {
        const contenidoBase64 = await this.leerArchivoComoBase64(this.archivoSeleccionado);
        const creado = await window.AppApi.llamarApi("/api/archivos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreOriginal: this.archivoSeleccionado.name,
            contenidoBase64,
            tipo: this.archivoSeleccionado.type || "application/octet-stream",
            categoria: this.nuevoArchivo.categoria,
            facultad: this.nuevoArchivo.facultad,
            fecha: this.nuevoArchivo.fecha,
            comentario: this.nuevoArchivo.comentario,
            titulo: this.nuevoArchivo.titulo,
            etiquetas: this.nuevoArchivo.etiquetas,
            tipoDocumento: this.nuevoArchivo.tipoDocumento,
            destinatarioId: this.nuevoArchivo.destinatarioId || null,
            propietarioId: this.sesion.id,
            propietarioNombre: this.sesion.usuario
          })
        });
        this.archivos.unshift(creado);
        this.archivoSeleccionado = null;
        this.nuevoArchivo = { titulo: "", tipoDocumento: "", categoria: "Documentación", facultad: "", carrera: "", fecha: "", destinatarioId: "", comentario: "", etiquetas: "" };
        if (this.$refs.inputArchivo) this.$refs.inputArchivo.value = "";
        this.mostrarToast("Archivo guardado y publicado con éxito.", "success");
        // Volver al listado
        this.archivosTab = "explorador";
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    abrirArchivo(archivo) {
      if (archivo?.ruta) {
        const ext = String(archivo.extension || "").toLowerCase();
        if (["pdf", "png", "jpg", "jpeg", "gif", "txt"].includes(ext)) {
          // Previsualizar internamente
          this.visorArchivo = archivo;
          this.visorActivo = true;
        } else {
          // Abrir en otra pestaña
          window.open(archivo.ruta, "_blank");
        }
      }
    },

    descargarArchivo(archivo) {
      if (archivo?.ruta) {
        const link = document.createElement("a");
        link.href = archivo.ruta;
        link.download = archivo.nombreOriginal;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.mostrarToast("Descarga iniciada.", "info");
      }
    },

    async eliminarArchivo(archivo) {
      if (!confirm(`¿Desea eliminar definitivamente el archivo "${archivo.titulo || archivo.nombreOriginal}"?`)) return;
      try {
        await window.AppApi.llamarApi(`/api/archivos/${archivo.id}`, {
          method: "DELETE"
        });
        this.archivos = this.archivos.filter((a) => a.id !== archivo.id);
        this.mostrarToast("Archivo eliminado del servidor.", "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    reemplazarDocumentoLocal(actualizado) {
      const i = this.documentos.findIndex((d) => d.id === actualizado.id);
      if (i !== -1) this.documentos.splice(i, 1, actualizado);
    },

    // Gestión de Usuarios por el Admin
    generarUsuarioAutomatico(nombre) {
      return window.AppUtils.generarUsuarioAutomatico 
        ? window.AppUtils.generarUsuarioAutomatico(nombre, this.usuarios)
        : (nombre || "").toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z\s]/g, "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .join(".") + "@live.uleam.edu.ec";
    },

    async agregarUsuario() {
      const { nombre, facultad, carrera, clave, rol, email } = this.nuevoUsuario;
      if (!nombre || !facultad || !carrera || !clave || !rol) {
        this.mostrarToast("Complete todos los campos del nuevo usuario.", "warning");
        return;
      }
      
      const emailGenerado = email || this.generarUsuarioAutomatico(nombre);
      const usernameGenerado = emailGenerado.split("@")[0];

      try {
        const creado = await window.AppApi.llamarApi("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            facultad,
            carrera,
            usuario: usernameGenerado,
            email: emailGenerado,
            clave,
            rol
          })
        });
        this.usuarios.push(creado);
        this.nuevoUsuario = { nombre: "", facultad: "", carrera: "", usuario: "", clave: "", rol: "", email: "" };
        this.mostrarToast(`Usuario "${creado.nombre}" creado exitosamente.`, "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    async eliminarUsuario(usuario) {
      if (Number(usuario.id) === Number(this.sesion.id)) {
        this.mostrarToast("No puedes eliminar tu propio usuario de sesión.", "error");
        return;
      }
      if (!confirm(`¿Está seguro que desea eliminar a "${usuario.nombre}"?`)) return;
      try {
        await window.AppApi.llamarApi(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
        this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
        this.mostrarToast("Usuario eliminado del sistema.", "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    async alternarEstado(usuario) {
      const nuevoEstado = usuario.estado === "activo" ? "desactivado" : "activo";
      try {
        const actualizado = await window.AppApi.llamarApi(`/api/usuarios/${usuario.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado })
        });
        const i = this.usuarios.findIndex((u) => u.id === actualizado.id);
        if (i !== -1) this.usuarios.splice(i, 1, actualizado);
        this.mostrarToast(`Estado de usuario cambiado a ${nuevoEstado}.`, "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    // Mensajería Interna
    seleccionarArchivoAdjunto(event) {
      const archivo = event.target.files?.[0];
      if (!archivo) return;
      this.nuevoCorreo.adjuntos.push({
        tipo: "local",
        nombreOriginal: archivo.name,
        archivo,
        tipoMime: archivo.type || "application/octet-stream"
      });
      if (this.$refs.inputAdjuntoCorreo) this.$refs.inputAdjuntoCorreo.value = "";
    },

    adjuntarArchivoGuardado(archivo) {
      const yaAgregado = this.nuevoCorreo.adjuntos.some((item) => item.tipo === "guardado" && Number(item.id) === Number(archivo.id));
      if (!yaAgregado) {
        this.nuevoCorreo.adjuntos.push({ tipo: "guardado", id: archivo.id, nombreOriginal: archivo.nombreOriginal, ruta: archivo.ruta });
        this.mostrarToast("Archivo adjuntado al borrador.", "success");
      } else {
        this.mostrarToast("El archivo ya está adjuntado.", "warning");
      }
    },

    quitarAdjunto(index) {
      this.nuevoCorreo.adjuntos.splice(index, 1);
    },

    async enviarCorreo() {
      if (!this.nuevoCorreo.destinatarioId || !this.nuevoCorreo.asunto || !this.nuevoCorreo.mensaje) {
        this.mostrarToast("Escriba destinatario, asunto y mensaje.", "warning");
        return;
      }
      try {
        const adjuntosPayload = [];
        for (const adjunto of this.nuevoCorreo.adjuntos) {
          if (adjunto.tipo === "guardado") {
            adjuntosPayload.push({ tipo: "guardado", archivoId: adjunto.id });
          } else if (adjunto.tipo === "local") {
            const contenidoBase64 = await this.leerArchivoComoBase64(adjunto.archivo);
            adjuntosPayload.push({
              tipo: "local",
              contenidoBase64,
              nombreOriginal: adjunto.nombreOriginal,
              tipo: adjunto.tipoMime || "application/octet-stream",
              categoria: "Documentación",
              facultad: this.sesion.facultad,
              fecha: window.AppUtils.hoyISO(),
              comentario: `Adjunto de correo: ${this.nuevoCorreo.asunto}`,
              titulo: adjunto.nombreOriginal,
              etiquetas: "correo"
            });
          }
        }
        const creado = await window.AppApi.llamarApi("/api/correos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...this.nuevoCorreo,
            adjuntos: adjuntosPayload,
            remitenteId: this.sesion.id,
            remitenteNombre: this.sesion.usuario
          })
        });
        this.correos.unshift(creado);
        this.nuevoCorreo = { destinatarioId: "", asunto: "", mensaje: "", adjuntos: [] };
        this.mostrarToast("Correo institucional enviado correctamente.", "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    // Soporte Técnico
    async enviarSolicitudSoporte() {
      if (!this.nuevoTicketSoporte.asunto || !this.nuevoTicketSoporte.descripcion) {
        this.mostrarToast("Por favor escriba el asunto y descripción.", "warning");
        return;
      }
      try {
        const creado = await window.AppApi.llamarApi("/api/soporte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...this.nuevoTicketSoporte,
            usuarioId: this.sesion.id,
            usuarioNombre: this.sesion.usuario
          })
        });
        this.soporteTickets.unshift(creado);
        this.nuevoTicketSoporte = { asunto: "", descripcion: "", prioridad: "media" };
        this.mostrarFormularioSoporte = false;
        this.mostrarToast("Solicitud enviada al equipo de soporte.", "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    async marcarTicketAtendido(ticket) {
      try {
        const actualizado = await window.AppApi.llamarApi(`/api/soporte/${ticket.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "atendido" })
        });
        const i = this.soporteTickets.findIndex((t) => t.id === actualizado.id);
        if (i !== -1) this.soporteTickets.splice(i, 1, actualizado);
        this.mostrarToast("Ticket marcado como atendido.", "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      }
    },

    // Modo Oscuro
    toggleTemaOscuro() {
      this.temaOscuro = !this.temaOscuro;
      localStorage.setItem("uleam_tema_oscuro", this.temaOscuro ? "true" : "false");
      if (this.temaOscuro) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    },

    // Recuperación de Contraseña (Flujo Cliente)
    async solicitarCodigoRecuperar() {
      if (!this.recuperarForm.usuario) {
        this.mostrarToast("Por favor ingrese su usuario o correo.", "warning");
        return;
      }
      this.recuperarMensaje = "";
      this.recuperarCargando = true;
      try {
        const res = await window.AppApi.llamarApi("/api/recuperar-clave/solicitar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: this.recuperarForm.usuario })
        });
        
        this.codigoRecuperacionSimulado = res.codigoSimulado;
        this.recuperarClaveStep = 2; // Pasar a restablecer
        this.mostrarToast("Código generado exitosamente (Simulado).", "success");
      } catch (err) {
        this.recuperarMensaje = err.message;
        this.mostrarToast(err.message, "error");
      } finally {
        this.recuperarCargando = false;
      }
    },

    async confirmarNuevaClave() {
      const { usuario, codigo, nuevaClave, confirmarClave } = this.recuperarForm;
      if (!codigo || !nuevaClave || !confirmarClave) {
        this.mostrarToast("Complete todos los campos.", "warning");
        return;
      }
      if (nuevaClave !== confirmarClave) {
        this.mostrarToast("Las contraseñas no coinciden.", "error");
        return;
      }
      this.recuperarMensaje = "";
      this.recuperarCargando = true;
      try {
        await window.AppApi.llamarApi("/api/recuperar-clave/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario, codigo, nuevaClave })
        });
        this.mostrarToast("Contraseña cambiada con éxito. Inicie sesión.", "success");
        this.cancelarRecuperar();
      } catch (err) {
        this.recuperarMensaje = err.message;
        this.mostrarToast(err.message, "error");
      } finally {
        this.recuperarCargando = false;
      }
    },

    cancelarRecuperar() {
      this.mostrandoRecuperar = false;
      this.recuperarClaveStep = 1;
      this.recuperarForm = { usuario: "", codigo: "", nuevaClave: "", confirmarClave: "" };
      this.recuperarMensaje = "";
      this.codigoRecuperacionSimulado = "";
    },

    // Perfil del Usuario Logueado
    abrirSubirAvatar() {
      this.$refs.avatarInputFile.click();
    },

    async cambiarAvatarSeleccionado(event) {
      const archivo = event.target.files[0];
      if (!archivo) return;
      this.avatarArchivo = archivo;
      
      const lector = new FileReader();
      lector.onload = (e) => {
        this.avatarPrevisualizacion = e.target.result;
      };
      lector.readAsDataURL(archivo);
    },

    async guardarPerfil() {
      if (!this.perfilForm.nombre || !this.perfilForm.email) {
        this.mostrarToast("Nombre y correo son campos obligatorios.", "warning");
        return;
      }
      if (this.perfilForm.passwordNueva && this.perfilForm.passwordNueva !== this.perfilForm.passwordConfirmar) {
        this.mostrarToast("La nueva contraseña no coincide con su confirmación.", "error");
        return;
      }
      
      this.cargandoPerfil = true;
      try {
        const payload = {
          nombre: this.perfilForm.nombre,
          email: this.perfilForm.email
        };

        if (this.perfilForm.passwordNueva) {
          payload.clave = this.perfilForm.passwordNueva;
        }

        if (this.avatarArchivo) {
          payload.fotoPerfilNombre = this.avatarArchivo.name;
          payload.fotoPerfilBase64 = await this.leerArchivoComoBase64(this.avatarArchivo);
        }

        const actualizado = await window.AppApi.llamarApi(`/api/usuarios/${this.sesion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        // Actualizar sesión reactiva y localStorage
        this.sesion.usuario = actualizado.nombre;
        this.sesion.email = actualizado.email || "";
        this.sesion.facultad = actualizado.facultad || "";
        this.sesion.carrera = actualizado.carrera || "";
        if (actualizado.fotoPerfil) {
          this.sesion.fotoPerfil = actualizado.fotoPerfil;
        }
        
        localStorage.setItem("uleam_sesion", JSON.stringify(this.sesion));

        // Limpiar inputs de contraseña
        this.perfilForm.passwordActual = "";
        this.perfilForm.passwordNueva = "";
        this.perfilForm.passwordConfirmar = "";
        this.avatarArchivo = null;
        this.avatarPrevisualizacion = null;
        if (this.$refs.avatarInputFile) this.$refs.avatarInputFile.value = "";

        this.mostrarToast("Perfil actualizado correctamente.", "success");
      } catch (err) {
        this.mostrarToast(err.message, "error");
      } finally {
        this.cargandoPerfil = false;
      }
    },

    inicializarPerfilForm() {
      this.perfilForm.nombre = this.sesion.usuario;
      this.perfilForm.email = this.sesion.email;
      this.perfilForm.passwordActual = "";
      this.perfilForm.passwordNueva = "";
      this.perfilForm.passwordConfirmar = "";
      this.avatarPrevisualizacion = null;
      this.avatarArchivo = null;
    },

    // Inicialización y destrucción de gráficos
    inicializarGraficos() {
      const opcionesComunes = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: this.temaOscuro ? "#cbd5e1" : "#1e293b"
            }
          }
        },
        scales: {
          x: {
            grid: { color: this.temaOscuro ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
            ticks: { color: this.temaOscuro ? "#94a3b8" : "#64748b" }
          },
          y: {
            grid: { color: this.temaOscuro ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
            ticks: { color: this.temaOscuro ? "#94a3b8" : "#64748b" }
          }
        }
      };

      if (!this.chartBarra && this.$refs.graficoBarra) {
        const datos = this.datosFlujoSemanal;
        const ctx = this.$refs.graficoBarra.getContext("2d");
        if (ctx) {
          this.chartBarra = new Chart(ctx, {
            type: "bar",
            data: {
              labels: datos.labels,
              datasets: [
                { label: "Recibidos", data: datos.recibidos, backgroundColor: "#dc2626", borderRadius: 4 },
                { label: "Despachados", data: datos.despachados, backgroundColor: "#10b981", borderRadius: 4 }
              ]
            },
            options: opcionesComunes
          });
        }
      }

      if (!this.chartBarras && this.$refs.graficoBarras) {
        const datos = this.datosPorCategoria;
        const ctx = this.$refs.graficoBarras.getContext("2d");
        if (ctx) {
          this.chartBarras = new Chart(ctx, {
            type: "bar",
            data: {
              labels: datos.labels,
              datasets: [
                { label: "Recibidos", data: datos.recibidos, backgroundColor: "#6366f1", borderRadius: 4 },
                { label: "Despachados", data: datos.despachados, backgroundColor: "#059669", borderRadius: 4 }
              ]
            },
            options: opcionesComunes
          });
        }
      }

      if (!this.chartPie && this.$refs.graficoPie) {
        const datos = this.datosDistribucionEstados;
        const ctx = this.$refs.graficoPie.getContext("2d");
        if (ctx) {
          this.chartPie = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: ["Firmados", "Delegados", "Pendientes", "Denegados"],
              datasets: [{
                data: [datos.cerrados, datos.esperando, datos.pendientes, datos.denegados],
                backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
                borderWidth: this.temaOscuro ? 2 : 1,
                borderColor: this.temaOscuro ? "#1e293b" : "#ffffff"
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: this.temaOscuro ? "#cbd5e1" : "#1e293b",
                    boxWidth: 12
                  }
                }
              }
            }
          });
        }
      }
    },

    actualizarGraficos() {
      if (this.chartBarra) {
        const datos = this.datosFlujoSemanal;
        this.chartBarra.data.datasets[0].data = datos.recibidos;
        this.chartBarra.data.datasets[1].data = datos.despachados;
        this.chartBarra.update();
      }
      if (this.chartBarras) {
        const datos = this.datosPorCategoria;
        this.chartBarras.data.datasets[0].data = datos.recibidos;
        this.chartBarras.data.datasets[1].data = datos.despachados;
        this.chartBarras.update();
      }
      if (this.chartPie) {
        const datos = this.datosDistribucionEstados;
        this.chartPie.data.datasets[0].data = [datos.cerrados, datos.esperando, datos.pendientes, datos.denegados];
        this.chartPie.update();
      }
    },

    destruirGraficos() {
      if (this.chartBarra) this.chartBarra.destroy();
      if (this.chartBarras) this.chartBarras.destroy();
      if (this.chartPie) this.chartPie.destroy();
      this.chartBarra = null;
      this.chartBarras = null;
      this.chartPie = null;
    }
  },

  watch: {
    documentos: {
      deep: true,
      handler() {
        if (this.sesion.logueado) {
          this.$nextTick(() => this.actualizarGraficos());
        }
      }
    },
    vistaActual(nuevaVista) {
      if (nuevaVista === "perfil") {
        this.inicializarPerfilForm();
      }
    }
  },

  created() {
    // Restaurar sesión persistida
    const sesionPersistida = localStorage.getItem("uleam_sesion");
    if (sesionPersistida) {
      try {
        const parsed = JSON.parse(sesionPersistida);
        if (parsed && parsed.logueado) {
          this.sesion = parsed;
          this.cargarDatosIniciales();
          this.iniciarPolling();
          this.$nextTick(() => this.inicializarGraficos());
        }
      } catch (e) {
        console.error("Error al restaurar sesión:", e);
      }
    }

    // Restaurar modo oscuro
    const temaPersistido = localStorage.getItem("uleam_tema_oscuro");
    if (temaPersistido === "true") {
      this.temaOscuro = true;
      document.body.classList.add("dark-mode");
    }
  },

  unmounted() {
    this.detenerPolling();
    this.destruirGraficos();
  }
}).mount("#app");
