<template>
  <div id="app">
    <!-- ======================== LOGIN ======================== -->
    <div id="login-screen" v-if="!session.logged">
      <div class="login-box">
        <div class="login-logo">
          <div class="brand-icon"><i class="fas fa-file-invoice"></i></div>
          <h1>DocuGest</h1>
          <p>Sistema de Gestión Documental</p>
        </div>
        <form @submit.prevent="login">
          <div class="form-group">
            <label>Usuario</label>
            <input v-model="loginForm.user" type="text" placeholder="Ingresa tu usuario" autocomplete="username" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input v-model="loginForm.pass" type="password" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary">
            <i class="fas fa-sign-in-alt"></i> Ingresar al Sistema
          </button>
          <p class="error-msg">{{ loginForm.error }}</p>
        </form>
        <div class="demo-creds">
          <strong>Credenciales de acceso:</strong>
          <table>
            <tr><td>admin / 1234</td><td style="color:#ef4444;font-weight:600">Administrador</td></tr>
            <tr><td>user / 1234</td><td style="color:#3b82f6;font-weight:600">Secretaria OM</td></tr>
          </table>
        </div>
      </div>
    </div>

    <!-- ======================== SISTEMA ======================== -->
    <div id="app-shell" v-else>

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="icon"><i class="fas fa-file-invoice"></i></div>
          <div>
            <div class="name">DocuGest</div>
            <div class="sub">Gestión Documental</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">Principal</div>
          <div class="nav-item" :class="{active: vista==='dashboard'}" @click="vista='dashboard'">
            <i class="fas fa-chart-pie"></i> Panel de Control
          </div>
          <div class="nav-item" :class="{active: vista==='bandeja'}" @click="vista='bandeja'">
            <i class="fas fa-inbox"></i> Bandeja de Entrada
            <span class="nav-badge" v-if="documentosPendientes > 0">{{ documentosPendientes }}</span>
          </div>

          <div class="nav-section">Documentos</div>
          <div class="nav-item" :class="{active: vista==='registro'}" @click="vista='registro'">
            <i class="fas fa-plus-circle"></i> Registrar Documento
          </div>
          <div class="nav-item" :class="{active: vista==='archivos'}" @click="vista='archivos'">
            <i class="fas fa-folder-open"></i> Archivo General
          </div>

          <div class="nav-section">Gestión</div>
          <div class="nav-item" :class="{active: vista==='reportes'}" @click="vista='reportes'">
            <i class="fas fa-chart-bar"></i> Reportes
          </div>
          <div v-if="session.rol==='Administrador'" class="nav-item" :class="{active: vista==='usuarios'}" @click="vista='usuarios'">
            <i class="fas fa-users-cog"></i> Gestión de Usuarios
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar" :style="{background: session.rol==='Administrador' ? '#ef4444' : '#3b82f6'}">
              {{ session.nombre ? session.nombre.charAt(0) : 'U' }}
            </div>
            <div class="user-info">
              <div class="name">{{ session.nombre }}</div>
              <div class="role">{{ session.rol }}</div>
            </div>
            <button class="btn-logout" @click="logout" title="Cerrar sesión">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="main-content">

        <!-- ===== DASHBOARD ===== -->
        <div v-show="vista==='dashboard'">
          <div class="page-header">
            <div>
              <div class="page-title">Panel de Control <span>{{ hoy }}</span></div>
            </div>
            <button class="btn-gray btn-sm" @click="exportarReporte">
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>

          <div class="stats-grid">
            <div class="stat-card stat-red">
              <div class="label">Total Documentos</div>
              <div class="value">{{ stats.total }}</div>
              <div class="change"><i class="fas fa-arrow-up"></i> Acumulado</div>
              <i class="fas fa-file-alt icon"></i>
            </div>
            <div class="stat-card stat-orange">
              <div class="label">Pendientes</div>
              <div class="value">{{ stats.pendientes }}</div>
              <div class="change">Requieren acción</div>
              <i class="fas fa-clock icon"></i>
            </div>
            <div class="stat-card stat-green">
              <div class="label">Despachados</div>
              <div class="value">{{ stats.despachados }}</div>
              <div class="change">Completados</div>
              <i class="fas fa-check-circle icon"></i>
            </div>
            <div class="stat-card stat-blue">
              <div class="label">En Proceso</div>
              <div class="value">{{ stats.enProceso }}</div>
              <div class="change">En revisión</div>
              <i class="fas fa-spinner icon"></i>
            </div>
          </div>

          <div class="charts-grid">
            <div class="card">
              <div class="card-header">
                <span class="card-title">Movimiento Semanal</span>
                <span class="tag">Últimos 7 días</span>
              </div>
              <div class="chart-wrap">
                <canvas id="chartLinea"></canvas>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <span class="card-title">Estado Actual</span>
              </div>
              <div class="chart-wrap">
                <canvas id="chartPie"></canvas>
              </div>
            </div>
          </div>

          <div style="margin-top:16px" class="card">
            <div class="card-header">
              <span class="card-title">Documentos por Categoría</span>
            </div>
            <div class="chart-wrap">
              <canvas id="chartBarras"></canvas>
            </div>
          </div>
        </div>

        <!-- ===== BANDEJA ===== -->
        <div v-show="vista==='bandeja'">
          <div class="page-header">
            <div class="page-title">Bandeja de Entrada <span>{{ documentosFiltrados.length }} documentos</span></div>
            <button class="btn-primary btn-sm" @click="vista='registro'">
              <i class="fas fa-plus"></i> Nuevo
            </button>
          </div>

          <div class="filters-bar">
            <input v-model="filtros.busqueda" type="text" placeholder="🔍  Buscar por asunto, remitente, número..." style="min-width:260px" />
            <select v-model="filtros.estado">
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Revisado">Revisado</option>
              <option value="Despachado">Despachado</option>
            </select>
            <select v-model="filtros.prioridad">
              <option value="">Todas las prioridades</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
            <select v-model="filtros.categoria">
              <option value="">Todas las categorías</option>
              <option value="Documentación">Documentación</option>
              <option value="Admisión">Admisión</option>
              <option value="Internos">Internos</option>
              <option value="Correspondencia">Correspondencia</option>
            </select>
            <span class="filter-count">{{ documentosFiltrados.length }} resultado(s)</span>
          </div>

          <div class="two-col">
            <div class="card" style="padding:0">
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>N° Doc.</th>
                      <th>Asunto</th>
                      <th>Remitente</th>
                      <th>Categoría</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="documentosFiltrados.length === 0">
                      <td colspan="7">
                        <div class="empty-state">
                          <i class="fas fa-inbox"></i>
                          <p>No hay documentos que coincidan</p>
                        </div>
                      </td>
                    </tr>
                    <tr v-for="doc in documentosFiltrados" :key="doc.id"
                        :class="{active: docSeleccionado?.id === doc.id}"
                        @click="docSeleccionado = doc"
                        :style="docSeleccionado?.id === doc.id ? 'background:#f0f9ff' : ''">
                      <td><code style="font-size:11px;color:var(--muted)">{{ doc.numero }}</code></td>
                      <td><strong>{{ doc.asunto }}</strong></td>
                      <td>{{ doc.remitente }}</td>
                      <td><span class="tag">{{ doc.categoria }}</span></td>
                      <td>
                        <span class="priority-dot" :class="'p-'+doc.prioridad.toLowerCase()">
                          {{ doc.prioridad }}
                        </span>
                      </td>
                      <td><span class="badge" :class="badgeEstado(doc.estado)">{{ doc.estado }}</span></td>
                      <td style="color:var(--muted);white-space:nowrap">{{ doc.fecha }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="detail-panel">
              <div v-if="!docSeleccionado" class="detail-empty">
                <i class="fas fa-mouse-pointer"></i>
                <p>Selecciona un documento para ver su detalle</p>
              </div>
              <div v-else>
                <div class="detail-section">
                  <h4>Información del Documento</h4>
                  <div class="detail-row">
                    <span class="key">N° Doc.</span>
                    <span class="val"><code>{{ docSeleccionado.numero }}</code></span>
                  </div>
                  <div class="detail-row">
                    <span class="key">Asunto</span>
                    <span class="val">{{ docSeleccionado.asunto }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="key">Remitente</span>
                    <span class="val">{{ docSeleccionado.remitente }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="key">Destino</span>
                    <span class="val">{{ docSeleccionado.destino }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="key">Fecha</span>
                    <span class="val">{{ docSeleccionado.fecha }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="key">Categoría</span>
                    <span class="val"><span class="tag">{{ docSeleccionado.categoria }}</span></span>
                  </div>
                  <div class="detail-row">
                    <span class="key">Prioridad</span>
                    <span class="val">
                      <span class="priority-dot" :class="'p-'+docSeleccionado.prioridad.toLowerCase()">
                        {{ docSeleccionado.prioridad }}
                      </span>
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="key">Estado</span>
                    <span class="val">
                      <span class="badge" :class="badgeEstado(docSeleccionado.estado)">{{ docSeleccionado.estado }}</span>
                    </span>
                  </div>
                  <div v-if="docSeleccionado.descripcion" class="detail-row">
                    <span class="key">Descripción</span>
                    <span class="val" style="font-size:12px;color:var(--muted)">{{ docSeleccionado.descripcion }}</span>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="detail-section">
                  <h4>Cambiar Estado</h4>
                  <select v-model="docSeleccionado.estado" @change="actualizarDocumento(docSeleccionado)" style="margin-bottom:12px">
                    <option>Pendiente</option>
                    <option>En proceso</option>
                    <option>Revisado</option>
                    <option>Despachado</option>
                  </select>
                </div>

                <div class="detail-actions">
                  <button class="btn-green btn-sm" @click="marcarRevisado(docSeleccionado)">
                    <i class="fas fa-check"></i> Revisar
                  </button>
                  <button class="btn-blue btn-sm" @click="despacharDoc(docSeleccionado)">
                    <i class="fas fa-paper-plane"></i> Despachar
                  </button>
                  <button v-if="session.rol==='Administrador'" class="btn-red btn-sm"
                          @click="eliminarDocumento(docSeleccionado)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== REGISTRO ===== -->
        <div v-show="vista==='registro'">
          <div class="page-header">
            <div class="page-title">Registrar Documento</div>
          </div>

          <div class="two-col-equal">
            <div class="card">
              <div class="card-header"><span class="card-title">Datos del Documento</span></div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Número de Documento</label>
                  <input v-model="regForm.numero" type="text" :placeholder="'DOC-'+nextNumero" />
                </div>
                <div class="form-group">
                  <label>Fecha de Recepción</label>
                  <input v-model="regForm.fecha" type="date" />
                </div>
                <div class="form-group full">
                  <label>Asunto</label>
                  <input v-model="regForm.asunto" type="text" placeholder="Ej: Solicitud de información presupuestaria" />
                </div>
                <div class="form-group">
                  <label>Remitente</label>
                  <input v-model="regForm.remitente" type="text" placeholder="Nombre o entidad" />
                </div>
                <div class="form-group">
                  <label>Destino / Área</label>
                  <input v-model="regForm.destino" type="text" placeholder="Área o funcionario" />
                </div>
                <div class="form-group">
                  <label>Categoría</label>
                  <select v-model="regForm.categoria">
                    <option>Documentación</option>
                    <option>Admisión</option>
                    <option>Internos</option>
                    <option>Correspondencia</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Prioridad</label>
                  <select v-model="regForm.prioridad">
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Baja</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label>Descripción / Observaciones</label>
                  <textarea v-model="regForm.descripcion" rows="3" placeholder="Detalles adicionales del documento..."></textarea>
                </div>
              </div>
              <div style="display:flex;gap:10px;margin-top:4px">
                <button class="btn-primary" @click="registrarDocumento" :disabled="!regFormValido">
                  <i class="fas fa-save"></i> Registrar Documento
                </button>
                <button class="btn-gray" @click="resetRegForm">
                  <i class="fas fa-times"></i> Limpiar
                </button>
              </div>
            </div>

            <div>
              <div class="card" style="margin-bottom:16px">
                <div class="card-header"><span class="card-title">Adjuntar Archivos</span></div>
                <div class="upload-zone" @click="$refs.fileInput.click()" @dragover.prevent @drop.prevent="onDrop">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Haz clic o arrastra archivos aquí</p>
                  <p class="hint">PDF, DOCX, XLSX, JPG — Máx. 10 MB c/u</p>
                </div>
                <input ref="fileInput" type="file" style="display:none" multiple accept=".pdf,.doc,.docx,.xlsx,.jpg,.png"
                       @change="onFileSelect" />
                <div class="file-list">
                  <div class="file-item" v-for="(f, i) in regForm.archivos" :key="i">
                    <i class="fas fa-file-pdf"></i>
                    <span class="fname">{{ f.name }}</span>
                    <span class="fsize">{{ formatSize(f.size) }}</span>
                    <span class="remove" @click="regForm.archivos.splice(i,1)">
                      <i class="fas fa-times"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header"><span class="card-title">Últimos Registrados</span></div>
                <div v-if="documentos.length===0" style="text-align:center;color:var(--muted);padding:20px 0">
                  No hay documentos aún
                </div>
                <div v-for="doc in documentos.slice().reverse().slice(0,4)" :key="doc.id"
                     style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                  <div style="width:36px;height:36px;background:#fee2e2;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="fas fa-file-alt" style="color:var(--red)"></i>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ doc.asunto }}</div>
                    <div style="font-size:11px;color:var(--muted)">{{ doc.numero }} · {{ doc.fecha }}</div>
                  </div>
                  <span class="badge" :class="badgeEstado(doc.estado)" style="font-size:10px">{{ doc.estado }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== ARCHIVOS ===== -->
        <div v-show="vista==='archivos'">
          <div class="page-header">
            <div class="page-title">Archivo General <span>{{ documentos.length }} documentos</span></div>
          </div>
          <div class="filters-bar">
            <input v-model="filtroArchivo" type="text" placeholder="🔍  Buscar en el archivo..." />
            <select v-model="filtroArchivoCategoria">
              <option value="">Todas las categorías</option>
              <option>Documentación</option>
              <option>Admisión</option>
              <option>Internos</option>
              <option>Correspondencia</option>
            </select>
          </div>
          <div class="card" style="padding:0">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>N° Doc.</th>
                    <th>Asunto</th>
                    <th>Remitente</th>
                    <th>Destino</th>
                    <th>Categoría</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Archivos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="docsFiltradosArchivo.length===0">
                    <td colspan="9">
                      <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No hay documentos registrados</p>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="doc in docsFiltradosArchivo" :key="doc.id">
                    <td><code style="font-size:11px;color:var(--muted)">{{ doc.numero }}</code></td>
                    <td><strong>{{ doc.asunto }}</strong></td>
                    <td>{{ doc.remitente }}</td>
                    <td>{{ doc.destino }}</td>
                    <td><span class="tag">{{ doc.categoria }}</span></td>
                    <td>
                      <span class="priority-dot" :class="'p-'+doc.prioridad.toLowerCase()">{{ doc.prioridad }}</span>
                    </td>
                    <td><span class="badge" :class="badgeEstado(doc.estado)">{{ doc.estado }}</span></td>
                    <td style="color:var(--muted);white-space:nowrap">{{ doc.fecha }}</td>
                    <td>
                      <span v-if="doc.archivos && doc.archivos.length>0">
                        <i class="fas fa-paperclip" style="color:var(--muted)"></i> {{ doc.archivos.length }}
                      </span>
                      <span v-else style="color:#cbd5e1">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ===== REPORTES ===== -->
        <div v-show="vista==='reportes'">
          <div class="page-header">
            <div class="page-title">Reportes y Estadísticas</div>
            <button class="btn-gray btn-sm" @click="exportarReporte">
              <i class="fas fa-download"></i> Exportar CSV
            </button>
          </div>

          <div class="report-stat-grid">
            <div class="report-stat">
              <div class="rs-val" style="color:var(--red)">{{ stats.total }}</div>
              <div class="rs-label">Total de Documentos</div>
            </div>
            <div class="report-stat">
              <div class="rs-val" style="color:var(--orange)">{{ stats.pendientes }}</div>
              <div class="rs-label">Pendientes</div>
            </div>
            <div class="report-stat">
              <div class="rs-val" style="color:var(--green)">{{ stats.despachados }}</div>
              <div class="rs-label">Despachados</div>
            </div>
            <div class="report-stat">
              <div class="rs-val" style="color:var(--blue)">{{ stats.enProceso }}</div>
              <div class="rs-label">En Proceso</div>
            </div>
            <div class="report-stat">
              <div class="rs-val" style="color:#8b5cf6">{{ stats.revisados }}</div>
              <div class="rs-label">Revisados</div>
            </div>
            <div class="report-stat">
              <div class="rs-val" style="color:var(--muted)">
                {{ stats.total > 0 ? Math.round((stats.despachados/stats.total)*100) : 0 }}%
              </div>
              <div class="rs-label">Tasa de Despacho</div>
            </div>
          </div>

          <div class="two-col-equal">
            <div class="card">
              <div class="card-header"><span class="card-title">Por Categoría</span></div>
              <div v-for="cat in statsPorCategoria" :key="cat.nombre" style="margin-bottom:14px">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px">
                  <span>{{ cat.nombre }}</span>
                  <strong>{{ cat.total }}</strong>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{width: stats.total>0 ? (cat.total/stats.total*100)+'%' : '0%'}"></div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><span class="card-title">Por Prioridad</span></div>
              <div v-for="p in statsPorPrioridad" :key="p.nombre" style="margin-bottom:16px">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px">
                  <span class="priority-dot" :class="'p-'+p.nombre.toLowerCase()">{{ p.nombre }}</span>
                  <strong>{{ p.total }}</strong>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill"
                       :style="{width: stats.total>0 ? (p.total/stats.total*100)+'%':'0%',
                                background: p.nombre==='Alta' ? '#ef4444' : p.nombre==='Media' ? '#f97316' : '#10b981'}"></div>
                </div>
              </div>

              <div class="divider"></div>
              <div class="card-header" style="margin-top:8px"><span class="card-title">Resumen por Estado</span></div>
              <div v-for="e in statsPorEstado" :key="e.estado" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
                <span><span class="badge" :class="badgeEstado(e.estado)">{{ e.estado }}</span></span>
                <strong>{{ e.total }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== USUARIOS ===== -->
        <div v-show="vista==='usuarios'" v-if="session.rol==='Administrador'">
          <div class="page-header">
            <div class="page-title">Gestión de Usuarios</div>
            <button class="btn-primary btn-sm" @click="showModalUsuario=true">
              <i class="fas fa-user-plus"></i> Agregar Usuario
            </button>
          </div>

          <div class="filters-bar">
            <input v-model="filtroUsuarios" type="text" placeholder="🔍  Buscar usuario..." />
            <select v-model="filtroEstadoUsuario">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="desactivado">Desactivado</option>
            </select>
          </div>

          <div class="card" style="padding:0">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Último acceso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in usuariosFiltrados" :key="u.id">
                    <td><code style="font-size:12px">{{ u.username }}</code></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar-sm" :style="{background: u.rol==='Administrador' ? '#ef4444' : '#3b82f6'}">
                          {{ u.nombre ? u.nombre.charAt(0) : 'U' }}
                        </div>
                        {{ u.nombre }}
                      </div>
                    </td>
                    <td>
                      <span class="badge" :class="u.rol==='Administrador' ? 'badge-red' : 'badge-blue'">
                        {{ u.rol }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="u.estado==='activo' ? 'badge-green' : 'badge-gray'">
                        {{ u.estado === 'activo' ? 'Activo' : 'Desactivado' }}
                      </span>
                    </td>
                    <td style="color:var(--muted)">{{ u.ultimoAcceso || 'Sin registro' }}</td>
                    <td>
                      <button class="btn-sm" :class="u.estado==='activo' ? 'btn-gray' : 'btn-green'"
                              @click="toggleUsuario(u)" :disabled="u.username==='admin'">
                        <i :class="u.estado==='activo' ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                        {{ u.estado==='activo' ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button class="btn-sm btn-red" style="margin-left:6px" @click="eliminarUsuario(u)"
                              :disabled="u.username==='admin'">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- ===== MODAL NUEVO USUARIO ===== -->
    <div class="modal-backdrop" v-if="showModalUsuario" @click.self="showModalUsuario=false">
      <div class="modal">
        <h3><i class="fas fa-user-plus" style="color:var(--red)"></i> Agregar Usuario</h3>
        <div class="form-grid-2">
          <div class="form-group">
            <label>Nombre completo</label>
            <input v-model="nuevoUsuario.nombre" type="text" placeholder="Ej: Juan Pérez" />
          </div>
          <div class="form-group">
            <label>Username</label>
            <input v-model="nuevoUsuario.username" type="text" placeholder="Ej: jperez" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input v-model="nuevoUsuario.password" type="password" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select v-model="nuevoUsuario.rol">
              <option value="Usuario">Usuario / Secretaria</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-gray" @click="showModalUsuario=false">Cancelar</button>
          <button class="btn-primary" @click="agregarUsuario">
            <i class="fas fa-save"></i> Guardar Usuario
          </button>
        </div>
      </div>
    </div>

    <!-- TOASTS -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        <i :class="t.icon"></i> {{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

export default {
  name: 'App',
  setup() {
    const API_URL = 'http://localhost:3000/api';

    const LS = {
      get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } },
      set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
    };

    // ─── SESSION ───
    const session = ref(LS.get('session', { logged: false, username:'', nombre:'', rol:'' }));

    // ─── DATOS PRINCIPALES ───
    const documentos = ref([]);
    const usuarios   = ref([]);

    // ─── UI STATE ───
    const vista          = ref('dashboard');
    const docSeleccionado = ref(null);
    const showModalUsuario = ref(false);
    const toasts = ref([]);

    // ─── FILTROS BANDEJA ───
    const filtros = ref({ busqueda:'', estado:'', prioridad:'', categoria:'' });

    // ─── FILTROS ARCHIVO ───
    const filtroArchivo = ref('');
    const filtroArchivoCategoria = ref('');

    // ─── FILTROS USUARIOS ───
    const filtroUsuarios = ref('');
    const filtroEstadoUsuario = ref('');

    // ─── FORMULARIO REGISTRO ───
    const regFormBase = () => ({
      numero: '', asunto: '', remitente: '', destino: '',
      categoria: 'Documentación', prioridad: 'Media',
      descripcion: '', fecha: new Date().toISOString().split('T')[0],
      archivos: []
    });
    const regForm = ref(regFormBase());

    // ─── FORMULARIO USUARIO ───
    const nuevoUsuario = ref({ nombre:'', username:'', password:'', rol:'Usuario' });

    // ─── CHARTS ───
    let chartLinea = null, chartPie = null, chartBarras = null;

    // ─── COMPUTED ───
    const hoy = computed(() => new Date().toLocaleDateString('es-EC', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));

    const nextNumero = computed(() => {
      const n = documentos.value.length + 1;
      return `2025-${String(n).padStart(3,'0')}`;
    });

    const documentosPendientes = computed(() =>
      documentos.value.filter(d => d.estado === 'Pendiente').length
    );

    const stats = computed(() => {
      const docs = documentos.value;
      return {
        total:       docs.length,
        pendientes:  docs.filter(d => d.estado === 'Pendiente').length,
        despachados: docs.filter(d => d.estado === 'Despachado').length,
        enProceso:   docs.filter(d => d.estado === 'En proceso').length,
        revisados:   docs.filter(d => d.estado === 'Revisado').length,
      };
    });

    const statsPorCategoria = computed(() => {
      const cats = ['Documentación','Admisión','Internos','Correspondencia'];
      return cats.map(c => ({ nombre: c, total: documentos.value.filter(d => d.categoria === c).length }));
    });

    const statsPorPrioridad = computed(() => {
      return ['Alta','Media','Baja'].map(p => ({ nombre: p, total: documentos.value.filter(d => d.prioridad === p).length }));
    });

    const statsPorEstado = computed(() => {
      return ['Pendiente','En proceso','Revisado','Despachado'].map(e => ({
        estado: e, total: documentos.value.filter(d => d.estado === e).length
      }));
    });

    const documentosFiltrados = computed(() => {
      return documentos.value.filter(doc => {
        const b = filtros.value.busqueda.toLowerCase();
        const coincideTexto = !b ||
          doc.asunto.toLowerCase().includes(b) ||
          doc.remitente.toLowerCase().includes(b) ||
          doc.numero.toLowerCase().includes(b) ||
          doc.destino.toLowerCase().includes(b);
        const coincideEstado    = !filtros.value.estado    || doc.estado    === filtros.value.estado;
        const coincidePrioridad = !filtros.value.prioridad || doc.prioridad === filtros.value.prioridad;
        const coincideCategoria = !filtros.value.categoria || doc.categoria === filtros.value.categoria;
        return coincideTexto && coincideEstado && coincidePrioridad && coincideCategoria;
      });
    });

    const docsFiltradosArchivo = computed(() => {
      return documentos.value.filter(doc => {
        const b = filtroArchivo.value.toLowerCase();
        const coincideTexto = !b ||
          doc.asunto.toLowerCase().includes(b) ||
          doc.numero.toLowerCase().includes(b) ||
          doc.remitente.toLowerCase().includes(b);
        const coincideCategoria = !filtroArchivoCategoria.value || doc.categoria === filtroArchivoCategoria.value;
        return coincideTexto && coincideCategoria;
      });
    });

    const usuariosFiltrados = computed(() => {
      return usuarios.value.filter(u => {
        const b = filtroUsuarios.value.toLowerCase();
        const coincideTexto = !b || u.nombre.toLowerCase().includes(b) || u.username.toLowerCase().includes(b);
        const coincideEstado = !filtroEstadoUsuario.value || u.estado === filtroEstadoUsuario.value;
        return coincideTexto && coincideEstado;
      });
    });

    const regFormValido = computed(() => regForm.value.asunto && regForm.value.remitente && regForm.value.destino);

    // ─── PERSISTENCIA AUTOMÁTICA ───
    watch(session, v => LS.set('session', v), { deep: true });

    // ─── ACTUALIZAR GRÁFICOS al cambiar docs o vista ───
    watch([documentos, vista], () => {
      if (vista.value === 'dashboard') {
        nextTick(() => renderCharts());
      }
    }, { deep: true });

    // ─── MÉTODOS: AUTH ───
    const loginForm = ref({ user:'', pass:'', error:'' });

    async function cargarDatos() {
      try {
        const resDocs = await fetch(`${API_URL}/documentos`);
        if (resDocs.ok) {
          const docs = await resDocs.json();
          documentos.value = docs.map(d => ({
            id: d.id,
            numero: d.ticket || `DOC-${d.id}`,
            asunto: d.asunto,
            remitente: d.remitente,
            destino: d.destinatarioNombre || d.facultad,
            categoria: d.categoria,
            prioridad: d.prioridad.charAt(0).toUpperCase() + d.prioridad.slice(1),
            estado: d.estado.charAt(0).toUpperCase() + d.estado.slice(1),
            fecha: d.fecha,
            descripcion: d.asunto,
            archivos: []
          }));
        }
        const resUsers = await fetch(`${API_URL}/usuarios`);
        if (resUsers.ok) {
          const users = await resUsers.json();
          usuarios.value = users.map(u => ({
            id: u.id,
            username: u.usuario,
            nombre: u.nombre,
            rol: u.rol,
            estado: u.estado,
            ultimoAcceso: u.ultimoAcceso || 'Sin registro'
          }));
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    }

    async function login() {
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario: loginForm.value.user, clave: loginForm.value.pass })
        });
        if (res.ok) {
          const u = await res.json();
          session.value = { logged: true, id: u.id, username: u.usuario, nombre: u.nombre, rol: u.rol };
          loginForm.value.error = '';
          vista.value = 'dashboard';
          await cargarDatos();
          nextTick(() => renderCharts());
        } else {
          loginForm.value.error = '❌ Credenciales incorrectas o usuario desactivado.';
        }
      } catch (err) {
        loginForm.value.error = '❌ Error de conexión con el servidor.';
      }
    }

    function logout() {
      session.value = { logged: false, username:'', nombre:'', rol:'' };
      loginForm.value = { user:'', pass:'', error:'' };
      docSeleccionado.value = null;
      documentos.value = [];
      usuarios.value = [];
    }

    // ─── MÉTODOS: DOCUMENTOS ───
    async function registrarDocumento() {
      if (!regFormValido.value) return;
      const f = regForm.value;
      try {
        const res = await fetch(`${API_URL}/documentos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket: f.numero || `DOC-${Date.now()}`,
            categoria: f.categoria,
            prioridad: f.prioridad.toLowerCase(),
            remitente: f.remitente,
            facultad: f.destino,
            asunto: f.asunto,
            usuarioId: session.value.id,
            usuarioNombre: session.value.nombre
          })
        });
        if (res.ok) {
          toast('Documento registrado exitosamente', 'fas fa-check-circle');
          resetRegForm();
          await cargarDatos();
          vista.value = 'bandeja';
        } else {
          toast('Error al registrar documento', 'fas fa-exclamation-triangle', 'error');
        }
      } catch (err) {
        toast('Error de conexión', 'fas fa-wifi', 'error');
      }
    }

    function resetRegForm() {
      regForm.value = regFormBase();
    }

    async function actualizarDocumento(doc) {
      try {
        const res = await fetch(`${API_URL}/documentos/${doc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: doc.estado.toLowerCase(),
            usuario: session.value.nombre
          })
        });
        if (res.ok) {
          toast('Estado actualizado', 'fas fa-sync');
          await cargarDatos();
        } else {
          toast('Error al actualizar estado', 'fas fa-exclamation-triangle', 'error');
        }
      } catch (err) {
        toast('Error de conexión', 'fas fa-wifi', 'error');
      }
    }

    function marcarRevisado(doc) {
      doc.estado = 'Revisado';
      actualizarDocumento(doc);
    }

    function despacharDoc(doc) {
      doc.estado = 'Despachado';
      actualizarDocumento(doc);
    }

    function eliminarDocumento(doc) {
      toast('Eliminación no soportada directamente en este flujo de API', 'fas fa-exclamation-triangle', 'warning');
    }

    // ─── MÉTODOS: USUARIOS ───
    async function toggleUsuario(u) {
      const nuevoEstado = u.estado === 'activo' ? 'desactivado' : 'activo';
      try {
        const res = await fetch(`${API_URL}/usuarios/${u.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });
        if (res.ok) {
          toast(`Usuario ${u.nombre} ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`,
                nuevoEstado === 'activo' ? 'fas fa-user-check' : 'fas fa-user-slash');
          await cargarDatos();
        } else {
          toast('Error al modificar usuario', 'fas fa-exclamation-triangle', 'error');
        }
      } catch (err) {
        toast('Error de conexión', 'fas fa-wifi', 'error');
      }
    }

    async function eliminarUsuario(u) {
      if (u.username === 'admin') return;
      if (!confirm(`¿Eliminar al usuario ${u.nombre}?`)) return;
      try {
        const res = await fetch(`${API_URL}/usuarios/${u.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          toast(`Usuario ${u.nombre} eliminado`, 'fas fa-trash', 'error');
          await cargarDatos();
        } else {
          toast('Error al eliminar usuario', 'fas fa-exclamation-triangle', 'error');
        }
      } catch (err) {
        toast('Error de conexión', 'fas fa-wifi', 'error');
      }
    }

    async function agregarUsuario() {
      const n = nuevoUsuario.value;
      if (!n.nombre || !n.username || !n.password) {
        toast('Completa todos los campos', 'fas fa-exclamation-triangle', 'warning');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: n.nombre,
            usuario: n.username.toLowerCase(),
            clave: n.password,
            facultad: 'General',
            rol: n.rol
          })
        });
        if (res.ok) {
          showModalUsuario.value = false;
          nuevoUsuario.value = { nombre:'', username:'', password:'', rol:'Usuario' };
          toast(`Usuario ${n.nombre} creado`, 'fas fa-user-plus');
          await cargarDatos();
        } else {
          const data = await res.json();
          toast(data.error || 'Error al crear usuario', 'fas fa-exclamation-triangle', 'error');
        }
      } catch (err) {
        toast('Error de conexión', 'fas fa-wifi', 'error');
      }
    }

    // ─── MÉTODOS: ARCHIVOS ───
    function onFileSelect(e) {
      regForm.value.archivos.push(...Array.from(e.target.files));
      e.target.value = '';
    }

    function onDrop(e) {
      regForm.value.archivos.push(...Array.from(e.dataTransfer.files));
    }

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
      return (bytes/1048576).toFixed(1) + ' MB';
    }

    function exportarReporte() {
      const header = ['Numero','Asunto','Remitente','Destino','Categoria','Prioridad','Estado','Fecha'];
      const rows = documentos.value.map(d =>
        [d.numero, d.asunto, d.remitente, d.destino, d.categoria, d.prioridad, d.estado, d.fecha]
      );
      const csv = [header, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'reporte-docugest.csv'; a.click();
      URL.revokeObjectURL(url);
      toast('Reporte exportado', 'fas fa-download');
    }

    function toast(msg, icon = 'fas fa-info-circle', type = 'success') {
      const id = Date.now();
      toasts.value.push({ id, msg, icon, type });
      setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 3500);
    }

    function badgeEstado(estado) {
      return {
        'Pendiente':   'badge-orange',
        'En proceso':  'badge-blue',
        'Revisado':    'badge-yellow',
        'Despachado':  'badge-green',
      }[estado] || 'badge-gray';
    }

    function renderCharts() {
      const docs = documentos.value;
      const dias = [];
      const recibidos = [], despachados = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('es-EC', { weekday: 'short' });
        const iso   = d.toISOString().split('T')[0];
        dias.push(label);
        recibidos.push(docs.filter(x => x.fecha === iso).length);
        despachados.push(docs.filter(x => x.fecha === iso && x.estado === 'Despachado').length);
      }

      const ctxPie = document.getElementById('chartPie');
      if (ctxPie) {
        if (chartPie) chartPie.destroy();
        chartPie = new Chart(ctxPie, {
          type: 'doughnut',
          data: {
            labels: ['Pendiente','En proceso','Revisado','Despachado'],
            datasets: [{
              data: [stats.value.pendientes, stats.value.enProceso, stats.value.revisados, stats.value.despachados],
              backgroundColor: ['#f97316','#3b82f6','#f59e0b','#10b981'],
              borderWidth: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
          }
        });
      }

      const ctxLinea = document.getElementById('chartLinea');
      if (ctxLinea) {
        if (chartLinea) chartLinea.destroy();
        chartLinea = new Chart(ctxLinea, {
          type: 'line',
          data: {
            labels: dias,
            datasets: [
              { label: 'Recibidos',   data: recibidos,   borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.1)', tension: .3, fill: true, pointRadius: 4 },
              { label: 'Despachados', data: despachados, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)', tension: .3, fill: true, pointRadius: 4 },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
          }
        });
      }

      const ctxBarras = document.getElementById('chartBarras');
      if (ctxBarras) {
        if (chartBarras) chartBarras.destroy();
        const cats = ['Documentación','Admisión','Internos','Correspondencia'];
        chartBarras = new Chart(ctxBarras, {
          type: 'bar',
          data: {
            labels: cats,
            datasets: [
              { label: 'Total',       data: cats.map(c => docs.filter(d => d.categoria===c).length), backgroundColor: '#818cf8' },
              { label: 'Despachados', data: cats.map(c => docs.filter(d => d.categoria===c && d.estado==='Despachado').length), backgroundColor: '#34d399' },
              { label: 'Pendientes',  data: cats.map(c => docs.filter(d => d.categoria===c && d.estado==='Pendiente').length), backgroundColor: '#fb923c' },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
          }
        });
      }
    }

    onMounted(async () => {
      if (session.value.logged) {
        await cargarDatos();
        nextTick(() => renderCharts());
      }
    });

    return {
      session,
      loginForm,
      login,
      logout,
      vista,
      hoy,
      nextNumero,
      documentos,
      documentosFiltrados,
      docsFiltradosArchivo,
      docSeleccionado,
      filtros,
      filtroArchivo,
      filtroArchivoCategoria,
      documentosPendientes,
      stats,
      statsPorCategoria,
      statsPorPrioridad,
      statsPorEstado,
      regForm,
      regFormValido,
      resetRegForm,
      registrarDocumento,
      actualizarDocumento,
      marcarRevisado,
      despacharDoc,
      eliminarDocumento,
      usuarios,
      usuariosFiltrados,
      filtroUsuarios,
      filtroEstadoUsuario,
      toggleUsuario,
      eliminarUsuario,
      showModalUsuario,
      nuevoUsuario,
      agregarUsuario,
      onFileSelect,
      onDrop,
      formatSize,
      badgeEstado,
      exportarReporte,
      toasts,
    };
  }
};
</script>

<style scoped>
/* ==============================
   TOKENS & RESET
============================== */
:root {
  --red:        #db3434;
  --red-dark:   #b92929;
  --green:      #10b981;
  --blue:       #3b82f6;
  --orange:     #f97316;
  --yellow:     #f59e0b;
  --sidebar-w:  260px;
  --bg:         #f0f2f5;
  --sidebar-bg: #1e2128;
  --sidebar-hover: #2a2f3a;
  --card-bg:    #ffffff;
  --border:     #e2e8f0;
  --text:       #1e293b;
  --muted:      #64748b;
  --shadow:     0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
  --shadow-lg:  0 10px 25px rgba(0,0,0,.15);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

input, select, textarea {
  font-family: inherit;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 9px 12px;
  width: 100%;
  transition: border-color .2s;
  background: #fff;
  color: var(--text);
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--red);
}
button {
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  padding: 9px 16px;
  cursor: pointer;
  transition: background .2s, transform .1s, opacity .2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
button:active { transform: scale(.98); }
button:disabled { opacity: .5; cursor: not-allowed; }

/* ==============================
   LOGIN
============================== */
#login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e2128 0%, #2d3748 50%, #1a1f2e 100%);
}
.login-box {
  background: #fff;
  border-radius: 16px;
  padding: 44px 40px;
  width: 380px;
  box-shadow: var(--shadow-lg);
}
.login-logo {
  text-align: center;
  margin-bottom: 28px;
}
.login-logo .brand-icon {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, var(--red), var(--red-dark));
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.login-logo .brand-icon i { color: #fff; font-size: 24px; }
.login-logo h1 { font-size: 22px; font-weight: 700; color: var(--text); }
.login-logo p { color: var(--muted); font-size: 13px; margin-top: 4px; }
.form-group { margin-bottom: 18px; }
.form-group label {
  display: block;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--muted);
  margin-bottom: 6px;
}
.btn-primary {
  background: var(--red);
  color: #fff;
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 15px;
  margin-top: 8px;
}
.btn-primary:hover { background: var(--red-dark); }
.error-msg {
  color: var(--red);
  font-size: 13px;
  margin-top: 12px;
  text-align: center;
  font-weight: 500;
  min-height: 20px;
}
.demo-creds {
  margin-top: 24px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px;
  font-size: 12px;
  color: var(--muted);
  border: 1px solid var(--border);
}
.demo-creds strong { color: var(--text); }
.demo-creds table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.demo-creds td { padding: 3px 6px; }
.demo-creds td:first-child { font-weight: 600; color: var(--text); }

/* ==============================
   LAYOUT SISTEMA
============================== */
#app-shell {
  display: flex;
  min-height: 100vh;
}

/* SIDEBAR */
.sidebar {
  width: var(--sidebar-w);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  transition: transform .3s;
}
.sidebar-brand {
  padding: 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  display: flex;
  align-items: center;
  gap: 12px;
}
.sidebar-brand .icon {
  width: 36px; height: 36px;
  background: var(--red);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sidebar-brand .icon i { color: #fff; font-size: 16px; }
.sidebar-brand .name { font-size: 16px; font-weight: 700; color: #fff; }
.sidebar-brand .sub { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 1px; }

.sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.nav-section {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: rgba(255,255,255,.3);
  padding: 14px 20px 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  color: rgba(255,255,255,.6);
  cursor: pointer;
  transition: all .2s;
  border-left: 3px solid transparent;
  text-decoration: none;
  font-weight: 500;
  font-size: 13.5px;
}
.nav-item i { width: 18px; text-align: center; font-size: 15px; }
.nav-item:hover {
  background: var(--sidebar-hover);
  color: #fff;
}
.nav-item.active {
  background: var(--sidebar-hover);
  color: #fff;
  border-left-color: var(--red);
}
.nav-badge {
  margin-left: auto;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
}
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,.08);
}
.user-card {
  display: flex; align-items: center; gap: 10px;
}
.user-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; color: #fff;
  flex-shrink: 0;
}
.user-info .name { font-size: 13px; font-weight: 600; color: #fff; }
.user-info .role {
  font-size: 11px; color: rgba(255,255,255,.45);
  margin-top: 1px;
}
.btn-logout {
  margin-left: auto;
  background: transparent;
  color: rgba(255,255,255,.4);
  padding: 6px 8px;
  font-size: 15px;
}
.btn-logout:hover { color: var(--red); background: rgba(239,68,68,.1); }

/* MAIN */
.main-content {
  margin-left: var(--sidebar-w);
  flex: 1;
  padding: 28px;
  min-height: 100vh;
}

/* ==============================
   PAGE HEADER
============================== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.page-title { font-size: 22px; font-weight: 700; }
.page-title span { color: var(--muted); font-weight: 400; font-size: 14px; margin-left: 8px; }

/* ==============================
   CARDS
============================== */
.card {
  background: var(--card-bg);
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  font-size: 14px; font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em; color: var(--muted);
}

/* STAT CARDS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  border-radius: 10px;
  padding: 20px;
  color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
}
.stat-card .label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  opacity: .85;
}
.stat-card .value {
  font-size: 36px;
  font-weight: 800;
  margin-top: 8px;
  line-height: 1;
}
.stat-card .change {
  font-size: 12px; opacity: .75; margin-top: 6px;
}
.stat-card .icon {
  position: absolute;
  right: 16px; bottom: 12px;
  font-size: 50px;
  opacity: .18;
}
.stat-red    { background: linear-gradient(135deg, #ef4444, #b91c1c); }
.stat-orange { background: linear-gradient(135deg, #f97316, #c2410c); }
.stat-green  { background: linear-gradient(135deg, #10b981, #047857); }
.stat-blue   { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }

/* ==============================
   TABLES
============================== */
.table-wrap {
  overflow-x: auto;
  border-radius: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
thead th {
  background: #f8fafc;
  color: var(--muted);
  padding: 12px 14px;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .05em;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}
tbody td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: #f8fafc; cursor: pointer; }

/* BADGES */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.badge-red    { background: #fee2e2; color: #b91c1c; }
.badge-green  { background: #d1fae5; color: #065f46; }
.badge-blue   { background: #dbeafe; color: #1e40af; }
.badge-orange { background: #ffedd5; color: #9a3412; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-gray   { background: #f1f5f9; color: #475569; }

/* PRIORITY */
.priority-dot {
  display: inline-flex; align-items: center; gap: 6px; font-weight: 600;
}
.priority-dot::before {
  content: '';
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.p-alta::before   { background: #ef4444; }
.p-media::before  { background: #f97316; }
.p-baja::before   { background: #10b981; }
.p-alta   { color: #ef4444; }
.p-media  { color: #f97316; }
.p-baja   { color: #10b981; }

/* ==============================
   FILTERS BAR
============================== */
.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}
.filters-bar input,
.filters-bar select {
  width: auto;
  min-width: 180px;
}
.filter-count {
  font-size: 12px;
  color: var(--muted);
  margin-left: auto;
}

/* ==============================
   LAYOUT DOS COLUMNAS
============================== */
.two-col {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}
.three-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.two-col-equal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ==============================
   DETALLE DOCUMENTO
============================== */
.detail-panel {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 22px;
  box-shadow: var(--shadow);
  position: sticky;
  top: 28px;
}
.detail-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}
.detail-empty i { font-size: 40px; opacity: .3; display: block; margin-bottom: 12px; }
.detail-section { margin-bottom: 20px; }
.detail-section h4 {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  color: var(--muted); margin-bottom: 10px;
}
.detail-row {
  display: flex; align-items: flex-start;
  gap: 10px; margin-bottom: 10px;
  font-size: 13px;
}
.detail-row .key { color: var(--muted); min-width: 90px; flex-shrink: 0; }
.detail-row .val { font-weight: 500; flex: 1; }
.detail-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
.btn-green  { background: var(--green);  color: #fff; }
.btn-green:hover  { background: #059669; }
.btn-blue   { background: var(--blue);   color: #fff; }
.btn-blue:hover   { background: #2563eb; }
.btn-red    { background: var(--red);    color: #fff; }
.btn-red:hover    { background: var(--red-dark); }
.btn-gray   { background: #f1f5f9; color: var(--muted); }
.btn-gray:hover   { background: #e2e8f0; }
.btn-orange { background: var(--orange); color: #fff; }
.btn-sm { padding: 7px 12px; font-size: 12px; }

/* ==============================
   FORM REGISTRO
============================== */
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group { margin-bottom: 16px; }
.form-group label {
  display: block; font-weight: 600;
  font-size: 12px; text-transform: uppercase;
  letter-spacing: .05em; color: var(--muted); margin-bottom: 6px;
}
.form-group.full { grid-column: 1 / -1; }
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  color: var(--muted);
  cursor: pointer;
  transition: border-color .2s, background .2s;
  background: #fafafa;
}
.upload-zone:hover { border-color: var(--red); background: #fff5f5; }
.upload-zone i { font-size: 28px; display: block; margin-bottom: 8px; }
.upload-zone p { font-size: 13px; }
.upload-zone .hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.file-list { margin-top: 12px; }
.file-item {
  display: flex; align-items: center; gap: 10px;
  background: #f8fafc; border-radius: 6px;
  padding: 9px 12px; margin-top: 8px;
  border: 1px solid var(--border);
}
.file-item i { color: var(--red); }
.file-item .fname { flex: 1; font-size: 12px; font-weight: 500; }
.file-item .fsize { font-size: 11px; color: var(--muted); }
.file-item .remove { cursor: pointer; color: var(--muted); font-size: 14px; }
.file-item .remove:hover { color: var(--red); }

/* ==============================
   CHARTS
============================== */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-top: 20px;
}
.chart-wrap {
  position: relative;
  height: 280px;
}

/* ==============================
   GESTIÓN USUARIOS
============================== */
.users-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}

/* ==============================
   MODAL
============================== */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 500px;
  max-width: 95vw;
  box-shadow: var(--shadow-lg);
}
.modal h3 { font-size: 18px; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

/* ==============================
   TOAST
============================== */
.toast-container {
  position: fixed; bottom: 24px; right: 24px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 300;
}
.toast {
  background: #1e2128;
  color: #fff;
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  display: flex; align-items: center; gap: 10px;
  box-shadow: var(--shadow-lg);
  animation: slideIn .3s ease;
  border-left: 4px solid var(--green);
}
.toast.error { border-left-color: var(--red); }
.toast.warning { border-left-color: var(--yellow); }
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

/* ==============================
   REPORTES
============================== */
.report-stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.report-stat {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--shadow);
  text-align: center;
}
.report-stat .rs-val {
  font-size: 28px; font-weight: 800; color: var(--text);
}
.report-stat .rs-label {
  font-size: 11px; color: var(--muted);
  text-transform: uppercase; letter-spacing: .05em; margin-top: 4px;
}

/* ==============================
   MISC
============================== */
.empty-state {
  text-align: center; padding: 50px 20px; color: var(--muted);
}
.empty-state i { font-size: 44px; opacity: .25; display: block; margin-bottom: 14px; }
.empty-state p { font-size: 15px; }
.section { display: none; }
.section.active { display: block; }
.divider { height: 1px; background: var(--border); margin: 20px 0; }
.tag {
  font-size: 11px; font-weight: 700;
  background: #f1f5f9; color: var(--muted);
  padding: 2px 8px; border-radius: 4px;
}
.progress-bar {
  height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 3px; background: var(--red);
  transition: width .4s;
}
.avatar-sm {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px; color: #fff;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
</style>
