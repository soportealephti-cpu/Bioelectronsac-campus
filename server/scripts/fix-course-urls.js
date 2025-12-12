/**
 * Script para actualizar las URLs de los cursos según el entorno
 *
 * Reemplaza URLs de producción por URLs de desarrollo (o viceversa)
 * para que los PDFs e imágenes se carguen correctamente
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const MONGO_URI = process.env.MONGO_URI;

// URLs a buscar y reemplazar
const PRODUCTION_URL = 'https://api.campus.bioelectronsac.com';
const LOCAL_URL = 'http://localhost:5000';

async function fixCourseUrls(targetEnv = 'development') {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Determinar qué URLs buscar y reemplazar
    let searchUrl, replaceUrl;
    if (targetEnv === 'development') {
      searchUrl = PRODUCTION_URL;
      replaceUrl = LOCAL_URL;
      console.log(`📝 Cambiando URLs de PRODUCCIÓN a DESARROLLO`);
    } else {
      searchUrl = LOCAL_URL;
      replaceUrl = PRODUCTION_URL;
      console.log(`📝 Cambiando URLs de DESARROLLO a PRODUCCIÓN`);
    }

    console.log(`   De: ${searchUrl}`);
    console.log(`   A:  ${replaceUrl}\n`);

    // Obtener todos los cursos
    const cursos = await Course.find();
    console.log(`📚 Total de cursos encontrados: ${cursos.length}\n`);

    let actualizados = 0;
    let sinCambios = 0;

    for (const curso of cursos) {
      let cambios = false;

      // Actualizar pdfUrl si contiene la URL a buscar
      if (curso.pdfUrl && curso.pdfUrl.includes(searchUrl)) {
        curso.pdfUrl = curso.pdfUrl.replace(searchUrl, replaceUrl);
        cambios = true;
      }

      // Actualizar imagenUrl si contiene la URL a buscar
      if (curso.imagenUrl && curso.imagenUrl.includes(searchUrl)) {
        curso.imagenUrl = curso.imagenUrl.replace(searchUrl, replaceUrl);
        cambios = true;
      }

      if (cambios) {
        await curso.save();
        actualizados++;
        console.log(`✅ Actualizado: ${curso.titulo}`);
        if (curso.pdfUrl) console.log(`   PDF: ${curso.pdfUrl}`);
        if (curso.imagenUrl) console.log(`   Imagen: ${curso.imagenUrl}`);
      } else {
        sinCambios++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Cursos actualizados: ${actualizados}`);
    console.log(`   ⚪ Cursos sin cambios: ${sinCambios}`);
    console.log(`   📚 Total: ${cursos.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Obtener el argumento de línea de comandos
const targetEnv = process.argv[2] || 'development';

if (!['development', 'production'].includes(targetEnv)) {
  console.error('❌ Argumento inválido. Usa: development o production');
  process.exit(1);
}

fixCourseUrls(targetEnv);
