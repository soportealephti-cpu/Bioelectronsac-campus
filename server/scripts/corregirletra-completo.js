/**
 * Script de Normalización Unicode COMPLETO
 * Nombre: corregirletra-completo.js
 *
 * Propósito: Normalizar usuarios Y certificados existentes
 * para corregir problemas con caracteres especiales (ñ, á, é, í, ó, ú, ü)
 *
 * Uso: node scripts/corregirletra-completo.js
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

// Modelo de Certificado
const certificateSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: "CertificateTemplate", required: true },
  number: { type: String, required: true, index: true },
  emitDate: { type: Date, default: Date.now },
  studentName: { type: String, required: true },
  courseTitle: { type: String, required: true },
  hours: { type: Number, required: true },
  dateText: { type: String, required: true },
  managerName: { type: String, required: true },
  backgroundUrlUsed: { type: String, default: "" },
  firmaUrlUsed: { type: String, default: "" },
}, { timestamps: true });
const Certificate = mongoose.model("Certificate", certificateSchema);

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

async function corregirLetrasCompleto() {
  console.log("\n🔧 SCRIPT DE NORMALIZACIÓN UNICODE COMPLETO");
  console.log("============================================\n");

  try {
    // Conectar a MongoDB
    console.log("📡 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bioelectron");
    console.log("✅ Conexión exitosa\n");

    // =============== NORMALIZAR USUARIOS ===============
    console.log("👥 NORMALIZANDO USUARIOS");
    console.log("====================================\n");

    const usuarios = await User.find({});
    console.log(`📋 ${usuarios.length} usuarios encontrados\n`);

    let usuariosActualizados = 0;
    let usuariosSinCambios = 0;
    let usuariosErrores = 0;

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

          usuario.nombre = normalizarTexto(usuario.nombre);
          usuario.apellido = normalizarTexto(usuario.apellido);
          usuario.correo = normalizarTexto(usuario.correo);

          await usuario.save();
          usuariosActualizados++;

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
          usuariosSinCambios++;
        }
      } catch (error) {
        usuariosErrores++;
        console.error(`❌ Error al actualizar usuario ${usuario.dni}:`, error.message);
      }
    }

    // =============== NORMALIZAR CERTIFICADOS ===============
    console.log("\n📜 NORMALIZANDO CERTIFICADOS");
    console.log("====================================\n");

    const certificados = await Certificate.find({});
    console.log(`📋 ${certificados.length} certificados encontrados\n`);

    let certificadosActualizados = 0;
    let certificadosSinCambios = 0;
    let certificadosErrores = 0;

    for (const certificado of certificados) {
      try {
        const necesitaActualizar = necesitaNormalizacion(certificado.studentName);

        if (necesitaActualizar) {
          const nombreOriginal = certificado.studentName;
          certificado.studentName = normalizarTexto(certificado.studentName);

          await certificado.save();
          certificadosActualizados++;

          console.log(`✅ Certificado actualizado:`);
          console.log(`   N°: ${certificado.number}`);
          console.log(`   Nombre: "${nombreOriginal}" → "${certificado.studentName}"`);
          console.log("");
        } else {
          certificadosSinCambios++;
        }
      } catch (error) {
        certificadosErrores++;
        console.error(`❌ Error al actualizar certificado ${certificado.number}:`, error.message);
      }
    }

    // =============== RESUMEN FINAL ===============
    console.log("\n============================================");
    console.log("📊 RESUMEN COMPLETO DE LA NORMALIZACIÓN");
    console.log("============================================\n");

    console.log("👥 USUARIOS:");
    console.log(`   ✅ Actualizados: ${usuariosActualizados}`);
    console.log(`   ⚪ Sin cambios: ${usuariosSinCambios}`);
    console.log(`   ❌ Errores: ${usuariosErrores}`);
    console.log(`   📋 Total: ${usuarios.length}\n`);

    console.log("📜 CERTIFICADOS:");
    console.log(`   ✅ Actualizados: ${certificadosActualizados}`);
    console.log(`   ⚪ Sin cambios: ${certificadosSinCambios}`);
    console.log(`   ❌ Errores: ${certificadosErrores}`);
    console.log(`   📋 Total: ${certificados.length}\n`);

    console.log("============================================\n");

    if (usuariosActualizados > 0 || certificadosActualizados > 0) {
      console.log("🎉 ¡Normalización completa exitosa!");
      console.log("💡 Todos los datos están ahora correctamente normalizados.\n");
    } else {
      console.log("ℹ️  No se encontraron datos que necesiten normalización.\n");
    }

  } catch (error) {
    console.error("\n❌ ERROR FATAL:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Conexión a MongoDB cerrada");
  }
}

// Ejecutar el script
corregirLetrasCompleto();
