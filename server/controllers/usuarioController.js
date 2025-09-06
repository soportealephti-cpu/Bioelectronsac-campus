const Usuario = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/usuarios
const obtenerUsuarios = async (_req, res) => {
  try {
    // prueba 1: consulta simple sin filtro
    const usuarios = await Usuario.find({ rol: "user" }).sort({ apellido: 1, nombre: 1 });
    res.json(usuarios);
  } catch (error) {
    console.error("❌ obtenerUsuarios ERROR:", error); // <-- IMPORTANTE
    res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
  }
};

// POST /api/usuarios
const crearUsuario = async (req, res) => {
  try {
    const { dni, apellido, nombre, correo, telefono } = req.body;

    // ✅ Verificar si el DNI ya existe
    const usuarioExistenteDNI = await Usuario.findOne({ dni });
    if (usuarioExistenteDNI) {
      return res.status(400).json({ 
        mensaje: "Este usuario ya existe", 
        detalle: `Ya existe un usuario registrado con el DNI: ${dni}` 
      });
    }

    // ✅ Verificar si el correo ya existe
    const correoCompleto = `${correo}@bioelectronsac.com`;
    const usuarioExistenteCorreo = await Usuario.findOne({ correo: correoCompleto });
    if (usuarioExistenteCorreo) {
      return res.status(400).json({ 
        mensaje: "Este correo ya está registrado", 
        detalle: `Ya existe un usuario con el correo: ${correoCompleto}` 
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dni, salt);

    const nuevoUsuario = new Usuario({
      dni,
      apellido: (apellido || "").toLowerCase(),
      nombre: nombre.toLowerCase(),
      correo: correoCompleto,
      celular: telefono || "",
      password: hashedPassword, // Guardar la contraseña hasheada
      rol: "user",
    });
    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario creado correctamente" });
  } catch (error) {
    console.error("❌ crearUsuario ERROR:", error);
    
    // ✅ Manejar errores específicos de duplicación de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      if (field === 'dni') {
        return res.status(400).json({ 
          mensaje: "Este usuario ya existe", 
          detalle: `Ya existe un usuario registrado con el DNI: ${value}` 
        });
      }
      if (field === 'correo') {
        return res.status(400).json({ 
          mensaje: "Este correo ya está registrado", 
          detalle: `Ya existe un usuario con el correo: ${value}` 
        });
      }
    }
    
    res.status(500).json({ mensaje: "Error al crear usuario", error: error.message });
  }
};

module.exports = { obtenerUsuarios, crearUsuario };
