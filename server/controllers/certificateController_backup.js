const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const Certificate = require("../models/Certificate");
const CertificateTemplate = require("../models/CertificateTemplate");
const Assignment = require("../models/Assignment");

// ---------------- helpers ----------------

const baseUrl = (req) => `${req.protocol}://${req.get("host")}`;

function ensureTemplateYear(tpl, year) {
  if (tpl.year !== year) {
    tpl.year = year;
    tpl.lastSeq = 0;
  }
  return tpl;
}

function fechaLarga(iso) {
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const d = iso ? new Date(iso) : new Date();
  return `Lima, ${String(d.getDate()).padStart(2, "0")} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function horasPorCurso(titulo = "") {
  const t = (titulo || "").toLowerCase();
  if (t.includes("actualización")) return 5;
  if (t.includes("oficial de protección radiológica")) return 50;
  return 20;
}

async function fetchImageBytes(url) {
  if (!url) return null;
  
  // Si es una URL HTTP/HTTPS localhost, convertir a path de archivo
  if (/^https?:\/\/localhost:\d+\/uploads\//i.test(url)) {
    const pathPart = url.replace(/^https?:\/\/localhost:\d+/, '');
    const filePath = path.join(__dirname, '..', pathPart);
    console.log(`🖼️ Convirtiendo URL local a path: ${url} -> ${filePath}`);
    return fs.promises.readFile(filePath);
  }
  
  // Si es una URL HTTP/HTTPS externa
  if (/^https?:\/\//i.test(url)) {
    console.log(`🌐 Descargando imagen externa: ${url}`);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`No se pudo leer imagen: ${url}`);
    const ab = await r.arrayBuffer();
    return Buffer.from(ab);
  }
  
  // Si es un path directo de archivo
  console.log(`📁 Leyendo archivo local: ${url}`);
  return fs.promises.readFile(url);
}

// --------------- plantilla ---------------

exports.getTemplate = async (_req, res) => {
  try {
    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    res.json({
      backgroundUrl: tpl.backgroundUrl || "",
      firmaUrl: tpl.firmaUrl || "",
      gerenteNombre: tpl.gerenteNombre || "",
      year: tpl.year,
      lastSeq: tpl.lastSeq,
    });
  } catch (e) {
    res.status(500).json({ mensaje: "Error al obtener plantilla", error: e.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});

    if (req.body?.gerenteNombre !== undefined) {
      tpl.gerenteNombre = req.body.gerenteNombre;
    }

    if (req.files?.background?.[0]) {
      const file = req.files.background[0];
      tpl.backgroundUrl = `${baseUrl(req)}/uploads/certificados/${file.filename}`;
    }
    if (req.files?.firma?.[0]) {
      const file = req.files.firma[0];
      tpl.firmaUrl = `${baseUrl(req)}/uploads/certificados/${file.filename}`;
    }

    await tpl.save();
    res.json({ mensaje: "Plantilla actualizada", template: tpl });
  } catch (e) {
    res.status(500).json({ mensaje: "Error al actualizar plantilla", error: e.message });
  }
};

exports.nextNumber = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    ensureTemplateYear(tpl, year);

    const yy = String(year).slice(-2);
    const number = `${yy}${String(tpl.lastSeq).padStart(4, "0")}`;
    res.json({ number });
  } catch (e) {
    res.status(500).json({ mensaje: "Error de correlativo", error: e.message });
  }
};

// ----------- emitir / obtener -----------

exports.emit = async (req, res) => {
  try {
    const { userId, courseId, emitDate, number } = req.body;
    if (!userId || !courseId) {
      return res.status(400).json({ mensaje: "Falta userId o courseId" });
    }

    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    const year = emitDate ? new Date(emitDate).getFullYear() : new Date().getFullYear();
    ensureTemplateYear(tpl, year);

    let finalNumber = number;
    if (!finalNumber) {
      tpl.lastSeq += 1;
      const yy = String(tpl.year).slice(-2);
      finalNumber = `${yy}${String(tpl.lastSeq).padStart(4, "0")}`;
      await tpl.save();
    }

    // detectar nombres en el esquema de Certificate
    const hasUser     = Boolean(Certificate.schema.paths["user"]);
    const hasUserId   = Boolean(Certificate.schema.paths["userId"]);
    const hasCourse   = Boolean(Certificate.schema.paths["course"]);
    const hasCourseId = Boolean(Certificate.schema.paths["courseId"]);

    // Obtener datos del usuario y curso para los campos requeridos
    const User = require("../models/User");
    const Course = require("../models/Course");
    
    const user = await User.findById(userId).lean();
    const course = await Course.findById(courseId).lean();
    
    if (!user || !course) {
      return res.status(404).json({ mensaje: "Usuario o curso no encontrado" });
    }

    const certDoc = {
      template: tpl._id,
      emitDate: emitDate ? new Date(emitDate) : new Date(),
      number: finalNumber,
      // Campos requeridos para el Certificate
      studentName: `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Estudiante',
      courseTitle: course.titulo || 'Curso',
      hours: horasPorCurso(course.titulo),
      dateText: fechaLarga(emitDate || new Date()),
      managerName: tpl.gerenteNombre || 'Director Académico',
      backgroundUrlUsed: tpl.backgroundUrl || '',
      firmaUrlUsed: tpl.firmaUrl || '',
    };
    if (hasUser) certDoc.user = userId; else if (hasUserId) certDoc.userId = userId;
    if (hasCourse) certDoc.course = courseId; else if (hasCourseId) certDoc.courseId = courseId;

    const cert = await Certificate.create(certDoc);

    res.status(201).json({ mensaje: "Certificado emitido", certificado: cert });
  } catch (e) {
    res.status(500).json({ mensaje: "Error al emitir certificado", error: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("user", "nombre apellido correo")
      .populate("course", "titulo")
      .populate("userId", "nombre apellido correo")
      .populate("courseId", "titulo");
    if (!cert) return res.status(404).json({ mensaje: "No encontrado" });
    res.json(cert);
  } catch (e) {
    res.status(500).json({ mensaje: "Error al obtener certificado", error: e.message });
  }
};

exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id; // ID del usuario autenticado

    const certificates = await Certificate.find({
      $or: [{ user: userId }, { userId: userId }], // Buscar por 'user' o 'userId'
    })
      .populate("course", "titulo") // Popular el curso
      .populate("template", "backgroundUrl firmaUrl gerenteNombre") // Popular la plantilla
      .lean(); // Obtener objetos JS planos

    res.json(certificates);
  } catch (error) {
    console.error("❌ getMyCertificates:", error);
    res.status(500).json({ mensaje: "Error al obtener mis certificados", error: error.message });
  }
};

// ---------------- PDF ----------------

exports.renderPdf = async (req, res) => {
  console.log("🔍 renderPdf llamado con ID:", req.params.id);
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("user", "nombre apellido correo")
      .populate("course", "titulo")
      .populate("template");

    if (!cert) return res.status(404).send("Certificado no encontrado");

    const pdfDir = path.join(__dirname, "..", "uploads", "certificados");
    const pdfPath = path.join(pdfDir, `cert-${cert._id}.pdf`);

    if (fs.existsSync(pdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      return fs.createReadStream(pdfPath).pipe(res);
    }

    await fs.promises.mkdir(pdfDir, { recursive: true });

    const userDoc   = cert.user || cert.userId;
    const courseDoc = cert.course || cert.courseId;

    const alumnoNombre = [userDoc?.nombre, userDoc?.apellido].filter(Boolean).join(" ") || "Nombre del alumno";
    const cursoTitulo  = courseDoc?.titulo || "Nombre del curso";
    const horas        = horasPorCurso(cursoTitulo);
    const numero       = cert.number || "";
    const anio         = new Date(cert.emitDate || Date.now()).getFullYear();
    const bioCode      = `BIO-${anio}`;
    const fechaTxt     = fechaLarga(cert.emitDate);
    const gerente      = cert.template?.gerenteNombre || "Gerente General";
    const fondoUrl     = cert.template?.backgroundUrl || "";
    const firmaUrl     = cert.template?.firmaUrl || "";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    if (fondoUrl) {
      try {
        console.log(`🎨 Intentando cargar imagen de fondo: ${fondoUrl}`);
        const bgBytes = await fetchImageBytes(fondoUrl);
        if (!bgBytes) {
          console.log(`❌ No se pudo obtener bytes de la imagen: ${fondoUrl}`);
        } else {
          console.log(`✅ Imagen cargada exitosamente, tamaño: ${bgBytes.length} bytes`);
          const isPng = fondoUrl.toLowerCase().endsWith(".png");
          const bgImg = isPng ? await pdfDoc.embedPng(bgBytes) : await pdfDoc.embedJpg(bgBytes);
          page.drawImage(bgImg, { x: 0, y: 0, width, height });
          console.log(`🖼️ Imagen de fondo aplicada al PDF`);
        }
      } catch (error) {
        console.error(`❌ Error al cargar imagen de fondo:`, error.message);
      }
    } else {
      console.log(`⚠️ No hay URL de imagen de fondo configurada`);
    }

    function drawCenter(text, y, font, size, color = rgb(0,0,0)) {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
    }

    let y = height - 170;
    if (numero) { drawCenter(String(numero), y, fontBold, 22); y -= 24; }
    drawCenter(bioCode, y, fontBold, 12); y -= 24;
    drawCenter("Certificado de aprobación para:", y, fontRegular, 12); y -= 30;
    drawCenter(alumnoNombre.toUpperCase(), y, fontBold, 20); y -= 36;

    drawCenter("Por haber completado satisfactoriamente el curso:", y, fontRegular, 11); y -= 16;
    drawCenter(cursoTitulo, y, fontBold, 12); y -= 16;
    drawCenter(`con una duración de ${horas} horas académicas.`, y, fontRegular, 11); y -= 40;

    page.drawText(fechaTxt, { x: 40, y: 40, size: 9, font: fontRegular });

    if (firmaUrl) {
      try {
        const fBytes = await fetchImageBytes(firmaUrl);
        const isPng = firmaUrl.toLowerCase().endsWith(".png");
        const fImg = isPng ? await pdfDoc.embedPng(fBytes) : await pdfDoc.embedJpg(fBytes);
        const fw = 180;
        const scale = fw / fImg.width;
        const fh = fImg.height * scale;
        const fx = width - fw - 60;
        const fy = 70;
        page.drawImage(fImg, { x: fx, y: fy, width: fw, height: fh });
        page.drawLine({ start: { x: fx, y: 62 }, end: { x: fx + fw, y: 62 }, thickness: 1, color: rgb(0.1,0.1,0.1) });
        const gw = fontRegular.widthOfTextAtSize(gerente, 10);
        page.drawText(gerente, { x: fx + (fw - gw) / 2, y: 49, size: 10, font: fontRegular });
        const cargo = "Gerente General";
        const cw = fontRegular.widthOfTextAtSize(cargo, 9);
        page.drawText(cargo, { x: fx + (fw - cw) / 2, y: 36, size: 9, font: fontRegular, color: rgb(0.4,0.4,0.4) });
      } catch (_) {}
    }

    const bytes = await pdfDoc.save();
    await fs.promises.writeFile(pdfPath, bytes);
    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(pdfPath).pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).send("No se pudo generar el PDF");
  }
};

// ------- asegurar por asignación (acepta assignmentId o userId+courseId) -------

exports.ensureForAssignment = async (req, res) => {
  try {
    let { assignmentId, userId, courseId } = req.body || {};

    // 1) Si vino assignmentId, usarlo. Si no, permitir userId+courseId.
    let asg = null;

    if (assignmentId) {
      if (!mongoose.isValidObjectId(assignmentId)) {
        return res.status(400).json({ ok: false, mensaje: "assignmentId inválido" });
      }
      asg = await Assignment.findById(assignmentId).lean();
      if (!asg) {
        return res.status(404).json({ ok: false, mensaje: "Asignación no encontrada" });
      }
      userId   = asg.user || asg.userId || asg.usuario || asg.alumno || asg.estudiante || userId;
      courseId = asg.course || asg.courseId || asg.curso || courseId;
    } else {
      // Fallback: userId + courseId
      if (!userId || !courseId) {
        return res.status(400).json({
          ok: false,
          mensaje: "Falta assignmentId o (userId y courseId)",
        });
      }
      // intentar localizar una asignación que los relacione (con distintos nombres de campo)
      asg = await Assignment.findOne({
        $or: [
          { user: userId,   course: courseId },
          { userId: userId, course: courseId },
          { user: userId,   courseId: courseId },
          { userId: userId, courseId: courseId },
          { usuario: userId, curso: courseId },
          { alumno: userId,  curso: courseId },
        ],
      }).lean();
      // si no existe, seguimos sin asg (pero más abajo validamos aprobación)
    }

    if (!userId || !courseId) {
      return res.status(400).json({ ok: false, mensaje: "No se pudo resolver userId y courseId" });
    }

    // Obtener datos del usuario y curso para los campos requeridos
    const User = require("../models/User");
    const Course = require("../models/Course");
    
    const user = await User.findById(userId).lean();
    const course = await Course.findById(courseId).lean();
    
    if (!user || !course) {
      return res.status(404).json({ ok: false, mensaje: "Usuario o curso no encontrado" });
    }

    // 2) Validar aprobado usando la info disponible
    let passed = false;
    if (asg) {
      if (typeof asg.passed === "boolean") {
        passed = asg.passed;
      } else if (
        typeof asg.lastScore === "number" &&
        typeof asg.lastTotal === "number" &&
        asg.lastTotal > 0
      ) {
        const cut = Math.ceil(asg.lastTotal * 0.7);
        passed = asg.lastScore >= cut;
      } else if (
        typeof asg.lastCorrect === "number" &&
        typeof asg.lastTotal === "number"
      ) {
        passed = asg.lastCorrect >= 12;
      }
    }

    if (!passed) {
      return res.status(400).json({ ok: false, mensaje: "El estudiante no aprobó aún" });
    }

    // 3) Si ya existe (user+course), devolverlo
    const already = await Certificate.findOne({
      $or: [
        { user: userId,   course: courseId },
        { userId: userId, courseId: courseId },
      ],
    });
    if (already) {
      return res.json({ ok: true, certificate: already });
    }

    // 4) Tomar plantilla + correlativo por año
    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    const now = new Date();
    const year = now.getFullYear();
    if (tpl.year !== year) {
      tpl.year = year;
      tpl.lastSeq = 0;
    }
    tpl.lastSeq += 1;
    await tpl.save();
    const yy = String(tpl.year).slice(-2);
    const number = `${yy}${String(tpl.lastSeq).padStart(4, "0")}`;

    // 5) Respetar cómo está definido tu esquema de Certificate
    const hasUser     = Boolean(Certificate.schema.paths["user"]);
    const hasUserId   = Boolean(Certificate.schema.paths["userId"]);
    const hasCourse   = Boolean(Certificate.schema.paths["course"]);
    const hasCourseId = Boolean(Certificate.schema.paths["courseId"]);

    const certDoc = {
      template: tpl._id,
      emitDate: emitDate ? new Date(emitDate) : new Date(),
      number,
    };
    if (hasUser)      certDoc.user    = userId;    else if (hasUserId)   certDoc.userId   = userId;
    if (hasCourse)    certDoc.course  = courseId;  else if (hasCourseId) certDoc.courseId = courseId;

    const cert = await Certificate.create(certDoc);

    return res.json({ ok: true, certificate: cert });
  } catch (e) {
    console.error("ensureForAssignment:", e);
    return res.status(500).json({ ok: false, mensaje: "Error al generar certificado", error: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("user", "nombre apellido correo")
      .populate("course", "titulo")
      .populate("userId", "nombre apellido correo")
      .populate("courseId", "titulo");
    if (!cert) return res.status(404).json({ mensaje: "No encontrado" });
    res.json(cert);
  } catch (e) {
    res.status(500).json({ mensaje: "Error al obtener certificado", error: e.message });
  }
};

// ---------------- PDF ----------------

exports.renderPdf = async (req, res) => {
  console.log("🔍 renderPdf llamado con ID:", req.params.id);
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("user", "nombre apellido correo")
      .populate("course", "titulo")
      .populate("template");

    if (!cert) return res.status(404).send("Certificado no encontrado");

    const pdfDir = path.join(__dirname, "..", "uploads", "certificados");
    const pdfPath = path.join(pdfDir, `cert-${cert._id}.pdf`);

    if (fs.existsSync(pdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      return fs.createReadStream(pdfPath).pipe(res);
    }

    await fs.promises.mkdir(pdfDir, { recursive: true });

    const userDoc   = cert.user || cert.userId;
    const courseDoc = cert.course || cert.courseId;

    const alumnoNombre = [userDoc?.nombre, userDoc?.apellido].filter(Boolean).join(" ") || "Nombre del alumno";
    const cursoTitulo  = courseDoc?.titulo || "Nombre del curso";
    const horas        = horasPorCurso(cursoTitulo);
    const numero       = cert.number || "";
    const anio         = new Date(cert.emitDate || Date.now()).getFullYear();
    const bioCode      = `BIO-${anio}`;
    const fechaTxt     = fechaLarga(cert.emitDate);
    const gerente      = cert.template?.gerenteNombre || "Gerente General";
    const fondoUrl     = cert.template?.backgroundUrl || "";
    const firmaUrl     = cert.template?.firmaUrl || "";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    if (fondoUrl) {
      try {
        console.log(`🎨 Intentando cargar imagen de fondo: ${fondoUrl}`);
        const bgBytes = await fetchImageBytes(fondoUrl);
        if (!bgBytes) {
          console.log(`❌ No se pudo obtener bytes de la imagen: ${fondoUrl}`);
        } else {
          console.log(`✅ Imagen cargada exitosamente, tamaño: ${bgBytes.length} bytes`);
          const isPng = fondoUrl.toLowerCase().endsWith(".png");
          const bgImg = isPng ? await pdfDoc.embedPng(bgBytes) : await pdfDoc.embedJpg(bgBytes);
          page.drawImage(bgImg, { x: 0, y: 0, width, height });
          console.log(`🖼️ Imagen de fondo aplicada al PDF`);
        }
      } catch (error) {
        console.error(`❌ Error al cargar imagen de fondo:`, error.message);
      }
    } else {
      console.log(`⚠️ No hay URL de imagen de fondo configurada`);
    }

    function drawCenter(text, y, font, size, color = rgb(0,0,0)) {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
    }

    let y = height - 170;
    if (numero) { drawCenter(String(numero), y, fontBold, 22); y -= 24; }
    drawCenter(bioCode, y, fontBold, 12); y -= 24;
    drawCenter("Certificado de aprobación para:", y, fontRegular, 12); y -= 30;
    drawCenter(alumnoNombre.toUpperCase(), y, fontBold, 20); y -= 36;

    drawCenter("Por haber completado satisfactoriamente el curso:", y, fontRegular, 11); y -= 16;
    drawCenter(cursoTitulo, y, fontBold, 12); y -= 16;
    drawCenter(`con una duración de ${horas} horas académicas.`, y, fontRegular, 11); y -= 40;

    page.drawText(fechaTxt, { x: 40, y: 40, size: 9, font: fontRegular });

    if (firmaUrl) {
      try {
        const fBytes = await fetchImageBytes(firmaUrl);
        const isPng = firmaUrl.toLowerCase().endsWith(".png");
        const fImg = isPng ? await pdfDoc.embedPng(fBytes) : await pdfDoc.embedJpg(fBytes);
        const fw = 180;
        const scale = fw / fImg.width;
        const fh = fImg.height * scale;
        const fx = width - fw - 60;
        const fy = 70;
        page.drawImage(fImg, { x: fx, y: fy, width: fw, height: fh });
        page.drawLine({ start: { x: fx, y: 62 }, end: { x: fx + fw, y: 62 }, thickness: 1, color: rgb(0.1,0.1,0.1) });
        const gw = fontRegular.widthOfTextAtSize(gerente, 10);
        page.drawText(gerente, { x: fx + (fw - gw) / 2, y: 49, size: 10, font: fontRegular });
        const cargo = "Gerente General";
        const cw = fontRegular.widthOfTextAtSize(cargo, 9);
        page.drawText(cargo, { x: fx + (fw - cw) / 2, y: 36, size: 9, font: fontRegular, color: rgb(0.4,0.4,0.4) });
      } catch (_) {}
    }

    const bytes = await pdfDoc.save();
    await fs.promises.writeFile(pdfPath, bytes);
    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(pdfPath).pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).send("No se pudo generar el PDF");
  }
};

// ------- asegurar por asignación (acepta assignmentId o userId+courseId) -------

exports.ensureForAssignment = async (req, res) => {
  try {
    let { assignmentId, userId, courseId } = req.body || {};

    // 1) Si vino assignmentId, usarlo. Si no, permitir userId+courseId.
    let asg = null;

    if (assignmentId) {
      if (!mongoose.isValidObjectId(assignmentId)) {
        return res.status(400).json({ ok: false, mensaje: "assignmentId inválido" });
      }
      asg = await Assignment.findById(assignmentId).lean();
      if (!asg) {
        return res.status(404).json({ ok: false, mensaje: "Asignación no encontrada" });
      }
      userId   = asg.user || asg.userId || asg.usuario || asg.alumno || asg.estudiante || userId;
      courseId = asg.course || asg.courseId || asg.curso || courseId;
    } else {
      // Fallback: userId + courseId
      if (!userId || !courseId) {
        return res.status(400).json({
          ok: false,
          mensaje: "Falta assignmentId o (userId y courseId)",
        });
      }
      // intentar localizar una asignación que los relacione (con distintos nombres de campo)
      asg = await Assignment.findOne({
        $or: [
          { user: userId,   course: courseId },
          { userId: userId, course: courseId },
          { user: userId,   courseId: courseId },
          { userId: userId, courseId: courseId },
          { usuario: userId, curso: courseId },
          { alumno: userId,  curso: courseId },
        ],
      }).lean();
      // si no existe, seguimos sin asg (pero más abajo validamos aprobación)
    }

    if (!userId || !courseId) {
      return res.status(400).json({ ok: false, mensaje: "No se pudo resolver userId y courseId" });
    }

    // Obtener datos del usuario y curso para los campos requeridos
    const User = require("../models/User");
    const Course = require("../models/Course");
    
    const user = await User.findById(userId).lean();
    const course = await Course.findById(courseId).lean();
    
    if (!user || !course) {
      return res.status(404).json({ ok: false, mensaje: "Usuario o curso no encontrado" });
    }

    // 2) Validar aprobado usando la info disponible
    let passed = false;
    if (asg) {
      if (typeof asg.passed === "boolean") {
        passed = asg.passed;
      } else if (
        typeof asg.lastScore === "number" &&
        typeof asg.lastTotal === "number" &&
        asg.lastTotal > 0
      ) {
        const cut = Math.ceil(asg.lastTotal * 0.7);
        passed = asg.lastScore >= cut;
      } else if (
        typeof asg.lastCorrect === "number" &&
        typeof asg.lastTotal === "number"
      ) {
        passed = asg.lastCorrect >= 12;
      }
    }

    if (!passed) {
      return res.status(400).json({ ok: false, mensaje: "El estudiante no aprobó aún" });
    }

    // 3) Si ya existe (user+course), devolverlo
    const already = await Certificate.findOne({
      $or: [
        { user: userId,   course: courseId },
        { userId: userId, courseId: courseId },
      ],
    });
    if (already) {
      return res.json({ ok: true, certificate: already });
    }

    // 4) Tomar plantilla + correlativo por año
    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    const now = new Date();
    const year = now.getFullYear();
    if (tpl.year !== year) {
      tpl.year = year;
      tpl.lastSeq = 0;
    }
    tpl.lastSeq += 1;
    await tpl.save();
    const yy = String(tpl.year).slice(-2);
    const number = `${yy}${String(tpl.lastSeq).padStart(4, "0")}`;

    // 5) Respetar cómo está definido tu esquema de Certificate
    const hasUser     = Boolean(Certificate.schema.paths["user"]);
    const hasUserId   = Boolean(Certificate.schema.paths["userId"]);
    const hasCourse   = Boolean(Certificate.schema.paths["course"]);
    const hasCourseId = Boolean(Certificate.schema.paths["courseId"]);

    const certDoc = {
      template: tpl._id,
      emitDate: now,
      number,
      // Campos requeridos para el Certificate
      studentName: `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Estudiante',
      courseTitle: course.titulo || 'Curso',
      hours: horasPorCurso(course.titulo),
      dateText: fechaLarga(now),
      managerName: tpl.gerenteNombre || 'Director Académico',
      backgroundUrlUsed: tpl.backgroundUrl || '',
      firmaUrlUsed: tpl.firmaUrl || '',
    };
    if (hasUser)      certDoc.user    = userId;    else if (hasUserId)   certDoc.userId   = userId;
    if (hasCourse)    certDoc.course  = courseId;  else if (hasCourseId) certDoc.courseId = courseId;

    const cert = await Certificate.create(certDoc);

    return res.json({ ok: true, certificate: cert });
  } catch (e) {
    console.error("ensureForAssignment:", e);
    return res.status(500).json({ ok: false, mensaje: "Error al generar certificado", error: e.message });
  }
};


exports.getCertificatesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Buscando certificados para userId:", userId);
    
    const certificates = await Certificate.find({ user: userId })
      .populate("course", "titulo categoria")
      .sort({ createdAt: -1 });
    console.log("📋 Certificados encontrados para usuario:", certificates.length);
    
    res.json(certificates);
  } catch (e) {
    console.error("❌ Error en getCertificatesByUser:", e);
    res.status(500).json({ mensaje: "Error al obtener certificados del usuario", error: e.message });
  }
};
