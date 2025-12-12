// server/routes/cursoRoutes.js
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const ctrl = require("../controllers/cursoController");

// almacenamiento en /uploads/cursos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads", "cursos")),
  filename: (req, file, cb) => {
    const ts = Date.now();
    // Normalizar el nombre del archivo: eliminar acentos, caracteres especiales y espacios
    const safe = file.originalname
      .normalize("NFD") // Descomponer caracteres Unicode
      .replace(/[\u0300-\u036f]/g, "") // Eliminar marcas diacríticas (acentos)
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Reemplazar caracteres no alfanuméricos por _
      .replace(/_{2,}/g, "_") // Reemplazar múltiples _ por uno solo
      .toLowerCase();
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "pdf") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("El archivo no es un PDF."), false);
      }
    } else if (file.fieldname === "imagen") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("El archivo no es una imagen válida."), false);
      }
    } else {
      cb(new Error("Tipo de archivo no permitido."), false);
    }
  },
});

// listar
router.get("/", ctrl.obtenerCursos);
router.get("/with-stats", ctrl.listarCursosConConteo);
router.get("/modulos", ctrl.obtenerModulos);

// servir archivos desde GridFS
router.get("/pdf/:fileId", ctrl.servirPDF);
router.get("/imagen/:fileId", ctrl.servirImagen);

// crear (con PDF e imagen)
router.post("/", upload.fields([{ name: "pdf", maxCount: 1 }, { name: "imagen", maxCount: 1 }]), ctrl.crearCurso);

// actualizar (opcionalmente PDF nuevo e imagen nueva)
router.put("/:id", upload.fields([{ name: "pdf", maxCount: 1 }, { name: "imagen", maxCount: 1 }]), ctrl.actualizarCurso);

// eliminar
router.delete("/:id", ctrl.eliminarCurso);

module.exports = router;
