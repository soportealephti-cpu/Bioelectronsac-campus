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
    const safe = file.originalname.replace(/\s+/g, "_").toLowerCase();
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

// crear (con PDF e imagen)
router.post("/", upload.fields([{ name: "pdf", maxCount: 1 }, { name: "imagen", maxCount: 1 }]), ctrl.crearCurso);

// actualizar (opcionalmente PDF nuevo e imagen nueva)
router.put("/:id", upload.fields([{ name: "pdf", maxCount: 1 }, { name: "imagen", maxCount: 1 }]), ctrl.actualizarCurso);

// eliminar
router.delete("/:id", ctrl.eliminarCurso);

module.exports = router;
