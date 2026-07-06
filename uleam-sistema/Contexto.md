# INFORME DE TRABAJO AUTÓNOMO — SEGUNDO PARCIAL
## Sistema de Gestión Documental — Secretaría General ULEAM

---

## 2. Descripción del Negocio o Tema Elegido (Contexto / Dominio)

La Universidad Laica Eloy Alfaro de Manabí (ULEAM) es una institución de educación superior pública ubicada en la ciudad de Manta, Ecuador. Como toda entidad universitaria de gran escala, la ULEAM gestiona diariamente un volumen significativo de documentación interna: oficios, memorandos, actas, resoluciones, solicitudes de trámite y correspondencia entre sus 8 facultades y más de 60 carreras académicas.

Actualmente, gran parte de la gestión documental en la Secretaría General se realiza de forma manual o semi-digital, lo que genera demoras en la distribución de trámites, pérdida de trazabilidad en las firmas de documentos, y dificultades para coordinar la delegación de responsabilidades entre facultades y carreras.

El dominio del sistema abarca la **gestión documental institucional**, específicamente orientada a:

- **Registro y seguimiento de trámites formales** (oficios, solicitudes, actas) con asignación de tickets únicos.
- **Distribución y delegación de documentos** entre usuarios de distintas facultades y carreras.
- **Almacenamiento digital de archivos** (digitalización de documentos físicos en formato PDF, imagen, etc.).
- **Mensajería interna** entre funcionarios de la universidad.
- **Generación de reportes y estadísticas** de la actividad documental.

Las 8 facultades contempladas en el sistema son:

1. Facultad Ciencias de la Salud
2. Facultad Ciencias Administrativas, Contables y Comercio
3. Facultad de Educación, Turismo y Humanidades
4. Facultad Ingeniería, Industria y Arquitectura
5. Facultad Ciencias de la Vida y Tecnologías
6. Facultad de Ciencias Sociales, Derecho y Bienestar
7. Facultad de Artes
8. Unidad de Formación Técnicas y Tecnológicas

---

## 3. Propósito del Sistema Web

El propósito del sistema web es **digitalizar y centralizar la gestión documental de la Secretaría General de la ULEAM**, proporcionando una plataforma en línea que permita a los funcionarios universitarios (secretarios, directores de carrera, docentes y administradores) realizar las siguientes actividades de manera eficiente:

- **Registrar trámites formales** con número de ticket, categoría, prioridad y asignación a un destinatario específico.
- **Firmar o denegar documentos** de forma digital desde la bandeja de entrada personalizada de cada usuario.
- **Delegar trámites** a otros usuarios de distintas facultades y carreras, manteniendo un historial completo de la ruta de auditoría.
- **Subir y compartir archivos digitales** (oficios escaneados, actas, resoluciones) con clasificación por facultad, carrera, categoría y etiquetas.
- **Enviar y recibir mensajes internos** entre funcionarios del sistema (correo institucional interno).
- **Visualizar estadísticas y reportes** del flujo documental en tiempo real mediante gráficos interactivos.
- **Administrar usuarios** del sistema (crear, editar, bloquear, eliminar) con control de roles y permisos.
- **Registrar tickets de soporte técnico** para reportar incidencias del sistema.

El sistema busca reducir los tiempos de respuesta en la gestión de trámites, eliminar la pérdida de documentos físicos, y proporcionar trazabilidad completa de cada acción realizada sobre un documento.

---

## 4. Requerimientos Funcionales y No Funcionales

### 4.1 Requerimientos Funcionales

| ID   | Requerimiento | Descripción |
|------|--------------|-------------|
| RF01 | Autenticación de usuarios | El sistema permite el inicio de sesión mediante usuario y contraseña, con validación contra la base de datos JSON. |
| RF02 | Roles y permisos | Se manejan dos roles: Administrador (acceso total) y Usuario (acceso limitado a sus propios documentos). |
| RF03 | Bandeja de entrada personalizada | Cada usuario visualiza únicamente los trámites que le fueron asignados, que creó, o que le delegaron. |
| RF04 | Registro de trámites | Los usuarios pueden crear trámites formales con ticket, categoría, prioridad, facultad, carrera, destinatario y asunto. |
| RF05 | Firma y denegación digital | Los usuarios pueden firmar (aprobar) o denegar documentos desde su bandeja, actualizando el estado del trámite. |
| RF06 | Delegación de trámites | Un usuario puede delegar un trámite a otro usuario de cualquier facultad/carrera, registrando la acción en el historial. |
| RF07 | Subida de archivos digitales | El sistema permite subir archivos (PDF, imágenes, documentos) con metadatos: título, categoría, facultad, carrera, fecha, etiquetas. |
| RF08 | Mensajería interna | Los usuarios pueden enviar y recibir mensajes internos con asunto, cuerpo y adjuntos simulados. |
| RF09 | Panel de estadísticas | Se muestran gráficos (barras, dona, línea) con métricas de trámites pendientes, firmados, por facultad, etc. |
| RF10 | Gestión de usuarios (Admin) | El administrador puede crear, editar, bloquear y eliminar usuarios del sistema. |
| RF11 | Historial de auditoría | Cada acción relevante (firma, delegación, creación) se registra con fecha, hora, usuario y descripción. |
| RF12 | Soporte técnico | Los usuarios pueden crear tickets de soporte con asunto, descripción y prioridad. |
| RF13 | Perfil de usuario | Cada usuario puede ver su información personal (nombre, facultad, carrera, rol) y cambiar su foto de perfil. |
| RF14 | Modo oscuro/claro | El sistema ofrece alternancia entre tema claro (grises claros) y tema oscuro (grises oscuros). |
| RF15 | Persistencia de sesión | La sesión del usuario se almacena en localStorage y se restaura automáticamente al recargar la página. |

### 4.2 Requerimientos No Funcionales

| ID    | Requerimiento | Descripción |
|-------|--------------|-------------|
| RNF01 | Rendimiento | El sistema debe cargar la interfaz principal en menos de 3 segundos en conexiones estándar. |
| RNF02 | Usabilidad | La interfaz debe ser intuitiva, con navegación por menú lateral y diseño responsivo. |
| RNF03 | Compatibilidad | El sistema debe funcionar correctamente en navegadores modernos (Chrome, Firefox, Edge). |
| RNF04 | Escalabilidad | La arquitectura modular (backend separado en módulos) permite agregar nuevas funcionalidades fácilmente. |
| RNF05 | Seguridad básica | Las contraseñas se almacenan en la base de datos JSON. Los usuarios bloqueados no pueden acceder al sistema. |
| RNF06 | Disponibilidad | El sistema está diseñado para ejecutarse en un servidor Node.js accesible 24/7 al publicarse en hosting. |
| RNF07 | Mantenibilidad | El código está organizado en módulos separados (auth, usuarios, documentos, archivos, correos, soporte, db). |

---

## 5. Herramientas y Tecnologías de Programación

### 5.1 Frontend (Lado del Cliente)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **HTML5** | — | Estructura y maquetación de todas las vistas del sistema. |
| **CSS3** | — | Estilos visuales, diseño responsivo, variables CSS para temas claro/oscuro, animaciones y transiciones. |
| **JavaScript (ES6+)** | — | Lógica de la aplicación, validaciones de formularios, manipulación del DOM, llamadas a la API. |
| **Vue.js 3** | 3.x (CDN) | Framework reactivo para la construcción de la interfaz de usuario (SPA), binding de datos, computed properties, watchers. |
| **Chart.js** | 4.x (CDN) | Librería de gráficos para las estadísticas y reportes (barras, dona, líneas). |
| **Font Awesome** | 6.x (CDN) | Iconografía vectorial para botones, menús y elementos visuales. |
| **Google Fonts (Inter)** | — | Tipografía profesional utilizada en toda la interfaz. |

### 5.2 Backend (Lado del Servidor)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Node.js** | 18+ | Entorno de ejecución del servidor web y la API REST. |
| **HTTP nativo (http module)** | — | Servidor web sin dependencias externas (sin Express). Se utiliza el módulo `http` nativo de Node.js. |
| **File System (fs module)** | — | Lectura y escritura de archivos JSON para persistencia de datos. |

### 5.3 Almacenamiento de Datos

| Tipo | Tecnología | Descripción |
|------|-----------|-------------|
| **Servidor** | **Archivos JSON** | Se utilizan 6 archivos JSON como base de datos: `usuarios.json`, `documentos.json`, `archivos.json`, `correos.json`, `soporte.json`, `auditoria.json`. |
| **Cliente** | **localStorage** | Se almacena la sesión del usuario (id, nombre, rol, facultad, foto de perfil) para persistencia entre recargas de página. |
| **Archivos subidos** | **Carpeta /uploads/** | Los archivos digitalizados se almacenan en el sistema de archivos del servidor, codificados en Base64 durante la transmisión. |

### 5.4 Arquitectura del Proyecto

```
uleam-sistema/
├── server.js                  ← Servidor HTTP y enrutador principal
├── package.json               ← Configuración del proyecto Node.js
├── backend/
│   ├── db.js                  ← Módulo de base de datos (lectura/escritura JSON)
│   ├── auth.js                ← Módulo de autenticación (login, recuperación)
│   ├── usuarios.js            ← CRUD de usuarios
│   ├── documentos.js          ← CRUD de trámites/documentos
│   ├── archivos.js            ← Gestión de archivos digitales
│   ├── correos.js             ← Mensajería interna
│   └── soporte.js             ← Tickets de soporte
├── public/
│   ├── index.html             ← Vista principal (SPA completa)
│   ├── app.js                 ← Lógica Vue.js de la aplicación
│   ├── style.css              ← Estilos CSS completos
│   ├── logo.png               ← Logo institucional
│   └── js/
│       ├── api.js             ← Módulo de comunicación con la API
│       └── utils.js           ← Utilidades compartidas
├── data/
│   ├── usuarios.json          ← Base de datos de usuarios
│   ├── documentos.json        ← Base de datos de trámites
│   ├── archivos.json          ← Base de datos de archivos
│   ├── correos.json           ← Base de datos de mensajes
│   ├── soporte.json           ← Base de datos de tickets
│   └── auditoria.json         ← Registro de auditoría
└── uploads/                   ← Carpeta de archivos subidos
```

---

## 6. Método de Publicación y Hosting

El sistema web fue publicado en **Vercel**, una plataforma de hosting en la nube que permite el despliegue gratuito de aplicaciones web.

### Proceso de publicación:

1. Se creó un repositorio en GitHub con el código fuente completo del proyecto.
2. Se vinculó el repositorio a la cuenta de Vercel.
3. Se configuró el proyecto como una aplicación Node.js con el comando de inicio `node server.js`.
4. Vercel asignó automáticamente un dominio público accesible desde cualquier navegador.

### Datos de publicación:

| Campo | Valor |
|-------|-------|
| **Plataforma de hosting** | Vercel |
| **URL pública** | `https://[TU-URL-AQUI].vercel.app` ← *(editar cuando esté publicado)* |
| **Repositorio GitHub** | `https://github.com/[TU-USUARIO]/uleam-sistema` ← *(editar con tu repo)* |
| **Tipo de plan** | Gratuito (Free Tier) |
| **Fecha de publicación** | *(editar con la fecha real)* |

> **Nota:** Para verificar el funcionamiento del sistema, acceder a la URL pública e iniciar sesión con las credenciales de prueba: **usuario:** `admin` / **contraseña:** `1234`.

---

## 7. Código Fuente Completo

A continuación se listan los 6 archivos principales del sistema. El código fuente completo se adjunta en los anexos del informe.

### Archivos principales:

| # | Archivo | Descripción | Líneas aprox. |
|---|---------|-------------|---------------|
| 1 | `server.js` | Servidor HTTP principal con enrutamiento de API REST | ~225 líneas |
| 2 | `public/index.html` | Vista completa del sistema (SPA) con todas las secciones HTML | ~1,350 líneas |
| 3 | `public/app.js` | Lógica principal de Vue.js: datos, computed, métodos, watchers | ~1,180 líneas |
| 4 | `public/style.css` | Estilos CSS completos: temas, layouts, componentes, responsive | ~1,885 líneas |
| 5 | `backend/documentos.js` | Módulo backend de gestión de trámites (CRUD + delegación + firma) | ~100 líneas |
| 6 | `backend/archivos.js` | Módulo backend de gestión de archivos digitales (subida + descarga) | ~106 líneas |

> *El código fuente completo de cada archivo se encuentra en las páginas siguientes de este documento.*

---

## 9. Conclusión del Proyecto

El desarrollo del Sistema de Gestión Documental para la Secretaría General de la ULEAM permitió cumplir con los objetivos planteados al inicio del proyecto, logrando una plataforma web funcional que digitaliza y centraliza el flujo de trámites documentales de la institución.

**Logros alcanzados:**

- Se implementó un sistema completo de gestión documental con bandeja de entrada personalizada por usuario, permitiendo que cada funcionario visualice únicamente los trámites que le competen.
- Se desarrolló un mecanismo de delegación de trámites entre facultades y carreras, con trazabilidad completa a través de un historial de auditoría.
- Se integró un módulo de almacenamiento digital que permite subir, clasificar y compartir archivos entre los usuarios del sistema.
- Se construyó una interfaz de usuario moderna y responsiva, con soporte para modo claro y oscuro, utilizando Vue.js 3 como framework reactivo.
- Se creó una arquitectura backend modular basada en Node.js puro (sin dependencias externas como Express), demostrando el dominio de los conceptos fundamentales de HTTP y APIs REST.
- Se utilizaron archivos JSON como sistema de almacenamiento semi-estructurado, cumpliendo con los requerimientos de la asignatura sobre formatos de datos.

**Aspectos técnicos destacados:**

- Uso de **Vue.js 3** para la reactividad de la interfaz (computed properties, watchers, v-model).
- **API REST** completa con verbos HTTP (GET, POST, PATCH, DELETE).
- **Almacenamiento dual**: localStorage en el cliente para la sesión, y archivos JSON en el servidor para la persistencia de datos.
- **Validación de formularios** tanto en el frontend (HTML5 + JavaScript) como en el backend (Node.js).
- Diseño con **variables CSS** para la gestión dinámica de temas visuales.
- Más de **120 usuarios pre-registrados** representando las 8 facultades y sus respectivas carreras.

**Lecciones aprendidas:**

- La importancia de una arquitectura modular para facilitar el mantenimiento y la escalabilidad del código.
- El valor de las validaciones tanto del lado del cliente como del servidor para garantizar la integridad de los datos.
- La utilidad de los formatos semi-estructurados (JSON) como alternativa ligera a bases de datos relacionales para proyectos de escala media.

---

## 10. Bibliografía

1. **Vue.js** — Documentación oficial. (2024). *The Progressive JavaScript Framework*. Recuperado de: https://vuejs.org/guide/introduction.html

2. **MDN Web Docs** — Mozilla Developer Network. (2024). *JavaScript Guide*. Recuperado de: https://developer.mozilla.org/es/docs/Web/JavaScript/Guide

3. **Node.js** — Documentación oficial. (2024). *Node.js v18 Documentation — HTTP Module*. Recuperado de: https://nodejs.org/docs/latest-v18.x/api/http.html

4. **Chart.js** — Documentación oficial. (2024). *Simple yet flexible JavaScript charting library*. Recuperado de: https://www.chartjs.org/docs/latest/

5. **Font Awesome** — Documentación oficial. (2024). *Icon Library and Toolkit*. Recuperado de: https://fontawesome.com/docs

6. **JSON.org** — Introducing JSON. (2024). *JavaScript Object Notation*. Recuperado de: https://www.json.org/json-es.html

7. **Vercel** — Documentación oficial. (2024). *Vercel Documentation — Deploying Node.js Applications*. Recuperado de: https://vercel.com/docs

8. **W3Schools** — (2024). *HTML5, CSS3 and JavaScript Tutorials*. Recuperado de: https://www.w3schools.com/

9. **Flanagan, D.** (2020). *JavaScript: The Definitive Guide* (7th ed.). O'Reilly Media.

10. **Pressman, R.** (2019). *Ingeniería del Software: Un Enfoque Práctico* (9ª ed.). McGraw-Hill Education.

---

*Documento generado como parte del Trabajo Autónomo del Segundo Parcial.*
*Universidad Laica Eloy Alfaro de Manabí — 2026*
