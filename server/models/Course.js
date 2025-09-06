// server/models/Course.js
const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    categoria: { type: String, default: "" },
    // ⬇️ Importante
    pdfUrl: { type: String, default: "" },
    // ⬇️ Nueva funcionalidad: Imagen del curso
    imagenUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
