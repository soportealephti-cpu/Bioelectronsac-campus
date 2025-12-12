// server/scripts/restore-production-urls.js
/**
 * Script para restaurar las URLs de PDFs apuntando al servidor de producción
 * De esta forma, en local se pueden ver los PDFs sin necesidad de descargarlos
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

// Mapeo de cursos y sus PDFs originales
const coursePdfMapping = [
  // PROTECCIÓN RADIOLÓGICA EN RADIOLOGÍA DENTAL
  { titulo: /DENTAL.*TEMA 1.*CONCEPTOS/i, pdf: '1761672594650_1._conceptos_fundamentales.pdf' },
  { titulo: /DENTAL.*TEMA 2.*INTERACCI/i, pdf: '1761672668429_2._interaccion_de_los_rayos_x_con_la_materia.pdf' },
  { titulo: /DENTAL.*TEMA 3.*MAGNITUDES/i, pdf: '1761672761326_3._magnitudes_y_unidades_de_radiacion.pdf' },
  { titulo: /DENTAL.*TEMA 4.*MEDICI/i, pdf: '1761672837692_4._medicion_de_las_radiaciones.pdf' },
  { titulo: /DENTAL.*TEMA 5.*EFECTOS/i, pdf: '1761672885510_5._efectos_biologicos_de_las_radiaciones_ionizantes.pdf' },
  { titulo: /DENTAL.*TEMA 6.*RAYOS/i, pdf: '1761672935369_6._rayos_x.pdf' },
  { titulo: /DENTAL.*TEMA 7.*PROTECCION/i, pdf: '1761673003853_7._proteccion_radiologica_en_radiodiagnostico.pdf' },
  { titulo: /DENTAL.*TEMA 8.*NORMATIVA/i, pdf: '1761673043861_8._normativa_en_proteccion_radiologica_en_el_peru.pdf' },
  { titulo: /^PROTECCI.*N RADIOL.*GICA EN RADIOLOG.*A DENTAL.*EVALUACI.*N$/i, pdf: '1761676630453_evaluacion_online.pdf' },

  // PROTECCIÓN RADIOLÓGICA EN RADIODIAGNÓSTICO MÉDICO
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 1.*CONCEPTOS/i, pdf: '1763046851151_1._conceptos_fundamentales.pdf' },
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 2.*INTERACCI/i, pdf: '1763046885342_2._interaccion_de_los_rayos_x_con_la_materia.pdf' },
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 3.*MAGNITUDES/i, pdf: '1763046914773_3._magnitudes_y_unidades_de_radiacion.pdf' },
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 4.*MEDICI/i, pdf: '1763046941371_4._medicion_de_las_radiaciones.pdf' },
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 5.*EFECTOS/i, pdf: '1763046966219_5._efectos_biologicos_de_las_radiaciones_ionizantes.pdf' },
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 6.*RAYOS/i, pdf: '1763046987386_6._rayos_x.pdf' },
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 7.*PROTECCION/i, pdf: '1763047006022_7._proteccion_radiologica_en_radiodiagnostico.pdf' },
  { titulo: /RADIODIAGN.*STICO M.*DICO.*TEMA 8.*NORMATIVA/i, pdf: '1763047035035_8._normativa_en_proteccion_radiologica_en_el_peru.pdf' },
  { titulo: /^CURSO PROTECCI.*N RADIOL.*GICA EN RADIODIAGN.*STICO M.*DICO.*EVALUACI/i, pdf: '1763047068153_evaluacion_online.pdf' },

  // ACTUALIZACIÓN DE PROTECCIÓN RADIOLÓGICA EN RADIOLOGÍA DENTAL
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 1/i, pdf: '1763056415011_1._conceptos_fundamentales.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 2/i, pdf: '1763056439510_2.interaccion_de_los_rayos_x_con_la_materia.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 3/i, pdf: '1763056459748_3._magnitudes_y_unidades_de_radiacion.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 4/i, pdf: '1763056507003_4._medicion_de_las_radiaciones.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 5/i, pdf: '1763056522898_5._efectos_biologicos_de_las_radiaciones_ionizantes.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 6/i, pdf: '1763056546000_6._rayos_x.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 7/i, pdf: '1763056568196_7._proteccion_radiologica_en_radiodiagnostico.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*TEMA 8/i, pdf: '1763056579938_8._normativa_en_proteccion_radiologica_en_el_peru.pdf' },
  { titulo: /ACTUALIZACI.*N.*DENTAL.*EVALUACI.*N$/i, pdf: '1763056820770_evaluacion_online.pdf' },

  // ACTUALIZACIÓN DE PROTECCIÓN RADIOLÓGICA EN RADIODIAGNÓSTICO MÉDICO
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 1/i, pdf: '1763479761917_1._conceptos_fundamentales.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 2/i, pdf: '1763480044533_2._interaccion_de_los_rayos_x_con_la_materia.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 3/i, pdf: '1763480094452_3._magnitudes_y_unidades_de_radiacion.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 4/i, pdf: '1763480145070_4._medicion_de_las_radiaciones.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 5/i, pdf: '1763480206176_5._efectos_biologicos_de_las_radiaciones_ionizantes.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 6/i, pdf: '1763480243068_6._rayos_x.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 7/i, pdf: '1763480288902_7._proteccion_radiologica_en_radiodiagnostico.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*TEMA 8/i, pdf: '1763480336940_8._normativa_en_proteccion_radiologica_en_el_peru.pdf' },
  { titulo: /ACTUALIZACI.*N.*RADIODIAGN.*STICO M.*DICO.*EVALUACI.*N$/i, pdf: '1763480378851_evaluacion_online.pdf' },
];

async function restoreProductionUrls() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const cursos = await Course.find({});
    let restaurados = 0;
    let noEncontrados = 0;

    console.log('=== RESTAURANDO URLs DE PRODUCCIÓN ===\n');

    for (const curso of cursos) {
      const { titulo, categoria } = curso;
      const combinado = `${titulo} ${categoria || ''}`.toUpperCase();

      // Buscar coincidencia en el mapeo usando categoria
      const match = coursePdfMapping.find(mapping => mapping.titulo.test(combinado));

      if (match) {
        const productionUrl = `https://api.campus.bioelectronsac.com/uploads/cursos/${match.pdf}`;
        curso.pdfUrl = productionUrl;
        await curso.save();

        console.log(`✅ ${curso.titulo} (${curso.categoria})`);
        console.log(`   PDF: ${match.pdf}`);
        console.log(`   URL: ${productionUrl}\n`);
        restaurados++;
      } else {
        console.log(`⚠️  NO ENCONTRADO: ${curso.titulo} (${curso.categoria})`);
        noEncontrados++;
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Total de cursos: ${cursos.length}`);
    console.log(`URLs restauradas: ${restaurados}`);
    console.log(`No encontrados: ${noEncontrados}`);
    console.log('\n✅ Ahora los PDFs se cargarán desde el servidor de producción');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  restoreProductionUrls();
}

module.exports = { restoreProductionUrls };
