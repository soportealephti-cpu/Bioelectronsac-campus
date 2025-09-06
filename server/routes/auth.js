 
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware"); // Importar el middleware
const { login, getMe } = require("../controllers/authController"); // Importar getMe

router.post("/login", login);
router.get("/me", auth, getMe); // Nueva ruta protegida

module.exports = router;