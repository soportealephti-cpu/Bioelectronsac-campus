const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { obtenerUsuarios, crearUsuario, actualizarUsuario } = require("../controllers/usuarioController");
const crud = require("../utils/crudController");

router.get("/", obtenerUsuarios);
router.post("/", crearUsuario);
router.put("/:id", actualizarUsuario); // Usa controlador específico que NO modifica password
router.delete("/:id", crud.deleteItem(User));

module.exports = router;
