const express = require("express");
const router = express.Router();
const auth = require('../middlewares/authMiddleware');

// IMPORTA correctamente tu controlador
const ctrl = require("../controllers/examController");

// ⚠️ IMPORTANTE: el orden de las rutas específicas va ANTES de "/:id"
// Lista todos los exámenes
router.get("/", auth, ctrl.listarExamenes);

// Crear examen
router.post("/", auth, ctrl.crearExamen);

// Actualizar examen
router.put("/:id", auth, ctrl.actualizarExamen);

// Eliminar examen
router.delete("/:id", auth, ctrl.eliminarExamen);

// Asignar (o quitar) curso a un examen
router.put("/:id/asignar-curso", auth, ctrl.asignarCurso);

// Registrar resultado del examen
router.post("/submit", auth, ctrl.submitResult);

// Obtener examen por ID (esta debe ir al final para no “comerse” las rutas anteriores)
router.get("/:id", auth, ctrl.getById);

module.exports = router;
