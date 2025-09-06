const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware"); // Importar el middleware
const assignmentController = require("../controllers/assignmentController");

const {
  createAssignment,
  listByUser,
  deleteAssignment,
  getMyCourses, // Importar la nueva función
} = require("../controllers/assignmentController");

router.get("/", listByUser);
router.post("/", createAssignment);
router.delete("/:id", deleteAssignment);
router.get("/my-courses", auth, getMyCourses);
router.get("/:id", assignmentController.getById);

module.exports = router;