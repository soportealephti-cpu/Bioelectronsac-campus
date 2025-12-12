// server/models/Course.js
const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    categoria: { type: String, default: "" },
    modulo: { type: String, default: "" }, // ⬅️ Nuevo: para agrupar cursos

    // ⬇️ Sistema de doble respaldo de PDFs
    pdfUrl: { type: String, default: "" }, // URL antigua (compatibilidad)
    pdfGridFsId: { type: mongoose.Schema.Types.ObjectId, default: null }, // ID en GridFS (respaldo 1)
    pdfBackupPath: { type: String, default: "" }, // Ruta en /pdfs-backup/ (respaldo 2)
    pdfOriginalName: { type: String, default: "" }, // Nombre original del archivo

    // ⬇️ Sistema de doble respaldo de imágenes
    imagenUrl: { type: String, default: "" }, // URL antigua (compatibilidad)
    imagenGridFsId: { type: mongoose.Schema.Types.ObjectId, default: null }, // ID en GridFS
    imagenBackupPath: { type: String, default: "" }, // Ruta en /pdfs-backup/
    imagenOriginalName: { type: String, default: "" }, // Nombre original
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
