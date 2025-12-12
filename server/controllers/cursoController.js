// server/controllers/cursoController.js
const path = require("path");
const fs = require("fs");
const Course = require("../models/Course");
const { generateFileUrl } = require("../utils/urlHelper");
const {
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  saveToBackupFolder,
  deleteFromBackupFolder
} = require("../utils/gridfsHelper");

const cursosDir = path.join(__dirname, "..", "uploads", "cursos");

// Asegura que exista /uploads/cursos
function ensureCursosDir() {
  try {
    fs.mkdirSync(cursosDir, { recursive: true });
  } catch {}
}

/**
 * Elimina archivos antiguos del sistema legacy
 */
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
 * LISTAR con conteo
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

/**
 * OBTENER todos los cursos
 */
exports.obtenerCursos = async (_req, res) => {
  try {
    const cursos = await Course.find().sort({ createdAt: -1 });
    res.json(cursos);
  } catch (error) {
    console.error("❌ obtenerCursos:", error);
    res.status(500).json({ mensaje: "Error al obtener cursos", error: error.message });
  }
};

/**
 * CREAR curso con sistema de doble respaldo
 */
exports.crearCurso = async (req, res) => {
  try {
    ensureCursosDir();
    const { titulo, categoria, modulo } = req.body;

    // Verificar si hay archivos adjuntos
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ mensaje: "Debe adjuntar un PDF" });
    }

    const pdfFile = req.files.pdf[0];
    const pdfBuffer = fs.readFileSync(pdfFile.path);

    console.log("📤 Guardando PDF en doble respaldo...");

    // 1. Subir PDF a GridFS (respaldo 1)
    const pdfGridFsId = await uploadToGridFS(
      pdfBuffer,
      pdfFile.filename,
      pdfFile.mimetype
    );

    // 2. Guardar PDF en /pdfs-backup/ (respaldo 2)
    const pdfBackupPath = saveToBackupFolder(
      pdfBuffer,
      pdfFile.filename,
      'cursos'
    );

    // 3. Generar URL compatible (para sistema legacy)
    const pdfUrl = generateFileUrl(`/api/cursos/pdf/${pdfGridFsId}`, req);

    // Procesar imagen (opcional)
    let imagenUrl = "";
    let imagenGridFsId = null;
    let imagenBackupPath = "";
    let imagenOriginalName = "";

    if (req.files.imagen && req.files.imagen[0]) {
      const imagenFile = req.files.imagen[0];
      const imagenBuffer = fs.readFileSync(imagenFile.path);

      console.log("📤 Guardando imagen en doble respaldo...");

      // 1. Subir imagen a GridFS
      imagenGridFsId = await uploadToGridFS(
        imagenBuffer,
        imagenFile.filename,
        imagenFile.mimetype
      );

      // 2. Guardar imagen en /pdfs-backup/
      imagenBackupPath = saveToBackupFolder(
        imagenBuffer,
        imagenFile.filename,
        'cursos'
      );

      // 3. Generar URL
      imagenUrl = generateFileUrl(`/api/cursos/imagen/${imagenGridFsId}`, req);
      imagenOriginalName = imagenFile.originalname;
    }

    console.log("💾 Creando curso en base de datos...");

    const curso = await Course.create({
      titulo,
      categoria,
      modulo: modulo || "",
      // PDF
      pdfUrl,
      pdfGridFsId,
      pdfBackupPath,
      pdfOriginalName: pdfFile.originalname,
      // Imagen
      imagenUrl,
      imagenGridFsId,
      imagenBackupPath,
      imagenOriginalName
    });

    // Eliminar archivos temporales de multer
    fs.unlinkSync(pdfFile.path);
    if (req.files.imagen && req.files.imagen[0]) {
      fs.unlinkSync(req.files.imagen[0].path);
    }

    console.log("✅ Curso creado con doble respaldo exitosamente");

    res.status(201).json({ mensaje: "Curso creado correctamente", curso });
  } catch (error) {
    console.error("❌ crearCurso:", error);
    res.status(500).json({ mensaje: "Error al crear curso", error: error.message });
  }
};

/**
 * ACTUALIZAR curso
 */
exports.actualizarCurso = async (req, res) => {
  try {
    ensureCursosDir();
    const { id } = req.params;
    const { titulo, categoria, modulo } = req.body;

    const curso = await Course.findById(id);
    if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

    // Actualizar PDF si se envía uno nuevo
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      const pdfFile = req.files.pdf[0];
      const pdfBuffer = fs.readFileSync(pdfFile.path);

      console.log("📤 Actualizando PDF en doble respaldo...");

      // Eliminar PDF anterior de GridFS
      if (curso.pdfGridFsId) {
        try {
          await deleteFromGridFS(curso.pdfGridFsId);
        } catch (e) {
          console.warn("No se pudo eliminar PDF anterior de GridFS:", e.message);
        }
      }

      // Eliminar PDF anterior de backup local
      if (curso.pdfBackupPath) {
        deleteFromBackupFolder(curso.pdfBackupPath);
      }

      // Eliminar del sistema legacy si existía
      if (curso.pdfUrl) borrarArchivoPorUrl(curso.pdfUrl);

      // Subir nuevo PDF a GridFS
      const pdfGridFsId = await uploadToGridFS(
        pdfBuffer,
        pdfFile.filename,
        pdfFile.mimetype
      );

      // Guardar nuevo PDF en backup
      const pdfBackupPath = saveToBackupFolder(
        pdfBuffer,
        pdfFile.filename,
        'cursos'
      );

      // Actualizar campos
      curso.pdfGridFsId = pdfGridFsId;
      curso.pdfBackupPath = pdfBackupPath;
      curso.pdfUrl = generateFileUrl(`/api/cursos/pdf/${pdfGridFsId}`, req);
      curso.pdfOriginalName = pdfFile.originalname;

      // Eliminar archivo temporal
      fs.unlinkSync(pdfFile.path);
    }

    // Actualizar imagen si se envía una nueva
    if (req.files && req.files.imagen && req.files.imagen[0]) {
      const imagenFile = req.files.imagen[0];
      const imagenBuffer = fs.readFileSync(imagenFile.path);

      console.log("📤 Actualizando imagen en doble respaldo...");

      // Eliminar imagen anterior de GridFS
      if (curso.imagenGridFsId) {
        try {
          await deleteFromGridFS(curso.imagenGridFsId);
        } catch (e) {
          console.warn("No se pudo eliminar imagen anterior de GridFS:", e.message);
        }
      }

      // Eliminar imagen anterior de backup local
      if (curso.imagenBackupPath) {
        deleteFromBackupFolder(curso.imagenBackupPath);
      }

      // Eliminar del sistema legacy si existía
      if (curso.imagenUrl) borrarArchivoPorUrl(curso.imagenUrl);

      // Subir nueva imagen a GridFS
      const imagenGridFsId = await uploadToGridFS(
        imagenBuffer,
        imagenFile.filename,
        imagenFile.mimetype
      );

      // Guardar nueva imagen en backup
      const imagenBackupPath = saveToBackupFolder(
        imagenBuffer,
        imagenFile.filename,
        'cursos'
      );

      // Actualizar campos
      curso.imagenGridFsId = imagenGridFsId;
      curso.imagenBackupPath = imagenBackupPath;
      curso.imagenUrl = generateFileUrl(`/api/cursos/imagen/${imagenGridFsId}`, req);
      curso.imagenOriginalName = imagenFile.originalname;

      // Eliminar archivo temporal
      fs.unlinkSync(imagenFile.path);
    }

    // Actualizar campos de texto
    if (typeof titulo === "string") curso.titulo = titulo;
    if (typeof categoria === "string") curso.categoria = categoria;
    if (typeof modulo === "string") curso.modulo = modulo;

    await curso.save();

    console.log("✅ Curso actualizado correctamente");

    res.json({ mensaje: "Curso actualizado", curso });
  } catch (error) {
    console.error("❌ actualizarCurso:", error);
    res.status(500).json({ mensaje: "Error al actualizar curso", error: error.message });
  }
};

/**
 * ELIMINAR curso
 */
exports.eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Course.findById(id);
    if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

    console.log("🗑️ Eliminando archivos del curso...");

    // Eliminar PDF de GridFS
    if (curso.pdfGridFsId) {
      try {
        await deleteFromGridFS(curso.pdfGridFsId);
      } catch (e) {
        console.warn("No se pudo eliminar PDF de GridFS:", e.message);
      }
    }

    // Eliminar PDF de backup local
    if (curso.pdfBackupPath) {
      deleteFromBackupFolder(curso.pdfBackupPath);
    }

    // Eliminar imagen de GridFS
    if (curso.imagenGridFsId) {
      try {
        await deleteFromGridFS(curso.imagenGridFsId);
      } catch (e) {
        console.warn("No se pudo eliminar imagen de GridFS:", e.message);
      }
    }

    // Eliminar imagen de backup local
    if (curso.imagenBackupPath) {
      deleteFromBackupFolder(curso.imagenBackupPath);
    }

    // Eliminar archivos del sistema legacy
    if (curso.pdfUrl) borrarArchivoPorUrl(curso.pdfUrl);
    if (curso.imagenUrl) borrarArchivoPorUrl(curso.imagenUrl);

    await curso.deleteOne();

    console.log("✅ Curso eliminado correctamente");

    res.json({ mensaje: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("❌ eliminarCurso:", error);
    res.status(500).json({ mensaje: "Error al eliminar curso", error: error.message });
  }
};

/**
 * SERVIR PDF desde GridFS
 */
exports.servirPDF = async (req, res) => {
  try {
    const { fileId } = req.params;

    console.log(`📥 Sirviendo PDF desde GridFS (ID: ${fileId})`);

    const { buffer, filename, contentType } = await downloadFromGridFS(fileId);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });

    res.send(buffer);
  } catch (error) {
    console.error("❌ servirPDF:", error);
    res.status(404).json({ mensaje: "PDF no encontrado", error: error.message });
  }
};

/**
 * SERVIR IMAGEN desde GridFS
 */
exports.servirImagen = async (req, res) => {
  try {
    const { fileId } = req.params;

    console.log(`📥 Sirviendo imagen desde GridFS (ID: ${fileId})`);

    const { buffer, filename, contentType } = await downloadFromGridFS(fileId);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });

    res.send(buffer);
  } catch (error) {
    console.error("❌ servirImagen:", error);
    res.status(404).json({ mensaje: "Imagen no encontrada", error: error.message });
  }
};

/**
 * Obtener lista de módulos únicos
 */
exports.obtenerModulos = async (_req, res) => {
  try {
    const modulos = await Course.distinct("modulo");
    const modulosFiltrados = modulos.filter(m => m && m.trim() !== "");
    res.json(modulosFiltrados);
  } catch (error) {
    console.error("❌ obtenerModulos:", error);
    res.status(500).json({ mensaje: "Error al obtener módulos", error: error.message });
  }
};
