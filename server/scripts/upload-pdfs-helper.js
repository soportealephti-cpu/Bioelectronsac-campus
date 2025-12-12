// server/scripts/upload-pdfs-helper.js
/**
 * Script para ayudar a re-subir PDFs masivamente
 * Genera un reporte de qué archivos necesitas volver a subir
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

async function generateUploadReport() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const cursos = await Course.find({}).sort({ titulo: 1, categoria: 1 });

    console.log('=== REPORTE DE PDFs FALTANTES ===\n');
    console.log('📋 Necesitas volver a subir estos archivos desde el panel de administración:\n');

    let contador = 0;
    const agrupados = {};

    cursos.forEach(curso => {
      const moduloNombre = curso.modulo || 'Sin módulo';
      if (!agrupados[moduloNombre]) {
        agrupados[moduloNombre] = [];
      }
      agrupados[moduloNombre].push(curso);
    });

    for (const [modulo, cursosList] of Object.entries(agrupados)) {
      console.log(`\n📁 MÓDULO: ${modulo}`);
      console.log('─'.repeat(80));

      cursosList.forEach(curso => {
        contador++;
        const pdfFilename = curso.pdfUrl ? curso.pdfUrl.split('/').pop() : '(sin URL)';

        console.log(`\n${contador}. ${curso.titulo}`);
        console.log(`   Categoría: ${curso.categoria}`);
        console.log(`   ID: ${curso._id}`);
        console.log(`   Archivo actual: ${pdfFilename}`);
        console.log(`   Acción: Editar curso y subir PDF`);
      });
    }

    console.log('\n\n=== RESUMEN ===');
    console.log(`Total de cursos: ${cursos.length}`);
    console.log(`\n📝 PASOS PARA RESOLVER:`);
    console.log('1. Inicia el servidor: cd server && npm start');
    console.log('2. Inicia el cliente: cd client && npm start');
    console.log('3. Ve a: http://localhost:3000 e inicia sesión como admin');
    console.log('4. Navega a la sección "Cursos"');
    console.log('5. Para cada curso, haz clic en "Editar"');
    console.log('6. Sube el archivo PDF correspondiente');
    console.log('7. Guarda los cambios');
    console.log('\n✅ Los nuevos archivos se subirán correctamente y serán accesibles en red.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  generateUploadReport();
}

module.exports = { generateUploadReport };
