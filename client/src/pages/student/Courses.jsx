// src/pages/student/Courses.jsx
import { useEffect, useMemo, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import Toast from "../../components/Toast";
import { fetchSummary } from "../../services/summary";

const API = "http://localhost:5000/api";

export default function Courses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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
        const mine = (Array.isArray(data) ? data : []).filter(
          (r) => (r?.usuario?.correo || "").toLowerCase() === (me?.correo || "").toLowerCase()
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
    window.open(`${API}/certificates/${cert.id}/pdf`, "_blank");
  };

  return (
    <div className="space-y-4">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <h2 className="text-xl font-semibold text-gray-700">Mis cursos</h2>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-2 text-left">Curso</th>
              <th className="px-4 py-2 text-left">Examen</th>
              <th className="px-4 py-2 text-center">Estado</th>
              <th className="px-4 py-2 text-center w-40">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Cargando…</td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No tienes cursos asignados.
                </td>
              </tr>
            )}

            {!loading && rows.map((r, idx) => {
              const curso = r?.curso?.titulo || "-";
              const examen = r?.examen?.titulo || "-";
              const aprobado = !!r?.certificado;
              return (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2">{curso}</td>
                  <td className="px-4 py-2">{examen}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${aprobado ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {aprobado ? "Aprobado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {/* Rendir examen (placeholder a futuro) */}
                      <button
                        className="px-3 py-1 rounded border hover:bg-gray-50 text-gray-700 inline-flex items-center gap-1"
                        title="Rendir examen"
                        disabled
                      >
                        <ExternalLink size={16} /> Examen
                      </button>

                      {/* Ver certificado si existe */}
                      {r?.certificado?.id && (
                        <button
                          className="px-3 py-1 rounded border hover:bg-gray-50 text-gray-700 inline-flex items-center gap-1"
                          onClick={() => openPdf(r.certificado)}
                          title={`Ver certificado #${r.certificado.number || ""}`}
                        >
                          <FileText size={16} /> PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
