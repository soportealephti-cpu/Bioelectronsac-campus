// src/pages/student/Courses.jsx
import { useEffect, useMemo, useState } from "react";
import { FileText, Award, BookOpen, Layers, Clock, CheckCircle, AlertCircle, ArrowRight, ClipboardList } from "lucide-react";
import Toast from "../../components/Toast";
import { fetchSummary } from "../../services/summary";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function Courses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("me") || "{}"); } catch { return {}; }
  }, []);

  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSummary();
        const now = new Date();
        const mine = (Array.isArray(data) ? data : []).filter(
          (r) => (r?.usuario?.correo || "").toLowerCase() === (me?.correo || "").toLowerCase()
            && (!r.expiresAt || new Date(r.expiresAt) > now)
        );
        setRows(mine);
      } catch (e) {
        console.error(e?.response?.data || e.message);
        showToast("error", "No se pudieron cargar tus cursos");
      } finally {
        setLoading(false);
      }
    })();
  }, [me?.correo]);

  const openPdf = (cert) => {
    if (!cert?.id) return;
    window.open(`${api.defaults.baseURL}/certificates/${cert.id}/pdf`, "_blank");
  };

  // Agrupar cursos por módulo
  const grupos = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      const modulo = r?.curso?.modulo?.trim() || "__sin_modulo__";
      if (!map.has(modulo)) map.set(modulo, []);
      map.get(modulo).push(r);
    });
    // Módulos nombrados primero, "sin módulo" al final
    const entries = Array.from(map.entries());
    const nombrados = entries.filter(([k]) => k !== "__sin_modulo__").sort(([a], [b]) => a.localeCompare(b));
    const sinModulo = entries.filter(([k]) => k === "__sin_modulo__");
    return [...nombrados, ...sinModulo];
  }, [rows]);

  // Días restantes para el vencimiento
  const diasRestantes = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Mis cursos</h2>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
              <div className="h-14 bg-gray-200" />
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map(j => (
                  <div key={j} className="h-28 bg-gray-100 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Mis cursos</h2>
        <div className="bg-white rounded-xl shadow-sm border p-12 flex flex-col items-center text-center">
          <BookOpen size={52} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No tienes cursos asignados</p>
          <p className="text-gray-400 text-sm mt-1">Cuando te asignen un curso, aparecerá aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700">Mis cursos</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {rows.length} curso{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-5">
        {grupos.map(([modulo, cursos]) => {
          const esNombrado = modulo !== "__sin_modulo__";
          const aprobados = cursos.filter(c => !!c.certificado).length;
          const total = cursos.length;
          const progreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;

          return (
            <div key={modulo} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Cabecera del módulo */}
              <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                esNombrado
                  ? "bg-gradient-to-r from-green-600 to-emerald-500"
                  : "bg-gradient-to-r from-gray-500 to-gray-400"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Layers size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-wider font-medium">Módulo</p>
                    <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
                      {esNombrado ? modulo : "Cursos sin módulo"}
                    </h3>
                  </div>
                </div>

                {/* Progreso */}
                <div className="flex flex-col items-start sm:items-end gap-1.5 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-xs font-medium">Progreso</span>
                    <span className="text-white font-bold text-sm">{aprobados}/{total}</span>
                  </div>
                  <div className="w-full sm:w-36 bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                  <span className="text-white/70 text-xs">{progreso}% completado</span>
                </div>
              </div>

              {/* Grid de cursos */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cursos.map((r, idx) => {
                  const aprobado = !!r?.certificado;
                  const examen = r?.examen?.titulo || null;
                  const dias = diasRestantes(r.expiresAt);
                  const pocoDias = dias !== null && dias <= 5;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${
                        aprobado ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"
                      }`}
                    >
                      {/* Título y badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                            aprobado ? "bg-green-100" : "bg-blue-50"
                          }`}>
                            <BookOpen size={15} className={aprobado ? "text-green-600" : "text-blue-500"} />
                          </div>
                          <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                            {r?.curso?.titulo || "-"}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          aprobado
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {aprobado
                            ? <><CheckCircle size={11} /> Aprobado</>
                            : <><AlertCircle size={11} /> Pendiente</>
                          }
                        </span>
                      </div>

                      {/* Examen y vencimiento */}
                      <div className="space-y-1.5">
                        {examen && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Award size={13} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{examen}</span>
                          </div>
                        )}
                        {dias !== null && (
                          <div className={`flex items-center gap-1.5 text-xs ${pocoDias ? "text-orange-600 font-medium" : "text-gray-400"}`}>
                            <Clock size={13} className="flex-shrink-0" />
                            <span>
                              {pocoDias
                                ? `⚠ Vence en ${dias} día${dias !== 1 ? "s" : ""}`
                                : `Vence en ${dias} día${dias !== 1 ? "s" : ""}`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2 mt-auto pt-1">
                        {/* Botón principal: examen (si no aprobado) o certificado (si aprobado) */}
                        {!aprobado ? (
                          <button
                            onClick={() => navigate(`/homeuser/courses/${r.assignmentId}`)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm group"
                          >
                            <ClipboardList size={14} />
                            <span>Ir al Examen</span>
                            <ArrowRight size={14} className="ml-auto group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openPdf(r.certificado)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm"
                            title={`Ver certificado #${r.certificado.number || ""}`}
                          >
                            <FileText size={14} /> Ver certificado
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
