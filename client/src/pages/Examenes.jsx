import { useEffect, useState } from "react";
import { Plus, X, Trash2, Edit2, Eye, Plug } from "lucide-react";
import Toast from "../components/Toast";
import { listExams, createExam, deleteExam, updateExam, assignExamToCourse } from "../services/exams";
import { listCourses } from "../services/courses";

const PASS_THRESHOLD = 12; // mínimo para aprobar en la simulación

export default function Examenes() {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  // Crear
  const [openCreate, setOpenCreate] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [num, setNum] = useState(1);
  const [pregs, setPregs] = useState([]);

  // Editar
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitulo, setEditTitulo] = useState("");
  const [editPregs, setEditPregs] = useState([]);

  // Confirm Delete
  const [confirm, setConfirm] = useState({ open: false, id: "" });

  // Vista previa
  const [openPreview, setOpenPreview] = useState(false);
  const [previewExam, setPreviewExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [previewResult, setPreviewResult] = useState(null);

  // Asignar curso
  const [openAssign, setOpenAssign] = useState(false);
  const [assignExam, setAssignExam] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await listExams();
      setExamenes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo cargar la lista");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Helpers construcción dinámica
  const makeEmptyQuestion = () => ({
    enunciado: "",
    alternativas: [
      { texto: "", correcta: true },
      { texto: "", correcta: false },
      { texto: "", correcta: false },
    ],
  });

  const initPreguntas = (n) => {
    const arr = Array.from({ length: n }, () => makeEmptyQuestion());
    setPregs(arr);
  };

  const initEditPreguntas = (exam) => {
    setEditPregs(exam.preguntas.map(p => ({
      enunciado: p.enunciado,
      alternativas: p.alternativas.map(a => ({ texto: a.texto, correcta: !!a.correcta }))
    })));
  };

  // Crear
  const openCreateModal = () => {
    setTitulo("");
    setNum(1);
    initPreguntas(1);
    setOpenCreate(true);
  };

  const onChangeNum = (n) => {
    const x = Math.max(1, Math.min(50, Number(n) || 1));
    setNum(x);
    initPreguntas(x);
  };

  const setPreguntaField = (i, value) => {
    setPregs(prev => prev.map((p, idx) => idx === i ? { ...p, ...value } : p));
  };

  const setAlternativa = (i, j, value) => {
    setPregs(prev => prev.map((p, idx) => {
      if (idx !== i) return p;
      const alternativas = p.alternativas.map((a, k) => k === j ? { ...a, ...value } : a);
      return { ...p, alternativas };
    }));
  };

  const setCorrecta = (i, j) => {
    setPregs(prev => prev.map((p, idx) => {
      if (idx !== i) return p;
      const alternativas = p.alternativas.map((a, k) => ({ ...a, correcta: k === j }));
      return { ...p, alternativas };
    }));
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createExam({ titulo, preguntas: pregs });
      setOpenCreate(false);
      await cargar();
      showToast("success", "Examen creado");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      const msg = e?.response?.data?.mensaje || "Error al crear examen";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  // Editar
  const openEditModal = (exam) => {
    setEditId(exam._id);
    setEditTitulo(exam.titulo);
    initEditPreguntas(exam);
    setOpenEdit(true);
  };

  const setEditPreguntaField = (i, value) => {
    setEditPregs(prev => prev.map((p, idx) => idx === i ? { ...p, ...value } : p));
  };

  const setEditAlternativa = (i, j, value) => {
    setEditPregs(prev => prev.map((p, idx) => {
      if (idx !== i) return p;
      const alternativas = p.alternativas.map((a, k) => k === j ? { ...a, ...value } : a);
      return { ...p, alternativas };
    }));
  };

  const setEditCorrecta = (i, j) => {
    setEditPregs(prev => prev.map((p, idx) => {
      if (idx !== i) return p;
      const alternativas = p.alternativas.map((a, k) => ({ ...a, correcta: k === j }));
      return { ...p, alternativas };
    }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateExam(editId, { titulo: editTitulo, preguntas: editPregs });
      setOpenEdit(false);
      await cargar();
      showToast("success", "Examen actualizado");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      const msg = e?.response?.data?.mensaje || "Error al actualizar examen";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar
  const doDelete = async () => {
    try {
      setLoading(true);
      await deleteExam(confirm.id);
      setConfirm({ open: false, id: "" });
      await cargar();
      showToast("success", "Examen eliminado");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  };

  // Vista previa
  const openPreviewModal = (exam) => {
    setPreviewExam(exam);
    setAnswers({});
    setPreviewResult(null);
    setOpenPreview(true);
  };

  const chooseAnswer = (qIdx, altIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: altIdx }));
  };

  const submitPreview = () => {
    if (!previewExam) return;
    const total = previewExam.preguntas?.length || 0;
    let score = 0;
    previewExam.preguntas.forEach((p, i) => {
      const chosen = answers[i];
      if (typeof chosen === "number" && p.alternativas[chosen]?.correcta) score += 1;
    });
    const passed = score >= PASS_THRESHOLD;
    setPreviewResult({ score, total, passed });
  };

  // Asignar curso
  const openAssignModal = async (exam) => {
    try {
      setLoading(true);
      const data = await listCourses();
      setCourses(Array.isArray(data) ? data : []);
      setAssignExam(exam);
      setSelectedCourse(exam.courseId?._id || "");
      setOpenAssign(true);
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo cargar cursos");
    } finally {
      setLoading(false);
    }
  };

  const submitAssign = async () => {
    try {
      setLoading(true);
      await assignExamToCourse(assignExam._id, selectedCourse || null);
      setOpenAssign(false);
      await cargar();
      showToast("success", selectedCourse ? "Examen asignado al curso" : "Examen desasignado");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      showToast("error", "No se pudo actualizar la relación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">Gestión de Exámenes</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 text-sm sm:text-base w-full sm:w-auto justify-center"
          disabled={loading}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nuevo Examen</span>
          <span className="sm:hidden">Crear</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto shadow rounded-lg bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="bg-green-100 text-gray-700">
              <th className="px-4 py-2 text-left">Título</th>
              <th className="px-4 py-2 text-center"># Preguntas</th>
              <th className="px-4 py-2 text-left w-[280px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3} className="px-4 py-4 text-gray-500">Cargando...</td></tr>
            )}
            {!loading && examenes.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-4 text-gray-500">No hay exámenes.</td></tr>
            )}
            {!loading && examenes.map((ex) => (
              <tr key={ex._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span>{ex.titulo}</span>
                    {ex.courseId?.titulo && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Curso: {ex.courseId.titulo}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">{ex.preguntas?.length || 0}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      title="Vista previa"
                      className="p-2 rounded-md border hover:bg-gray-100"
                      onClick={() => openPreviewModal(ex)}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      title="Editar"
                      className="p-2 rounded-md border hover:bg-blue-50 text-blue-600"
                      onClick={() => openEditModal(ex)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      title="Asignar a curso"
                      className="p-2 rounded-md border hover:bg-emerald-50 text-emerald-700"
                      onClick={() => openAssignModal(ex)}
                    >
                      <Plug size={16} />
                    </button>
                    <button
                      title="Eliminar"
                      className="p-2 rounded-md border hover:bg-red-50 text-red-600"
                      onClick={() => setConfirm({ open: true, id: ex._id })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal CREAR */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl relative">
            <button onClick={() => setOpenCreate(false)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-center mb-4">Nuevo Examen</h2>

            <form onSubmit={submitCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="border rounded-md px-3 py-2 md:col-span-2"
                  placeholder="Título del examen"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600"># Preguntas</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="border rounded-md px-3 py-2 w-28"
                    value={num}
                    onChange={(e) => onChangeNum(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {pregs.map((p, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <label className="text-sm text-gray-600">Pregunta {i + 1}</label>
                      <input
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        placeholder="Enunciado de la pregunta"
                        value={p.enunciado}
                        onChange={(e) => setPreguntaField(i, { enunciado: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      {p.alternativas.map((a, j) => (
                        <div key={j} className="flex items-center gap-2 border rounded-md p-2">
                          <input
                            type="radio"
                            name={`correcta-${i}`}
                            checked={a.correcta}
                            onChange={() => setCorrecta(i, j)}
                          />
                          <input
                            className="flex-1 border rounded-md px-3 py-2"
                            placeholder={`Alternativa ${j + 1}`}
                            value={a.texto}
                            onChange={(e) => setAlternativa(i, j, { texto: e.target.value })}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Crear Examen"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDITAR */}
      {openEdit && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl relative">
            <button onClick={() => setOpenEdit(false)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-center mb-4">Editar Examen</h2>

            <form onSubmit={submitEdit} className="space-y-5">
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Título del examen"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                required
              />

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {editPregs.map((p, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <label className="text-sm text-gray-600">Pregunta {i + 1}</label>
                      <input
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        placeholder="Enunciado de la pregunta"
                        value={p.enunciado}
                        onChange={(e) => setEditPreguntaField(i, { enunciado: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      {p.alternativas.map((a, j) => (
                        <div key={j} className="flex items-center gap-2 border rounded-md p-2">
                          <input
                            type="radio"
                            name={`edit-correcta-${i}`}
                            checked={a.correcta}
                            onChange={() => setEditCorrecta(i, j)}
                          />
                          <input
                            className="flex-1 border rounded-md px-3 py-2"
                            placeholder={`Alternativa ${j + 1}`}
                            value={a.texto}
                            onChange={(e) => setEditAlternativa(i, j, { texto: e.target.value })}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Actualizar Examen"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal PREVIEW */}
      {openPreview && previewExam && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl relative">
            <button onClick={() => setOpenPreview(false)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-4">{previewExam.titulo}</h2>

            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
              {previewExam.preguntas?.map((p, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <p className="font-medium mb-3">Pregunta {i + 1}: {p.enunciado}</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {p.alternativas.map((a, j) => (
                      <label
                        key={j}
                        className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50 ${
                          answers[i] === j ? "ring-2 ring-green-500" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`prev-${i}`}
                          checked={answers[i] === j}
                          onChange={() => chooseAnswer(i, j)}
                        />
                        <span>{a.texto}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {previewResult ? (
              <div className={`mt-5 p-4 rounded-lg text-center ${previewResult.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                <p className="font-semibold">
                  Puntaje: {previewResult.score} / {previewResult.total}
                </p>
                <p>{previewResult.passed ? "✅ Aprobado" : `❌ Desaprobado (mínimo ${PASS_THRESHOLD})`}</p>
              </div>
            ) : (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={submitPreview}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Simular envío
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal ASIGNAR CURSO */}
      {openAssign && assignExam && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl relative">
            <button onClick={() => setOpenAssign(false)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500">
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-center mb-4">Asignar examen a curso</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Examen: <span className="font-semibold">{assignExam.titulo}</span>
            </p>

            <div className="space-y-4">
              <select
                className="w-full border rounded-md px-3 py-2"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">— Selecciona un curso —</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.titulo} — {c.categoria}</option>
                ))}
              </select>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setSelectedCourse(""); submitAssign(); }}
                  className="px-4 py-2 rounded border hover:bg-gray-100"
                  disabled={loading}
                >
                  Desasignar
                </button>
                <button
                  onClick={submitAssign}
                  className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={loading || !selectedCourse}
                >
                  Guardar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirm.open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar examen?</h3>
            <p className="text-gray-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirm({ open: false, id: "" })} className="px-4 py-2 rounded border hover:bg-gray-100">Cancelar</button>
              <button onClick={doDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
