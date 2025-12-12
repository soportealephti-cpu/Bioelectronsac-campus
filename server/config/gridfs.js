const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket;

/**
 * Inicializa GridFS bucket cuando MongoDB esté conectado
 */
function initGridFS() {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB no está conectado');
  }

  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });

  console.log('✅ GridFS inicializado correctamente');
  return bucket;
}

/**
 * Obtiene el bucket de GridFS (lo inicializa si es necesario)
 */
function getGridFSBucket() {
  if (!bucket) {
    return initGridFS();
  }
  return bucket;
}

module.exports = {
  initGridFS,
  getGridFSBucket
};
