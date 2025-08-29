// GESTOR-DOC-2-front/js/toasts.js

/**
 * Muestra un mensaje emergente (toast) en pantalla durante unos segundos.
 * Agrega una clase azul o roja según el parámetro success.
 *
 * @param {string} message Mensaje a mostrar
 * @param {boolean} [success=true] Indica si es un mensaje de éxito (azul) o error (rojo)
 */
export function showToast(message, success = true) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${success ? 'bg-blue-600' : 'bg-red-600'}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}