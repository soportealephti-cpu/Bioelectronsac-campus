// Diagnóstico completo del flujo: examen → asignación → certificado → PDF
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');
const Certificate = require('./models/Certificate');
const Exam = require('./models/Exam');

async function diagnosticoCompleto() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Conectado a la base de datos\n');

    console.log('=== DIAGNÓSTICO COMPLETO DEL FLUJO ===\n');

    // 1. USUARIOS
    console.log('👥 USUARIOS:');
    const users = await User.find();
    users.forEach(user => {
      console.log(`  - ${user.nombre} ${user.apellido} (${user._id}) [${user.rol}]`);
    });
    console.log();

    // 2. CURSOS
    console.log('📚 CURSOS:');
    const courses = await Course.find();
    courses.forEach(course => {
      console.log(`  - ${course.titulo} (${course._id})`);
    });
    console.log();

    // 3. EXÁMENES
    console.log('📝 EXÁMENES:');
    const exams = await Exam.find().populate('courseId', 'titulo');
    exams.forEach(exam => {
      console.log(`  - ${exam.titulo} → ${exam.courseId?.titulo || 'Sin curso'} (${exam._id})`);
    });
    console.log();

    // 4. ASIGNACIONES (ASSIGNMENTS)
    console.log('📋 ASIGNACIONES:');
    const assignments = await Assignment.find()
      .populate('user', 'nombre apellido')
      .populate('course', 'titulo')
      .populate('lastExamId', 'titulo');
    
    assignments.forEach(assignment => {
      console.log(`  - Usuario: ${assignment.user?.nombre} ${assignment.user?.apellido}`);
      console.log(`    Curso: ${assignment.course?.titulo}`);
      console.log(`    Último examen: ${assignment.lastExamId?.titulo || 'Ninguno'}`);
      console.log(`    Puntaje: ${assignment.lastScore || 'N/A'}/${assignment.lastTotal || 'N/A'}`);
      console.log(`    Correctas: ${assignment.lastCorrect || 'N/A'}`);
      console.log(`    ✅ PASSED: ${assignment.passed ? 'SÍ' : 'NO'}`);
      console.log(`    ID: ${assignment._id}\n`);
    });

    // 5. CERTIFICADOS
    console.log('🏆 CERTIFICADOS:');
    const certificates = await Certificate.find()
      .populate('user', 'nombre apellido')
      .populate('course', 'titulo');
    
    certificates.forEach(cert => {
      console.log(`  - #${cert.number} → ${cert.user?.nombre} ${cert.user?.apellido}`);
      console.log(`    Curso: ${cert.course?.titulo}`);
      console.log(`    Estudiante guardado: ${cert.studentName}`);
      console.log(`    Título guardado: ${cert.courseTitle}`);
      console.log(`    Fecha: ${cert.emitDate?.toLocaleDateString()}`);
      console.log(`    ID: ${cert._id}\n`);
    });

    // 6. ANÁLISIS DE RELACIONES
    console.log('🔗 ANÁLISIS DE RELACIONES:');
    for (const user of users) {
      console.log(`\n👤 Usuario: ${user.nombre} ${user.apellido} (${user._id})`);
      
      // Asignaciones del usuario
      const userAssignments = assignments.filter(a => a.user?._id.toString() === user._id.toString());
      console.log(`   📋 Asignaciones: ${userAssignments.length}`);
      
      userAssignments.forEach(assignment => {
        console.log(`      → ${assignment.course?.titulo} (passed: ${assignment.passed})`);
      });
      
      // Certificados del usuario
      const userCertificates = certificates.filter(c => c.user?._id.toString() === user._id.toString());
      console.log(`   🏆 Certificados: ${userCertificates.length}`);
      
      userCertificates.forEach(cert => {
        console.log(`      → #${cert.number} - ${cert.course?.titulo}`);
      });

      // Verificar si hay asignaciones aprobadas sin certificado
      const approvedWithoutCert = userAssignments.filter(a => 
        a.passed && !userCertificates.some(c => c.course?._id.toString() === a.course?._id.toString())
      );
      
      if (approvedWithoutCert.length > 0) {
        console.log(`   ⚠️  PROBLEMA: ${approvedWithoutCert.length} asignaciones aprobadas SIN certificado:`);
        approvedWithoutCert.forEach(a => {
          console.log(`      → ${a.course?.titulo} (${a._id})`);
        });
      }
    }

    // 7. VERIFICAR ENDPOINTS DE PDF
    console.log('\n📄 VERIFICACIÓN DE PDFs:');
    for (const cert of certificates) {
      console.log(`   Testing PDF: http://localhost:5000/api/certificates/${cert._id}/pdf`);
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await mongoose.disconnect();
  }
}

diagnosticoCompleto();