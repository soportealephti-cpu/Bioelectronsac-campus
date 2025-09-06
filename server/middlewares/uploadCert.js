// server/middlewares/uploadCert.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "..", "uploads", "certificados");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || ".png");
    cb(null, `${ts}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  console.log(`📁 Archivo subido: ${file.originalname}, tipo: ${file.mimetype}`);
  
  // Rechazar WebP explícitamente
  if (file.mimetype === 'image/webp') {
    return cb(new Error("❌ Archivos WebP no son compatibles. Por favor, usa PNG o JPG."), false);
  }
  
  if (!/image\/(png|jpe?g)/i.test(file.mimetype)) {
    return cb(new Error("❌ Solo se aceptan imágenes PNG/JPG"), false);
  }
  
  console.log(`✅ Archivo ${file.originalname} aceptado`);
  cb(null, true);
}

module.exports = multer({ storage, fileFilter });
