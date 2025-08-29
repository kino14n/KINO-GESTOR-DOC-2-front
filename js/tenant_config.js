// Configuración específica del inquilino para el frontend multi‑inquilino
// Modifica estos valores al duplicar el frontend para otro cliente.

export const tenantConfig = {
  // ID único del cliente. Debe coincidir con una clave en 'tenants.json'
  id: 'cliente-predeterminado',

  // URL pública de tu bucket de Cloudflare R2
  r2PublicUrl: 'https://TU_URL_PUBLICA_DE_R2.r2.dev'
};