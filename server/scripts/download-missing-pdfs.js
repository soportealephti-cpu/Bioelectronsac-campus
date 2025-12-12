// server/scripts/download-missing-pdfs.js
/**
 * Script para descargar PDFs faltantes desde el servidor de producción
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

// Función para descargar un archivo
function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destinationPath);
    const protocol = url.startsWith('https:') ? https : http;

    const request = protocol.get(url, (response) => {
      // Verificar si la respuesta es exitosa (código 200)
      if (response.statusCode !== 200) {
        fs.unlinkSync(destinationPath); // Eliminar archivo parcial
        reject(new Error(`Error ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlinkSync(destinationPath); // Eliminar archivo parcial
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlinkSync(destinationPath);
      reject(err);
    });
  });
}

async function downloadMissingPdfs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const cursosDir = path.join(__dirname, '..', 'uploads', 'cursos');

    // Asegurar que existe el directorio
    if (!fs.existsSync(cursosDir)) {
      fs.mkdirSync(cursosDir, { recursive: true });
    }

    const cursos = await Course.find({});

    let totalDescargados = 0;
    let totalFallidos = 0;
    let totalYaExisten = 0;

    console.log('=== DESCARGANDO PDFs FALTANTES ===\n');

    for (const curso of cursos) {
      if (!curso.pdfUrl) {
        console.log(`⚠️  ${curso.titulo} - No tiene URL de PDF\n`);
        continue;
      }

      // Extraer el nombre del archivo de la URL
      const pdfFilename = curso.pdfUrl.split('/').pop();
      const pdfPath = path.join(cursosDir, pdfFilename);

      // Verificar si el archivo ya existe
      if (fs.existsSync(pdfPath)) {
        console.log(`✓ ${curso.titulo} - PDF ya existe: ${pdfFilename}`);
        totalYaExisten++;
        continue;
      }

      // Intentar descargar el PDF
      console.log(`⬇️  Descargando: ${curso.titulo}`);
      console.log(`   URL: ${curso.pdfUrl}`);

      try {
        await downloadFile(curso.pdfUrl, pdfPath);

        // Verificar que el archivo se descargó correctamente
        const stats = fs.statSync(pdfPath);
        if (stats.size > 0) {
          console.log(`   ✅ Descargado (${(stats.size / 1024).toFixed(2)} KB)\n`);
          totalDescargados++;
        } else {
          console.log(`   ❌ Archivo vacío\n`);
          fs.unlinkSync(pdfPath);
          totalFallidos++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        totalFallidos++;
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Total de cursos: ${cursos.length}`);
    console.log(`PDFs ya existentes: ${totalYaExisten}`);
    console.log(`PDFs descargados: ${totalDescargados}`);
    console.log(`PDFs fallidos: ${totalFallidos}`);

    if (totalFallidos > 0) {
      console.log('\n⚠️  NOTA:');
      console.log('Los PDFs que fallaron no están disponibles en el servidor de producción.');
      console.log('Deberás volver a subirlos manualmente desde el panel de administración.');
    }

    if (totalDescargados > 0) {
      console.log('\n✅ ¡PDFs descargados exitosamente!');
      console.log('Los archivos están ahora disponibles en tu servidor local.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  downloadMissingPdfs();
}

module.exports = { downloadMissingPdfs };
