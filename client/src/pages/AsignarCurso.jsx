import { useEffect, useMemo, useState } from "react";
import { UserPlus, BookOpen, CheckCircle2, Trash2, Clock, ShieldCheck } from "lucide-react";
import Toast from "../components/Toast";
import { listUsers } from "../services/users";
import { listCourses } from "../services/courses";
import { listAssignmentsByUser, createAssignment, deleteAssignment } from "../services/assignments";

export default function AsignarCurso() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [days, setDays] = useState(30);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para búsqueda de alumnos
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  const selectedUserName = useMemo(() => {
    const u = users.find(x => x._id === selectedUser);
    return u ? `${u.apellido || ""} ${u.nombre || ""}`.trim() : "—";
  }, [selectedUser, users]);

  // Filtrar usuarios según el término de búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u => {
      const fullName = `${u.apellido || ""} ${u.nombre || ""}`.toLowerCase();
      const email = (u.correo || "").toLowerCase();
      const dni = (u.dni || "").toLowerCase();
      return fullName.includes(term) || email.includes(term) || dni.includes(term);
    });
  }, [users, searchTerm]);

  const handleSelectUser = (user) => {
    setSelectedUser(user._id);
    setSearchTerm(`${user.apellido || ""} ${user.nombre || ""}`.trim());
    setShowUserDropdown(false);
  };

  const cargarBase = async () => {
    try {
      setLoading(true);
      const [u, c] = await Promise.all([listUsers(), listCourses()]);
      setUsers(u);
      setCourses(c);
    } catch {
      showToast("error", "Error cargando listas");
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignaciones = async (userId) => {
    if (!userId) { setAssignments([]); return; }
    try {
      setLoading(true);
      const data = await listAssignmentsByUser(userId);
      setAssignments(data);
    } catch {
      showToast("error", "No se pudo cargar cursos asignados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarBase(); }, []);
  useEffect(() => { cargarAsignaciones(selectedUser); }, [selectedUser]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserDropdown && !e.target.closest('.relative')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  const asignar = async () => {
    if (!selectedUser) return showToast("warn", "Selecciona un alumno");
    if (!selectedCourse) return showToast("warn", "Selecciona un curso");

    try {
      setLoading(true);

      // Crear la asignación con la fecha de expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      await createAssignment({
        userId: selectedUser,
        courseId: selectedCourse,
        expiresAt: expiresAt.toISOString()
      });

      await cargarAsignaciones(selectedUser);
      showToast("success", "Curso asignado correctamente", 3000);
      setSelectedCourse("");
    } catch (e) {
      const msg = e?.response?.data?.mensaje || e?.response?.data?.message || "Error al asignar";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const quitar = async (assignmentId) => {
    try {
      setLoading(true);
      await deleteAssignment(assignmentId);
      await cargarAsignaciones(selectedUser);
      showToast("success", "Asignación eliminada");
    } catch {
      showToast("error", "Error al eliminar asignación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Izquierda: panel de asignación */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <UserPlus className="text-green-600 flex-shrink-0" size={24} />
            <h2 className="text-lg sm:text-xl font-bold text-gray-700 text-center sm:text-left">Asignar Curso</h2>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="relative">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Buscar Alumno</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowUserDropdown(true);
                  if (!e.target.value) setSelectedUser("");
                }}
                onFocus={() => setShowUserDropdown(true)}
                placeholder="Escribe nombre, DNI o correo..."
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
              />
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {filteredUsers.map(u => (
                    <div
                      key={u._id}
                      onClick={() => handleSelectUser(u)}
                      className="px-4 py-3 hover:bg-green-50 active:bg-green-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">{u.apellido} {u.nombre}</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-0.5">{u.correo} • DNI: {u.dni}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Selecciona Curso</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors bg-white"
              >
                <option value="">— Elegir curso —</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.titulo} {c.categoria && `— ${c.categoria}`}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="text-xs sm:text-sm text-amber-600 mt-2 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>No hay cursos creados. Ve a "Crear Curso" para agregar cursos primero.</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock size={18} className="flex-shrink-0"/> Días de acceso
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">Por defecto 30 días (modelo actual del negocio).</p>
              </div>

              <button
                onClick={asignar}
                disabled={loading || !selectedUser || !selectedCourse}
                className="w-full px-6 py-3.5 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all text-sm sm:text-base shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Asignando...</span>
                  </div>
                ) : (
                  "✓ Asignar Curso"
                )}
              </button>
            </div>

            <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 text-xs sm:text-sm text-green-700">
                <ShieldCheck size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Asignación segura: el alumno verá el curso asignado en su panel de usuario.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Derecha: cursos del alumno */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <BookOpen className="text-blue-600 flex-shrink-0" size={24} />
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-gray-700">
                Cursos de
              </h2>
              <span className="text-base sm:text-lg font-semibold text-blue-600">{selectedUserName}</span>
            </div>
          </div>

          {!selectedUser && (
            <div className="text-center py-8">
              <UserPlus size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">Primero elige un alumno para ver sus cursos asignados.</p>
            </div>
          )}

          {selectedUser && (
            <div className="space-y-3 sm:space-y-4">
              {assignments.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">Este alumno aún no tiene cursos asignados.</p>
                </div>
              )}

              {assignments.map(a => {
                const vencimiento = a.expiresAt ? new Date(a.expiresAt) : null;
                const vencido = vencimiento ? vencimiento < new Date() : false;
                return (
                  <div key={a._id} className="border rounded-xl p-4 sm:p-4 hover:shadow-md transition-all bg-white">
                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{a.course?.titulo}</div>
                        <div className="text-sm text-gray-500 mt-1">{a.course?.categoria}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            vencido ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}>
                            {vencido ? "Vencido" : "Activo"}
                          </span>
                          {vencimiento && (
                            <span className="text-xs text-gray-500">
                              Vence: {vencimiento.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={a.course?.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm transition-colors whitespace-nowrap"
                        >
                          Ver PDF
                        </a>
                        <button
                          onClick={() => quitar(a._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm transition-colors"
                          title="Quitar asignación"
                        >
                          <Trash2 size={16} /> Quitar
                        </button>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-3">
                      <div>
                        <div className="font-semibold text-gray-900 text-base mb-1.5">{a.course?.titulo}</div>
                        <div className="text-sm text-gray-500 mb-2">{a.course?.categoria}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            vencido ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}>
                            {vencido ? "Vencido" : "Activo"}
                          </span>
                          {vencimiento && (
                            <span className="text-xs text-gray-500">
                              Vence: {vencimiento.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={a.course?.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                        >
                          Ver PDF
                        </a>
                        <button
                          onClick={() => quitar(a._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
                          title="Quitar asignación"
                        >
                          <Trash2 size={16} />
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
        <div className="flex items-start gap-3 text-sm sm:text-base text-blue-700">
          <CheckCircle2 className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold mb-1">💡 Consejo útil</p>
            <p className="text-blue-600">Puedes asignar múltiples cursos al mismo alumno. La lista se actualiza en tiempo real.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
