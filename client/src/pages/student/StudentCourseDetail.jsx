// client/src/pages/student/CourseViewer.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAssignmentDetail } from "../../services/assignments";
import { ChevronLeft, FileText, GraduationCap, X } from "lucide-react";

const API = "http://localhost:5000";

export default function CourseViewer() {
  const { id } = useParams(); // assignmentId
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState({ titulo: "Curso", pdfUrl: "", examId: null });
  const [confirmOpen, setConfirmOpen] = useState(false);

  // por si más adelante lo usas
  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("authUser") || "{}"); }
    catch { return {}; }
  }, []);

  const normalizeUrl = (u) => {
    if (!u) return "";
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${API}${u.startsWith("/") ? u : `/${u}`}`;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const a = await getAssignmentDetail(id);
        const titulo = a?.course?.titulo || a?.curso?.titulo || "Curso";
        const rawPdf =
          a?.course?.pdfUrl || a?.curso?.pdfUrl || a?.course?.materialUrl || "";
        const pdfUrl = normalizeUrl(rawPdf);
        const examId = a?.exam?._id || a?.examen?._id || null;
        setInfo({ titulo, pdfUrl, examId });
      } catch (e) {
        console.error("getAssignmentDetail error:", e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const goExam = () => {
    if (!info.examId) return;
    navigate(`/homeuser/exam/${info.examId}?assign=${id}`);
  };

  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-4 flex items-center justify-between">
        {/* Izquierda: volver */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        {/* Centro: título */}
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={18} /> {info.titulo}
        </h2>

        {/* Derecha: botón Realizar examen (reemplaza “Contando páginas…”) */}
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!info.examId}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            info.examId
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          title={info.examId ? "Realizar examen" : "Este curso no tiene examen asignado"}
        >
          <GraduationCap size={18} />
          Realizar examen
        </button>
      </div>

      {/* Visor PDF SIN mensajes de CORS en pantalla */}
      <div className="bg-white rounded-xl shadow p-4">
        {info.pdfUrl ? (
          <div className="border rounded-lg overflow-hidden">
            <iframe
              key={info.pdfUrl}
              title="Material del curso"
              src={info.pdfUrl}
              className="w-full"
              style={{ height: "75vh", border: "none" }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border p-10 text-center bg-white text-gray-600">
            No se encontró material PDF para este curso.
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                ¿Listo para rendir el examen?
              </h3>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setConfirmOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-gray-600">
              Confirma que has leído y entendido el material del curso. Al continuar,
              iniciarás el examen.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 rounded border hover:bg-gray-50"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                onClick={goExam}
                disabled={!info.examId}
                className={`px-4 py-2 rounded-lg ${
                  info.examId
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Sí, realizar examen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
