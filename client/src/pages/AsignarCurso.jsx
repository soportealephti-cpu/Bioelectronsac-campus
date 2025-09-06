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

  const [toast, setToast] = useState(null);
  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  const selectedUserName = useMemo(() => {
    const u = users.find(x => x._id === selectedUser);
    return u ? `${u.apellido || ""} ${u.nombre || ""}`.trim() : "—";
  }, [selectedUser, users]);

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

  const asignar = async () => {
    if (!selectedUser) return showToast("warn", "Selecciona un alumno");
    if (!selectedCourse) return showToast("warn", "Selecciona un curso");
    try {
      setLoading(true);
      await createAssignment({ userId: selectedUser, courseId: selectedCourse, days });
      await cargarAsignaciones(selectedUser);
      showToast("success", "Curso asignado correctamente");
    } catch (e) {
      const msg = e?.response?.data?.mensaje || "Error al asignar";
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Izquierda: panel de asignación */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <UserPlus className="text-green-600" size={20} />
            <h2 className="text-lg sm:text-xl font-bold text-gray-700">Asignar Curso</h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona Alumno</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="">— Elegir alumno —</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.apellido} {u.nombre} — {u.correo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona Curso</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="">— Elegir curso —</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.titulo} • {c.categoria}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock size={16}/> Días de acceso
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p className="text-xs text-gray-500 mt-1">Por defecto 30 días (modelo actual del negocio).</p>
              </div>

              <button
                onClick={asignar}
                disabled={loading || !selectedUser || !selectedCourse}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Asignando...
                  </div>
                ) : (
                  "Asignar"
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-green-700">
                <ShieldCheck size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span>Asignación segura: el alumno verá este curso en su panel de usuario.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Derecha: cursos del alumno */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <BookOpen className="text-blue-600" size={20} />
            <h2 className="text-lg sm:text-xl font-bold text-gray-700">Cursos de <span className="text-blue-600 block sm:inline">{selectedUserName}</span></h2>
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
                  <div key={a._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{a.course?.titulo}</div>
                        <div className="text-sm text-gray-500">{a.course?.categoria}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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

                      <div className="flex items-center gap-2 ml-4">
                        <a
                          href={a.course?.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                        >
                          Ver PDF
                        </a>
                        <button
                          onClick={() => quitar(a._id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm transition-colors"
                          title="Quitar asignación"
                        >
                          <Trash2 size={16} /> Quitar
                        </button>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="mb-3">
                        <div className="font-semibold text-gray-900 mb-1">{a.course?.titulo}</div>
                        <div className="text-sm text-gray-500 mb-2">{a.course?.categoria}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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

                      <div className="flex gap-2">
                        <a
                          href={a.course?.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                        >
                          Ver PDF
                        </a>
                        <button
                          onClick={() => quitar(a._id)}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm transition-colors"
                          title="Quitar asignación"
                        >
                          <Trash2 size={16} />
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
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2 text-sm text-blue-700">
          <CheckCircle2 className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
          <span>Tip: cuando asignes o quites un curso, la lista se actualiza automáticamente.</span>
        </div>
      </div>
    </div>
  );
}
