// client/src/pages/Cursos.jsx
import { useEffect, useState } from "react";
import { Plus, X, Eye, Pencil, Trash } from "lucide-react";
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
  const [form, setForm] = useState({ titulo: "", categoria: "", file: null, imagen: null });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState(null);

  // Editar
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({ _id: "", titulo: "", categoria: "", file: null, imagen: null });
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [openEditPreview, setOpenEditPreview] = useState(false);
  const [editImagenPreviewUrl, setEditImagenPreviewUrl] = useState(null);

  // Confirm eliminar
  const [confirm, setConfirm] = useState({ open: false, id: "" });

  const cargarCursos = async () => {
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
  };

  useEffect(() => { cargarCursos(); }, []);

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
      setForm({ titulo: "", categoria: "", file: null, imagen: null });
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
    setEditData({ _id: c._id, titulo: c.titulo, categoria: c.categoria, file: null, imagen: null });
    setEditPreviewUrl(null);
    setEditImagenPreviewUrl(null);
    setOpenEdit(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editData._id) return;
    try {
      setLoading(true);
      await updateCourse(editData._id, {
        titulo: editData.titulo,
        categoria: editData.categoria,
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">Gestión de Cursos</h1>
        <button
          onClick={() => setOpenCreate(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 text-sm sm:text-base w-full sm:w-auto justify-center"
          disabled={loading}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nuevo Curso</span>
          <span className="sm:hidden">Crear</span>
        </button>
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden lg:block overflow-x-auto shadow rounded-lg bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="bg-green-100 text-gray-700">
              <th className="px-4 py-3 text-left font-semibold">Título</th>
              <th className="px-4 py-3 text-left font-semibold">Categoría</th>
              <th className="px-4 py-3 text-center font-semibold">Imagen</th>
              <th className="px-4 py-3 text-center font-semibold">PDF</th>
              <th className="px-4 py-3 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-4 text-gray-500 text-center">Cargando...</td></tr>
            )}
            {!loading && cursos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-4 text-gray-500 text-center">No hay cursos registrados.</td></tr>
            )}
            {!loading && cursos.map((c) => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.titulo}</td>
                <td className="px-4 py-3">{c.categoria}</td>
                <td className="px-4 py-3 text-center">
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
                <td className="px-4 py-3 text-center">
                  <a
                    href={c.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1 border rounded-lg hover:bg-gray-100 transition-colors"
                    title="Ver PDF"
                  >
                    <Eye size={16} /> Ver
                  </a>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-center">
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

      {/* Vista Móvil/Tablet - Tarjetas */}
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
        {!loading && cursos.map((c) => (
          <div key={c._id} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{c.titulo}</h3>
                <p className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1 inline-block">{c.categoria}</p>
              </div>
              {c.imagenUrl && (
                <img 
                  src={c.imagenUrl} 
                  alt={c.titulo} 
                  className="w-16 h-16 object-cover rounded-lg ml-4 cursor-pointer hover:opacity-80"
                  onClick={() => window.open(c.imagenUrl, '_blank')}
                />
              )}
            </div>
            <div className="flex gap-2">
              <a
                href={c.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Eye size={16} />
                Ver PDF
              </a>
              <button
                onClick={() => openEditModal(c)}
                className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => confirmDelete(c._id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}
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
    </div>
  );
}
