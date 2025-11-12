// client/src/pages/Cursos.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, X, Pencil, Trash, FileText, ChevronDown, ChevronRight, FolderOpen, Folder, Wand2 } from "lucide-react";
import Toast from "../components/Toast";
import { listCourses, createCourse, updateCourse, deleteCourse } from "../services/courses";

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  // Crear
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ titulo: "", categoria: "", modulo: "", file: null, imagen: null });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState(null);

  // Editar
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({ _id: "", titulo: "", categoria: "", modulo: "", file: null, imagen: null });
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [openEditPreview, setOpenEditPreview] = useState(false);
  const [editImagenPreviewUrl, setEditImagenPreviewUrl] = useState(null);

  // Confirm eliminar
  const [confirm, setConfirm] = useState({ open: false, id: "" });

  // Estado para controlar módulos expandidos/colapsados
  const [expandedModules, setExpandedModules] = useState({});

  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  // Agrupar cursos por módulo
  const cursosAgrupados = useMemo(() => {
    const grupos = {};

    cursos.forEach(curso => {
      const moduloNombre = curso.modulo || "Sin módulo";
      if (!grupos[moduloNombre]) {
        grupos[moduloNombre] = [];
      }
      grupos[moduloNombre].push(curso);
    });

    // Ordenar: primero módulos con nombre, luego "Sin módulo"
    const modulosOrdenados = Object.keys(grupos).sort((a, b) => {
      if (a === "Sin módulo") return 1;
      if (b === "Sin módulo") return -1;
      return a.localeCompare(b);
    });

    return modulosOrdenados.map(modulo => ({
      nombre: modulo,
      cursos: grupos[modulo],
      cantidad: grupos[modulo].length
    }));
  }, [cursos]);

  const cargarCursos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listCourses();
      setCursos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo cargar la lista de cursos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener lista de TÍTULOS de cursos para usar como módulos
  const getCursosComoModulos = () => {
    // Retornar solo los títulos de los cursos (cada curso puede ser un módulo)
    return cursos.map(c => c.titulo).sort();
  };

  // Sugerencias de módulo = Títulos de cursos existentes
  const [moduloSuggestions, setModuloSuggestions] = useState([]);

  const updateModuloSuggestions = () => {
    // Mostrar todos los títulos de cursos como opciones de módulo
    const cursosTitulos = getCursosComoModulos();
    setModuloSuggestions(cursosTitulos);
  };

  // Auto-organización de módulos
  const [showAutoOrganize, setShowAutoOrganize] = useState(false);
  const [autoOrganizeReport, setAutoOrganizeReport] = useState({ updated: 0, unchanged: 0, changes: [] });

  // Función para determinar si un curso es una evaluación
  const isEvaluacion = (curso) => {
    const titulo = curso.titulo.toLowerCase();
    return titulo.includes('evaluacion') || titulo.includes('evaluación') ||
           titulo.includes('examen') || titulo.includes('test');
  };

  // Función para buscar el curso principal de una evaluación
  const findCursoPrincipalParaEvaluacion = (evaluacion) => {
    // Buscar en la categoría si coincide con el título de algún curso
    const categoriaBusqueda = evaluacion.categoria.toLowerCase().trim();

    for (const curso of cursos) {
      if (curso._id === evaluacion._id) continue; // No compararse consigo mismo

      const tituloComparar = curso.titulo.toLowerCase().trim();

      // Si la categoría de la evaluación contiene o es igual al título del curso
      if (categoriaBusqueda.includes(tituloComparar) || tituloComparar.includes(categoriaBusqueda)) {
        return curso.titulo; // Retornar el título exacto del curso
      }
    }

    return null;
  };

  // Función para buscar si un curso es subtema de otro curso principal
  const findCursoPrincipalPorTitulo = (cursoActual) => {
    const tituloActual = cursoActual.titulo.toLowerCase().trim();
    let mejorCoincidencia = null;
    let mayorLongitud = 0;

    for (const curso of cursos) {
      if (curso._id === cursoActual._id) continue; // No compararse consigo mismo

      const tituloPosiblePrincipal = curso.titulo.toLowerCase().trim();

      // Si el título actual contiene el título del otro curso Y ese título es más largo que coincidencias anteriores
      if (tituloActual.includes(tituloPosiblePrincipal) && tituloPosiblePrincipal.length > mayorLongitud) {
        mejorCoincidencia = curso.titulo;
        mayorLongitud = tituloPosiblePrincipal.length;
      }
    }

    return mejorCoincidencia;
  };

  // Función principal de auto-organización
  const autoOrganizarTodos = async () => {
    try {
      setLoading(true);
      const cambios = [];
      let actualizados = 0;
      let sinCambios = 0;

      for (const curso of cursos) {
        let nuevoModulo = null;

        // 1. Si es una evaluación, buscar por categoría
        if (isEvaluacion(curso)) {
          nuevoModulo = findCursoPrincipalParaEvaluacion(curso);
          if (nuevoModulo) {
            cambios.push({
              curso: curso.titulo,
              tipo: 'Evaluación',
              moduloAnterior: curso.modulo || '(vacío)',
              moduloNuevo: nuevoModulo
            });
          }
        }
        // 2. Si no es evaluación, buscar por similitud de título
        else {
          nuevoModulo = findCursoPrincipalPorTitulo(curso);
          if (nuevoModulo) {
            cambios.push({
              curso: curso.titulo,
              tipo: 'Subtema',
              moduloAnterior: curso.modulo || '(vacío)',
              moduloNuevo: nuevoModulo
            });
          }
        }

        // Si encontramos un módulo y es diferente al actual
        if (nuevoModulo && nuevoModulo !== curso.modulo) {
          await updateCourse(curso._id, {
            titulo: curso.titulo,
            categoria: curso.categoria,
            modulo: nuevoModulo
          });
          actualizados++;
        } else {
          sinCambios++;
        }
      }

      setAutoOrganizeReport({ updated: actualizados, unchanged: sinCambios, changes: cambios });
      await cargarCursos();

      if (actualizados > 0) {
        showToast("success", `Auto-organización completada: ${actualizados} curso(s) actualizado(s)`);
      } else {
        showToast("info", "No se encontraron cambios necesarios");
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Error durante la auto-organización");
    } finally {
      setLoading(false);
      setShowAutoOrganize(false);
    }
  };

  useEffect(() => { cargarCursos(); }, [cargarCursos]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setForm((s) => ({ ...s, file: f || null }));
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleEditFile = (e) => {
    const f = e.target.files?.[0];
    setEditData((s) => ({ ...s, file: f || null }));
    setEditPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleImagenFile = (e) => {
    const f = e.target.files?.[0];
    setForm((s) => ({ ...s, imagen: f || null }));
    setImagenPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleEditImagenFile = (e) => {
    const f = e.target.files?.[0];
    setEditData((s) => ({ ...s, imagen: f || null }));
    setEditImagenPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.categoria || !form.file) {
      showToast("warn", "Completa título, categoría y adjunta un PDF");
      return;
    }
    try {
      setLoading(true);
      await createCourse(form);
      setOpenCreate(false);
      setForm({ titulo: "", categoria: "", modulo: "", file: null, imagen: null });
      setPreviewUrl(null);
      setImagenPreviewUrl(null);
      await cargarCursos();
      showToast("success", "Curso creado correctamente");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      const msg = e?.response?.data?.mensaje || "Error al crear curso";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (c) => {
    setEditData({
      _id: c._id,
      titulo: c.titulo,
      categoria: c.categoria,
      modulo: c.modulo || "",
      file: null,
      imagen: null
    });
    setEditPreviewUrl(null);
    setEditImagenPreviewUrl(null);
    setOpenEdit(true);

    // Actualizar sugerencias
    updateModuloSuggestions();
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editData._id) return;
    try {
      setLoading(true);
      await updateCourse(editData._id, {
        titulo: editData.titulo,
        categoria: editData.categoria,
        modulo: editData.modulo,
        file: editData.file || undefined,
        imagen: editData.imagen || undefined,
      });
      setOpenEdit(false);
      await cargarCursos();
      showToast("success", "Curso actualizado");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      const msg = e?.response?.data?.mensaje || "Error al actualizar curso";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => setConfirm({ open: true, id });
  const doDelete = async () => {
    try {
      setLoading(true);
      await deleteCourse(confirm.id);
      setConfirm({ open: false, id: "" });
      await cargarCursos();
      showToast("success", "Curso eliminado");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      const msg = e?.response?.data?.mensaje || "Error al eliminar curso";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 text-center sm:text-left">Gestión de Cursos</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowAutoOrganize(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 text-sm sm:text-base justify-center"
            disabled={loading || cursos.length === 0}
          >
            <Wand2 size={18} />
            <span className="hidden sm:inline">Auto-Organizar Módulos</span>
            <span className="sm:hidden">Auto-Organizar</span>
          </button>
          <button
            onClick={() => {
              setOpenCreate(true);
              updateModuloSuggestions();
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 text-sm sm:text-base justify-center"
            disabled={loading}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Curso</span>
            <span className="sm:hidden">Crear</span>
          </button>
        </div>
      </div>

      {/* Vista Desktop - Agrupada por Módulos */}
      <div className="hidden lg:block space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            Cargando cursos...
          </div>
        )}
        {!loading && cursos.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            No hay cursos registrados.
          </div>
        )}
        {!loading && cursosAgrupados.map((grupo, idx) => {
          const isExpanded = expandedModules[grupo.nombre] !== false; // Por defecto expandido

          // Definir colores específicos para cada módulo
          const colores = [
            { bg: "bg-blue-100/50", hover: "hover:bg-blue-50", icon: "text-blue-600", iconClosed: "text-blue-500" },
            { bg: "bg-purple-100/50", hover: "hover:bg-purple-50", icon: "text-purple-600", iconClosed: "text-purple-500" },
            { bg: "bg-green-100/50", hover: "hover:bg-green-50", icon: "text-green-600", iconClosed: "text-green-500" },
            { bg: "bg-orange-100/50", hover: "hover:bg-orange-50", icon: "text-orange-600", iconClosed: "text-orange-500" },
            { bg: "bg-pink-100/50", hover: "hover:bg-pink-50", icon: "text-pink-600", iconClosed: "text-pink-500" },
            { bg: "bg-indigo-100/50", hover: "hover:bg-indigo-50", icon: "text-indigo-600", iconClosed: "text-indigo-500" },
          ];

          const colorGray = { bg: "bg-gray-100/50", hover: "hover:bg-gray-50", icon: "text-gray-600", iconClosed: "text-gray-500" };
          const colorActual = grupo.nombre === "Sin módulo" ? colorGray : colores[idx % colores.length];

          return (
            <div key={grupo.nombre} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Header del Módulo - Colapsable */}
              <button
                onClick={() => toggleModule(grupo.nombre)}
                className={`w-full px-6 py-4 flex items-center justify-between ${colorActual.bg} ${colorActual.hover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <FolderOpen className={colorActual.icon} size={24} />
                  ) : (
                    <Folder className={colorActual.iconClosed} size={24} />
                  )}
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-800">{grupo.nombre}</h3>
                    <p className="text-sm text-gray-500">{grupo.cantidad} curso{grupo.cantidad !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={20} className="text-gray-600" /> : <ChevronRight size={20} className="text-gray-600" />}
              </button>

              {/* Cursos del Módulo */}
              {isExpanded && (
                <div className="border-t">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700">
                        <th className="px-6 py-3 text-left font-semibold text-sm">Título</th>
                        <th className="px-6 py-3 text-left font-semibold text-sm">Categoría</th>
                        <th className="px-6 py-3 text-center font-semibold text-sm">Imagen</th>
                        <th className="px-6 py-3 text-center font-semibold text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {grupo.cursos.map((c) => (
                        <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{c.titulo}</td>
                          <td className="px-6 py-4 text-gray-600">{c.categoria}</td>
                          <td className="px-6 py-4 text-center">
                            {c.imagenUrl ? (
                              <img
                                src={c.imagenUrl}
                                alt={c.titulo}
                                className="w-12 h-12 object-cover rounded-lg mx-auto cursor-pointer hover:opacity-80"
                                onClick={() => window.open(c.imagenUrl, '_blank')}
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">Sin imagen</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-center">
                              <a
                                href={c.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg border hover:bg-green-50 text-green-600 transition-colors"
                                title="Ver PDF"
                              >
                                <FileText size={18} />
                              </a>
                              <button
                                onClick={() => openEditModal(c)}
                                className="p-2 rounded-lg border hover:bg-blue-50 text-blue-600 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => confirmDelete(c._id)}
                                className="p-2 rounded-lg border hover:bg-red-50 text-red-600 transition-colors"
                                title="Eliminar"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vista Móvil/Tablet - Agrupada por Módulos */}
      <div className="lg:hidden space-y-4">
        {loading && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            Cargando cursos...
          </div>
        )}
        {!loading && cursos.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            No hay cursos registrados.
          </div>
        )}
        {!loading && cursosAgrupados.map((grupo, idx) => {
          const isExpanded = expandedModules[grupo.nombre] !== false;

          // Definir colores específicos para vista móvil
          const coloresMobile = [
            { bg: "bg-blue-100", text: "text-blue-700", icon: "text-blue-600" },
            { bg: "bg-purple-100", text: "text-purple-700", icon: "text-purple-600" },
            { bg: "bg-green-100", text: "text-green-700", icon: "text-green-600" },
            { bg: "bg-orange-100", text: "text-orange-700", icon: "text-orange-600" },
            { bg: "bg-pink-100", text: "text-pink-700", icon: "text-pink-600" },
            { bg: "bg-indigo-100", text: "text-indigo-700", icon: "text-indigo-600" },
          ];

          const colorGrayMobile = { bg: "bg-gray-100", text: "text-gray-700", icon: "text-gray-600" };
          const colorActualMobile = grupo.nombre === "Sin módulo" ? colorGrayMobile : coloresMobile[idx % coloresMobile.length];

          return (
            <div key={grupo.nombre} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Header del Módulo */}
              <button
                onClick={() => toggleModule(grupo.nombre)}
                className={`w-full px-4 py-3 flex items-center justify-between ${colorActualMobile.bg} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <FolderOpen className={colorActualMobile.icon} size={20} />
                  ) : (
                    <Folder className={colorActualMobile.icon} size={20} />
                  )}
                  <div className="text-left">
                    <h3 className={`font-bold text-base ${colorActualMobile.text}`}>{grupo.nombre}</h3>
                    <p className="text-xs text-gray-600">{grupo.cantidad} curso{grupo.cantidad !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={18} className="text-gray-600" /> : <ChevronRight size={18} className="text-gray-600" />}
              </button>

              {/* Cursos del Módulo */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {grupo.cursos.map((c) => (
                    <div key={c._id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2">{c.titulo}</h4>
                          <span className="inline-block text-xs text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                            {c.categoria}
                          </span>
                        </div>
                        {c.imagenUrl && (
                          <img
                            src={c.imagenUrl}
                            alt={c.titulo}
                            className="w-14 h-14 object-cover rounded-lg ml-3 cursor-pointer hover:opacity-80"
                            onClick={() => window.open(c.imagenUrl, '_blank')}
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={c.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 px-3 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-center flex items-center justify-center gap-1"
                        >
                          <FileText size={16} />
                          <span className="text-sm">PDF</span>
                        </a>
                        <button
                          onClick={() => openEditModal(c)}
                          className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(c._id)}
                          className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Modal crear curso */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setOpenCreate(false); setPreviewUrl(null); setImagenPreviewUrl(null); }} className="absolute top-4 right-4 text-gray-600 hover:text-red-500">
              <X size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 pr-8">Nuevo Curso</h2>

            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del Curso</label>
                <input
                  type="text"
                  placeholder="Título del curso"
                  value={form.titulo}
                  onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  placeholder="Categoría"
                  value={form.categoria}
                  onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value }))}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Módulo (opcional - título de otro curso principal)
                </label>
                <input
                  type="text"
                  list="modulo-suggestions-create"
                  placeholder="Selecciona el título del curso principal o deja vacío"
                  value={form.modulo}
                  onChange={(e) => setForm((s) => ({ ...s, modulo: e.target.value }))}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
                <datalist id="modulo-suggestions-create">
                  {moduloSuggestions.map((mod, idx) => (
                    <option key={idx} value={mod} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-2">
                  💡 <strong>Cursos principales:</strong> Dejar vacío. <strong>Temas/Subtemas:</strong> Seleccionar el título del curso al que pertenecen.
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del curso (opcional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImagenFile} 
                  className="w-full text-sm" 
                />
                {imagenPreviewUrl && (
                  <div className="mt-3">
                    <img 
                      src={imagenPreviewUrl} 
                      alt="Vista previa" 
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => window.open(imagenPreviewUrl, '_blank')}
                    />
                  </div>
                )}
                {form.imagen && (
                  <span className="text-xs text-gray-500 break-all mt-2 block">{form.imagen.name}</span>
                )}
              </div>

              <div className="border border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Archivo PDF</label>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={handleFile} 
                  className="w-full text-sm" 
                  required 
                />
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setOpenPreview(true)} 
                    disabled={!previewUrl} 
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
                  >
                    Vista previa
                  </button>
                  {form.file && (
                    <span className="text-xs text-gray-500 break-all">{form.file.name}</span>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium transition-colors" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando...
                  </div>
                ) : (
                  "Registrar Curso"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar curso */}
      {openEdit && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setOpenEdit(false); setEditPreviewUrl(null); setEditImagenPreviewUrl(null); }} className="absolute top-4 right-4 text-gray-600 hover:text-red-500">
              <X size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 pr-8">Editar Curso</h2>

            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del Curso</label>
                <input
                  type="text"
                  placeholder="Título del curso"
                  value={editData.titulo}
                  onChange={(e) => setEditData((s) => ({ ...s, titulo: e.target.value }))}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  placeholder="Categoría"
                  value={editData.categoria}
                  onChange={(e) => setEditData((s) => ({ ...s, categoria: e.target.value }))}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Módulo (opcional - título de otro curso principal)
                </label>
                <input
                  type="text"
                  list="modulo-suggestions-edit"
                  placeholder="Selecciona el título del curso principal o deja vacío"
                  value={editData.modulo}
                  onChange={(e) => setEditData((s) => ({ ...s, modulo: e.target.value }))}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
                <datalist id="modulo-suggestions-edit">
                  {moduloSuggestions.map((mod, idx) => (
                    <option key={idx} value={mod} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-2">
                  💡 <strong>Cursos principales:</strong> Dejar vacío. <strong>Temas/Subtemas:</strong> Seleccionar el título del curso al que pertenecen.
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del curso (opcional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleEditImagenFile} 
                  className="w-full text-sm" 
                />
                {editImagenPreviewUrl && (
                  <div className="mt-3">
                    <img 
                      src={editImagenPreviewUrl} 
                      alt="Vista previa" 
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => window.open(editImagenPreviewUrl, '_blank')}
                    />
                  </div>
                )}
                {editData.imagen && (
                  <span className="text-xs text-gray-500 break-all mt-2 block">{editData.imagen.name}</span>
                )}
              </div>

              <div className="border border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reemplazar PDF (opcional)</label>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={handleEditFile} 
                  className="w-full text-sm" 
                />
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setOpenEditPreview(true)} 
                    disabled={!editPreviewUrl} 
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
                  >
                    Vista previa
                  </button>
                  {editData.file && (
                    <span className="text-xs text-gray-500 break-all">{editData.file.name}</span>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium transition-colors" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando...
                  </div>
                ) : (
                  "Actualizar Curso"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirm.open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar curso?</h3>
            <p className="text-gray-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setConfirm({ open: false, id: "" })} className="px-4 py-2 rounded-lg border hover:bg-gray-100 order-2 sm:order-1">Cancelar</button>
              <button onClick={doDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 order-1 sm:order-2">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa PDF crear */}
      {openPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white w-[90%] h-[90%] rounded-xl shadow-xl relative overflow-hidden">
            <button onClick={() => setOpenPreview(false)} className="absolute top-3 right-3 bg-white/80 hover:bg-white px-3 py-1 rounded">
              Cerrar
            </button>
            <iframe title="Vista previa PDF" src={previewUrl} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Vista previa PDF editar */}
      {openEditPreview && editPreviewUrl && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white w-[90%] h-[90%] rounded-xl shadow-xl relative overflow-hidden">
            <button onClick={() => setOpenEditPreview(false)} className="absolute top-3 right-3 bg-white/80 hover:bg-white px-3 py-1 rounded">
              Cerrar
            </button>
            <iframe title="Vista previa PDF" src={editPreviewUrl} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Modal Auto-Organizar Módulos */}
      {showAutoOrganize && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wand2 className="text-purple-600" size={24} />
                <h2 className="text-xl font-bold text-gray-700">Auto-Organizar Módulos</h2>
              </div>
              <button onClick={() => setShowAutoOrganize(false)} className="text-gray-600 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">¿Cómo funciona?</h3>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li><strong>Evaluaciones:</strong> Se asignan al curso cuyo título coincide con la categoría</li>
                <li><strong>Subtemas:</strong> Se asignan al curso principal si su título contiene el título completo de otro curso</li>
                <li><strong>Cursos principales:</strong> Permanecen sin módulo (aparecerán como carpetas)</li>
              </ul>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Se analizarán <strong className="text-purple-600">{cursos.length} cursos</strong> para organizar automáticamente.
              </p>
              <p className="text-sm text-gray-600">
                Los cursos que ya tienen un módulo asignado manualmente <strong>se respetarán solo si son correctos</strong>.
                Si se encuentra una mejor coincidencia, se actualizará.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowAutoOrganize(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 font-medium transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={autoOrganizarTodos}
                className="px-6 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium transition-colors disabled:opacity-60 flex items-center gap-2 justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Organizando...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Iniciar Auto-Organización
                  </>
                )}
              </button>
            </div>

            {/* Mostrar reporte si hay cambios */}
            {autoOrganizeReport.changes.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">
                  ✓ Cambios realizados ({autoOrganizeReport.updated})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {autoOrganizeReport.changes.map((cambio, idx) => (
                    <div key={idx} className="text-sm bg-white p-3 rounded border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">{cambio.curso}</div>
                      <div className="text-gray-600">
                        <span className="text-green-700 font-medium">[{cambio.tipo}]</span>
                        {' '}<span className="text-gray-500">{cambio.moduloAnterior}</span>
                        {' → '}
                        <span className="text-purple-700 font-medium">{cambio.moduloNuevo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
