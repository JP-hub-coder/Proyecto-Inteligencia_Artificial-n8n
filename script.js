/* ============================================================
   app.js — Formulario de Justificación de Inasistencia
   Conecta con webhook de n8n vía multipart/form-data
   ============================================================ */

// ─── CONFIGURA AQUÍ TU WEBHOOK DE N8N ───────────────────────
const N8N_WEBHOOK_URL = 'https://monthly-zipfile-pessimism.ngrok-free.dev/webhook-test/justificacion';

// para uso en cloud: https://juanbeltran.app.n8n.cloud/webhook-test/justificacion
//
// Campos que llegarán al webhook:
//   ID_estudiante | Correo | Nombre | Teléfono | Curso
//   Motivo_inasistencia | Url_imagen
// ─────────────────────────────────────────────────────────────

// ─── REFERENCIAS DOM ─────────────────────────────────────────
const form            = document.getElementById('justificationForm');
const submitBtn       = document.getElementById('submitBtn');
const loadingOverlay  = document.getElementById('loadingOverlay');

const successState    = document.getElementById('successState');
const errorState      = document.getElementById('errorState');
const errorMsg        = document.getElementById('errorMsg');

const dropzone        = document.getElementById('dropzone');
const fileInput       = document.getElementById('archivo');
const browseBtn       = document.getElementById('browseBtn');
const dzContent       = document.getElementById('dropzoneContent');
const dzPreview       = document.getElementById('dropzonePreview');
const previewName     = document.getElementById('previewName');
const previewSize     = document.getElementById('previewSize');
const previewIcon     = document.getElementById('previewIcon');
const removeFileBtn   = document.getElementById('removeFile');

const descripcion      = document.getElementById('descripcion');
const charCount        = document.getElementById('charCount');
const motivoGrid       = document.getElementById('motivoGrid');

const fechaInicio      = document.getElementById('fecha_inicio');
const fechaFin         = document.getElementById('fecha_fin');
const dateRangeDisplay = document.getElementById('dateRangeDisplay');
const dateRangeText    = document.getElementById('dateRangeText');

let selectedFile = null;

// ─── RANGO DE FECHAS ─────────────────────────────────────────
function updateDateRange() {
  const inicio = fechaInicio.value;
  const fin    = fechaFin.value;

  if (!inicio) { dateRangeDisplay.hidden = true; return; }

  if (fin && fin < inicio) {
    showError('fecha_fin', 'La fecha de fin no puede ser anterior al inicio.');
    dateRangeDisplay.hidden = true;
    return;
  }
  clearError('fecha_fin');

  const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  if (inicio && fin && inicio !== fin) {
    const diffDays = Math.round((new Date(fin + 'T12:00:00') - new Date(inicio + 'T12:00:00')) / 86400000) + 1;
    dateRangeText.textContent = `${fmt(inicio)}  →  ${fmt(fin)}  (${diffDays} día${diffDays !== 1 ? 's' : ''})`;
  } else {
    dateRangeText.textContent = fmt(inicio);
  }

  dateRangeDisplay.hidden = false;
}

fechaInicio.addEventListener('change', () => {
  clearError('fecha_inicio');
  fechaInicio.classList.remove('invalid');
  if (fechaFin.value && fechaFin.value < fechaInicio.value) fechaFin.value = '';
  fechaFin.min = fechaInicio.value;
  updateDateRange();
});

fechaFin.addEventListener('change', () => {
  clearError('fecha_fin');
  fechaFin.classList.remove('invalid');
  updateDateRange();
});

// ─── MOTIVO: SELECCIÓN VISUAL ────────────────────────────────
motivoGrid.addEventListener('change', (e) => {
  document.querySelectorAll('.motivo-card').forEach(c => c.classList.remove('selected'));
  e.target.closest('.motivo-card')?.classList.add('selected');
  clearError('motivo');
});

// ─── CONTADOR DE CARACTERES ───────────────────────────────────
descripcion.addEventListener('input', () => {
  const len = descripcion.value.length;
  charCount.textContent = Math.min(len, 500);
  if (len > 500) descripcion.value = descripcion.value.substring(0, 500);
  clearError('descripcion');
});

// ─── DROPZONE ─────────────────────────────────────────────────
browseBtn.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('click', (e) => {
  if (e.target !== removeFileBtn && !removeFileBtn.contains(e.target)) fileInput.click();
});
dropzone.addEventListener('dragover',  (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragleave', ()  => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault(); dropzone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
removeFileBtn.addEventListener('click', (e) => { e.stopPropagation(); clearFile(); });

function handleFile(file) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowed.includes(file.type)) { showError('archivo', 'Formato no permitido. Usa PDF, JPG o PNG.'); return; }
  if (file.size > 5 * 1024 * 1024) { showError('archivo', 'El archivo supera el límite de 5 MB.'); return; }
  selectedFile = file;
  clearError('archivo');
  const icons = { 'application/pdf': '📋', 'image/jpeg': '🖼️', 'image/png': '🖼️' };
  previewIcon.textContent = icons[file.type] || '📄';
  previewName.textContent = file.name;
  previewSize.textContent = formatFileSize(file.size);
  dzContent.hidden = true;
  dzPreview.hidden = false;
}

function clearFile() {
  selectedFile = null; fileInput.value = '';
  dzContent.hidden = false; dzPreview.hidden = true;
}

function formatFileSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}

// ─── LIMPIEZA DE ERRORES EN VIVO ─────────────────────────────
['nombre', 'id_estudiante', 'correo', 'telefono'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    clearError(id === 'id_estudiante' ? 'id' : id);
    document.getElementById(id)?.classList.remove('invalid');
  });
});
document.getElementById('curso')?.addEventListener('change', () => {
  clearError('curso'); document.getElementById('curso')?.classList.remove('invalid');
});

// ─── VALIDACIÓN ───────────────────────────────────────────────
function validateForm() {
  let valid = true;

  const nombre   = document.getElementById('nombre').value.trim();
  const idEst    = document.getElementById('id_estudiante').value.trim();
  const correo   = document.getElementById('correo').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const curso    = document.getElementById('curso').value;
  const inicio   = fechaInicio.value;
  const fin      = fechaFin.value;
  const motivo   = document.querySelector('input[name="motivo_categoria"]:checked');
  const desc     = descripcion.value.trim();

  if (!nombre)  { showError('nombre',   'Ingresa tu nombre completo.');       markInvalid('nombre');        valid = false; }
  if (!idEst)   { showError('id',       'Ingresa tu código estudiantil.');    markInvalid('id_estudiante'); valid = false; }
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    showError('correo', 'Ingresa un correo institucional válido.'); markInvalid('correo'); valid = false;
  }
  if (!telefono || !/^\+?[\d\s\-]{7,15}$/.test(telefono)) {
    showError('telefono', 'Ingresa un número de teléfono válido.'); markInvalid('telefono'); valid = false;
  }
  if (!curso)   { showError('curso',    'Selecciona el curso.');              markInvalid('curso');         valid = false; }
  if (!inicio)  { showError('fecha_inicio', 'Selecciona la fecha de inicio.'); markInvalid('fecha_inicio'); valid = false; }
  if (fin && fin < inicio) { showError('fecha_fin', 'La fecha de fin no puede ser anterior al inicio.'); markInvalid('fecha_fin'); valid = false; }
  if (!motivo)  { showError('motivo',   'Selecciona el motivo de tu inasistencia.'); valid = false; }
  if (!desc || desc.length < 20) { showError('descripcion', 'Escribe una descripción de al menos 20 caracteres.'); markInvalid('descripcion'); valid = false; }
  if (!selectedFile) { showError('archivo', 'Adjunta un documento de soporte.'); valid = false; }

  return valid;
}

function showError(field, msg)  { const el = document.getElementById(`error-${field}`); if (el) el.textContent = msg; }
function clearError(field)      { const el = document.getElementById(`error-${field}`); if (el) el.textContent = ''; }
function markInvalid(id)        { document.getElementById(id)?.classList.add('invalid'); }

// ─── ENVÍO AL WEBHOOK DE N8N ──────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    const firstError = form.querySelector('.field-error:not(:empty)');
    firstError?.closest('.field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Overlay de carga aparece SOLO después de validar y al iniciar el envío
  setLoading(true);

  /*
    CONFIGURACIÓN DEL NODO WEBHOOK EN N8N:
    ──────────────────────────────────────
    1. Agrega un nodo "Webhook"
    2. HTTP Method: POST
    3. Response Mode: "Immediately"
    4. En "Options" → Binary Data: ON

    El archivo llega como binario en el campo "Url_imagen".
    Procésalo con "Move Binary Data" → sube a Drive/S3 → usa la URL resultante.

    Campos exactos recibidos:
      ID_estudiante, Correo, Nombre, Teléfono, Curso,
      Motivo_inasistencia, Url_imagen (binario),
      fecha_inicio, fecha_fin, rango_fechas, descripcion, timestamp
  */

  const inicio = fechaInicio.value;
  const fin    = fechaFin.value;

  const payload = new FormData();

  // ── Campos según especificación del cliente ───────────────────
  payload.append('ID_estudiante',      document.getElementById('id_estudiante').value.trim());
  payload.append('Correo',             document.getElementById('correo').value.trim());
  payload.append('Nombre',             document.getElementById('nombre').value.trim());
  payload.append('Teléfono',           document.getElementById('telefono').value.trim());
  payload.append('Curso',              document.getElementById('curso').value);
  payload.append('Motivo_inasistencia', document.querySelector('input[name="motivo_categoria"]:checked').value);
  payload.append('Url_imagen',         selectedFile, selectedFile.name); // binario → n8n lo sube y genera URL

  // ── Contexto adicional ────────────────────────────────────────
  payload.append('fecha_inicio',   inicio);
  payload.append('fecha_fin',      fin || inicio);
  payload.append('rango_fechas',   fin && fin !== inicio ? `${inicio} al ${fin}` : inicio);
  payload.append('descripcion',    descripcion.value.trim());
  payload.append('timestamp',      new Date().toISOString());

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: payload
      // ⚠️ No fijes Content-Type — el browser lo pone con boundary correcto
    });

    if (res.ok) {
      showSuccess();
    } else {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
  } catch (err) {
    console.error('[Webhook Error]', err);
    showErrorState(err.message);
  } finally {
    setLoading(false);
  }
});

// ─── ESTADOS UI ───────────────────────────────────────────────
function setLoading(isLoading) {
  submitBtn.disabled    = isLoading;
  loadingOverlay.hidden = !isLoading;
}

function showSuccess() {
  loadingOverlay.hidden = true;
  form.style.display    = 'none';
  successState.hidden   = false;
  errorState.hidden     = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showErrorState(msg = '') {
  loadingOverlay.hidden = true;
  form.style.display    = 'none';
  errorState.hidden     = false;
  successState.hidden   = true;
  if (msg) errorMsg.textContent = `Error: ${msg}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── RESET / RETRY ────────────────────────────────────────────
window.resetForm = function () {
  form.reset();
  clearFile();
  charCount.textContent   = '0';
  dateRangeDisplay.hidden = true;
  document.querySelectorAll('.motivo-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.style.display  = '';
  successState.hidden = true;
  errorState.hidden   = true;
};

window.retryForm = function () {
  errorState.hidden  = true;
  form.style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
