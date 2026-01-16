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
    const correoCompleto = `${correo}@bioelectronsac.com`.normalize('NFC');
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
      apellido: (apellido || "").toLowerCase().normalize('NFC'),
      nombre: nombre.toLowerCase().normalize('NFC'),
      correo: correoCompleto, // Ya está normalizado en línea 31
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

// PUT /api/usuarios/:id
const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, dni, correo, correoPersonal, telefono } = req.body;

    // Objeto con los campos permitidos para actualizar (SIN password)
    const camposActualizables = {
      nombre: nombre?.toLowerCase().normalize('NFC'),
      apellido: (apellido || "").toLowerCase().normalize('NFC'),
      dni,
      correoPersonal: correoPersonal || "",
      celular: telefono || ""
    };

    // Si se envía correo, construir el correo completo
    if (correo) {
      // Si viene solo la base (sin @), agregar el dominio
      const correoCompleto = correo.includes('@')
        ? correo
        : `${correo}@bioelectronsac.com`;
      camposActualizables.correo = correoCompleto.normalize('NFC');
    }

    // Actualizar usuario SIN tocar el password
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      camposActualizables,
      { new: true, runValidators: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({
      mensaje: "Usuario actualizado correctamente",
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error("❌ actualizarUsuario ERROR:", error);

    // Manejar errores de duplicación
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      if (field === 'dni') {
        return res.status(400).json({
          mensaje: "Este DNI ya está en uso",
          detalle: `Ya existe otro usuario con el DNI: ${value}`
        });
      }
      if (field === 'correo') {
        return res.status(400).json({
          mensaje: "Este correo ya está en uso",
          detalle: `Ya existe otro usuario con el correo: ${value}`
        });
      }
    }

    res.status(500).json({ mensaje: "Error al actualizar usuario", error: error.message });
  }
};

module.exports = { obtenerUsuarios, crearUsuario, actualizarUsuario };
