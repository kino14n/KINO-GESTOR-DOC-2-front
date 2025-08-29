// GESTOR-DOC-2-front/js/upload.js

import { showToast } from './toasts.js';
import { config } from './config.js';
import { tenantConfig } from './tenant_config.js';

/**
 * Carga los datos de un documento en el formulario de subida para edición.
 * Muestra el PDF actual usando la URL pública del bucket R2 para el inquilino.
 *
 * @param {Object} docData Información del documento a editar
 */
export function loadDocumentForEdit(docData) {
  const form = document.getElementById('form-upload');
  const docIdInput = document.getElementById('docId');
  const nameInput = document.getElementById('name');
  const dateInput = document.getElementById('date');
  const codesTextarea = document.getElementById('codes');
  const fileInput = document.getElementById('file');
  if (!form || !docIdInput || !nameInput || !dateInput || !codesTextarea || !fileInput) return;

  // Asigna los valores del documento a los campos del formulario
  docIdInput.value = docData.id || '';
  nameInput.value = docData.name || '';
  dateInput.value = docData.date ? new Date(docData.date).toISOString().split('T')[0] : '';
  codesTextarea.value = (docData.codigos_extraidos || '')
    .split(',')
    .map(c => c.trim())
    .join('\n');

  // Muestra información del PDF actual, construyendo un enlace con la URL pública R2
  const currentPdfInfo = document.getElementById('currentPdfInfo');
  if (currentPdfInfo) {
    if (docData.path) {
      const pdfUrl = `${tenantConfig.r2PublicUrl}/${docData.path}`;
      currentPdfInfo.innerHTML = `PDF actual: <a href="${pdfUrl}" target="_blank" class="underline text-blue-700">Ver PDF</a>`;
    } else {
      currentPdfInfo.innerHTML = 'No hay PDF asociado.';
    }
  }
  // Limpia la selección de archivo para evitar sobrescribir si el usuario no elige nuevo archivo
  fileInput.value = '';
}

/**
 * Inicializa el formulario de subida/edición de documentos.
 * Envía los datos al backend en modo multipart/form-data y muestra mensajes de éxito o error.
 */
export function initUploadForm() {
  const form = document.getElementById('form-upload');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const docId = form.querySelector('#docId').value.trim();
    const isEdit = docId !== '';

    // Asegura que API_BASE no termina en barra y construye la URL final
    const API_BASE_URL = (config.API_BASE || '').replace(/\/$/, '');
    const endpoint = isEdit
      ? `${API_BASE_URL}/api/documentos/${docId}`
      : `${API_BASE_URL}/api/documentos/upload`;
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const res = await fetch(endpoint, {
        method,
        body: formData,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`El servidor respondió con error ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      if (data.ok) {
        showToast(isEdit ? 'Documento editado' : 'Documento subido', true);
        form.reset();
        form.querySelector('#docId').value = '';
        const currentPdfInfo = document.getElementById('currentPdfInfo');
        if (currentPdfInfo) currentPdfInfo.innerHTML = '';
      } else {
        showToast('Error: ' + (data.error || 'Desconocido'), false);
      }
    } catch (err) {
      showToast(`Error de conexión: ${err.message}`, false);
      console.error('Error en fetch:', err);
    }
  });
}

// Exponemos la función de edición en el ámbito global para que consulta.js pueda invocarla
window.loadDocumentForEdit = loadDocumentForEdit;