// server/scripts/clean-missing-pdfs.js
/**
 * Script para limpiar referencias a PDFs que no existen en el servidor
 * Marca las URLs como vacías para que el sistema maneje el error correctamente
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

async function cleanMissingPdfs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const cursosDir = path.join(__dirname, '..', 'uploads', 'cursos');
    const cursos = await Course.find({});

    let actualizados = 0;
    let conPdfValido = 0;

    console.log('=== LIMPIEZA DE PDFs FALTANTES ===\n');

    for (const curso of cursos) {
      if (!curso.pdfUrl) {
        console.log(`⚠️  ${curso.titulo} - Sin PDF asignado`);
        continue;
      }

      // Extraer el nombre del archivo de la URL
      const pdfFilename = curso.pdfUrl.split('/').pop();
      const pdfPath = path.join(cursosDir, pdfFilename);

      if (!fs.existsSync(pdfPath)) {
        console.log(`❌ ${curso.titulo}`);
        console.log(`   PDF Faltante: ${pdfFilename}`);
        console.log(`   Acción: Marcando pdfUrl como vacío\n`);

        // Limpiar la URL del PDF faltante
        curso.pdfUrl = '';
        await curso.save();
        actualizados++;
      } else {
        conPdfValido++;
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Total de cursos: ${cursos.length}`);
    console.log(`Cursos con PDF válido: ${conPdfValido}`);
    console.log(`Cursos actualizados (PDF limpiado): ${actualizados}`);
    console.log(`\n⚠️  IMPORTANTE: Los cursos sin PDF ahora tienen pdfUrl vacío.`);
    console.log(`Necesitas volver a subir los PDFs desde el panel de administración.\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  cleanMissingPdfs();
}

module.exports = { cleanMissingPdfs };
