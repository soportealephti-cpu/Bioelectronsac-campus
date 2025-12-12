// client/src/pages/Resumen.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Check, X, ChevronDown, FileText, Loader2, Search, Users, CheckCircle, Clock } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState(""); // Búsqueda

  // Paginación
  const REGISTROS_POR_PAGINA = 8;
  const [paginaActual, setPaginaActual] = useState(1);

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
      // preseleccionar primer módulo (curso principal) por usuario
      const firstSel = {};
      (Array.isArray(data) ? data : []).forEach((r) => {
        const correo = r?.usuario?.correo || "-";
        const esModulo = !r?.curso?.modulo || r?.curso?.modulo === "";
        // Solo preseleccionar si es un módulo
        if (!firstSel[correo] && esModulo) {
          firstSel[correo] = r.assignmentId || r._id;
        }
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

  // Agrupar por usuario y filtrar solo módulos (cursos principales)
  const grouped = useMemo(() => {
    const map = new Map();
    raw.forEach((r) => {
      const correo = r?.usuario?.correo || "-";
      // Solo incluir si es un módulo (curso principal sin campo modulo o modulo vacío)
      const esModulo = !r?.curso?.modulo || r?.curso?.modulo === "";

      if (esModulo) {
        if (!map.has(correo)) map.set(correo, []);
        map.get(correo).push(r);
      }
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

  // Filtrado por búsqueda
  const gruposArray = Array.from(grouped.entries());
  const gruposFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return gruposArray;
    const term = searchTerm.toLowerCase();
    return gruposArray.filter(([correo, asignaciones]) => {
      const alumno = (asignaciones[0]?.usuario?.nombre || "").toLowerCase();
      const apellido = (asignaciones[0]?.usuario?.apellido || "").toLowerCase();
      return alumno.includes(term) || apellido.includes(term) || correo.toLowerCase().includes(term);
    });
  }, [gruposArray, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    let totalAlumnos = grouped.size;
    let aprobados = 0;
    let pendientes = 0;

    gruposArray.forEach(([, asignaciones]) => {
      const tieneAprobado = asignaciones.some(a => !!a.certificado);
      if (tieneAprobado) aprobados++;
      else pendientes++;
    });

    return { totalAlumnos, aprobados, pendientes };
  }, [gruposArray, grouped.size]);

  // Paginación
  const totalPaginas = Math.ceil(gruposFiltrados.length / REGISTROS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const indiceFin = indiceInicio + REGISTROS_POR_PAGINA;
  const gruposPaginados = gruposFiltrados.slice(indiceInicio, indiceFin);

  // Reset página cuando se filtra
  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm]);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generarNumerosPagina = () => {
    const paginas = [];
    const maxPaginasVisibles = 5;

    if (totalPaginas <= maxPaginasVisibles) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      if (paginaActual <= 3) {
        for (let i = 1; i <= 4; i++) paginas.push(i);
        paginas.push('...');
        paginas.push(totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        paginas.push(1);
        paginas.push('...');
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) paginas.push(i);
      } else {
        paginas.push(1);
        paginas.push('...');
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) paginas.push(i);
        paginas.push('...');
        paginas.push(totalPaginas);
      }
    }
    return paginas;
  };

  return (
    <div className="w-full">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 text-center sm:text-left">Resumen General</h1>
        <button
          onClick={cargar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60 w-full sm:w-auto justify-center transition-colors"
          disabled={loading}
          title="Recargar"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Recargar</span>
          <span className="sm:hidden">Actualizar</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Alumnos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAlumnos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Aprobados</p>
              <p className="text-2xl font-bold text-green-700">{stats.aprobados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-orange-700">{stats.pendientes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Mostrando {gruposFiltrados.length} de {gruposArray.length} resultados
          </p>
        )}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>ℹ️ Nota:</strong> Solo se muestran módulos (cursos principales). Los temas y subtemas están agrupados dentro de cada módulo.
          </p>
        </div>
      </div>

      {/* Vista Desktop - Tarjetas mejoradas */}
      <div className="hidden lg:block space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              Cargando registros...
            </div>
          </div>
        )}

        {!loading && gruposFiltrados.length === 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-500">
            {searchTerm ? "No se encontraron resultados." : "No hay registros."}
          </div>
        )}

        {!loading &&
          gruposPaginados.map(([correo, asignaciones]) => {
            const alumno = asignaciones[0]?.usuario?.nombre || "-";
            const apellido = asignaciones[0]?.usuario?.apellido || "";
            const nombreCompleto = `${apellido} ${alumno}`.trim();
            const selectedId =
              selectedByUser[correo] || asignaciones[0]?.assignmentId || asignaciones[0]?._id;

            const row =
              asignaciones.find((a) => (a.assignmentId || a._id) === selectedId) ||
              asignaciones[0];

            const examen = row?.examen?.titulo || "Sin examen asignado";
            const ultimo = row?.ultimoResultado || "-";
            const aprobado = !!row?.certificado;
            const id = row.assignmentId || row._id;

            return (
              <div key={`${correo}-${id}`} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Columna 1: Info del alumno y estado */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{nombreCompleto}</h3>
                        <p className="text-sm text-gray-600 break-all">{correo}</p>
                      </div>
                      <Badge ok={aprobado}>
                        {aprobado ? "Aprobado" : "Pendiente"}
                      </Badge>
                    </div>

                    {/* Selector de módulo */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Módulo seleccionado (Curso Principal)</label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 pr-10 bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm"
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
                          size={18}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Info adicional */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-xs font-medium text-gray-600 mb-1">Examen</span>
                        <span className="text-gray-900">{examen}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-600 mb-1">Último resultado</span>
                        {ultimo === "aprobado" ? (
                          <Badge ok>Aprobado</Badge>
                        ) : ultimo === "desaprobado" ? (
                          <Badge ok={false}>Desaprobado</Badge>
                        ) : (
                          <span className="text-gray-500">Sin intentos</span>
                        )}
                      </div>
                    </div>

                    {/* 👇 NUEVO: Mostrar intentos */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">Intentos realizados:</span>
                        <span className={`font-semibold ${
                          (row?.intentos || 0) >= 3
                            ? "text-red-600"
                            : (row?.intentos || 0) >= 2
                            ? "text-amber-600"
                            : "text-gray-900"
                        }`}>{row?.intentos || 0} de 3</span>
                      </div>
                    </div>
                  </div>

                  {/* Columna 2: Acciones */}
                  <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                    <button
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-4 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 text-sm font-medium transition-colors"
                      onClick={() => setAprobado(row, true)}
                      disabled={savingId === id}
                      title="Marcar como aprobado"
                    >
                      {savingId === id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>Aprobar</span>
                    </button>

                    <button
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-4 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium transition-colors"
                      onClick={() => setAprobado(row, false)}
                      disabled={savingId === id}
                      title="Marcar como pendiente"
                    >
                      {savingId === id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                      <span>Pendiente</span>
                    </button>

                    {row?.certificado?.id && (
                      <button
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
                        onClick={() => openPdf(row.certificado)}
                        disabled={pdfOpeningId === row.certificado.id}
                        title={`Ver certificado #${row.certificado.number || ""}`}
                      >
                        {pdfOpeningId === row.certificado.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <FileText size={16} />
                        )}
                        <span>Certificado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Vista Móvil/Tablet - Tarjetas mejoradas */}
      <div className="lg:hidden space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            Cargando registros...
          </div>
        )}
        {!loading && gruposFiltrados.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            {searchTerm ? "No se encontraron resultados." : "No hay registros."}
          </div>
        )}
        {!loading &&
          gruposPaginados.map(([correo, asignaciones]) => {
            const alumno = asignaciones[0]?.usuario?.nombre || "-";
            const apellido = asignaciones[0]?.usuario?.apellido || "";
            const nombreCompleto = `${apellido} ${alumno}`.trim();
            const selectedId =
              selectedByUser[correo] || asignaciones[0]?.assignmentId || asignaciones[0]?._id;

            const row =
              asignaciones.find((a) => (a.assignmentId || a._id) === selectedId) ||
              asignaciones[0];

            const examen = row?.examen?.titulo || "Sin examen asignado";
            const ultimo = row?.ultimoResultado || "-";
            const aprobado = !!row?.certificado;
            const id = row.assignmentId || row._id;

            return (
              <div key={`${correo}-${id}`} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1">{nombreCompleto}</h3>
                    <p className="text-sm text-gray-600 break-all">{correo}</p>
                  </div>
                  <Badge ok={aprobado}>{aprobado ? "Aprobado" : "Pendiente"}</Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Módulo seleccionado (Curso Principal)</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
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

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="block text-xs font-medium text-gray-600 mb-1">Examen</span>
                      <span className="text-sm text-gray-900">{examen}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-600 mb-1">Último resultado</span>
                      {ultimo === "aprobado" ? (
                        <Badge ok>Aprobado</Badge>
                      ) : ultimo === "desaprobado" ? (
                        <Badge ok={false}>Desaprobado</Badge>
                      ) : (
                        <span className="text-gray-500 text-sm">Sin intentos</span>
                      )}
                    </div>
                  </div>

                  {/* 👇 NUEVO: Mostrar intentos (móvil) */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">Intentos realizados:</span>
                      <span className={`font-semibold ${
                        (row?.intentos || 0) >= 3
                          ? "text-red-600"
                          : (row?.intentos || 0) >= 2
                          ? "text-amber-600"
                          : "text-gray-900"
                      }`}>{row?.intentos || 0} de 3</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 text-sm font-medium transition-colors"
                      onClick={() => setAprobado(row, true)}
                      disabled={savingId === id}
                      title="Marcar como aprobado"
                    >
                      {savingId === id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Aprobar
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium transition-colors"
                      onClick={() => setAprobado(row, false)}
                      disabled={savingId === id}
                      title="Marcar como pendiente"
                    >
                      {savingId === id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                      Pendiente
                    </button>
                  </div>
                  {row?.certificado?.id && (
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
                      onClick={() => openPdf(row.certificado)}
                      disabled={pdfOpeningId === row.certificado.id}
                      title={`Ver certificado #${row.certificado.number || ""}`}
                    >
                      {pdfOpeningId === row.certificado.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <FileText size={16} />
                      )}
                      Ver Certificado
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Paginación */}
      {!loading && gruposFiltrados.length > REGISTROS_POR_PAGINA && (
        <>
          {/* Paginación Desktop */}
          <div className="hidden sm:flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-4 py-2.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Anterior
            </button>

            <div className="flex gap-2">
              {generarNumerosPagina().map((numero, index) => (
                <button
                  key={index}
                  onClick={() => typeof numero === 'number' && cambiarPagina(numero)}
                  disabled={numero === '...'}
                  className={`px-4 py-2.5 rounded-lg border transition-colors font-medium ${
                    numero === paginaActual
                      ? 'bg-green-600 text-white border-green-600'
                      : numero === '...'
                      ? 'cursor-default border-transparent'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {numero}
                </button>
              ))}
            </div>

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-4 py-2.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Siguiente
            </button>
          </div>

          {/* Paginación Móvil */}
          <div className="sm:hidden flex flex-col gap-3 mt-6">
            <div className="flex justify-center items-center gap-2 text-sm text-gray-600 font-medium">
              Página {paginaActual} de {totalPaginas}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="flex-1 px-4 py-2.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Anterior
              </button>
              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="flex-1 px-4 py-2.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
