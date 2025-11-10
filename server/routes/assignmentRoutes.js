const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware"); // Importar el middleware
const assignmentController = require("../controllers/assignmentController");

const {
  createAssignment,
  listByUser,
  deleteAssignment,
  getMyCourses,
  assignModuleToUser, // Importar la nueva función
} = require("../controllers/assignmentController");

router.get("/", listByUser);
router.post("/", createAssignment);
router.post("/module", assignModuleToUser); // Nueva ruta para asignar módulos
router.delete("/:id", deleteAssignment);
router.get("/my-courses", auth, getMyCourses);
router.get("/:id", assignmentController.getById);

module.exports = router;