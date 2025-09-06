// server/controllers/cursoController.js
const path = require("path");
const fs = require("fs");
const Course = require("../models/Course");

const cursosDir = path.join(__dirname, "..", "uploads", "cursos");

// Asegura que exista /uploads/cursos
function ensureCursosDir() {
  try {
    fs.mkdirSync(cursosDir, { recursive: true });
  } catch {}
}

function borrarArchivoPorUrl(fileUrl) {
  try {
    const idx = fileUrl.indexOf("/uploads/cursos/");
    if (idx === -1) return;
    const filename = fileUrl.slice(idx + "/uploads/cursos/".length);
    if (!filename) return;
    const full = path.join(cursosDir, filename);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) {
    console.warn("No se pudo borrar el archivo anterior:", e.message);
  }
}

/**
 * LISTAR con conteo (igual a tu código)
 */
exports.listarCursosConConteo = async (_req, res) => {
  try {
    const cursos = await Course.aggregate([
      { $lookup: { from: "assignments", localField: "_id", foreignField: "course", as: "asigs" } },
      { $addFields: { alumnosAsignados: { $size: "$asigs" } } },
      { $project: { asigs: 0 } },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(cursos);
  } catch (error) {
    console.error("❌ listarCursosConConteo:", error);
    res.status(500).json({ mensaje: "Error al listar cursos", error: error.message });
  }
};

exports.obtenerCursos = async (_req, res) => {
  try {
    const cursos = await Course.find().sort({ createdAt: -1 });
    res.json(cursos);
  } catch (error) {
    console.error("❌ obtenerCursos:", error);
    res.status(500).json({ mensaje: "Error al obtener cursos", error: error.message });
  }
};

exports.crearCurso = async (req, res) => {
  try {
    ensureCursosDir();
    const { titulo, categoria } = req.body;
    
    // Verificar si hay archivos adjuntos
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ mensaje: "Debe adjuntar un PDF" });
    }

    // Procesar PDF (obligatorio)
    const pdfUrl = `${req.protocol}://${req.get("host")}/uploads/cursos/${req.files.pdf[0].filename}`;
    
    // Procesar imagen (opcional)
    let imagenUrl = "";
    if (req.files.imagen && req.files.imagen[0]) {
      imagenUrl = `${req.protocol}://${req.get("host")}/uploads/cursos/${req.files.imagen[0].filename}`;
    }

    console.log("Creando curso con:", { titulo, categoria, pdf: req.files.pdf[0], imagen: req.files.imagen?.[0] });
    const curso = await Course.create({ titulo, categoria, pdfUrl, imagenUrl });
    res.status(201).json({ mensaje: "Curso creado correctamente", curso });
  } catch (error) {
    console.error("❌ crearCurso:", error);
    res.status(500).json({ mensaje: "Error al crear curso", error: error.message });
  }
};

exports.actualizarCurso = async (req, res) => {
  try {
    ensureCursosDir();
    const { id } = req.params;
    const { titulo, categoria } = req.body;

    const curso = await Course.findById(id);
    if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

    // Actualizar PDF si se envía uno nuevo
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      // Borrar el PDF anterior si existía
      if (curso.pdfUrl) borrarArchivoPorUrl(curso.pdfUrl);
      curso.pdfUrl = `${req.protocol}://${req.get("host")}/uploads/cursos/${req.files.pdf[0].filename}`;
    }

    // Actualizar imagen si se envía una nueva
    if (req.files && req.files.imagen && req.files.imagen[0]) {
      // Borrar la imagen anterior si existía
      if (curso.imagenUrl) borrarArchivoPorUrl(curso.imagenUrl);
      curso.imagenUrl = `${req.protocol}://${req.get("host")}/uploads/cursos/${req.files.imagen[0].filename}`;
    }

    if (typeof titulo === "string") curso.titulo = titulo;
    if (typeof categoria === "string") curso.categoria = categoria;

    await curso.save();
    res.json({ mensaje: "Curso actualizado", curso });
  } catch (error) {
    console.error("❌ actualizarCurso:", error);
    res.status(500).json({ mensaje: "Error al actualizar curso", error: error.message });
  }
};

exports.eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Course.findById(id);
    if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

    // Eliminar archivos del servidor
    if (curso.pdfUrl) borrarArchivoPorUrl(curso.pdfUrl);
    if (curso.imagenUrl) borrarArchivoPorUrl(curso.imagenUrl);
    
    await curso.deleteOne();

    res.json({ mensaje: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("❌ eliminarCurso:", error);
    res.status(500).json({ mensaje: "Error al eliminar curso", error: error.message });
  }
};
