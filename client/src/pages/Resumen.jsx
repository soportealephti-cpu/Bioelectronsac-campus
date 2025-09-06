// client/src/pages/Resumen.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Check, X, ChevronDown, FileText, Loader2 } from "lucide-react";
import Toast from "../components/Toast";
import { fetchSummary, updateAssignmentStatus } from "../services/summary";

const API = "http://localhost:5000/api";

export default function Resumen() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");      // desactiva botones de una fila mientras guarda
  const [pdfOpeningId, setPdfOpeningId] = useState(""); // spinner mientras abrimos PDF (UX)
  const [toast, setToast] = useState(null);
  const [selectedByUser, setSelectedByUser] = useState({}); // { correo: assignmentId }

  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  // Cargar datos
  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSummary();
      setRaw(Array.isArray(data) ? data : []);
      // preseleccionar primer curso por usuario
      const firstSel = {};
      (Array.isArray(data) ? data : []).forEach((r) => {
        const correo = r?.usuario?.correo || "-";
        if (!firstSel[correo]) firstSel[correo] = r.assignmentId || r._id;
      });
      setSelectedByUser(firstSel);
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo cargar el resumen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Agrupar por usuario
  const grouped = useMemo(() => {
    const map = new Map();
    raw.forEach((r) => {
      const correo = r?.usuario?.correo || "-";
      if (!map.has(correo)) map.set(correo, []);
      map.get(correo).push(r);
    });
    return map;
  }, [raw]);

  // Badge simple
  const Badge = ({ ok, children }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {children}
    </span>
  );

  // Aprobar / Pendiente (en backend se emite certificado si corresponde)
  const setAprobado = async (row, aprobado) => {
    const id = row.assignmentId || row._id || "";
    try {
      setSavingId(id);
      await updateAssignmentStatus(id, { aprobado });
      await cargar();
      showToast("success", aprobado ? "Marcado como aprobado" : "Marcado como pendiente");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo actualizar la relación");
    } finally {
      setSavingId("");
    }
  };

  // Abrir PDF (solo si ya existe cert.id)
  const openPdf = (cert) => {
    if (!cert?.id) return;
    try {
      setPdfOpeningId(cert.id);
      // OJO: tu backend monta /api/certificates
      window.open(`${API}/certificates/${cert.id}/pdf`, "_blank", "noopener,noreferrer");
    } finally {
      // pequeño delay visual para que el spinner se vea
      setTimeout(() => setPdfOpeningId(""), 600);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">Resumen</h1>
        <button
          onClick={cargar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60 w-full sm:w-auto justify-center"
          disabled={loading}
          title="Recargar"
        >
          <RefreshCcw size={18} />
          <span className="hidden sm:inline">Recargar</span>
          <span className="sm:hidden">Actualizar</span>
        </button>
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden lg:block overflow-x-auto shadow rounded-lg bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="bg-green-100 text-gray-700">
              <th className="px-4 py-3 text-left font-semibold">Alumno</th>
              <th className="px-4 py-3 text-left font-semibold">Correo</th>
              <th className="px-4 py-3 text-left font-semibold">Curso</th>
              <th className="px-4 py-3 text-left font-semibold">Examen</th>
              <th className="px-4 py-3 text-center font-semibold">Último resultado</th>
              <th className="px-4 py-3 text-center font-semibold">Estado</th>
              <th className="px-4 py-3 text-center font-semibold w-48">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    Cargando…
                  </div>
                </td>
              </tr>
            )}

            {!loading && grouped.size === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No hay registros.
                </td>
              </tr>
            )}

            {!loading &&
              Array.from(grouped.entries()).map(([correo, asignaciones]) => {
                const alumno = asignaciones[0]?.usuario?.nombre || "-";
                const selectedId =
                  selectedByUser[correo] || asignaciones[0]?.assignmentId || asignaciones[0]?._id;

                const row =
                  asignaciones.find((a) => (a.assignmentId || a._id) === selectedId) ||
                  asignaciones[0];

                const examen = row?.examen?.titulo || "-";
                const ultimo = row?.ultimoResultado || "-";
                const aprobado = !!row?.certificado; // aprobado si ya existe certificado
                const id = row.assignmentId || row._id;

                return (
                  <tr key={`${correo}-${id}`} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{alumno}</td>
                    <td className="px-4 py-3 text-sm">{correo}</td>
                    <td className="px-4 py-3">
                      <div className="relative inline-flex">
                        <select
                          className="appearance-none border rounded-md px-3 py-2 pr-8 bg-white"
                          value={selectedId}
                          onChange={(e) =>
                            setSelectedByUser((s) => ({ ...s, [correo]: e.target.value }))
                          }
                        >
                          {asignaciones.map((a) => (
                            <option key={a.assignmentId || a._id} value={a.assignmentId || a._id}>
                              {a.curso?.titulo || "-"}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-2">{examen}</td>

                    <td className="px-4 py-2 text-center">
                      {ultimo === "aprobado" ? (
                        <Badge ok>aprobado</Badge>
                      ) : ultimo === "desaprobado" ? (
                        <Badge ok={false}>desaprobado</Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-center">
                      <Badge ok={aprobado}>{aprobado ? "aprobado" : "pendiente"}</Badge>
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 justify-center">
                        {/* ✔️ aprobar */}
                        <button
                          className="p-2 rounded border hover:bg-green-50 text-green-700 disabled:opacity-50"
                          onClick={() => setAprobado(row, true)}
                          disabled={savingId === id}
                          title="Marcar como aprobado"
                        >
                          {savingId === id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        </button>

                        {/* ❌ pendiente (desaprobado manual) */}
                        <button
                          className="p-2 rounded border hover:bg-red-50 text-red-700 disabled:opacity-50"
                          onClick={() => setAprobado(row, false)}
                          disabled={savingId === id}
                          title="Marcar como pendiente"
                        >
                          {savingId === id ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                        </button>

                        {/* PDF (solo si hay certificado) */}
                        {row?.certificado?.id && (
                          <button
                            className="p-2 rounded border hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                            onClick={() => openPdf(row.certificado)}
                            disabled={pdfOpeningId === row.certificado.id}
                            title={`Ver certificado #${row.certificado.number || ""}`}
                          >
                            {pdfOpeningId === row.certificado.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <FileText size={18} />
                            )}
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

      {/* Vista Móvil/Tablet - Tarjetas */}
      <div className="lg:hidden space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            Cargando registros...
          </div>
        )}
        {!loading && grouped.size === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            No hay registros.
          </div>
        )}
        {!loading &&
          Array.from(grouped.entries()).map(([correo, asignaciones]) => {
            const alumno = asignaciones[0]?.usuario?.nombre || "-";
            const selectedId =
              selectedByUser[correo] || asignaciones[0]?.assignmentId || asignaciones[0]?._id;

            const row =
              asignaciones.find((a) => (a.assignmentId || a._id) === selectedId) ||
              asignaciones[0];

            const examen = row?.examen?.titulo || "-";
            const ultimo = row?.ultimoResultado || "-";
            const aprobado = !!row?.certificado;
            const id = row.assignmentId || row._id;

            return (
              <div key={`${correo}-${id}`} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg">{alumno}</h3>
                    <p className="text-sm text-gray-600 break-all">{correo}</p>
                  </div>
                  <Badge ok={aprobado}>{aprobado ? "aprobado" : "pendiente"}</Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Curso</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                      value={selectedId}
                      onChange={(e) =>
                        setSelectedByUser((s) => ({ ...s, [correo]: e.target.value }))
                      }
                    >
                      {asignaciones.map((a) => (
                        <option key={a.assignmentId || a._id} value={a.assignmentId || a._id}>
                          {a.curso?.titulo || "-"}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-xs font-medium text-gray-700 mb-1">Examen</span>
                      <span className="text-sm text-gray-900">{examen}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-700 mb-1">Último resultado</span>
                      {ultimo === "aprobado" ? (
                        <Badge ok>aprobado</Badge>
                      ) : ultimo === "desaprobado" ? (
                        <Badge ok={false}>desaprobado</Badge>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 text-sm"
                    onClick={() => setAprobado(row, true)}
                    disabled={savingId === id}
                    title="Marcar como aprobado"
                  >
                    {savingId === id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Aprobar
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm"
                    onClick={() => setAprobado(row, false)}
                    disabled={savingId === id}
                    title="Marcar como pendiente"
                  >
                    {savingId === id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    Pendiente
                  </button>
                  {row?.certificado?.id && (
                    <button
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => openPdf(row.certificado)}
                      disabled={pdfOpeningId === row.certificado.id}
                      title={`Ver certificado #${row.certificado.number || ""}`}
                    >
                      {pdfOpeningId === row.certificado.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <FileText size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
