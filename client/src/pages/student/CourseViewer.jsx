// client/src/pages/student/CourseViewer.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAssignmentDetail } from "../../services/assignments";
import { ChevronLeft, FileText, GraduationCap, X } from "lucide-react";

export default function CourseViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState({ titulo: "Curso", pdfUrl: "", examId: null });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const a = await getAssignmentDetail(id);
        const titulo = a?.course?.titulo || a?.curso?.titulo || "Curso";
        const pdfUrl = a?.course?.pdfUrl || a?.curso?.pdfUrl || a?.course?.materialUrl || "";
        const examId = a?.exam?._id || a?.examen?._id || null;
        setInfo({ titulo, pdfUrl, examId });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Móvil/Desktop Responsive */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3">
          {/* Móvil: Layout vertical */}
          <div className="block sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                <ChevronLeft size={16} /> Volver
              </button>
              
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!info.examId}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  info.examId
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                title={info.examId ? "Realizar examen" : "Este curso no tiene examen asignado"}
              >
                <GraduationCap size={16} />
                Examen
              </button>
            </div>
            
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2 text-center">
              <FileText size={18} /> 
              <span className="line-clamp-2">{info.titulo}</span>
            </h1>
          </div>

          {/* Desktop: Layout horizontal */}
          <div className="hidden sm:flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            <h1 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={18} /> {info.titulo}
            </h1>

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
        </div>
      </div>

      {/* Visor PDF - Abre en nueva pestaña como en admin */}
      <div className="flex-1 p-4 sm:p-6">
        {info.pdfUrl ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-8 sm:p-12">
            <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
              <div className="bg-green-100 p-6 rounded-full">
                <FileText size={64} className="text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Material del Curso</h3>
                <p className="text-gray-600 mb-6">El PDF está listo para visualizarse</p>
              </div>
              <a
                href={info.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium w-full sm:w-auto justify-center"
              >
                <FileText size={20} />
                Ver PDF del Curso
              </a>
              <p className="text-sm text-gray-500 text-center">El PDF se abrirá en una nueva pestaña</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-10 text-center text-gray-600">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No hay material disponible</h3>
            <p className="text-sm">No se encontró material PDF para este curso.</p>
          </div>
        )}
      </div>

      {/* Modal de confirmación - Responsive */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 pr-4">¿Listo para el examen?</h3>
                <button 
                  className="p-1 rounded-full hover:bg-gray-100 flex-shrink-0" 
                  onClick={() => setConfirmOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                Confirma que has leído el material. Al continuar, iniciarás el examen.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button 
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50 order-2 sm:order-1" 
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => navigate(`/homeuser/exam/${info.examId}?assign=${id}`)}
                  disabled={!info.examId}
                  className={`px-4 py-2 rounded-lg order-1 sm:order-2 ${
                    info.examId 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  Iniciar Examen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
