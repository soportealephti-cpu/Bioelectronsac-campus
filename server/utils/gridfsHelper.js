// server/utils/gridfsHelper.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { getGridFSBucket } = require("../config/gridfs");
const { Readable } = require("stream");

/**
 * Sube un archivo a GridFS
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} contentType - Tipo MIME del archivo
 * @returns {Promise<ObjectId>} - ID del archivo en GridFS
 */
async function uploadToGridFS(fileBuffer, filename, contentType) {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();

      // Crear stream de lectura desde el buffer
      const readableStream = Readable.from(fileBuffer);

      // Crear stream de escritura a GridFS
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: contentType,
        metadata: {
          uploadedAt: new Date(),
          originalName: filename
        }
      });

      // Pipe del buffer a GridFS
      readableStream.pipe(uploadStream);

      uploadStream.on('error', (error) => {
        console.error('❌ Error al subir a GridFS:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        console.log(`✅ Archivo subido a GridFS: ${filename} (ID: ${uploadStream.id})`);
        resolve(uploadStream.id);
      });
    } catch (error) {
      console.error('❌ Error en uploadToGridFS:', error);
      reject(error);
    }
  });
}

/**
 * Descarga un archivo de GridFS (VERSIÓN ASYNC/AWAIT)
 * @param {string|ObjectId} fileId - ID del archivo en GridFS
 * @returns {Promise<{buffer: Buffer, filename: string, contentType: string}>}
 */
async function downloadFromGridFS(fileId) {
  try {
    const bucket = getGridFSBucket();

    // Convertir a ObjectId si es string
    const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;

    // Buscar metadata del archivo usando await
    const files = await bucket.find({ _id: objectId }).toArray();

    if (!files || files.length === 0) {
      throw new Error('Archivo no encontrado en GridFS');
    }

    const file = files[0];

    // Descargar archivo como buffer
    return new Promise((resolve, reject) => {
      const chunks = [];
      const downloadStream = bucket.openDownloadStream(objectId);

      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('error', (error) => {
        console.error('❌ Error al descargar de GridFS:', error);
        reject(error);
      });

      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ Archivo descargado de GridFS: ${file.filename} (${buffer.length} bytes)`);
        resolve({
          buffer,
          filename: file.filename,
          contentType: file.contentType || 'application/octet-stream'
        });
      });
    });
  } catch (error) {
    console.error('❌ Error en downloadFromGridFS:', error);
    throw error;
  }
}

/**
 * Elimina un archivo de GridFS
 * @param {string|ObjectId} fileId - ID del archivo en GridFS
 * @returns {Promise<void>}
 */
async function deleteFromGridFS(fileId) {
  try {
    const bucket = getGridFSBucket();

    // Convertir a ObjectId si es string
    const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;

    await bucket.delete(objectId);
    console.log(`✅ Archivo eliminado de GridFS (ID: ${fileId})`);
  } catch (error) {
    console.error('❌ Error al eliminar de GridFS:', error);
    throw error;
  }
}

/**
 * Guarda una copia del archivo en /pdfs-backup/
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} subfolder - Subcarpeta (cursos, certificados, etc.)
 * @returns {string} - Ruta donde se guardó el archivo
 */
function saveToBackupFolder(fileBuffer, filename, subfolder = 'cursos') {
  try {
    const backupDir = path.join(__dirname, '..', '..', 'pdfs-backup', subfolder);

    // Asegurar que existe el directorio
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, filename);

    // Guardar archivo
    fs.writeFileSync(backupPath, fileBuffer);

    console.log(`✅ Archivo guardado en backup: ${backupPath}`);

    // Retornar ruta relativa desde la raíz del proyecto
    return `/pdfs-backup/${subfolder}/${filename}`;
  } catch (error) {
    console.error('❌ Error al guardar en backup:', error);
    throw error;
  }
}

/**
 * Elimina un archivo de /pdfs-backup/
 * @param {string} relativePath - Ruta relativa del archivo
 */
function deleteFromBackupFolder(relativePath) {
  try {
    if (!relativePath) return;

    const fullPath = path.join(__dirname, '..', '..', relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Archivo eliminado de backup: ${fullPath}`);
    }
  } catch (error) {
    console.warn('⚠️  No se pudo eliminar archivo de backup:', error.message);
  }
}

module.exports = {
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  saveToBackupFolder,
  deleteFromBackupFolder
};
