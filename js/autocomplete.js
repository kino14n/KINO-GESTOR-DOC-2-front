// GESTOR-DOC-2-front/js/autocomplete.js

import { sugerirCodigos } from './api.js';

// Controlador de abortar peticiones de autocompletado para evitar resultados fuera de orden
let abortCtrl = null;

/**
 * Inicializa el autocompletado para la búsqueda por código.
 * Escucha eventos de input, hace solicitudes a sugerirCodigos y muestra sugerencias.
 */
export function initAutocompleteCodigo() {
  const input = document.getElementById('codeInput');
  if (!input) return;

  const suggestionsContainer = document.getElementById('suggestions');
  if (!suggestionsContainer) return;

  async function render(q) {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.classList.add('hidden');
    if (!q || q.length < 1) return;

    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();
    try {
      const codigos = await sugerirCodigos(q, { signal: abortCtrl.signal });
      if (codigos && codigos.length > 0) {
        suggestionsContainer.classList.remove('hidden');
        codigos.slice(0, 10).forEach(c => {
          const div = document.createElement('div');
          div.textContent = c;
          div.className = 'px-3 py-2 cursor-pointer hover:bg-gray-100';
          div.addEventListener('click', () => {
            input.value = c;
            suggestionsContainer.classList.add('hidden');
          });
          suggestionsContainer.appendChild(div);
        });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Error de autocompletado:', err);
    }
  }

  input.addEventListener('input', () => render((input.value || '').trim()));
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') suggestionsContainer.classList.add('hidden'); });
  document.addEventListener('click', (e) => {
    if (!suggestionsContainer.contains(e.target) && e.target !== input) {
      suggestionsContainer.classList.add('hidden');
    }
  });
}