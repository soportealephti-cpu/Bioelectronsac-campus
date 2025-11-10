const mongoose = require("mongoose");

const alternativaSchema = new mongoose.Schema({
  texto: { type: String, required: true },
  correcta: { type: Boolean, default: false }
}, { _id: false });

const preguntaSchema = new mongoose.Schema({
  enunciado: { type: String, required: true },
  alternativas: {
    type: [alternativaSchema],
    validate: v => Array.isArray(v) && v.length === 3
  }
}, { _id: false });

const examSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  preguntas: {
    type: [preguntaSchema],
    validate: v => Array.isArray(v) && v.length > 0
  },
  // 👇 Relación opcional con Curso (mantener compatibilidad)
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
  // 👇 Nuevo: Relación con módulo (string)
  modulo: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Exam", examSchema);
