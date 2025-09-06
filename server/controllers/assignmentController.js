const Assignment = require("../models/Assignment");
const Exam = require("../models/Exam");

const addDays = (base, days) => new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

exports.createAssignment = async (req, res) => {
  try {
    const { userId, courseId, days = 30 } = req.body;
    if (!userId || !courseId) {
      return res.status(400).json({ mensaje: "userId y courseId son requeridos" });
    }

    const expiresAt = addDays(new Date(), Number(days));
    const assignment = await Assignment.create({ user: userId, course: courseId, expiresAt });

    res.status(201).json({ mensaje: "Curso asignado", assignment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: "Este curso ya está asignado a este usuario" });
    }
    console.error("❌ createAssignment:", error);
    res.status(500).json({ mensaje: "Error al asignar curso", error: error.message });
  }
};

exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ mensaje: "userId es requerido" });

    const items = await Assignment.find({ user: userId })
      .populate("course", "titulo categoria pdfUrl imagenUrl")
      .sort({ createdAt: -1 });

    // Filtrar asignaciones donde el curso ha sido eliminado (course es null)
    const filteredItems = items.filter(item => item.course);

    res.json(filteredItems);
  } catch (error) {
    console.error("❌ listByUser:", error);
    res.status(500).json({ mensaje: "Error al listar asignaciones", error: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    res.json({ mensaje: "Asignación eliminada" });
  } catch (error) {
    console.error("❌ deleteAssignment:", error);
    res.status(500).json({ mensaje: "Error al eliminar asignación", error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const asg = await Assignment.findById(id)
      .populate({ path: "user", select: "nombre correo" })
      .populate({ path: "course", select: "titulo pdfUrl imagenUrl" }); // <— IMPORTANTE

    if (!asg) return res.status(404).json({ mensaje: "Asignación no encontrada" });

    // si tu modelo Exam referencia el curso con courseId:
    const exam = await Exam.findOne({ courseId: asg.course?._id }).select("titulo");

    return res.json({
      _id: asg._id,
      user: asg.user,
      course: {
        _id: asg.course?._id,
        titulo: asg.course?.titulo || "",
        pdfUrl: asg.course?.pdfUrl || "",     // <— AQUÍ va al frontend
        imagenUrl: asg.course?.imagenUrl || "", // <— Imagen también va al frontend
      },
      exam: exam ? { _id: exam._id, titulo: exam.titulo } : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error al obtener asignación", error: e.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id; // ID del usuario autenticado

    const assignments = await Assignment.find({ user: userId })
      .populate("course", "titulo categoria pdfUrl imagenUrl"); // Popular el curso

    res.json(assignments);
  } catch (error) {
    console.error("❌ getMyCourses:", error);
    res.status(500).json({ mensaje: "Error al obtener mis cursos", error: error.message });
  }
};
