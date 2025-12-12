// server/scripts/update-db-urls.js
/**
 * Script para actualizar las URLs en la base de datos después de renombrar archivos
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

async function updateDatabaseUrls() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Mapeo de URLs antiguas a nuevas
    const urlMappings = [
      {
        old: '1756228436951_tema_2_-_interacciãn_de_los_rayos_x_con_la_materia.pdf',
        new: '1756228436951_tema_2_-_interaccia_n_de_los_rayos_x_con_la_materia.pdf'
      },
      {
        old: '1757042885894_dentro_de_una_cueva_nevada_donde_hay_cristales_de_hielo_azules_,estilo_anime.jpg',
        new: '1757042885894_dentro_de_una_cueva_nevada_donde_hay_cristales_de_hielo_azules_estilo_anime.jpg'
      },
      {
        old: '1757043166613_quiero_que_me_genres_un_bosque_nevado_estilo_anime_(2).jpg',
        new: '1757043166613_quiero_que_me_genres_un_bosque_nevado_estilo_anime_2_.jpg'
      }
    ];

    let totalActualizados = 0;

    for (const mapping of urlMappings) {
      // Actualizar PDFs
      const pdfUpdated = await Course.updateMany(
        { pdfUrl: { $regex: mapping.old, $options: 'i' } },
        [
          {
            $set: {
              pdfUrl: {
                $replaceOne: {
                  input: "$pdfUrl",
                  find: mapping.old,
                  replacement: mapping.new
                }
              }
            }
          }
        ]
      );

      // Actualizar imágenes
      const imgUpdated = await Course.updateMany(
        { imagenUrl: { $regex: mapping.old, $options: 'i' } },
        [
          {
            $set: {
              imagenUrl: {
                $replaceOne: {
                  input: "$imagenUrl",
                  find: mapping.old,
                  replacement: mapping.new
                }
              }
            }
          }
        ]
      );

      const count = pdfUpdated.modifiedCount + imgUpdated.modifiedCount;
      if (count > 0) {
        console.log(`✅ Actualizado: ${mapping.old} -> ${mapping.new} (${count} documentos)`);
        totalActualizados += count;
      }
    }

    console.log(`\n✅ Total de documentos actualizados: ${totalActualizados}`);

    // Mostrar todos los cursos con sus URLs
    const cursos = await Course.find({}, { titulo: 1, pdfUrl: 1, imagenUrl: 1 });
    console.log('\n=== URLs DE CURSOS ===');
    cursos.forEach(curso => {
      console.log(`\n📚 ${curso.titulo}`);
      if (curso.pdfUrl) console.log(`   PDF: ${curso.pdfUrl}`);
      if (curso.imagenUrl) console.log(`   IMG: ${curso.imagenUrl}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  updateDatabaseUrls();
}

module.exports = { updateDatabaseUrls };
