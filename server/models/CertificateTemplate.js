// server/models/CertificateTemplate.js
const mongoose = require("mongoose");

const certificateTemplateSchema = new mongoose.Schema(
  {
    gerenteNombre: { type: String, default: "" },
    backgroundUrl: { type: String, default: "" },
    firmaUrl:      { type: String, default: "" },

    year:    { type: Number, default: new Date().getFullYear() },
    // 👇 CAMBIADO: valor inicial ajustable (149 para que el primero sea 150)
    lastSeq: { type: Number, default: 149 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CertificateTemplate", certificateTemplateSchema);
