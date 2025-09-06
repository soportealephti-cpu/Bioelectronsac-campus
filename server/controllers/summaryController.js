// server/controllers/summaryController.js
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const Course = require("../models/Course");
const Exam = require("../models/Exam");
const Certificate = require("../models/Certificate");
const CertificateTemplate = require("../models/CertificateTemplate");

/** Util: asegura que el template esté en el año en curso (reinicia secuencia si cambió de año) */
function ensureTemplateYear(tpl, year) {
  if (tpl.year !== year) {
    tpl.year = year;
    tpl.lastSeq = 0;
  }
  return tpl;
}

// helpers para campos requeridos por el Certificate
function fechaLarga(iso) {
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const d = iso ? new Date(iso) : new Date();
  return `Lima, ${String(d.getDate()).padStart(2, "0")} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}
function horasPorCurso(titulo = "") {
  const t = String(titulo).toLowerCase();
  if (t.includes("actualización")) return 5;
  if (t.includes("oficial de protección radiológica")) return 50;
  return 20;
}

/** GET /api/summary  -> filas para la tabla de Resumen */
exports.getSummary = async (_req, res) => {
  try {
    const asignaciones = await Assignment.find({})
      .populate({ path: "user", select: "nombre apellido correo" })
      .populate({ path: "course", select: "titulo" })
      .sort({ createdAt: -1 });

    // Traer exámenes mapeados por courseId (si usas 1 examen por curso)
    const exams = await Exam.find({}).select("titulo courseId");
    const examByCourse = new Map();
    exams.forEach((e) => {
      if (e.courseId) examByCourse.set(String(e.courseId), e);
    });

    const rows = await Promise.all(
      asignaciones.map(async (a) => {
        const cert = await Certificate.findOne({ user: a.user, course: a.course }).lean();
        const ex = examByCourse.get(String(a.course?._id)) || null;

        return {
          assignmentId: a._id,
          usuario: {
            nombre: [a.user?.nombre, a.user?.apellido].filter(Boolean).join(" ") || "-",
            correo: a.user?.correo || "-",
          },
          
        curso: {
            titulo: a.course?.titulo || "-",
            materialUrl: a.course?.materialUrl || a.course?.pdfUrl || ""  // <-- añade esto
          },

          examen: ex ? { titulo: ex.titulo } : null,
          // quitamos intentos reales por ahora
          ultimoResultado: cert ? "aprobado" : "-",
          aprobado: !!cert,
          certificado: cert
            ? { id: String(cert._id), number: cert.number, emitDate: cert.emitDate }
            : null,
        };
      })
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error al construir resumen", error: e.message });
  }
};

/**
 * PATCH /api/summary/:assignmentId/status
 * body: { aprobado: boolean }
 * Si aprobado === true y no hay certificado para (user, course) => lo crea con TODOS los campos requeridos.
 * Si aprobado === false no borra certificado (política conservadora).
 */
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { aprobado } = req.body || {};

    const asg = await Assignment.findById(assignmentId)
      .populate({ path: "user", select: "nombre apellido correo" })
      .populate({ path: "course", select: "titulo" });

    if (!asg) {
      return res.status(404).json({ mensaje: "Asignación no encontrada" });
    }

    let cert = await Certificate.findOne({ user: asg.user?._id, course: asg.course?._id });

    if (aprobado && !cert) {
      // emitir certificado con campos requeridos por el modelo
      let tpl = await CertificateTemplate.findOne();
      if (!tpl) tpl = await CertificateTemplate.create({});

      const now = new Date();
      const year = now.getFullYear();
      ensureTemplateYear(tpl, year);

      tpl.lastSeq += 1;
      const yy = String(tpl.year).slice(-2);     // p.ej. 2025 -> "25"
      const number = `${yy}${String(tpl.lastSeq).padStart(4, "0")}`; // ej: 250001
      await tpl.save();

      const studentName = [asg.user?.nombre, asg.user?.apellido].filter(Boolean).join(" ") || "-";
      const courseTitle = asg.course?.titulo || "-";
      const hours = horasPorCurso(courseTitle);
      const dateText = fechaLarga(now.toISOString());
      const managerName = tpl.gerenteNombre || "Gerente General";

      cert = await Certificate.create({
        user: asg.user._id,
        course: asg.course._id,
        template: tpl._id,
        emitDate: now,
        number,
        // ---- campos requeridos por tu schema ----
        studentName,
        courseTitle,
        hours,
        dateText,
        managerName,
      });
    }

    // Devolvemos la fila actualizada igual que en getSummary
    const ex = await Exam.findOne({ courseId: asg.course?._id }).select("titulo").lean();

    const row = {
      assignmentId: asg._id,
      usuario: {
        nombre: [asg.user?.nombre, asg.user?.apellido].filter(Boolean).join(" ") || "-",
        correo: asg.user?.correo || "-",
      },
      curso: { titulo: asg.course?.titulo || "-" },
      examen: ex ? { titulo: ex.titulo } : null,
      ultimoResultado: cert ? "aprobado" : (aprobado ? "aprobado" : "-"),
      aprobado: !!cert || !!aprobado,
      certificado: cert
        ? { id: String(cert._id), number: cert.number, emitDate: cert.emitDate }
        : null,
    };

    res.json({ mensaje: "Estado actualizado", row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "No se pudo actualizar el estado", error: e.message });
  }
};
