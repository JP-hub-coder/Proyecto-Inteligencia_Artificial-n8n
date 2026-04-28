/* ============================================================
   app.js — Formulario de Justificación de Inasistencia
   Conecta con webhook de n8n vía multipart/form-data
   ============================================================ */

// ─── CONFIGURA AQUÍ TU WEBHOOK DE N8N ───────────────────────
const N8N_WEBHOOK_URL = 'https://monthly-zipfile-pessimism.ngrok-free.dev';
//
// Ejemplo:  'https://mi-n8n.ejemplo.com/webhook/justificacion'
// Para pruebas locales: 'http://localhost:5678/webhook/justificacion'
// ─────────────────────────────────────────────────────────────

// ─── REFERENCIAS DOM ─────────────────────────────────────────
const form          = document.getElementById('justificationForm');
const submitBtn     = document.getElementById('submitBtn');
const btnText       = submitBtn.querySelector('.btn-text');
const btnSpinner    = submitBtn.querySelector('.btn-spinner');

const successState  = document.getElementById('successState');
const errorState    = document.getElementById('errorState');
const errorMsg      = document.getElementById('errorMsg');

const dropzone      = document.getElementById('dropzone');
const fileInput     = document.getElementById('archivo');
const browseBtn     = document.getElementById('browseBtn');
const dzContent     = document.getElementById('dropzoneContent');
const dzPreview     = document.getElementById('dropzonePreview');
const previewName   = document.getElementById('previewName');
const previewSize   = document.getElementById('previewSize');
const previewIcon   = document.getElementById('previewIcon');
const removeFileBtn = document.getElementById('removeFile');

const descripcion   = document.getElementById('descripcion');
const charCount     = document.getElementById('charCount');
const motivoGrid    = document.getElementById('motivoGrid');

let selectedFile    = null;

// ─── MOTIVÓ: SELECCIÓN VISUAL ────────────────────────────────
motivoGrid.addEventListener('change', (e) => {
  document.querySelectorAll('.motivo-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selected = e.target.closest('.motivo-card');
  if (selected) selected.classList.add('selected');
  clearError('motivo');
});

// ─── CONTADOR DE CARACTERES ───────────────────────────────────
descripcion.addEventListener('input', () => {
  const len = descripcion.value.length;
  charCount.textContent = len;
  if (len > 500) {
    descripcion.value = descripcion.value.substring(0, 500);
    charCount.textContent = 500;
  }
  clearError('descripcion');
});

// ─── DROPZONE ─────────────────────────────────────────────────
browseBtn.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('click', (e) => {
  if (e.target !== removeFileBtn && !removeFileBtn.contains(e.target)) {
    fileInput.click();
  }
});

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

removeFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFile();
});

function handleFile(file) {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5 MB

  if (!allowedTypes.includes(file.type)) {
    showError('archivo', 'Formato no permitido. Usa PDF, JPG o PNG.');
    return;
  }
  if (file.size > maxSize) {
    showError('archivo', 'El archivo supera el límite de 5 MB.');
    return;
  }

  selectedFile = file;
  clearError('archivo');

  // Ícono según tipo
  const icons = { 'application/pdf': '📋', 'image/jpeg': '🖼️', 'image/png': '🖼️' };
  previewIcon.textContent = icons[file.type] || '📄';
  previewName.textContent = file.name;
  previewSize.textContent = formatFileSize(file.size);

  dzContent.hidden = true;
  dzPreview.hidden = false;
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  dzContent.hidden = false;
  dzPreview.hidden = true;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── LIMPIEZA DE ERRORES EN INPUT ────────────────────────────
['nombre', 'id_estudiante', 'correo', 'fecha'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    clearError(id === 'id_estudiante' ? 'id' : id);
    document.getElementById(id).classList.remove('invalid');
  });
});

// ─── VALIDACIÓN ───────────────────────────────────────────────
function validateForm() {
  let valid = true;

  const nombre = document.getElementById('nombre').value.trim();
  const idEst  = document.getElementById('id_estudiante').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const fecha  = document.getElementById('fecha').value;
  const motivo = document.querySelector('input[name="motivo_categoria"]:checked');
  const desc   = descripcion.value.trim();

  if (!nombre) {
    showError('nombre', 'Ingresa tu nombre completo.');
    markInvalid('nombre');
    valid = false;
  }

  if (!idEst) {
    showError('id', 'Ingresa tu código estudiantil.');
    markInvalid('id_estudiante');
    valid = false;
  }

  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    showError('correo', 'Ingresa un correo institucional válido.');
    markInvalid('correo');
    valid = false;
  }

  if (!fecha) {
    showError('fecha', 'Selecciona la fecha de inasistencia.');
    markInvalid('fecha');
    valid = false;
  }

  if (!motivo) {
    showError('motivo', 'Selecciona el motivo de tu inasistencia.');
    valid = false;
  }

  if (!desc || desc.length < 20) {
    showError('descripcion', 'Escribe una descripción de al menos 20 caracteres.');
    markInvalid('descripcion');
    valid = false;
  }

  if (!selectedFile) {
    showError('archivo', 'Adjunta un documento de soporte.');
    valid = false;
  }

  return valid;
}

function showError(field, msg) {
  const el = document.getElementById(`error-${field}`);
  if (el) el.textContent = msg;
}

function clearError(field) {
  const el = document.getElementById(`error-${field}`);
  if (el) el.textContent = '';
}

function markInvalid(id) {
  document.getElementById(id)?.classList.add('invalid');
}

// ─── ENVÍO AL WEBHOOK DE N8N ──────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    // Scroll al primer error visible
    const firstError = form.querySelector('.field-error:not(:empty)');
    firstError?.closest('.field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  setLoading(true);

  /*
    n8n espera un Webhook Trigger con:
      - Body type: multipart/form-data  (para recibir el archivo)
      - Método: POST
    En tu nodo Webhook de n8n:
      1. Crea un nodo "Webhook"
      2. HTTP Method: POST
      3. Response Mode: "When last node finishes" (o "Immediately")
      4. Binary Data: activa "Accept Binary Files"
      El archivo llegará en req.body.files.archivo
      Los demás campos en req.body.data
  */
  const payload = new FormData();
  payload.append('nombre',             document.getElementById('nombre').value.trim());
  payload.append('id_estudiante',      document.getElementById('id_estudiante').value.trim());
  payload.append('correo',             document.getElementById('correo').value.trim());
  payload.append('fecha',              document.getElementById('fecha').value);
  payload.append('motivo_categoria',   document.querySelector('input[name="motivo_categoria"]:checked').value);
  payload.append('descripcion',        descripcion.value.trim());
  payload.append('archivo',            selectedFile, selectedFile.name);
  payload.append('timestamp',          new Date().toISOString());
  payload.append('origen',             'formulario-web');

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: payload
      // NO pongas Content-Type: el browser lo pone automático con boundary
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
  submitBtn.disabled = isLoading;
  btnText.hidden     = isLoading;
  btnSpinner.hidden  = !isLoading;
}

function showSuccess() {
  form.style.display   = 'none';
  successState.hidden  = false;
  errorState.hidden    = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showErrorState(msg = '') {
  form.style.display   = 'none';
  errorState.hidden    = false;
  successState.hidden  = true;
  if (msg) errorMsg.textContent = `Error: ${msg}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── RESET / RETRY ────────────────────────────────────────────
window.resetForm = function () {
  form.reset();
  clearFile();
  charCount.textContent = '0';
  document.querySelectorAll('.motivo-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.style.display   = '';
  successState.hidden  = true;
  errorState.hidden    = true;
};

window.retryForm = function () {
  errorState.hidden    = true;
  form.style.display   = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};