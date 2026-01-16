/**
 * Script de Normalización Unicode para Usuarios
 * Nombre: corregirletra.js
 *
 * Propósito: Normalizar todos los usuarios existentes en la base de datos
 * para corregir problemas con caracteres especiales (ñ, á, é, í, ó, ú, ü)
 *
 * Uso: node scripts/corregirletra.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Modelo de Usuario
const userSchema = new mongoose.Schema({
  nombre:   { type: String, required: true },
  apellido: { type: String, default: "" },
  dni:      { type: String, required: true, unique: true },
  celular:  { type: String, default: "" },
  correo:   { type: String, required: true, unique: true },
  correoPersonal: { type: String, default: "" },
  password: { type: String, required: true },
  rol:      { type: String, enum: ["admin", "user"], default: "user" }
});
const User = mongoose.model("User", userSchema);

// Función para normalizar un string
function normalizarTexto(texto) {
  if (!texto) return texto;
  return texto.normalize('NFC');
}

// Función para detectar si un string necesita normalización
function necesitaNormalizacion(texto) {
  if (!texto) return false;
  const normalizado = texto.normalize('NFC');
  return texto !== normalizado;
}

async function corregirLetras() {
  console.log("\n🔧 SCRIPT DE NORMALIZACIÓN UNICODE");
  console.log("====================================\n");

  try {
    // Conectar a MongoDB
    console.log("📡 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bioelectron");
    console.log("✅ Conexión exitosa\n");

    // Obtener todos los usuarios
    console.log("📋 Obteniendo usuarios de la base de datos...");
    const usuarios = await User.find({});
    console.log(`✅ ${usuarios.length} usuarios encontrados\n`);

    let actualizados = 0;
    let sinCambios = 0;
    let errores = 0;

    console.log("🔍 Analizando y normalizando usuarios...\n");

    for (const usuario of usuarios) {
      try {
        const necesitaActualizar =
          necesitaNormalizacion(usuario.nombre) ||
          necesitaNormalizacion(usuario.apellido) ||
          necesitaNormalizacion(usuario.correo);

        if (necesitaActualizar) {
          const nombreOriginal = usuario.nombre;
          const apellidoOriginal = usuario.apellido;
          const correoOriginal = usuario.correo;

          // Normalizar campos
          usuario.nombre = normalizarTexto(usuario.nombre);
          usuario.apellido = normalizarTexto(usuario.apellido);
          usuario.correo = normalizarTexto(usuario.correo);

          // Guardar cambios
          await usuario.save();
          actualizados++;

          console.log(`✅ Usuario actualizado:`);
          console.log(`   DNI: ${usuario.dni}`);
          if (nombreOriginal !== usuario.nombre) {
            console.log(`   Nombre: "${nombreOriginal}" → "${usuario.nombre}"`);
          }
          if (apellidoOriginal !== usuario.apellido) {
            console.log(`   Apellido: "${apellidoOriginal}" → "${usuario.apellido}"`);
          }
          if (correoOriginal !== usuario.correo) {
            console.log(`   Correo: "${correoOriginal}" → "${usuario.correo}"`);
          }
          console.log("");
        } else {
          sinCambios++;
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error al actualizar usuario ${usuario.dni}:`, error.message);
      }
    }

    // Mostrar resumen
    console.log("\n====================================");
    console.log("📊 RESUMEN DE LA NORMALIZACIÓN");
    console.log("====================================");
    console.log(`✅ Usuarios actualizados: ${actualizados}`);
    console.log(`⚪ Usuarios sin cambios: ${sinCambios}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total procesado: ${usuarios.length}`);
    console.log("====================================\n");

    if (actualizados > 0) {
      console.log("🎉 ¡Normalización completada exitosamente!");
      console.log("💡 Los usuarios ahora podrán loguearse sin problemas.\n");
    } else {
      console.log("ℹ️  No se encontraron usuarios que necesiten normalización.\n");
    }

  } catch (error) {
    console.error("\n❌ ERROR FATAL:", error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log("👋 Conexión a MongoDB cerrada");
  }
}

// Ejecutar el script
corregirLetras();
