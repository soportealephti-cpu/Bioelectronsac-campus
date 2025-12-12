// server/middlewares/upload.js
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const dest = path.join(__dirname, "..", "uploads", "cursos");
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    // Normalizar el nombre del archivo: eliminar acentos y caracteres especiales
    const safeName = basename
      .normalize("NFD") // Descomponer caracteres Unicode
      .replace(/[\u0300-\u036f]/g, "") // Eliminar marcas diacríticas (acentos)
      .replace(/[^a-zA-Z0-9_-]/g, "_") // Reemplazar caracteres no alfanuméricos por _
      .replace(/_{2,}/g, "_") // Reemplazar múltiples _ por uno solo
      .toLowerCase();
    cb(null, `${Date.now()}_${safeName}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === "pdf") {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Solo se permite PDF para el campo pdf"), false);
    }
  } else if (file.fieldname === "imagen") {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes para el campo imagen"), false);
    }
  } else {
    return cb(new Error("Campo de archivo no válido"), false);
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
