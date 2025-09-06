const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    assignedAt: { type: Date, default: Date.now },
    expiresAt:  { type: Date },
    active:     { type: Boolean, default: true },

    // NUEVOS (opcionales, para el resumen)
    intentos:        { type: Number, default: 0 },
    ultimoResultado: { type: String, enum: ["aprobado", "desaprobado", "-"], default: "-" },
    aprobado:        { type: Boolean, default: false },
    
    // Campos para resultados del examen
    lastExamId:      { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    lastScore:       { type: Number },
    lastTotal:       { type: Number },
    lastCorrect:     { type: Number },
    lastAnswers:     [{ type: mongoose.Schema.Types.Mixed }],
    passed:          { type: Boolean, default: false }
  },
  { timestamps: true }
);

assignmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
