// server/models/CertificateTemplate.js
const mongoose = require("mongoose");

const certificateTemplateSchema = new mongoose.Schema(
  {
    gerenteNombre: { type: String, default: "" },
    backgroundUrl: { type: String, default: "" },
    firmaUrl:      { type: String, default: "" },

    year:    { type: Number, default: new Date().getFullYear() },
    // 👇 CAMBIADO: valor inicial 199 (para que el primer certificado sea 200)
    lastSeq: { type: Number, default: 199 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CertificateTemplate", certificateTemplateSchema);
