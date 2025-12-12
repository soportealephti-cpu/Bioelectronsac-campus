const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fetch = require('node-fetch');

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

// Función para descargar fuentes con respaldo local
async function downloadFontFromGoogleFonts(fontFamily, weight = '400') {
  try {
    console.log(`📥 Intentando obtener fuente: ${fontFamily} - ${weight}`);
    
    // Primero intentar con URLs de Google Fonts más robustas
    const fontUrls = {
      'Montanapha': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap',
      'Garet': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
      'Asangha': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap',
      'ArchTH': 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;700&display=swap'
    };

    // URLs directas de fuentes woff2 como respaldo
    const directFontUrls = {
      'Montanapha': 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.woff2',
      'Garet': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
      'Asangha': 'https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4taVQUwaEQbjB_mQ.woff2',
      'ArchTH': 'https://fonts.gstatic.com/s/archivo/v19/k3kQo8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaHFxiUAEM.woff2'
    };

    const directUrl = directFontUrls[fontFamily];
    if (!directUrl) {
      console.log(`⚠️ Fuente ${fontFamily} no configurada, usando fuente estándar`);
      return null;
    }

    try {
      const response = await fetch(directUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const fontBuffer = await response.arrayBuffer();
      console.log(`✅ Fuente ${fontFamily} descargada directamente: ${fontBuffer.byteLength} bytes`);
      return Buffer.from(fontBuffer);
    } catch (fetchError) {
      console.log(`⚠️ No se pudo descargar fuente ${fontFamily}, usando respaldo estándar:`, fetchError.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error general obteniendo fuente ${fontFamily}:`, error.message);
    return null;
  }
}

// Cache de fuentes para evitar descargas múltiples
const fontCache = new Map();

function fechaLarga(iso) {
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  let d;

  if (iso) {
    // 👇 CORREGIDO: Manejar zona horaria correctamente
    // Si viene como string tipo "2025-01-17", parsearlo como fecha local, no UTC
    if (typeof iso === 'string' && iso.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = iso.split('-').map(Number);
      d = new Date(year, month - 1, day); // Crear fecha en zona horaria local
    } else {
      d = new Date(iso);
    }
  } else {
    d = new Date();
  }

  return `Lima, ${String(d.getDate()).padStart(2, "0")} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function horasPorCurso(titulo = "") {
  const t = (titulo || "").toLowerCase();
  if (t.includes("actualización")) return 5;
  if (t.includes("oficial de protección radiológica")) return 50;
  return 20;
}

async function fetchImageBytes(url) {
  if (!url) {
    console.log(`⚠️ fetchImageBytes: URL vacía o null`);
    return null;
  }
  
  try {
    // Si es una URL HTTP/HTTPS localhost, convertir a path de archivo
    if (/^https?:\/\/localhost:\d+\/uploads\//i.test(url)) {
      const pathPart = url.replace(/^https?:\/\/localhost:\d+/, '');
      const filePath = path.join(__dirname, '..', pathPart);
      console.log(`🖼️ Convirtiendo URL local a path: ${url} -> ${filePath}`);
      
      // Verificar si el archivo existe
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Archivo no existe: ${filePath}`);
        return null;
      }
      
      const bytes = await fs.promises.readFile(filePath);
      console.log(`✅ Archivo leído exitosamente: ${bytes.length} bytes`);
      
      // ✨ Detectar tipo de archivo por signature
      const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && 
                     bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
      
      if (isWebP) {
        console.log(`🔄 Archivo WebP detectado, no es compatible con PDF. Necesita convertirse.`);
        return null; // Por ahora devolvemos null para WebP
      }
      
      return bytes;
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
    if (!fs.existsSync(url)) {
      console.log(`❌ Archivo no existe: ${url}`);
      return null;
    }
    return fs.promises.readFile(url);
  } catch (error) {
    console.error(`❌ Error en fetchImageBytes para ${url}:`, error);
    return null;
  }
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
    console.log(`🔧 updateTemplate llamado`);
    console.log(`   - req.body:`, req.body);
    console.log(`   - req.files:`, req.files);

    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    console.log(`📋 Plantilla actual:`, { backgroundUrl: tpl.backgroundUrl, firmaUrl: tpl.firmaUrl, gerenteNombre: tpl.gerenteNombre, lastSeq: tpl.lastSeq });

    if (req.body?.gerenteNombre !== undefined) {
      tpl.gerenteNombre = req.body.gerenteNombre;
      console.log(`✏️ Actualizando nombre gerente: ${req.body.gerenteNombre}`);
    }

    // 👇 NUEVO: Permitir actualizar lastSeq (número inicial)
    if (req.body?.lastSeq !== undefined) {
      const newLastSeq = Number(req.body.lastSeq);
      if (!isNaN(newLastSeq) && newLastSeq >= 0) {
        tpl.lastSeq = newLastSeq;
        console.log(`🔢 Actualizando lastSeq (número inicial): ${newLastSeq}`);
      }
    }

    if (req.files?.background?.[0]) {
      const file = req.files.background[0];
      const newUrl = `${baseUrl(req)}/uploads/certificados/${file.filename}`;
      tpl.backgroundUrl = newUrl;
      console.log(`🖼️ Actualizando background: ${newUrl}`);
    } else {
      console.log(`⚠️ No se recibió archivo background`);
    }

    if (req.files?.firma?.[0]) {
      const file = req.files.firma[0];
      const newUrl = `${baseUrl(req)}/uploads/certificados/${file.filename}`;
      tpl.firmaUrl = newUrl;
      console.log(`✍️ Actualizando firma: ${newUrl}`);
    } else {
      console.log(`⚠️ No se recibió archivo firma`);
    }

    await tpl.save();
    console.log(`💾 Plantilla guardada:`, { backgroundUrl: tpl.backgroundUrl, firmaUrl: tpl.firmaUrl, gerenteNombre: tpl.gerenteNombre, lastSeq: tpl.lastSeq });

    res.json({ mensaje: "Plantilla actualizada", template: tpl });
  } catch (e) {
    console.error(`❌ Error updateTemplate:`, e);
    res.status(500).json({ mensaje: "Error al actualizar plantilla", error: e.message });
  }
};

exports.nextNumber = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    ensureTemplateYear(tpl, year);

    // 👇 CORREGIDO: Devolver el SIGUIENTE número (lastSeq + 1)
    const nextNum = tpl.lastSeq + 1;
    const number = `${String(nextNum).padStart(3, "0")}`;
    res.json({ number, lastSeq: tpl.lastSeq }); // También enviar lastSeq para debugging
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

    // ✅ Verificar si ya existe un certificado para este usuario y curso
    const existingCertificate = await Certificate.findOne({
      $or: [
        { user: userId, course: courseId },
        { userId: userId, courseId: courseId }
      ]
    });

    if (existingCertificate) {
      return res.status(400).json({ 
        mensaje: "Usuario ya cuenta con certificado", 
        detalle: "Este usuario ya tiene un certificado emitido para este curso",
        certificadoId: existingCertificate._id
      });
    }

    let tpl = await CertificateTemplate.findOne();
    if (!tpl) tpl = await CertificateTemplate.create({});
    const year = emitDate ? new Date(emitDate).getFullYear() : new Date().getFullYear();
    ensureTemplateYear(tpl, year);

    let finalNumber = number;
    if (!finalNumber) {
      tpl.lastSeq += 1;
      // Cambiado a 3 dígitos sin prefijo de año
      finalNumber = `${String(tpl.lastSeq).padStart(3, "0")}`;
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

    // ✨ SIEMPRE usar la plantilla ACTUAL, no la que se guardó en el certificado
    let currentTemplate = await CertificateTemplate.findOne();
    if (!currentTemplate) currentTemplate = await CertificateTemplate.create({});

    const pdfDir = path.join(__dirname, "..", "uploads", "certificados");
    const pdfPath = path.join(pdfDir, `cert-${cert._id}.pdf`);

    // ✨ Eliminar PDF existente para regenerar con plantilla actual
    if (fs.existsSync(pdfPath)) {
      console.log(`🗑️ Eliminando PDF existente para regenerar: ${pdfPath}`);
      fs.unlinkSync(pdfPath);
    }

    await fs.promises.mkdir(pdfDir, { recursive: true });

    const userDoc   = cert.user || cert.userId;
    const courseDoc = cert.course || cert.courseId;

    // 👇 USAR LOS DATOS GUARDADOS EN EL CERTIFICADO (snapshot inmutable)
    const alumnoNombre = cert.studentName || [userDoc?.nombre, userDoc?.apellido].filter(Boolean).join(" ") || "Nombre del alumno";
    const cursoTitulo  = cert.courseTitle || courseDoc?.titulo || "Nombre del curso";
    const horas        = cert.hours || horasPorCurso(cursoTitulo);
    const numero       = cert.number || "";
    const anio         = new Date(cert.emitDate || Date.now()).getFullYear();
    const bioCode      = `BIO-${anio}`;
    const fechaTxt     = cert.dateText || fechaLarga(cert.emitDate); // 👈 USAR dateText guardado
    const gerente      = cert.managerName || currentTemplate?.gerenteNombre || "Gerente General";
    const fondoUrl     = currentTemplate?.backgroundUrl || "";
    const firmaUrl     = currentTemplate?.firmaUrl || "";

    console.log(`📋 Datos del certificado ${cert._id}:`);
    console.log(`   - emitDate (raw): ${cert.emitDate}`);
    console.log(`   - emitDate (type): ${typeof cert.emitDate}`);
    console.log(`   - fechaTxt: ${fechaTxt}`);
    console.log(`   - alumnoNombre: ${alumnoNombre}`);
    console.log(`   - cursoTitulo: ${cursoTitulo}`);
    console.log(`   - numero: ${numero}`);
    console.log(`   - backgroundUrl: ${fondoUrl}`);
    console.log(`   - firmaUrl: ${firmaUrl}`);
    console.log(`   - gerenteNombre: ${gerente}`);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape
    const { width, height } = page.getSize();

    // Cargar fuentes personalizadas
    let fontMontanapha, fontGaret, fontAsangha, fontArchTH;
    let fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    try {
      // Intentar cargar fuentes personalizadas
      const montanaphaBytes = await downloadFontFromGoogleFonts('Montanapha');
      if (montanaphaBytes) {
        fontMontanapha = await pdfDoc.embedFont(montanaphaBytes);
      }

      const garetBytes = await downloadFontFromGoogleFonts('Garet'); 
      if (garetBytes) {
        fontGaret = await pdfDoc.embedFont(garetBytes);
      }

      const asanghaBytes = await downloadFontFromGoogleFonts('Asangha');
      if (asanghaBytes) {
        fontAsangha = await pdfDoc.embedFont(asanghaBytes);
      }

      const archTHBytes = await downloadFontFromGoogleFonts('ArchTH');
      if (archTHBytes) {
        fontArchTH = await pdfDoc.embedFont(archTHBytes);
      }
    } catch (error) {
      console.error('❌ Error cargando fuentes personalizadas:', error.message);
      console.log('⚠️ Usando fuentes estándar como respaldo');
    }

    if (fondoUrl) {
      try {
        console.log(`🎨 Intentando cargar imagen de fondo: ${fondoUrl}`);
        const bgBytes = await fetchImageBytes(fondoUrl);
        if (!bgBytes) {
          console.log(`❌ No se pudo obtener bytes de la imagen: ${fondoUrl}`);
        } else {
          console.log(`✅ Imagen cargada exitosamente, tamaño: ${bgBytes.length} bytes`);
          
          // ✨ Detectar formato real del archivo por sus bytes, no por extensión
          let bgImg;
          const isPngByBytes = bgBytes[0] === 0x89 && bgBytes[1] === 0x50 && bgBytes[2] === 0x4E && bgBytes[3] === 0x47;
          
          if (isPngByBytes) {
            console.log(`🎨 Detectado como PNG real`);
            bgImg = await pdfDoc.embedPng(bgBytes);
          } else {
            console.log(`🎨 Detectado como JPEG (o intentando como JPEG)`);
            bgImg = await pdfDoc.embedJpg(bgBytes);
          }
          
          page.drawImage(bgImg, { x: 0, y: 0, width, height });
          console.log(`🖼️ Imagen de fondo aplicada al PDF exitosamente`);
        }
      } catch (error) {
        console.error(`❌ Error al cargar imagen de fondo:`, error);
        // ✨ Si falla, intentar con el otro formato
        try {
          console.log(`🔄 Intentando con formato alternativo...`);
          const bgBytes = await fetchImageBytes(fondoUrl);
          if (bgBytes) {
            const bgImg = await pdfDoc.embedJpg(bgBytes);
            page.drawImage(bgImg, { x: 0, y: 0, width, height });
            console.log(`🖼️ Imagen de fondo aplicada como JPEG`);
          }
        } catch (secondError) {
          console.error(`❌ Error también con formato alternativo:`, secondError.message);
        }
      }
    } else {
      console.log(`⚠️ No hay URL de imagen de fondo configurada`);
    }

    function drawCenter(text, y, font, size, color = rgb(0,0,0)) {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
    }

    // 🎯 AQUÍ PUEDES MODIFICAR TODAS LAS POSICIONES, TAMAÑOS Y ESPACIADO
    let y = height - 170; // ⬅️ Posición inicial desde arriba (más alto = más arriba)

    // CERTIFICADO N° - PUEDES CAMBIAR EL TAMAÑO AQUÍ
    if (numero) {
      const certificateFont = fontMontanapha || fontBold;
      drawCenter(`CERTIFICADO N° ${String(numero)}`, y, certificateFont, 28); // ⬅️ AUMENTADO de 26 a 28
      y -= 32; // ⬅️ Espaciado después del número
    }

    // BIO 2025 - PUEDES CAMBIAR EL TAMAÑO AQUÍ
    const bioFont = fontGaret || fontBold;
    drawCenter(bioCode.toUpperCase(), y, bioFont, 16); // ⬅️ AUMENTADO de 14 a 16
    y -= 30; // ⬅️ Espaciado después de BIO 2025

    // TEXTO "Certificado de aprobación para:" - PUEDES CAMBIAR EL TAMAÑO AQUÍ
    const certificateTextFont = fontAsangha || fontRegular;
    drawCenter("Certificado de aprobación para:", y, certificateTextFont, 16); // ⬅️ AUMENTADO de 14 a 16
    y -= 35; // ⬅️ Espaciado después

    // NOMBRE DEL ALUMNO - PUEDES CAMBIAR EL TAMAÑO AQUÍ
    drawCenter(alumnoNombre.toUpperCase(), y, fontBold, 26); // ⬅️ AUMENTADO de 24 a 26
    y -= 45; // ⬅️ Espaciado después del nombre

    // DESCRIPCIÓN "Por haber completado..." - PUEDES CAMBIAR EL TAMAÑO AQUÍ
    drawCenter("Por haber completado satisfactoriamente el curso:", y, certificateTextFont, 15); // ⬅️ AUMENTADO de 13 a 15
    y -= 20; // ⬅️ Espaciado entre líneas

    // TÍTULO DEL CURSO - PUEDES CAMBIAR EL TAMAÑO AQUÍ
    drawCenter(cursoTitulo, y, fontBold, 17); // ⬅️ AUMENTADO de 15 a 17
    y -= 20; // ⬅️ Espaciado

    // HORAS ACADÉMICAS - PUEDES CAMBIAR EL TAMAÑO AQUÍ
    drawCenter(`con una duración de ${horas} horas académicas.`, y, certificateTextFont, 15); // ⬅️ AUMENTADO de 13 a 15
    y -= 50; // ⬅️ Espaciado final

    // 📅 FECHA - PUEDES CAMBIAR POSICIÓN Y TAMAÑO AQUÍ
    const dateFont = fontArchTH || fontRegular;
    page.drawText(fechaTxt, {
      x: 40,   // ⬅️ Posición horizontal (más grande = más a la derecha)
      y: 60,   // ⬅️ SUBIDA de 40 a 60 (más arriba)
      size: 12, // ⬅️ Tamaño de la fuente
      font: dateFont,
      color: rgb(0, 0, 0) // ⬅️ Color negro para mejor visibilidad
    });

    // ✍️ FIRMA Y NOMBRES - PUEDES CAMBIAR POSICIÓN Y TAMAÑOS AQUÍ
    if (firmaUrl) {
      try {
        const fBytes = await fetchImageBytes(firmaUrl);
        const isPng = firmaUrl.toLowerCase().endsWith(".png");
        const fImg = isPng ? await pdfDoc.embedPng(fBytes) : await pdfDoc.embedJpg(fBytes);

        // 📏 TAMAÑO Y POSICIÓN DE LA FIRMA
        const fw = 200; // ⬅️ Ancho de la firma
        const scale = fw / fImg.width;
        const fh = fImg.height * scale;
        const fx = width - fw - 80; // ⬅️ Posición horizontal
        const fy = 105; // ⬅️ Posición vertical (SUBIDO de 80 a 105 - más arriba)

        page.drawImage(fImg, { x: fx, y: fy, width: fw, height: fh });
        page.drawLine({ start: { x: fx, y: 97 }, end: { x: fx + fw, y: 97 }, thickness: 1, color: rgb(0.1,0.1,0.1) }); // Línea también subida

        // 👤 NOMBRE DEL GERENTE - PUEDES CAMBIAR EL TAMAÑO AQUÍ
        const gw = fontRegular.widthOfTextAtSize(gerente, 12);
        page.drawText(gerente, {
          x: fx + (fw - gw) / 2,
          y: 83, // ⬅️ SUBIDO de 58 a 83
          size: 12,
          font: fontRegular
        });

        // 💼 CARGO "Gerente General" - PUEDES CAMBIAR EL TAMAÑO AQUÍ
        const cargo = "Gerente General";
        const cw = fontRegular.widthOfTextAtSize(cargo, 10);
        page.drawText(cargo, {
          x: fx + (fw - cw) / 2,
          y: 69, // ⬅️ SUBIDO de 44 a 69
          size: 10,
          font: fontRegular,
          color: rgb(0.4,0.4,0.4)
        });
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
    // Cambiado a 3 dígitos sin prefijo de año
    const number = `${String(tpl.lastSeq).padStart(3, "0")}`;

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