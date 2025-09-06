 
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await User.findOne({ correo });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Crear y firmar el token
    const payload = {
      user: {
        id: user.id,
        rol: user.rol,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" }, // El token expirará en 1 hora
      (err, token) => {
        if (err) throw err;
        res.json({ token, rol: user.rol }); // Enviar el token y el rol al cliente
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user.id viene del middleware de autenticación
    const user = await User.findById(req.user.id).select("-password"); // Excluir la contraseña
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    // Asegurar que tanto 'id' como '_id' estén disponibles para compatibilidad
    const userResponse = user.toObject();
    userResponse.id = user._id;
    res.json(userResponse);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { login, getMe };
