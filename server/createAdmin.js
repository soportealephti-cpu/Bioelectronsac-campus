 
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedAdminUser = async () => {
  try {
    // Verificar si ya existe un administrador
    const adminExists = await User.findOne({ rol: "admin" });

    if (adminExists) {
      console.log("El usuario administrador ya existe.");
      return;
    }

    // Si no existe, crear uno nuevo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", salt);

    const admin = new User({
      nombre: "Admin",
      apellido: "Bioelectron",
      dni: process.env.ADMIN_DNI || "00000000",
      correo: process.env.ADMIN_EMAIL || "admin@bioelectronsac.com",
      password: hashedPassword,
      rol: "admin",
    });

    await admin.save();
    console.log("Usuario administrador creado con éxito.");

  } catch (error) {
    console.error("Error al crear el usuario administrador:", error);
  }
};

module.exports = seedAdminUser;


