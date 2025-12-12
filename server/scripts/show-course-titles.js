const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

async function showTitles() {
  await mongoose.connect(process.env.MONGO_URI);
  const cursos = await Course.find({});
  console.log('Total cursos:', cursos.length);
  console.log('\n=== TÍTULOS DE CURSOS ===\n');
  cursos.forEach((c, i) => {
    console.log(`${i+1}. "${c.titulo}" (${c.categoria || 'Sin categoría'})`);
  });
  await mongoose.disconnect();
}

showTitles();
