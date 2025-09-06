const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre:   { type: String, required: true },
  apellido: { type: String, default: "" },      // <-- añadido
  dni:      { type: String, required: true, unique: true },
  celular:  { type: String, default: "" },
  correo:   { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol:      { type: String, enum: ["admin", "user"], default: "user" }
});

module.exports = mongoose.model("User", userSchema);
