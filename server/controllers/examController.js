const Exam = require("../models/Exam");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment"); 

exports.listarExamenes = async (_req, res) => {
  try {
    // 👇 Trae también el título del curso si está asignado
    const data = await Exam.find()
      .populate("courseId", "titulo")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ mensaje: "Error al obtener exámenes", error: e.message });
  }
};

exports.crearExamen = async (req, res) => {
  try {
    const { titulo, preguntas } = req.body;

    if (!titulo || !Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({ mensaje: "Datos incompletos" });
    }

    for (const p of preguntas) {
      if (!p.enunciado || !Array.isArray(p.alternativas) || p.alternativas.length !== 3) {
        return res.status(400).json({ mensaje: "Cada pregunta debe tener 3 alternativas" });
      }
      const correctas = p.alternativas.filter(a => a.correcta).length;
      if (correctas !== 1) {
        return res.status(400).json({ mensaje: "Cada pregunta debe tener exactamente 1 alternativa correcta" });
      }
    }

    const exam = await Exam.create({ titulo, preguntas });
    res.status(201).json({ mensaje: "Examen creado", exam });
  } catch (e) {
    res.status(500).json({ mensaje: "Error al crear examen", error: e.message });
  }
};

exports.actualizarExamen = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, preguntas } = req.body;

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ mensaje: "Examen no encontrado" });

    if (typeof titulo === "string") exam.titulo = titulo;
    if (Array.isArray(preguntas) && preguntas.length > 0) {
      for (const p of preguntas) {
        if (!p.enunciado || !Array.isArray(p.alternativas) || p.alternativas.length !== 3) {
          return res.status(400).json({ mensaje: "Cada pregunta debe tener 3 alternativas" });
        }
        const correctas = p.alternativas.filter(a => a.correcta).length;
        if (correctas !== 1) {
          return res.status(400).json({ mensaje: "Cada pregunta debe tener exactamente 1 alternativa correcta" });
        }
      }
      exam.preguntas = preguntas;
    }

    await exam.save();
    res.json({ mensaje: "Examen actualizado", exam });
  } catch (e) {
    res.status(500).json({ mensaje: "Error al actualizar examen", error: e.message });
  }
};

exports.eliminarExamen = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ mensaje: "Examen no encontrado" });
    await exam.deleteOne();
    res.json({ mensaje: "Examen eliminado" });
  } catch (e) {
    res.status(500).json({ mensaje: "Error al eliminar examen", error: e.message });
  }
};

// 👇 NUEVO: asignar/quitar curso de un examen
exports.asignarCurso = async (req, res) => {
  try {
    console.log("📥 body:", req.body);
    const { id } = req.params;        // examId
    const { courseId } = req.body;    // puede venir null para desasignar

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ mensaje: "Examen no encontrado" });

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) return res.status(400).json({ mensaje: "Curso no válido" });
      exam.courseId = courseId;
    } else {
      exam.courseId = null; // desasignar
    }

    await exam.save();
    const withCourse = await Exam.findById(id).populate("courseId", "titulo");
    res.json({ mensaje: "Relación actualizada", exam: withCourse });
  } catch (e) {
    res.status(500).json({ mensaje: "Error al asignar curso", error: e.message });
  }
};


exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ mensaje: "Examen no encontrado" });
    res.json(exam);
  } catch (e) {
    console.error("getById examen:", e);
    res.status(500).json({ mensaje: "Error al obtener examen", error: e.message });
  }
};

exports.submitResult = async (req, res) => {
  try {
    // OBTENER EL ID DE USUARIO DEL TOKEN, NO DEL BODY
    const userId = req.user.id;

    const {
      examId,
      assignmentId,
      score,
      total,
      correct,
      answers = [],
    } = req.body || {};

    console.log("Received exam submission for assignmentId:", assignmentId); // Log

    if (!assignmentId) {
      return res.status(400).json({ ok: false, message: "Falta el ID de la asignación" });
    }

    // VERIFICAR QUE LA ASIGNACIÓN PERTENECE AL USUARIO AUTENTICADO
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ ok: false, message: "Asignación no encontrada" });
    }

    if (assignment.user.toString() !== userId) {
      return res.status(403).json({ ok: false, message: "No tienes permiso para actualizar esta asignación" });
    }

    // Ahora que es seguro, procede a actualizar
    // Lógica de aprobación: 70% o más del total de preguntas
    const minimumPassScore = Math.ceil(total * 0.7);
    const passed = correct >= minimumPassScore;

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      {
        lastExamId: examId || null,
        lastScore: score ?? null,
        lastTotal: total ?? null,
        lastCorrect: correct ?? null,
        lastAnswers: answers,
        passed: passed,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // responde "ok" para que el front siga
    res.json({ 
      ok: true, 
      message: "Resultado registrado", 
      assignment: updatedAssignment,
      examResult: {
        passed,
        minimumPassScore,
        score: score ?? 0,
        correct: correct ?? 0,
        total: total ?? 0
      }
    });
  } catch (e) {
    console.error("submitResult examen:", e);
    res.status(500).json({ ok: false, mensaje: "Error al registrar resultado", error: e.message });
  }
};