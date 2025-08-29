// GESTOR-DOC-2-front/js/modals.js

/**
 * Muestra el modal de login. Requiere que en el HTML existan los elementos con
 * IDs loginOverlay, accessInput, submitAccess y errorMsg. La contraseña por
 * defecto es "111"; cámbiala según tus necesidades.
 *
 * @param {() => void} onSuccess Callback que se ejecuta si la contraseña es correcta
 */
export function showModalLogin(onSuccess) {
  const loginOverlay = document.getElementById('loginOverlay');
  const claveInput = document.getElementById('accessInput');
  const loginButton = document.getElementById('submitAccess');
  const errorMsgDiv = document.getElementById('errorMsg');

  if (!loginOverlay || !claveInput || !loginButton || !errorMsgDiv) {
    console.error('showModalLogin: Elementos del modal de login no encontrados. Asegúrese de que estén en index.html con los IDs correctos.');
    return;
  }

  // Asegura que el modal sea visible
  loginOverlay.classList.remove('hidden');
  errorMsgDiv.classList.add('hidden');
  claveInput.value = '';
  claveInput.focus();

  // Adjunta el evento onclick al botón de login
  loginButton.onclick = () => {
    const clave = claveInput.value;
    // La clave de administrador está aquí. Cámbiala si es necesario.
    if (clave === '111') {
      loginOverlay.classList.add('hidden');
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } else {
      errorMsgDiv.classList.remove('hidden');
      claveInput.value = '';
      claveInput.focus();
    }
  };

  // Permite presionar Enter en el campo de clave
  claveInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      loginButton.click();
    }
  };
}

/**
 * Muestra un modal de confirmación con un mensaje y ejecuta una acción si el usuario confirma.
 * Requiere que existan los elementos con IDs confirmOverlay, confirmOk, confirmCancel y confirmMsg.
 *
 * @param {string} message Mensaje a mostrar en el modal
 * @param {() => void} onConfirm Función a ejecutar si se confirma
 */
export function showModalConfirm(message, onConfirm) {
  const confirmOverlay = document.getElementById('confirmOverlay');
  const confirmOkButton = document.getElementById('confirmOk');
  const confirmCancelButton = document.getElementById('confirmCancel');
  const confirmMsgP = document.getElementById('confirmMsg');

  if (!confirmOverlay || !confirmOkButton || !confirmCancelButton || !confirmMsgP) {
    console.error('showModalConfirm: Elementos del modal de confirmación no encontrados. Asegúrese de que estén en index.html con los IDs correctos.');
    return;
  }

  confirmMsgP.textContent = message;
  confirmOverlay.classList.remove('hidden');

  confirmOkButton.onclick = () => {
    confirmOverlay.classList.add('hidden');
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  confirmCancelButton.onclick = () => {
    confirmOverlay.classList.add('hidden');
  };
}