// GESTOR-DOC-2-front/js/auth.js
// Control de acceso simple con overlay. Acepta callback tras autenticación.

const STORAGE_KEY = 'gd_auth_ok';

/**
 * Muestra el overlay hasta que el usuario ingrese la clave correcta.
 * Si la clave es correcta, oculta el overlay y ejecuta el callback opcional.
 *
 * @param {() => void} [onReady] Función a ejecutar tras autenticación
 */
export function requireAuth(onReady) {
  const overlay = document.getElementById('loginOverlay');
  const input = /** @type {HTMLInputElement|null} */ (document.getElementById('accessInput'));
  const submit = document.getElementById('submitAccess');
  const errorMsg = document.getElementById('errorMsg');
  const main = document.getElementById('mainContent');

  const showMain = () => {
    if (overlay) overlay.classList.add('hidden');
    if (main) main.classList.remove('hidden');
    try { onReady && onReady(); } catch (e) { console.error(e); }
  };

  // Si ya está autenticado en esta sesión
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    showMain();
    return;
  }

  // Estado inicial
  if (main) main.classList.add('hidden');
  if (overlay) overlay.classList.remove('hidden');
  if (errorMsg) errorMsg.textContent = '';

  const tryLogin = () => {
    const v = (input?.value || '').trim();
    // Clave de pruebas; cámbiala en producción
    if (v === '111') {
      localStorage.setItem(STORAGE_KEY, '1');
      showMain();
    } else {
      if (errorMsg) errorMsg.textContent = 'Clave incorrecta';
      input?.focus();
    }
  };

  submit?.addEventListener('click', tryLogin);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tryLogin(); }
  });
}

/**
 * Elimina la autenticación almacenada y recarga la página.
 */
export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}