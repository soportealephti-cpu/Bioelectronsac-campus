const User = require("../models/User");
const Course = require("../models/Course");
const Certificate = require("../models/Certificate");
const Assignment = require("../models/Assignment");
const XLSX = require('xlsx');

const getDashboardStats = async (req, res) => {
  try {
    // Obtener conteos totales
    const totalUsers = await User.countDocuments({ rol: "user" });
    const totalCourses = await Course.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    
    // Estadísticas por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Obtener datos mensuales de usuarios registrados
    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          rol: "user"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Obtener datos mensuales de certificados emitidos
    const certificatesByMonth = await Certificate.aggregate([
      {
        $match: {
          emitDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$emitDate" },
            month: { $month: "$emitDate" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Obtener datos mensuales de asignaciones de cursos
    const assignmentsByMonth = await Assignment.aggregate([
      {
        $match: {
          assignedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$assignedAt" },
            month: { $month: "$assignedAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Función para obtener nombre del mes en español
    const getMonthName = (month) => {
      const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      return months[month - 1];
    };

    // Crear array de los últimos 6 meses
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const usersCount = usersByMonth.find(u => u._id.year === year && u._id.month === month)?.count || 0;
      const certificatesCount = certificatesByMonth.find(c => c._id.year === year && c._id.month === month)?.count || 0;
      const assignmentsCount = assignmentsByMonth.find(a => a._id.year === year && a._id.month === month)?.count || 0;
      
      monthlyData.push({
        month: getMonthName(month),
        year: year,
        users: usersCount,
        certificates: certificatesCount,
        assignments: assignmentsCount
      });
    }

    // Obtener cursos más populares
    const popularCourses = await Assignment.aggregate([
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseData"
        }
      },
      {
        $unwind: "$courseData"
      },
      {
        $group: {
          _id: "$course",
          courseName: { $first: "$courseData.titulo" },
          assignmentCount: { $sum: 1 },
          approvedCount: { $sum: { $cond: ["$aprobado", 1, 0] } }
        }
      },
      {
        $sort: { assignmentCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      totals: {
        users: totalUsers,
        courses: totalCourses,
        certificates: totalCertificates,
        assignments: totalAssignments
      },
      monthlyProgress: monthlyData,
      popularCourses: popularCourses
    });

  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ error: "Error obteniendo estadísticas del dashboard" });
  }
};

const importFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se proporcionó archivo Excel" });
    }

    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames;
    
    let importResults = {
      users: { created: 0, updated: 0, errors: 0 },
      courses: { created: 0, updated: 0, errors: 0 },
      assignments: { created: 0, updated: 0, errors: 0 },
      certificates: { created: 0, updated: 0, errors: 0 }
    };

    console.log("Hojas encontradas en el Excel:", sheets);

    // Procesar hoja de Usuarios
    if (sheets.includes('Usuarios')) {
      const usersSheet = workbook.Sheets['Usuarios'];
      const usersData = XLSX.utils.sheet_to_json(usersSheet);
      
      for (const userData of usersData) {
        try {
          if (!userData['Correo'] || !userData['Nombre']) continue;
          
          const existingUser = await User.findOne({ correo: userData['Correo'] });
          
          const userObj = {
            nombre: userData['Nombre'] || '',
            apellido: userData['Apellido'] || '',
            dni: userData['DNI'] || '',
            correo: userData['Correo'],
            celular: userData['Celular'] || '',
            rol: userData['Rol'] || 'user'
          };

          if (existingUser) {
            await User.findByIdAndUpdate(existingUser._id, userObj);
            importResults.users.updated++;
          } else {
            // Para nuevos usuarios, generar una contraseña temporal
            userObj.password = require('bcryptjs').hashSync('123456', 10);
            await User.create(userObj);
            importResults.users.created++;
          }
        } catch (error) {
          console.error("Error procesando usuario:", error);
          importResults.users.errors++;
        }
      }
    }

    // Procesar hoja de Cursos
    if (sheets.includes('Cursos')) {
      const coursesSheet = workbook.Sheets['Cursos'];
      const coursesData = XLSX.utils.sheet_to_json(coursesSheet);
      
      for (const courseData of coursesData) {
        try {
          if (!courseData['Título']) continue;
          
          const existingCourse = await Course.findOne({ titulo: courseData['Título'] });
          
          const courseObj = {
            titulo: courseData['Título'],
            categoria: courseData['Categoría'] || '',
            pdfUrl: courseData['URL del PDF'] || ''
            // No importamos imagenUrl para evitar problemas con archivos
          };

          if (existingCourse) {
            await Course.findByIdAndUpdate(existingCourse._id, courseObj);
            importResults.courses.updated++;
          } else {
            await Course.create(courseObj);
            importResults.courses.created++;
          }
        } catch (error) {
          console.error("Error procesando curso:", error);
          importResults.courses.errors++;
        }
      }
    }

    // Procesar Asignaciones (solo crear nuevas, no actualizar)
    if (sheets.includes('Asignaciones')) {
      const assignmentsSheet = workbook.Sheets['Asignaciones'];
      const assignmentsData = XLSX.utils.sheet_to_json(assignmentsSheet);
      
      for (const assignmentData of assignmentsData) {
        try {
          if (!assignmentData['Correo Usuario'] || !assignmentData['Curso']) continue;
          
          const user = await User.findOne({ correo: assignmentData['Correo Usuario'] });
          const course = await Course.findOne({ titulo: assignmentData['Curso'] });
          
          if (!user || !course) continue;
          
          // Verificar si ya existe la asignación
          const existingAssignment = await Assignment.findOne({ user: user._id, course: course._id });
          if (existingAssignment) continue;
          
          const assignmentObj = {
            user: user._id,
            course: course._id,
            active: assignmentData['Estado'] === 'Activo',
            aprobado: assignmentData['Aprobado'] === 'Sí',
            intentos: parseInt(assignmentData['Intentos']) || 0,
            ultimoResultado: assignmentData['Último Resultado'] || '-',
            lastScore: assignmentData['Puntaje Final'] && assignmentData['Puntaje Final'] !== '-' ? parseInt(assignmentData['Puntaje Final']) : undefined,
            assignedAt: assignmentData['Fecha de Asignación'] ? new Date(assignmentData['Fecha de Asignación']) : new Date()
          };

          await Assignment.create(assignmentObj);
          importResults.assignments.created++;
        } catch (error) {
          console.error("Error procesando asignación:", error);
          importResults.assignments.errors++;
        }
      }
    }

    res.json({
      mensaje: "Importación completada",
      resultados: importResults,
      totalProcesado: Object.values(importResults).reduce((total, item) => 
        total + item.created + item.updated + item.errors, 0)
    });

  } catch (error) {
    console.error("Error importing from Excel:", error);
    res.status(500).json({ mensaje: "Error procesando archivo Excel", error: error.message });
  }
};

const exportToExcel = async (req, res) => {
  try {
    // Obtener todos los datos de las tablas
    const users = await User.find().select('-password').lean();
    const courses = await Course.find().lean();
    const assignments = await Assignment.find().populate('user', 'nombre apellido correo').populate('course', 'titulo categoria').lean();
    const certificates = await Certificate.find().populate('user', 'nombre apellido correo').populate('course', 'titulo categoria').lean();

    // Formatear datos de usuarios
    const usersData = users.map(user => ({
      'ID': user._id.toString(),
      'Nombre': user.nombre || '',
      'Apellido': user.apellido || '',
      'DNI': user.dni || '',
      'Correo': user.correo || '',
      'Celular': user.celular || '',
      'Rol': user.rol || '',
      'Fecha de Registro': user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : '',
      'Última Actualización': user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('es-ES') : ''
    }));

    // Formatear datos de cursos
    const coursesData = courses.map(course => ({
      'ID': course._id.toString(),
      'Título': course.titulo || '',
      'Categoría': course.categoria || '',
      'URL del PDF': course.pdfUrl || '',
      'URL de Imagen': course.imagenUrl || '',
      'Fecha de Creación': course.createdAt ? new Date(course.createdAt).toLocaleDateString('es-ES') : '',
      'Última Actualización': course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('es-ES') : ''
    }));

    // Formatear datos de asignaciones
    const assignmentsData = assignments.map(assignment => ({
      'ID': assignment._id.toString(),
      'Usuario': assignment.user ? `${assignment.user.nombre} ${assignment.user.apellido}`.trim() : 'Usuario eliminado',
      'Correo Usuario': assignment.user ? assignment.user.correo : '',
      'Curso': assignment.course ? assignment.course.titulo : 'Curso eliminado',
      'Categoría': assignment.course ? assignment.course.categoria : '',
      'Estado': assignment.active ? 'Activo' : 'Inactivo',
      'Aprobado': assignment.aprobado ? 'Sí' : 'No',
      'Intentos': assignment.intentos || 0,
      'Último Resultado': assignment.ultimoResultado || '-',
      'Puntaje Final': assignment.lastScore || '-',
      'Total Preguntas': assignment.lastTotal || '-',
      'Respuestas Correctas': assignment.lastCorrect || '-',
      'Fecha de Asignación': assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString('es-ES') : '',
      'Fecha de Vencimiento': assignment.expiresAt ? new Date(assignment.expiresAt).toLocaleDateString('es-ES') : 'Sin vencimiento'
    }));

    // Formatear datos de certificados
    const certificatesData = certificates.map(certificate => ({
      'ID': certificate._id.toString(),
      'Número de Certificado': certificate.number || '',
      'Usuario': certificate.user ? `${certificate.user.nombre} ${certificate.user.apellido}`.trim() : certificate.studentName || 'Usuario eliminado',
      'Correo Usuario': certificate.user ? certificate.user.correo : '',
      'Curso': certificate.course ? certificate.course.titulo : certificate.courseTitle || 'Curso eliminado',
      'Categoría': certificate.course ? certificate.course.categoria : '',
      'Horas': certificate.hours || 0,
      'Fecha de Emisión': certificate.emitDate ? new Date(certificate.emitDate).toLocaleDateString('es-ES') : '',
      'Texto de Fecha': certificate.dateText || '',
      'Nombre del Gerente': certificate.managerName || '',
      'URL Background': certificate.backgroundUrlUsed || '',
      'URL Firma': certificate.firmaUrlUsed || ''
    }));


    // Crear libro de Excel
    const workbook = XLSX.utils.book_new();

    // Crear hojas
    const usersSheet = XLSX.utils.json_to_sheet(usersData);
    const coursesSheet = XLSX.utils.json_to_sheet(coursesData);
    const assignmentsSheet = XLSX.utils.json_to_sheet(assignmentsData);
    const certificatesSheet = XLSX.utils.json_to_sheet(certificatesData);

    // Agregar hojas al libro
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Usuarios');
    XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Cursos');
    XLSX.utils.book_append_sheet(workbook, assignmentsSheet, 'Asignaciones');
    XLSX.utils.book_append_sheet(workbook, certificatesSheet, 'Certificados');

    // Crear resumen estadístico
    const summaryData = [
      { 'Tabla': 'Usuarios', 'Total de Registros': users.length },
      { 'Tabla': 'Cursos', 'Total de Registros': courses.length },
      { 'Tabla': 'Asignaciones', 'Total de Registros': assignments.length },
      { 'Tabla': 'Certificados', 'Total de Registros': certificates.length },
      { 'Tabla': 'TOTAL', 'Total de Registros': users.length + courses.length + assignments.length + certificates.length }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen', 0); // Poner como primera hoja

    // Generar buffer del archivo
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers para descarga
    const fileName = `backup_biocursos_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);

  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ error: "Error generando archivo Excel" });
  }
};

module.exports = {
  getDashboardStats,
  exportToExcel,
  importFromExcel
};