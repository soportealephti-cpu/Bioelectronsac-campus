const router = require("express").Router();
const auth = require('../middlewares/authMiddleware');
const upload = require("../middlewares/uploadCert");
const ctrl = require("../controllers/certificateController");

// IMPORTANTE: Las rutas más específicas deben ir primero para evitar conflictos

// Plantilla (GET sin auth para consistencia con otras rutas de listado)
router.get("/template", ctrl.getTemplate);
router.put(
  "/template",
  auth,
  upload.fields([
    { name: "background", maxCount: 1 },
    { name: "firma", maxCount: 1 },
  ]),
  ctrl.updateTemplate
);

// Número siguiente
router.get("/next-number", ctrl.nextNumber);

// Garantizar/emitir por asignación (usado por el alumno al aprobar)
router.post("/ensure", auth, ctrl.ensureForAssignment);

// Obtener certificados de un usuario (debe ir ANTES de /:id)
router.get("/user/:userId", auth, ctrl.getCertificatesByUser);

// Certificados individuales (rutas con parámetros genéricos van al final)
router.post("/", auth, ctrl.emit);
router.get("/:id/pdf", ctrl.renderPdf); // PDF público - sin auth para window.open
router.get("/:id", auth, ctrl.getById);

module.exports = router;
