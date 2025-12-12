const { Readable } = require('stream');
const { getGridFSBucket } = require('../config/gridfs');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');

/**
 * Sube un archivo a GridFS
 * @param {Buffer} buffer - Buffer del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} contentType - Tipo MIME del archivo
 * @returns {Promise<ObjectId>} ID del archivo en GridFS
 */
async function uploadToGridFS(buffer, filename, contentType) {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const readableStream = Readable.from(buffer);

      const uploadStream = bucket.openUploadStream(filename, {
        contentType,
        metadata: {
          uploadedAt: new Date()
        }
      });

      readableStream.pipe(uploadStream);

      uploadStream.on('finish', () => {
        console.log(`✅ Archivo subido a GridFS: ${filename} (ID: ${uploadStream.id})`);
        resolve(uploadStream.id);
      });

      uploadStream.on('error', (error) => {
        console.error(`❌ Error subiendo a GridFS:`, error);
        reject(error);
      });
    } catch (error) {
      console.error(`❌ Error en uploadToGridFS:`, error);
      reject(error);
    }
  });
}

/**
 * Descarga un archivo desde GridFS
 * @param {string} fileId - ID del archivo en GridFS
 * @returns {Promise<{buffer: Buffer, filename: string, contentType: string}>}
 */
async function downloadFromGridFS(fileId) {
  return new Promise(async (resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const objectId = new ObjectId(fileId);

      // Obtener metadatos del archivo
      const files = await bucket.find({ _id: objectId }).toArray();

      if (files.length === 0) {
        return reject(new Error('Archivo no encontrado en GridFS'));
      }

      const file = files[0];
      const chunks = [];

      const downloadStream = bucket.openDownloadStream(objectId);

      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          filename: file.filename,
          contentType: file.contentType || 'application/octet-stream'
        });
      });

      downloadStream.on('error', (error) => {
        console.error(`❌ Error descargando desde GridFS:`, error);
        reject(error);
      });
    } catch (error) {
      console.error(`❌ Error en downloadFromGridFS:`, error);
      reject(error);
    }
  });
}

/**
 * Elimina un archivo de GridFS
 * @param {string} fileId - ID del archivo a eliminar
 */
async function deleteFromGridFS(fileId) {
  try {
    const bucket = getGridFSBucket();
    const objectId = new ObjectId(fileId);
    await bucket.delete(objectId);
    console.log(`✅ Archivo eliminado de GridFS: ${fileId}`);
  } catch (error) {
    console.error(`❌ Error eliminando de GridFS:`, error);
    throw error;
  }
}

/**
 * Guarda un archivo en la carpeta de respaldo /pdfs-backup
 * @param {Buffer} buffer - Buffer del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} subfolder - Subcarpeta (ej: 'cursos', 'certificados')
 * @returns {string} Ruta relativa del archivo guardado
 */
function saveToBackupFolder(buffer, filename, subfolder = '') {
  try {
    const backupDir = path.join(__dirname, '..', 'pdfs-backup', subfolder);

    // Crear directorio si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, filename);
    fs.writeFileSync(filePath, buffer);

    const relativePath = path.join('pdfs-backup', subfolder, filename);
    console.log(`✅ Archivo guardado en respaldo: ${relativePath}`);

    return relativePath;
  } catch (error) {
    console.error(`❌ Error guardando en carpeta de respaldo:`, error);
    throw error;
  }
}

/**
 * Elimina un archivo de la carpeta de respaldo
 * @param {string} backupPath - Ruta relativa del archivo (ej: 'pdfs-backup/cursos/archivo.pdf')
 */
function deleteFromBackupFolder(backupPath) {
  try {
    if (!backupPath) return;

    const fullPath = path.join(__dirname, '..', backupPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Archivo eliminado del respaldo: ${backupPath}`);
    }
  } catch (error) {
    console.error(`❌ Error eliminando del respaldo:`, error);
    // No lanzar error, solo logear (el respaldo es secundario)
  }
}

module.exports = {
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  saveToBackupFolder,
  deleteFromBackupFolder
};
