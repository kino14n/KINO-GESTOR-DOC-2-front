import { listarDocumentos, eliminarDocumento } from './api.js';
import { showModalConfirm } from './modals.js';
import { showToast } from './toasts.js';
import { bindCodeButtons } from './main.js';
import { config } from './config.js';
import { tenantConfig } from './tenant_config.js';

// Contiene la lista actual de documentos para filtros o recargas
let currentDocs = [];

/**
 * Carga y muestra los documentos en #results-list.
 */
export async function cargarConsulta() {
  try {
    currentDocs = await listarDocumentos();
    renderDocs(currentDocs);
    // Vincular los eventos de los botones "Ver Códigos" después de renderizar
    const listEl = document.getElementById('results-list');
    if (listEl) bindCodeButtons(listEl);
  } catch (e) {
    console.error('Error al cargar documentos:', e);
    showToast('Error al cargar lista', false);
  }
}

/**
 * Renderiza documentos con la información a la izquierda y las acciones a la derecha.
 * Utiliza la URL pública del bucket R2 para enlazar los PDFs.
 */
function renderDocs(docs) {
  const container = document.getElementById('results-list');
  if (!container) return;
  container.innerHTML = docs
    .map(d => {
      const fecha = d.date ? new Date(d.date).toISOString().split('T')[0] : 'Sin fecha';
      const codesArray = (d.codigos_extraidos || '').split(',').map(s => s.trim()).filter(Boolean);
      const codesId = `codes-list-${d.id || Math.random().toString(36).slice(2)}`;
      const codesListHtml = ` ${
        codesArray.length > 0
          ? codesArray.map(c => ` <span class="code">${c}</span> `).join('')
          : ' Sin códigos. '
      } `;
      const pdfLink = d.path
        ? `<a href="${tenantConfig.r2PublicUrl}/${d.path}" target="_blank" class="underline text-blue-700">Ver PDF</a>`
        : 'Sin PDF';
      return `
<div class="doc-item flex justify-between items-start py-2 border-b">
  <div class="flex-1">
    <div><strong>${d.name}</strong></div>
    <div>${fecha}</div>
    <div>Archivo PDF: ${d.path || 'No disponible'}</div>
    <div>${pdfLink}</div>
    <div id="${codesId}" class="hidden codes-list">${codesListHtml}</div>
  </div>
  <div class="flex flex-col gap-2 ml-4">
    <button class="edit-btn text-blue-700 underline" onclick="dispatchEdit(${d.id})">Editar</button>
    <button class="delete-btn text-red-700 underline" onclick="eliminarDoc(${d.id})">Eliminar</button>
    <button class="codes-btn text-green-700 underline" data-target="${codesId}">Ver Códigos</button>
  </div>
</div>
      `;
    })
    .join('');
}

// Editar documento y cambiar a pestaña “Subir”
window.dispatchEdit = async id => {
  const res = await fetch(`${config.API_BASE}/${id}`);
  const docData = await res.json();
  if (docData && !docData.error) {
    if (window.loadDocumentForEdit) {
      window.loadDocumentForEdit(docData);
    } else if (typeof loadDocumentForEdit === 'function') {
      loadDocumentForEdit(docData);
    } else {
      document.dispatchEvent(new CustomEvent('load-edit', { detail: docData }));
    }
    window.showTab('tab-upload');
  } else {
    showToast('Error al cargar el documento', false);
  }
};

// Filtros cliente-side
window.clearConsultFilter = () => {
  const input = document.getElementById('consultFilterInput');
  if (input) input.value = '';
  renderDocs(currentDocs);
  const listEl = document.getElementById('results-list');
  if (listEl) bindCodeButtons(listEl);
};

window.doConsultFilter = () => {
  const term = document.getElementById('consultFilterInput').value.toLowerCase().trim();
  renderDocs(
    currentDocs.filter(d =>
      d.name.toLowerCase().includes(term) ||
      (d.codigos_extraidos || '').toLowerCase().includes(term) ||
      (d.path || '').toLowerCase().includes(term)
    )
  );
  const listEl = document.getElementById('results-list');
  if (listEl) bindCodeButtons(listEl);
};

window.downloadCsv = () => window.open(`/api/documentos?format=csv`, '_blank');
window.downloadPdfs = id => window.open(`/api/documentos?format=pdf&id=${id}`, '_blank');

// Confirma eliminación y recarga la lista
window.eliminarDoc = id => {
  showModalConfirm('¿Eliminar documento?', async () => {
    try {
      await eliminarDocumento(id);
      showToast('Documento eliminado', true);
      cargarConsulta();
    } catch {
      showToast('No se pudo eliminar', false);
    }
  });
};