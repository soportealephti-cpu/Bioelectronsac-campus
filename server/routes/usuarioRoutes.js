const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { obtenerUsuarios, crearUsuario } = require("../controllers/usuarioController");
const crud = require("../utils/crudController");

router.get("/", obtenerUsuarios);
router.post("/", crearUsuario);
router.put("/:id", crud.updateItem(User));
router.delete("/:id", crud.deleteItem(User));

module.exports = router;
