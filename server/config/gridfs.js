// server/config/gridfs.js
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gfsBucket = null;

/**
 * Inicializa GridFS Bucket
 * Debe llamarse después de conectar a MongoDB
 */
function initGridFS() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB debe estar conectado antes de inicializar GridFS");
  }

  const db = mongoose.connection.db;

  // Crear bucket para archivos de cursos
  gfsBucket = new GridFSBucket(db, {
    bucketName: "courseFiles" // Nombre del bucket en MongoDB
  });

  console.log("✅ GridFS inicializado correctamente");
  return gfsBucket;
}

/**
 * Obtiene la instancia de GridFS Bucket
 */
function getGridFSBucket() {
  if (!gfsBucket) {
    throw new Error("GridFS no ha sido inicializado. Llama a initGridFS() primero.");
  }
  return gfsBucket;
}

module.exports = {
  initGridFS,
  getGridFSBucket
};
