// server/models/CertificateTemplate.js
const mongoose = require("mongoose");

const certificateTemplateSchema = new mongoose.Schema(
  {
    gerenteNombre: { type: String, default: "" },
    backgroundUrl: { type: String, default: "" },
    firmaUrl:      { type: String, default: "" },

    year:    { type: Number, default: new Date().getFullYear() },
    // dejamos lastSeq en 3999 para que el primero del año sea 4000
    lastSeq: { type: Number, default: 3999 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CertificateTemplate", certificateTemplateSchema);
