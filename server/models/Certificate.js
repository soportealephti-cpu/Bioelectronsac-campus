// server/models/Certificate.js
const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "CertificateTemplate", required: true },

    // correlativo final (AA + 4 dígitos)
    number: { type: String, required: true, index: true },

    emitDate: { type: Date, default: Date.now },

    // --- SNAPSHOT (inmutable) ---
    studentName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    hours: { type: Number, required: true },
    dateText: { type: String, required: true },          // "Lima, 20 de agosto de 2025"
    managerName: { type: String, required: true },
    backgroundUrlUsed: { type: String, default: "" },
    firmaUrlUsed: { type: String, default: "" },
  },
  { timestamps: true }
);

// Un certificado por (user, course)
certificateSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
