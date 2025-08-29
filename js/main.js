// GESTOR-DOC-2-front/js/main.js

import { buscarOptimaAvanzada, buscarPorCodigo, listarDocumentos } from './api.js';
import { cargarConsulta } from './consulta.js';
import { initUploadForm } from './upload.js';
import { requireAuth } from './auth.js';
import { initAutocompleteCodigo } from './autocomplete.js';
import { showToast } from './toasts.js';
import { config } from './config.js';

/**
 * Cambia la pestaña visible en la interfaz.
 */
window.showTab = tabId => {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById(tabId)?.classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(btn =>
    btn.dataset.tab === tabId ? btn.classList.add('active') : btn.classList.remove('active')
  );
};

/**
 * Llama al backend para solicitar un PDF con códigos resaltados.
 */
async function solicitarPdfResaltado(button, pdfPath, codes) {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Procesando...';

    try {
        // Esta URL debe coincidir con la ruta que implementes en el backend para esta función
        const response = await fetch(`${config.API_BASE}/api/documentos/resaltar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdf_path: pdfPath, codes: codes })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error desconocido al resaltar el PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);

    } catch (error) {
        console.error('Error al solicitar PDF resaltado:', error);
        showToast(error.message, false);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

/**
 * Asigna el evento de clic a los botones "Ver Códigos" y cambia su texto.
 */
export function bindCodeButtons(container) {
  if (!container) return;
  const buttons = container.querySelectorAll('.btn-ver-codigos');
  buttons.forEach(btn => {
    const codesId = btn.dataset.codesId;
    if (!codesId) return;

    btn.addEventListener('click', e => {
      e.preventDefault();
      const el = document.getElementById(codesId);
      if (el) {
        el.classList.toggle('hidden');
        btn.textContent = el.classList.contains('hidden') ? 'Ver Códigos' : 'Ocultar Códigos';
      }
    });
  });
}
window.bindCodeButtons = bindCodeButtons;

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('mainContent');
    if (main) main.classList.add('hidden');

    document.querySelectorAll('.tab').forEach(btn =>
        btn.addEventListener('click', () => window.showTab(btn.dataset.tab))
    );

    requireAuth(() => {
        document.getElementById('loginOverlay')?.classList.add('hidden');
        if (main) main.classList.remove('hidden');

        // Carga inicial de datos y funcionalidades
        window.showTab('tab-search');
        cargarConsulta();
        initUploadForm();
        initAutocompleteCodigo();

        // === LÓGICA DE BÚSQUEDA ÓPTIMA ===
        const optimaInput = document.getElementById('optimaSearchInput');
        const optimaButton = document.getElementById('doOptimaSearchButton');
        const optimaClear = document.getElementById('clearOptimaSearchButton');
        const optimaResults = document.getElementById('results-optima-search');

        function attachResaltarListeners() {
            optimaResults.querySelectorAll('.btn-resaltar').forEach(button => {
                button.addEventListener('click', () => {
                    const pdfPath = button.dataset.pdfPath;
                    const codes = JSON.parse(button.dataset.codes);
                    solicitarPdfResaltado(button, pdfPath, codes);
                });
            });
        }

        const doOptimaSearch = async () => {
            const txt = optimaInput.value.trim();
            if (!txt) return showToast('Ingresa uno o varios códigos para buscar', 'warning');
            
            optimaButton.disabled = true;
            optimaButton.textContent = "Buscando...";
            optimaResults.innerHTML = ' Buscando... ';

            try {
                const resultado = await buscarOptimaAvanzada(txt);
                if (resultado.documentos?.length) {
                    const docsHtml = resultado.documentos.map(d => {
                        const doc = d.documento;
                        const codes = d.codigos_cubre;
                        const codesJsonString = JSON.stringify(codes);
                        const verPdfBtn = doc.path ? `<button class="btn btn--secondary" data-pdf-path="${doc.path}">Ver PDF</button>` : '';
                        const resaltarPdfBtn = doc.path ? `<button class="btn btn--warning btn-resaltar" data-pdf-path="${doc.path}" data-codes='${codesJsonString}'>PDF Resaltado</button>` : '';

                        return `\n<div class="doc-item">\n  <div>Documento: ${doc.name}</div>\n  <div>Códigos cubiertos: ${codes.join(', ')}</div>\n  <div class="actions">\n    ${verPdfBtn}${resaltarPdfBtn}\n  </div>\n</div>`;
                    }).join('');
                    const faltantesHtml = resultado.codigos_faltantes?.length ? `<div class="mt-2">Códigos no encontrados: ${resultado.codigos_faltantes.join(', ')}</div>` : '';
                    optimaResults.innerHTML = docsHtml + faltantesHtml;
                    attachResaltarListeners();
                } else {
                    optimaResults.innerHTML = ' No se encontraron documentos que cubran los códigos solicitados. ';
                }
            } catch (err) {
                showToast('Error en la búsqueda: ' + err.message, false);
                optimaResults.innerHTML = ` Error en la búsqueda. `;
            } finally {
                optimaButton.disabled = false;
                optimaButton.textContent = "Buscar";
            }
        };

        optimaButton.addEventListener('click', doOptimaSearch);
        optimaClear.addEventListener('click', () => {
            optimaInput.value = '';
            optimaResults.innerHTML = '';
        });

        // === LÓGICA PARA BÚSQUEDA POR CÓDIGO ===
        const codeInput = document.getElementById('codeInput');
        const codeSearchButton = document.getElementById('doCodeSearchButton');
        const codeResultsContainer = document.getElementById('results-code');

        const performCodeSearch = async () => {
            const code = codeInput.value.trim();
            if (!code) return showToast('Ingresa un término para buscar.', 'warning');

            codeSearchButton.disabled = true;
            codeSearchButton.textContent = "Buscando...";
            codeResultsContainer.innerHTML = ' Buscando... ';

            try {
                const results = await buscarPorCodigo(code, 'like');
                if (results && results.length > 0) {
                    codeResultsContainer.innerHTML = results.map(doc => {
                        const codesArray = (doc.codigos_extraidos || '').split(',').map(s => s.trim()).filter(Boolean);
                        const codesId = `codes-list-search-${doc.id}`;
                        const codesListHtml = ` ${
                            codesArray.length > 0 && codesArray[0] !== 'N/A'
                              ? codesArray.map(c => `<span class="code-item">${c}</span>`).join('')
                              : ' Sin códigos asociados. '
                        } `;
                        const verPdfBtn = doc.path ? `<button class="btn btn--secondary" data-pdf-path="${doc.path}">Ver PDF</button>` : '';
                        const editBtn = `<button class="btn btn--dark" onclick="window.dispatchEdit(${doc.id})">Editar</button>`;
                        const verCodigosBtn = `<button class="btn btn--primary btn-ver-codigos" data-codes-id="${codesId}">Ver Códigos</button>`;

                        return `\n<div class="doc-item">\n  <div>${doc.name}</div>\n  <div class="actions">\n    ${verPdfBtn} ${editBtn} ${verCodigosBtn}\n  </div>\n  <div id="${codesId}" class="codes-list hidden">${codesListHtml}</div>\n</div>`;
                    }).join('');
                    bindCodeButtons(codeResultsContainer);
                } else {
                    codeResultsContainer.innerHTML = ' No se encontraron documentos que coincidan con la búsqueda. ';
                }
            } catch (err) {
                showToast('Error en la búsqueda: ' + err.message, false);
                codeResultsContainer.innerHTML = ` Error al realizar la búsqueda. `;
            } finally {
                codeSearchButton.disabled = false;
                codeSearchButton.textContent = "Buscar por Código";
            }
        };

        codeSearchButton.addEventListener('click', performCodeSearch);
        codeInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performCodeSearch();
            }
        });
    });
});