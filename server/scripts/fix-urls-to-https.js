/**
 * Script para migrar URLs HTTP a HTTPS en la base de datos
 *
 * Uso: node scripts/fix-urls-to-https.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Course = require('../models/Course');
const User = require('../models/User');
const Certificate = require('../models/Certificate');

async function migrateUrls() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bioelectronCursosDB';
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    let totalUpdated = 0;

    // 1. Migrar URLs en Cursos (Course)
    console.log('📚 Migrando URLs en Cursos...');
    const courses = await Course.find({
      $or: [
        { pdfUrl: /^http:\/\// },
        { imagenUrl: /^http:\/\// }
      ]
    });

    console.log(`   Encontrados ${courses.length} cursos con URLs HTTP`);

    for (const course of courses) {
      let updated = false;

      if (course.pdfUrl && course.pdfUrl.startsWith('http://')) {
        course.pdfUrl = course.pdfUrl.replace('http://', 'https://');
        updated = true;
      }

      if (course.imagenUrl && course.imagenUrl.startsWith('http://')) {
        course.imagenUrl = course.imagenUrl.replace('http://', 'https://');
        updated = true;
      }

      if (updated) {
        await course.save();
        totalUpdated++;
        console.log(`   ✓ Actualizado curso: ${course.titulo}`);
      }
    }

    // 2. Migrar URLs en Usuarios (si tienen fotos de perfil)
    console.log('\n👥 Migrando URLs en Usuarios...');
    const users = await User.find({
      $or: [
        { foto: /^http:\/\// },
        { avatar: /^http:\/\// }
      ]
    });

    console.log(`   Encontrados ${users.length} usuarios con URLs HTTP`);

    for (const user of users) {
      let updated = false;

      if (user.foto && user.foto.startsWith('http://')) {
        user.foto = user.foto.replace('http://', 'https://');
        updated = true;
      }

      if (user.avatar && user.avatar.startsWith('http://')) {
        user.avatar = user.avatar.replace('http://', 'https://');
        updated = true;
      }

      if (updated) {
        await user.save();
        totalUpdated++;
        console.log(`   ✓ Actualizado usuario: ${user.nombre}`);
      }
    }

    // 3. Migrar URLs en Certificados (Certificate)
    console.log('\n🎓 Migrando URLs en Certificados...');
    const certificates = await Certificate.find({
      certificateUrl: /^http:\/\//
    });

    console.log(`   Encontrados ${certificates.length} certificados con URLs HTTP`);

    for (const cert of certificates) {
      if (cert.certificateUrl && cert.certificateUrl.startsWith('http://')) {
        cert.certificateUrl = cert.certificateUrl.replace('http://', 'https://');
        await cert.save();
        totalUpdated++;
        console.log(`   ✓ Actualizado certificado: ${cert._id}`);
      }
    }

    console.log(`\n✅ Migración completada!`);
    console.log(`📊 Total de registros actualizados: ${totalUpdated}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar migración
console.log('🚀 Iniciando migración de URLs HTTP → HTTPS\n');
migrateUrls();
