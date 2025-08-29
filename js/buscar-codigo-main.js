// js/buscar-codigo-main.js
// Este archivo controla la lógica exclusiva de la página buscar-codigo.html en modo multi‑inquilino.

import { buscarPorCodigo } from './api.js';
import { initAutocompleteCodigo } from './autocomplete.js';
import { showToast } from './toasts.js';
import { bindCodeButtons } from './main.js';
import { config } from './config.js';
import { tenantConfig } from './tenant_config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a los elementos del DOM
  const codeInput = document.getElementById('codeInput');
  const codeSearchButton = document.getElementById('doCodeSearchButton');
  const codeResultsContainer = document.getElementById('results-code');

  // Función principal para realizar la búsqueda por código
  const performCodeSearch = async () => {
    const code = codeInput.value.trim();
    if (!code) {
      showToast('Ingresa un término para buscar.', false);
      return;
    }

    codeSearchButton.disabled = true;
    codeSearchButton.textContent = 'Buscando...';
    codeResultsContainer.innerHTML = ' Buscando... ';

    try {
      const results = await buscarPorCodigo(code, 'like');

      if (results && results.length > 0) {
        // Genera el HTML para cada resultado
        codeResultsContainer.innerHTML = results.map(doc => {
          const codesArray = (doc.codigos_extraidos || '').split(',').map(s => s.trim()).filter(Boolean);
          const codesId = `codes-list-search-${doc.id}`;
          const codesListHtml = ` ${
            codesArray.length > 0 && codesArray[0] !== 'N/A'
              ? codesArray.map(c => ` <span class="code">${c}</span> `).join('')
              : ' Sin códigos asociados. '
          } `;
          // Construye la URL pública para ver el PDF desde R2
          const pdfUrl = doc.path ? `${tenantConfig.r2PublicUrl}/${doc.path}` : null;
          const verPdfBtn = pdfUrl ? `<a href="${pdfUrl}" target="_blank" class="text-blue-700 underline">Ver PDF</a>` : '';
          const verCodigosBtn = codesArray.length > 0
            ? `<button class="codes-btn text-green-700 underline" data-target="${codesId}">Ver Códigos</button>`
            : '';
          return `
<div class="doc-item flex flex-col border-b py-2">
  <div><strong>${doc.name}</strong></div>
  <div class="actions flex gap-4 mt-1">${verPdfBtn}${verCodigosBtn}</div>
  <div id="${codesId}" class="hidden codes-list mt-1">${codesListHtml}</div>
</div>
          `;
        }).join('');
        // Activa los botones de "Ver Códigos"
        bindCodeButtons(codeResultsContainer);
      } else {
        codeResultsContainer.innerHTML = ' No se encontraron documentos que coincidan con la búsqueda. ';
      }
    } catch (err) {
      showToast('Error en la búsqueda: ' + err.message, false);
      codeResultsContainer.innerHTML = ` Error al realizar la búsqueda. `;
    } finally {
      codeSearchButton.disabled = false;
      codeSearchButton.textContent = 'Buscar';
    }
  };

  // Asignar eventos al botón y al campo de entrada
  codeSearchButton.addEventListener('click', performCodeSearch);
  codeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performCodeSearch();
    }
  });

  // Inicializar las sugerencias de autocompletado
  initAutocompleteCodigo();
});