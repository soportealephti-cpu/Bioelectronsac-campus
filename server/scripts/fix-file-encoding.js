// server/scripts/fix-file-encoding.js
/**
 * Script para renombrar archivos con caracteres especiales mal codificados
 * y actualizar las referencias en la base de datos
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

// Función para normalizar nombres de archivos
function normalizeFilename(filename) {
  return filename
    .normalize("NFD") // Descomponer caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Eliminar marcas diacríticas (acentos)
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Reemplazar caracteres no alfanuméricos por _
    .replace(/_{2,}/g, "_") // Reemplazar múltiples _ por uno solo
    .toLowerCase();
}

async function fixFileEncoding() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const cursosDir = path.join(__dirname, '..', 'uploads', 'cursos');

    // Verificar que el directorio existe
    if (!fs.existsSync(cursosDir)) {
      console.log('❌ El directorio de cursos no existe');
      return;
    }

    // Leer todos los archivos del directorio
    const files = fs.readdirSync(cursosDir);
    console.log(`📁 Encontrados ${files.length} archivos en el directorio`);

    let renombrados = 0;
    let errores = 0;

    for (const file of files) {
      try {
        const normalizedFile = normalizeFilename(file);

        // Si el nombre ya está normalizado, continuar
        if (file === normalizedFile) {
          continue;
        }

        const oldPath = path.join(cursosDir, file);
        const newPath = path.join(cursosDir, normalizedFile);

        // Verificar que el archivo nuevo no exista
        if (fs.existsSync(newPath)) {
          console.log(`⚠️  El archivo normalizado ya existe: ${normalizedFile}`);
          continue;
        }

        // Renombrar el archivo
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renombrado: ${file} -> ${normalizedFile}`);

        // Actualizar referencias en la base de datos
        // Buscar y actualizar cursos que usen este archivo como PDF
        const cursosPdfActualizados = await Course.updateMany(
          { pdfUrl: { $regex: file, $options: 'i' } },
          { $set: { pdfUrl: `/uploads/cursos/${normalizedFile}` } }
        );

        // Buscar y actualizar cursos que usen este archivo como imagen
        const cursosImagenActualizados = await Course.updateMany(
          { imagenUrl: { $regex: file, $options: 'i' } },
          { $set: { imagenUrl: `/uploads/cursos/${normalizedFile}` } }
        );

        const totalActualizados = cursosPdfActualizados.modifiedCount + cursosImagenActualizados.modifiedCount;
        if (totalActualizados > 0) {
          console.log(`   📝 Actualizados ${totalActualizados} cursos en la BD (PDF: ${cursosPdfActualizados.modifiedCount}, Imagen: ${cursosImagenActualizados.modifiedCount})`);
        }

        renombrados++;
      } catch (error) {
        console.error(`❌ Error procesando ${file}:`, error.message);
        errores++;
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`✅ Archivos renombrados: ${renombrados}`);
    console.log(`❌ Errores: ${errores}`);

  } catch (error) {
    console.error('❌ Error en el script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar el script
if (require.main === module) {
  fixFileEncoding();
}

module.exports = { normalizeFilename, fixFileEncoding };
