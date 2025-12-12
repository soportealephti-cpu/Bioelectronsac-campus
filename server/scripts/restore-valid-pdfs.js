// server/scripts/restore-valid-pdfs.js
/**
 * Script para restaurar las URLs de los PDFs que SÍ existen en el servidor
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const { generateFileUrl } = require('../utils/urlHelper');
require('dotenv').config();

async function restoreValidPdfs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const cursosDir = path.join(__dirname, '..', 'uploads', 'cursos');

    // Obtener lista de PDFs disponibles en el disco
    const availablePdfs = fs.readdirSync(cursosDir)
      .filter(file => file.endsWith('.pdf'));

    console.log(`📁 PDFs disponibles en disco: ${availablePdfs.length}\n`);
    availablePdfs.forEach(pdf => console.log(`   - ${pdf}`));
    console.log('');

    // Obtener todos los cursos
    const cursos = await Course.find({});

    let restaurados = 0;

    console.log('=== RESTAURANDO URLs DE PDFs VÁLIDOS ===\n');

    // Para cada PDF disponible, buscar cursos que podrían usarlo
    for (const pdfFile of availablePdfs) {
      // Buscar cursos sin pdfUrl o con pdfUrl que coincida con este archivo
      const cursosParaActualizar = cursos.filter(curso => {
        if (!curso.pdfUrl) return true; // Sin URL, posible candidato
        const urlFilename = curso.pdfUrl.split('/').pop();
        return urlFilename === pdfFile;
      });

      if (cursosParaActualizar.length > 0) {
        // Tomar el primer curso que coincida
        const curso = cursosParaActualizar[0];
        const newUrl = generateFileUrl(`/uploads/cursos/${pdfFile}`);

        curso.pdfUrl = newUrl;
        await curso.save();

        console.log(`✅ ${curso.titulo}`);
        console.log(`   PDF: ${pdfFile}`);
        console.log(`   URL: ${newUrl}\n`);
        restaurados++;
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`PDFs en disco: ${availablePdfs.length}`);
    console.log(`Cursos restaurados: ${restaurados}`);
    console.log(`Cursos sin PDF: ${cursos.length - restaurados}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  restoreValidPdfs();
}

module.exports = { restoreValidPdfs };
