// GESTOR-DOC-2-front/js/api.js

import { config } from './config.js';
import { tenantConfig } from './tenant_config.js';

// Normaliza la URL base de la API (sin / al final)
const API_BASE = (config?.API_BASE || '').replace(/\/$/, '');
const ABS = (p) => (p.startsWith('http') ? p : `${API_BASE}${p}`);

/**
 * Función genérica para hacer peticiones a la API.
 * Maneja JSON, timeouts y errores de forma automática.
 * Además añade el encabezado X‑Tenant‑ID con el ID del cliente.
 */
async function jfetch(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = undefined,
    signal,
    timeoutMs = 30000,
  } = options;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new DOMException('Timeout', 'AbortError')), timeoutMs);

  // Incluir siempre el identificador del inquilino en las cabeceras
  const finalHeaders = { ...headers, 'X-Tenant-ID': tenantConfig.id };
  let finalBody = body;

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isForm && typeof body !== 'string' && !(body instanceof Blob)) {
    if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  try {
    const res = await fetch(ABS(path), {
      method,
      mode: 'cors',
      headers: finalHeaders,
      body: finalBody,
      signal: signal || ctrl.signal,
    });

    clearTimeout(t);

    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try {
        const j = await res.json();
        msg = j?.message || j?.error || msg;
      } catch (_) {}
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    if (res.status === 204) return null;
    return res.text();

  } catch (err) {
    console.error(`Error en jfetch para ${path}:`, err);
    throw err; // Re-lanza el error para que el código que llamó a jfetch pueda manejarlo
  }
}

/* ==========================================================================
   === PUNTOS DE ACCESO A LA API (ENDPOINTS) ===
   ========================================================================== */

/* ------------------ Salud / Diagnóstico ------------------ */
export const ping = () => jfetch('/api/ping');
export const envInfo = () => jfetch('/api/env');
export const diagDoc = () => jfetch('/api/documentos/_diag');

/* ------------------ Búsquedas ------------------ */

// Listado general de todos los documentos
export const listarDocumentos = () =>
  jfetch('/api/documentos', { method: 'GET' });

// Búsqueda "Inteligente"
export const buscarOptimaAvanzada = (texto) =>
  jfetch('/api/documentos/search_optima', {
    method: 'POST',
    body: { texto },
  });

// Búsqueda por un código específico
export const buscarPorCodigo = (codigo, modo = 'like') =>
  jfetch('/api/documentos/search_by_code', {
    method: 'POST',
    body: { codigo, modo },
  });

// Sugerencias de autocompletado para la búsqueda por código
export const sugerirCodigos = (prefix, { signal } = {}) =>
  jfetch('/api/documentos/search_by_code', {
    method: 'POST',
    body: { codigo: prefix, modo: 'prefijo' },
    signal,
  });

/* ------------------ Operaciones CRUD (Crear, Leer, Actualizar, Eliminar) ------------------ */

// Subir un nuevo documento
export const subirDocumentoMultipart = (formData) =>
  jfetch('/api/documentos/upload', {
    method: 'POST',
    body: formData, // FormData establece su propio Content-Type
  });

// Editar un documento existente
export const editarDocumento = (id, payload) =>
  jfetch(`/api/documentos/${id}`, {
    method: 'PUT',
    body: payload, // Puede ser FormData o JSON
  });

// Eliminar un documento
export const eliminarDocumento = (id) =>
  jfetch(`/api/documentos/${id}`, { method: 'DELETE' });