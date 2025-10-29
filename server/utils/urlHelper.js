/**
 * Helper para generar URLs correctas en desarrollo y producción
 *
 * En producción (Docker con HTTPS), las URLs deben usar https://
 * En desarrollo local, usar http://localhost:5000
 */

/**
 * Obtiene la URL base del API según el entorno
 * @param {Object} req - Request object de Express (opcional)
 * @returns {string} URL base del API
 */
const getApiBaseUrl = (req = null) => {
  // Si hay variable de entorno API_URL, usarla (prioritario)
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  // Si estamos en producción, usar HTTPS
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.campus.bioelectronsac.com';
  }

  // Si se proporciona req, intentar construir desde el request
  if (req) {
    // Verificar headers de proxy (Nginx, etc.)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');

    // Si el protocolo forwarded es https, usarlo
    if (protocol === 'https') {
      return `https://${host}`;
    }

    return `${protocol}://${host}`;
  }

  // Fallback para desarrollo local
  return 'http://localhost:5000';
};

/**
 * Genera una URL completa para un archivo en /uploads
 * @param {string} relativePath - Ruta relativa del archivo (ej: "/uploads/cursos/file.pdf")
 * @param {Object} req - Request object de Express (opcional)
 * @returns {string} URL completa del archivo
 */
const generateFileUrl = (relativePath, req = null) => {
  if (!relativePath) return '';

  const baseUrl = getApiBaseUrl(req);

  // Si la ruta ya es absoluta (empieza con http), retornarla tal cual
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    // Si estamos en producción y la URL es http, cambiarla a https
    if (process.env.NODE_ENV === 'production' && relativePath.startsWith('http://')) {
      return relativePath.replace('http://', 'https://');
    }
    return relativePath;
  }

  // Asegurar que la ruta empiece con /
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  return `${baseUrl}${path}`;
};

module.exports = {
  getApiBaseUrl,
  generateFileUrl
};
