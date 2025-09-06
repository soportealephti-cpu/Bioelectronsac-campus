// client/src/pages/Certificados.jsx
import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import {
  getCertificateTemplate,
  updateCertificateTemplate,
  emitCertificate,
  getNextCertificateNumber,
} from "../services/certificates";
import { listUsers } from "../services/users"; // Corregido
import { listCourses } from "../services/courses"; // Corregido
import { Eye } from "lucide-react";

function formatearFechaLarga(isoDate) {
  if (!isoDate) return "";
  const meses = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
  ];
  const d = new Date(isoDate);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  return `Lima, ${dia} de ${mes} de ${anio}`;
}

export default function Certificados() {
  const [tpl, setTpl] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    userId: "",
    courseId: "",
    number: "",
    emitDate: new Date().toISOString().substring(0, 10),
    gerenteNombre: "",
    backgroundFile: null,
    firmaFile: null,
  });

  const [preview, setPreview] = useState({ backgroundUrl: "", firmaUrl: "" });
  const [toast, setToast] = useState(null);
  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  const loadAll = async () => {
    try {
      const [tplRes, usersRes, coursesRes] = await Promise.all([
        getCertificateTemplate(),
        listUsers(), // Corregido
        listCourses(), // Corregido
      ]);

      setTpl(tplRes);
      setForm((f) => ({ ...f, gerenteNombre: tplRes.gerenteNombre || "" }));
      setPreview({
        backgroundUrl: tplRes.backgroundUrl || "",
        firmaUrl: tplRes.firmaUrl || "",
      });

      setUsers(Array.isArray(usersRes) ? usersRes : []); // Corregido
      setCourses(Array.isArray(coursesRes) ? coursesRes : []); // Corregido
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudieron cargar datos");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Autollenar correlativo (string) cuando cambia el año de la fecha
  useEffect(() => {
    const y = form.emitDate
      ? new Date(form.emitDate).getFullYear()
      : new Date().getFullYear();

    (async () => {
      try {
        const n = await getNextCertificateNumber(y); // ✅ devuelve string
        if (n) setForm((s) => ({ ...s, number: n }));
      } catch (err) {
        console.error("getNextCertificateNumber failed:", err?.response?.data || err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.emitDate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onFile = (name) => (e) => {
    const file = e.target.files?.[0] || null;
    setForm((s) => ({ ...s, [name]: file }));
    if (name === "backgroundFile" && file) {
      setPreview((p) => ({ ...p, backgroundUrl: URL.createObjectURL(file) }));
    }
    if (name === "firmaFile" && file) {
      setPreview((p) => ({ ...p, firmaUrl: URL.createObjectURL(file) }));
    }
  };

  const saveTemplate = async () => {
    try {
      await updateCertificateTemplate({               // ✅
        gerenteNombre: form.gerenteNombre,
        backgroundFile: form.backgroundFile || undefined,
        firmaFile: form.firmaFile || undefined,
      });
      await loadAll();
      showToast("success", "Plantilla actualizada");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo actualizar la plantilla");
    }
  };

  const emitir = async () => {
    if (!form.userId || !form.courseId) {
      showToast("warn", "Selecciona alumno y curso");
      return;
    }
    try {
      await emitCertificate({
        userId: form.userId,
        courseId: form.courseId,
        number: form.number || undefined, // si lo dejas vacío, backend genera
        emitDate: form.emitDate,
      });
      showToast("success", "Certificado emitido");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo emitir el certificado");
    }
  };

  // Datos dinámicos para la previa
  const alumno = users.find((u) => u._id === form.userId);
  const curso = courses.find((c) => c._id === form.courseId);

  const alumnoNombre = (() => {
    const n = alumno?.nombre || "";
    const ap = alumno?.apellido || "";
    return n && ap ? `${n} ${ap}` : n || "Nombre del alumno";
  })();

  const cursoTitulo = curso?.titulo || "Nombre del curso";
  const gerente = form.gerenteNombre || "Gerente General";
  const fechaLarga = formatearFechaLarga(form.emitDate);

  const horas = (() => {
    const t = (cursoTitulo || "").toLowerCase();
    if (t.includes("actualización")) return 5;
    if (t.includes("oficial de protección radiológica")) return 50;
    return 20;
  })();

  const openPreviewTab = () => {
    const bg = preview.backgroundUrl || tpl?.backgroundUrl || "";
    const firma = preview.firmaUrl || tpl?.firmaUrl || "";
    const bigNumber = form.number || "";

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Vista previa certificado</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  :root { --pad: 14%; }
  body{margin:0;background:#f6f7f8;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto}
  .wrap{width:90vw;max-width:1100px;margin:24px auto;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:16px;}
  .canvas{position:relative;width:100%;aspect-ratio:1.414/1;background:#f9fafb;border-radius:8px;overflow:hidden}
  .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .layer{position:absolute;inset:0;padding:var(--pad);font-size:14px;color:#111}
  .top{width:100%;text-align:center;margin-top:7%}
  .num{font-weight:800;font-size:26px;margin-bottom:6px}
  .bio{font-weight:700;font-size:14px}
  .title{margin-top:6px;font-size:15px}
  .alumno{margin-top:2px;font-weight:800;font-size:28px}
  .texto{margin-top:8px;font-size:14px;line-height:1.35}
  .texto b{font-weight:700}
  .fecha{position:absolute;left:7%;bottom:9%;font-size:12px}
  .firmaBox{position:absolute;right:12%;bottom:7%;display:flex;flex-direction:column;align-items:center}
  .firmaImg{height:70px;object-fit:contain;margin-bottom:-8px}
  .line{border-top:1px solid #222;width:220px;margin-top:2px}
  .gerente{margin-top:6px;font-size:12px}
  .cargo{font-size:11px;color:#6b7280}
</style>
</head>
<body>
  <div class="wrap">
    <div class="canvas">
      ${bg ? `<img class="bg" src="${bg}"/>` : ``}
      <div class="layer">
        <div class="top">
          <div class="num">CERTIFICADO N°${bigNumber}</div>
          <div class="bio">BIO-2025</div>
          <div class="title">Certificado de aprobación para:</div>
          <div class="alumno">${alumnoNombre}</div>
          <div class="texto">
            Por haber completado satisfactoriamente el curso:
            <b> ${cursoTitulo}</b> con una duración de
            <b> ${horas}</b> horas académicas.
          </div>
        </div>

        <div class="fecha">${fechaLarga}</div>

        <div class="firmaBox">
          ${firma ? `<img class="firmaImg" src="${firma}"/>` : ``}
          <div class="line"></div>
          <div class="gerente">${gerente}</div>
          <div class="cargo">Gerente General</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 sm:mb-6">Certificados</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Formulario */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">Datos</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Alumno</label>
              <select
                name="userId"
                value={form.userId}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccione…</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.nombre}
                    {u.apellido ? ` ${u.apellido}` : ""} — {u.correo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Curso</label>
              <select
                name="courseId"
                value={form.courseId}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccione…</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Número (opcional)</label>
                <input
                  name="number"
                  value={form.number}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="N°"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Fecha de emisión</label>
                <input
                  type="date"
                  name="emitDate"
                  value={form.emitDate}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Representante (Gerente)</label>
              <input
                name="gerenteNombre"
                value={form.gerenteNombre}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Cambiar fondo (PNG/JPG)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={onFile("backgroundFile")}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Cambiar firma (PNG/JPG)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={onFile("firmaFile")}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveTemplate}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Guardar plantilla
              </button>
              <button
                onClick={emitir}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Emitir certificado
              </button>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Vista previa</h2>
            <button
              onClick={openPreviewTab}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border hover:bg-gray-50"
              title="Ver en otra pestaña"
            >
              <Eye size={16} />
              Ver
            </button>
          </div>

          <div className="relative w-full aspect-[1.414/1] border rounded overflow-hidden bg-gray-50">
            {/* fondo */}
            {preview.backgroundUrl ? (
              <img
                src={preview.backgroundUrl}
                alt="fondo"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : tpl?.backgroundUrl ? (
              <img
                src={tpl.backgroundUrl}
                alt="fondo"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                (Sube un fondo PNG/JPG)
              </div>
            )}

            {/* overlays */}
            <div className="absolute inset-0 p-[14%]">
              {/* bloque superior */}
              <div className="w-full text-center mt-[7%]">
                <div className="text-xl font-extrabold leading-none mb-1">
                  CERTIFICADO N°{form.number || ""}
                </div>
                <div className="font-bold text-xs">BIO-2025</div>
                <div className="mt-1 text-[13px]">Certificado de aprobación para:</div>
                <div className="text-2xl font-extrabold leading-tight">
                  {alumnoNombre}
                </div>
                <div className="mt-2 text-[13px] leading-snug">
                  Por haber completado satisfactoriamente el curso:
                  <span className="font-semibold"> {cursoTitulo}</span> con una
                  duración de
                  <span className="font-semibold"> {horas}</span> horas académicas.
                </div>
              </div>

              {/* fecha abajo izquierda */}
              <div className="absolute left-[7%] bottom-[9%] text-[12px]">
                {fechaLarga}
              </div>

              {/* firma + gerente abajo derecha */}
              <div className="absolute right-[28%] bottom-[10%] flex flex-col items-center">
                {(preview.firmaUrl || tpl?.firmaUrl) && (
                  <img
                    src={preview.firmaUrl || tpl?.firmaUrl}
                    alt="firma"
                    className="h-14 object-contain -mb-2"
                  />
                )}
                <div className="border-t w-56" />
                <div className="text-[12px] mt-1">{gerente}</div>
                <div className="text-[11px] text-gray-500">Gerente General</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            * La posición de los textos es fija por ahora.
          </p>
        </div>
      </div>
    </div>
  );
}
