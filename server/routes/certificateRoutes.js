const router = require("express").Router();
const auth = require('../middlewares/authMiddleware');
const upload = require("../middlewares/uploadCert");
const ctrl = require("../controllers/certificateController");

// Plantilla
router.get("/template", auth, ctrl.getTemplate);
router.put(
  "/template",
  auth,
  upload.fields([
    { name: "background", maxCount: 1 },
    { name: "firma", maxCount: 1 },
  ]),
  ctrl.updateTemplate
);
router.get("/next-number", auth, ctrl.nextNumber);

// Certificados
router.post("/", auth, ctrl.emit);
router.get("/:id", auth, ctrl.getById);
router.get("/:id/pdf", ctrl.renderPdf); // PDF público - sin auth para window.open

// Obtener certificados de un usuario
router.get("/user/:userId", auth, ctrl.getCertificatesByUser);

// Garantizar/emitir por asignación (usado por el alumno al aprobar)
router.post("/ensure", auth, ctrl.ensureForAssignment);

module.exports = router;
