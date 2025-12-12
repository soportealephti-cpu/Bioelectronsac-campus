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
 * CREAR curso con sistema de triple respaldo
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

    console.log("📤 Guardando PDF con sistema de triple respaldo...");

    // 1. Subir PDF a GridFS (principal)
    const pdfGridFsId = await uploadToGridFS(
      pdfBuffer,
      pdfFile.filename,
      pdfFile.mimetype
    );

    // 2. Guardar PDF en /pdfs-backup/ (respaldo 1)
    const pdfBackupPath = saveToBackupFolder(
      pdfBuffer,
      pdfFile.filename,
      'cursos'
    );

    // 3. Generar URL para servir con fallback inteligente
    const pdfUrl = generateFileUrl(`/api/cursos/file/pdf/${pdfGridFsId}`, req);

    // Procesar imagen (opcional)
    let imagenUrl = "";
    let imagenGridFsId = null;
    let imagenBackupPath = "";
    let imagenOriginalName = "";

    if (req.files.imagen && req.files.imagen[0]) {
      const imagenFile = req.files.imagen[0];
      const imagenBuffer = fs.readFileSync(imagenFile.path);

      console.log("📤 Guardando imagen con sistema de triple respaldo...");

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
      imagenUrl = generateFileUrl(`/api/cursos/file/imagen/${imagenGridFsId}`, req);
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

    // Limpiar archivos temporales de multer
    try {
      fs.unlinkSync(pdfFile.path);
      if (req.files.imagen && req.files.imagen[0]) {
        fs.unlinkSync(req.files.imagen[0].path);
      }
    } catch (e) {
      console.warn("⚠️ No se pudieron eliminar archivos temporales:", e.message);
    }

    console.log("✅ Curso creado exitosamente con triple respaldo");
    res.status(201).json({ mensaje: "Curso creado correctamente", curso });
  } catch (error) {
    console.error("❌ crearCurso:", error);
    res.status(500).json({ mensaje: "Error al crear curso", error: error.message });
  }
};

/**
 * ACTUALIZAR curso con sistema de triple respaldo
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

      console.log("📤 Actualizando PDF con sistema de triple respaldo...");

      // Eliminar archivos antiguos
      if (curso.pdfGridFsId) {
        await deleteFromGridFS(curso.pdfGridFsId).catch(e =>
          console.warn("⚠️ No se pudo eliminar PDF antiguo de GridFS:", e.message)
        );
      }
      if (curso.pdfBackupPath) {
        deleteFromBackupFolder(curso.pdfBackupPath);
      }
      if (curso.pdfUrl) {
        borrarArchivoPorUrl(curso.pdfUrl);
      }

      // Subir nuevo PDF
      const pdfGridFsId = await uploadToGridFS(pdfBuffer, pdfFile.filename, pdfFile.mimetype);
      const pdfBackupPath = saveToBackupFolder(pdfBuffer, pdfFile.filename, 'cursos');
      const pdfUrl = generateFileUrl(`/api/cursos/file/pdf/${pdfGridFsId}`, req);

      curso.pdfUrl = pdfUrl;
      curso.pdfGridFsId = pdfGridFsId;
      curso.pdfBackupPath = pdfBackupPath;
      curso.pdfOriginalName = pdfFile.originalname;

      // Limpiar temporal
      try { fs.unlinkSync(pdfFile.path); } catch {}
    }

    // Actualizar imagen si se envía una nueva
    if (req.files && req.files.imagen && req.files.imagen[0]) {
      const imagenFile = req.files.imagen[0];
      const imagenBuffer = fs.readFileSync(imagenFile.path);

      console.log("📤 Actualizando imagen con sistema de triple respaldo...");

      // Eliminar archivos antiguos
      if (curso.imagenGridFsId) {
        await deleteFromGridFS(curso.imagenGridFsId).catch(e =>
          console.warn("⚠️ No se pudo eliminar imagen antigua de GridFS:", e.message)
        );
      }
      if (curso.imagenBackupPath) {
        deleteFromBackupFolder(curso.imagenBackupPath);
      }
      if (curso.imagenUrl) {
        borrarArchivoPorUrl(curso.imagenUrl);
      }

      // Subir nueva imagen
      const imagenGridFsId = await uploadToGridFS(imagenBuffer, imagenFile.filename, imagenFile.mimetype);
      const imagenBackupPath = saveToBackupFolder(imagenBuffer, imagenFile.filename, 'cursos');
      const imagenUrl = generateFileUrl(`/api/cursos/file/imagen/${imagenGridFsId}`, req);

      curso.imagenUrl = imagenUrl;
      curso.imagenGridFsId = imagenGridFsId;
      curso.imagenBackupPath = imagenBackupPath;
      curso.imagenOriginalName = imagenFile.originalname;

      // Limpiar temporal
      try { fs.unlinkSync(imagenFile.path); } catch {}
    }

    if (typeof titulo === "string") curso.titulo = titulo;
    if (typeof categoria === "string") curso.categoria = categoria;
    if (typeof modulo === "string") curso.modulo = modulo;

    await curso.save();
    console.log("✅ Curso actualizado exitosamente");
    res.json({ mensaje: "Curso actualizado", curso });
  } catch (error) {
    console.error("❌ actualizarCurso:", error);
    res.status(500).json({ mensaje: "Error al actualizar curso", error: error.message });
  }
};

/**
 * ELIMINAR curso y sus archivos de todos los sistemas de respaldo
 */
exports.eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Course.findById(id);
    if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" });

    console.log("🗑️ Eliminando archivos del curso de todos los sistemas...");

    // Eliminar PDF de todos los sistemas
    if (curso.pdfGridFsId) {
      await deleteFromGridFS(curso.pdfGridFsId).catch(e =>
        console.warn("⚠️ No se pudo eliminar PDF de GridFS:", e.message)
      );
    }
    if (curso.pdfBackupPath) {
      deleteFromBackupFolder(curso.pdfBackupPath);
    }
    if (curso.pdfUrl) {
      borrarArchivoPorUrl(curso.pdfUrl);
    }

    // Eliminar imagen de todos los sistemas
    if (curso.imagenGridFsId) {
      await deleteFromGridFS(curso.imagenGridFsId).catch(e =>
        console.warn("⚠️ No se pudo eliminar imagen de GridFS:", e.message)
      );
    }
    if (curso.imagenBackupPath) {
      deleteFromBackupFolder(curso.imagenBackupPath);
    }
    if (curso.imagenUrl) {
      borrarArchivoPorUrl(curso.imagenUrl);
    }

    await curso.deleteOne();

    console.log("✅ Curso eliminado correctamente de todos los sistemas");
    res.json({ mensaje: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("❌ eliminarCurso:", error);
    res.status(500).json({ mensaje: "Error al eliminar curso", error: error.message });
  }
};

/**
 * SERVIR ARCHIVO con sistema de fallback inteligente (Triple Respaldo)
 *
 * Estrategia de búsqueda:
 * 1. Intentar servir desde /uploads/cursos (sistema legacy)
 * 2. Si no existe, servir desde GridFS
 * 3. Si no existe, servir desde /pdfs-backup
 * 4. (Futuro) Si no existe, buscar en Google Drive API
 */
exports.servirArchivo = async (req, res) => {
  try {
    const { tipo, fileId } = req.params; // tipo: 'pdf' o 'imagen'

    console.log(`📥 Sirviendo ${tipo} con ID: ${fileId}`);

    // FALLBACK 1: Intentar servir desde GridFS (sistema principal actual)
    try {
      const { buffer, filename, contentType } = await downloadFromGridFS(fileId);

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': buffer.length,
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'public, max-age=31536000' // Cache por 1 año
      });

      console.log(`✅ Archivo servido desde GridFS: ${filename}`);
      return res.send(buffer);
    } catch (gridfsError) {
      console.log(`⚠️ No encontrado en GridFS, intentando con /uploads/cursos...`);
    }

    // FALLBACK 2: Buscar en el sistema legacy /uploads/cursos
    // (Buscar archivos que contengan el fileId en su nombre)
    const legacyDir = path.join(__dirname, '..', 'uploads', 'cursos');

    if (fs.existsSync(legacyDir)) {
      const files = fs.readdirSync(legacyDir);
      const matchingFile = files.find(f => f.includes(fileId));

      if (matchingFile) {
        const filePath = path.join(legacyDir, matchingFile);
        const buffer = fs.readFileSync(filePath);
        const contentType = tipo === 'pdf' ? 'application/pdf' : 'image/jpeg';

        res.set({
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${matchingFile}"`,
          'Content-Length': buffer.length,
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'Cache-Control': 'public, max-age=31536000'
        });

        console.log(`✅ Archivo servido desde /uploads/cursos: ${matchingFile}`);
        return res.send(buffer);
      }
    }

    // FALLBACK 3: Buscar en /pdfs-backup
    const backupDir = path.join(__dirname, '..', 'pdfs-backup', 'cursos');

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      const matchingFile = files.find(f => f.includes(fileId));

      if (matchingFile) {
        const filePath = path.join(backupDir, matchingFile);
        const buffer = fs.readFileSync(filePath);
        const contentType = tipo === 'pdf' ? 'application/pdf' : 'image/jpeg';

        res.set({
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${matchingFile}"`,
          'Content-Length': buffer.length,
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'Cache-Control': 'public, max-age=31536000'
        });

        console.log(`✅ Archivo servido desde /pdfs-backup: ${matchingFile}`);
        return res.send(buffer);
      }
    }

    // FALLBACK 4: (Futuro) Buscar en Google Drive API
    // TODO: Implementar búsqueda en Google Drive

    // Si no se encontró en ningún lado
    console.error(`❌ Archivo no encontrado en ningún sistema de respaldo: ${fileId}`);
    res.status(404).json({ mensaje: "Archivo no encontrado en ningún sistema de respaldo" });

  } catch (error) {
    console.error("❌ servirArchivo:", error);
    res.status(500).json({ mensaje: "Error al servir archivo", error: error.message });
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
