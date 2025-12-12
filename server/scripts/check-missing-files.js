// server/scripts/check-missing-files.js
/**
 * Script para verificar qué archivos de cursos existen en la BD pero no en el servidor
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

async function checkMissingFiles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const cursosDir = path.join(__dirname, '..', 'uploads', 'cursos');
    const cursos = await Course.find({});

    let totalCursos = 0;
    let cursosConPdfFaltante = 0;
    let cursosConImagenFaltante = 0;

    console.log('=== DIAGNÓSTICO DE ARCHIVOS FALTANTES ===\n');

    for (const curso of cursos) {
      totalCursos++;
      let tieneProblemaPdf = false;
      let tieneProblemaImagen = false;

      // Verificar PDF
      if (curso.pdfUrl) {
        // Extraer el nombre del archivo de la URL
        const pdfFilename = curso.pdfUrl.split('/').pop();
        const pdfPath = path.join(cursosDir, pdfFilename);

        if (!fs.existsSync(pdfPath)) {
          tieneProblemaPdf = true;
          cursosConPdfFaltante++;
        }
      }

      // Verificar imagen
      if (curso.imagenUrl) {
        const imgFilename = curso.imagenUrl.split('/').pop();
        const imgPath = path.join(cursosDir, imgFilename);

        if (!fs.existsSync(imgPath)) {
          tieneProblemaImagen = true;
          cursosConImagenFaltante++;
        }
      }

      // Mostrar cursos con problemas
      if (tieneProblemaPdf || tieneProblemaImagen) {
        console.log(`❌ CURSO: ${curso.titulo}`);
        console.log(`   ID: ${curso._id}`);

        if (tieneProblemaPdf) {
          console.log(`   ⚠️  PDF FALTANTE: ${curso.pdfUrl}`);
        }

        if (tieneProblemaImagen) {
          console.log(`   ⚠️  IMAGEN FALTANTE: ${curso.imagenUrl}`);
        }

        console.log('');
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Total de cursos en BD: ${totalCursos}`);
    console.log(`Cursos con PDF faltante: ${cursosConPdfFaltante}`);
    console.log(`Cursos con imagen faltante: ${cursosConImagenFaltante}`);

    if (cursosConPdfFaltante > 0 || cursosConImagenFaltante > 0) {
      console.log('\n⚠️  ACCIÓN REQUERIDA:');
      console.log('Debes volver a subir los archivos faltantes desde el panel de administración.');
      console.log('Los nuevos archivos se guardarán con nombres normalizados (sin acentos ni caracteres especiales).');
    } else {
      console.log('\n✅ Todos los archivos están presentes en el servidor.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  checkMissingFiles();
}

module.exports = { checkMissingFiles };
