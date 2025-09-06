import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getExamById, submitExamResult } from "../../services/exams";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import {
  ensureCertificateForAssignment,
} from "../../services/certificates";

const LETTER = (i) => String.fromCharCode(65 + i);

function normalizeQuestion(q, idx) {
  const id = q._id || q.id || `q_${idx}`;
  const enunciado = q.enunciado || q.pregunta || q.titulo || `Pregunta ${idx + 1}`;

  let opciones = [];
  let correctKey = "";

  // Manejar el caso específico de la estructura del backend (alternativas)
  if (Array.isArray(q.alternativas)) {
    opciones = q.alternativas.map((a, i) => ({
      key: LETTER(i),
      texto: a.texto || a.label || a || "",
      correcta: !!a.correcta
    }));
    
    // Encontrar la respuesta correcta
    const correctIndex = q.alternativas.findIndex(a => a.correcta);
    if (correctIndex >= 0) {
      correctKey = LETTER(correctIndex);
    }
  } else if (Array.isArray(q.opciones)) {
    if (typeof q.opciones[0] === "string") {
      opciones = q.opciones.map((t, i) => ({ key: LETTER(i), texto: t, correcta: false }));
    } else {
      opciones = q.opciones.map((o, i) => ({
        key: o.key || o.letra || o.id || LETTER(i),
        texto: o.texto || o.valor || o.opcion || "",
        correcta: !!o.correcta,
      }));
      
      // Encontrar la respuesta correcta
      const correctIndex = opciones.findIndex(o => o.correcta);
      if (correctIndex >= 0) {
        correctKey = opciones[correctIndex].key;
      }
    }
  } else if (q.options) {
    const entries = Array.isArray(q.options) ? q.options : Object.values(q.options);
    opciones = entries.map((t, i) => ({
      key: t.key || t.letra || LETTER(i),
      texto: t.texto || t.label || t,
      correcta: !!t.correcta,
    }));
    
    // Encontrar la respuesta correcta
    const correctIndex = opciones.findIndex(o => o.correcta);
    if (correctIndex >= 0) {
      correctKey = opciones[correctIndex].key;
    }
  }

  // Fallback para detectar respuesta correcta por otros campos
  if (!correctKey) {
    correctKey =
      q.correcta || q.respuestaCorrecta || q.answer || q.correctKey || "";
    const idxFromNumber =
      typeof q.correctIndex === "number"
        ? q.correctIndex
        : typeof q.respuestaIndex === "number"
        ? q.respuestaIndex
        : undefined;
    if (!correctKey && typeof idxFromNumber === "number" && idxFromNumber >= 0) {
      correctKey = LETTER(idxFromNumber);
    }
  }

  return { 
    id, 
    enunciado, 
    opciones: opciones.map(o => ({ key: o.key, texto: o.texto })), 
    correcta: correctKey || "" 
  };
}

export default function ExamTake() {
  const params = useParams();
  const examId = params.id || params.examId;

  const [search] = useSearchParams();
  const assignmentId = search.get("assign") || null;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState({ _id: "", titulo: "Examen", preguntas: [], courseId: "" });
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadError, setLoadError] = useState("");

  // sticky solo aquí
  useEffect(() => {
    const aside = document.querySelector("aside");
    if (!aside) return;
    const prev = {
      position: aside.style.position,
      top: aside.style.top,
      height: aside.style.height,
      overflowY: aside.style.overflowY,
    };
    aside.style.position = "sticky";
    aside.style.top = "0";
    aside.style.height = "100vh";
    aside.style.overflowY = "auto";
    return () => {
      aside.style.position = prev.position;
      aside.style.top = prev.top;
      aside.style.height = prev.height;
      aside.style.overflowY = prev.overflowY;
    };
  }, []);

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("authUser") || "{}"); }
    catch { return {}; }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        if (!examId) {
          setLoadError("No se encontró el ID del examen en la URL.");
          setLoading(false);
          return;
        }
        const raw = await getExamById(examId);
        const titulo = raw?.titulo || raw?.name || "Examen";
        const preguntasRaw = raw?.preguntas || raw?.questions || [];
        const preguntas = preguntasRaw.map((q, i) => normalizeQuestion(q, i));

        // Tomar courseId si el examen lo tiene (varios nombres posibles)
        const courseId =
          raw?.courseId ||
          raw?.cursoId ||
          raw?.course?._id ||
          raw?.curso?._id ||
          "";

        setExam({ _id: raw?._id || examId, titulo, preguntas, courseId });
      } catch (e) {
        console.error("getExamById error:", e);
        setLoadError("No se pudo cargar el examen.");
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  const respond = (qid, key) => setAnswers((s) => ({ ...s, [qid]: key }));

  const allAnswered = exam.preguntas.length > 0 && exam.preguntas.every((q) => !!answers[q.id]);

  const submit = async () => {
    const total = exam.preguntas.length;
    let correct = 0;

    const detail = exam.preguntas.map((q) => {
      const v = (answers[q.id] || "").toString().trim().toUpperCase();
      const ck = (q.correcta || "").toString().trim().toUpperCase();
      const isOk = ck ? v === ck : false;
      if (isOk) correct += 1;
      return { questionId: q.id, value: v, correct: isOk, correctKey: ck };
    });

    const score = Math.round((correct / Math.max(total, 1)) * 100);

    try {
      console.log("Submitting exam result for assignmentId:", assignmentId); // Log
      const result = await submitExamResult({
        examId: exam._id,
        assignmentId,
        answers: detail,
        score,
        correct,
        total,
        userId: me?.id || me?._id || undefined,
      });
      
      // Usar los datos del backend para determinar si aprobó
      const examResult = result.examResult || {};
      const backendPassed = result.assignment?.passed || examResult.passed || false;
      const minimumRequired = examResult.minimumPassScore || Math.ceil(total * 0.7);
      
      setSubmitted({ 
        score, 
        correct, 
        total, 
        passed: backendPassed,
        minimumRequired 
      });
      setShowConfirmModal(true);
    } catch (e) {
      console.error("submitExamResult:", e?.response?.data || e.message);
    }
  };

  if (loading) return <div className="p-6">Cargando examen…</div>;

  if (loadError) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 mb-4">
          <ChevronLeft size={16} /> Volver
        </button>
        <div className="text-red-600">{loadError}</div>
      </div>
    );
  }


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50">
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{exam.titulo}</h1>
        <div />
      </div>

      <div className="space-y-4">
        {exam.preguntas.map((q, idx) => (
          <div key={q.id} className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="font-medium text-gray-800 mb-2">
              {idx + 1}. {q.enunciado}
            </div>
            <div className="grid gap-2">
              {q.opciones.length === 0 && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Esta pregunta no tiene alternativas configuradas.
                </div>
              )}
              {q.opciones.map((op, i) => {
                const active = (answers[q.id] || "") === (op.key || LETTER(i));
                return (
                  <label key={op.key || LETTER(i)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${active ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                    <input
                      type="radio"
                      name={q.id}
                      value={op.key || LETTER(i)}
                      checked={active}
                      onChange={() => respond(q.id, op.key || LETTER(i))}
                      className="h-4 w-4"
                    />
                    <span className="font-medium text-gray-700">{(op.key || LETTER(i))}.</span>
                    <span className="text-gray-700">{op.texto}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={() => navigate(-1)}>
          Cancelar
        </button>
        <button
          disabled={!allAnswered}
          onClick={submit}
          className={`px-5 py-2 rounded-lg ${allAnswered ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
        >
          Enviar respuestas
        </button>
      </div>

      {/* Modal de confirmación de examen */}
      {showConfirmModal && submitted && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className={`flex items-center justify-center gap-2 font-semibold text-2xl ${submitted.passed ? "text-green-700" : "text-red-700"}`}>
              {submitted.passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              {submitted.passed ? "¡Examen Aprobado!" : "Examen Reprobado"}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Correctas: {submitted.correct}</span>
                <span>Incorrectas: {submitted.total - submitted.correct}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-3 ${submitted.passed ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.round((submitted.correct / Math.max(submitted.total, 1)) * 100)}%` }} />
              </div>
            </div>

            <div className="text-gray-900 text-4xl font-bold mt-3">Puntaje: {submitted.score}%</div>
            <div className="text-sm text-gray-500 mt-1">
              Mínimo para aprobar: {submitted.minimumRequired || Math.ceil(submitted.total * 0.7)} respuestas correctas (70%).
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {submitted.passed && (
                <button
                  onClick={async () => {
                    try {
                      const payload = {};
                      if (assignmentId && typeof assignmentId === 'string' && assignmentId !== 'null' && assignmentId !== 'undefined') {
                        payload.assignmentId = assignmentId;
                      } else {
                        payload.userId = me?.id || me?._id;
                        payload.courseId = exam.courseId;
                      }
                      console.log("Payload for certificate:", payload); // Log
                      const r = await ensureCertificateForAssignment(payload);
                      if (r?.ok && r?.certificate?._id) {
                        // Redirigir a la página de certificados con el certificado específico
                        navigate(`/homeuser/certificates?cert=${r.certificate._id}`);
                      } else {
                        alert(r?.mensaje || "No se pudo obtener el certificado.");
                      }
                    } catch (err) {
                      console.error(err?.response?.data || err.message);
                      alert(err?.response?.data?.mensaje || "Error generando el certificado.");
                    } finally {
                      setShowConfirmModal(false); // Cerrar modal después de intentar generar
                    }
                  }}
                  className="px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-lg font-semibold"
                >
                  Ver certificado
                </button>
              )}
              <button
                onClick={() => navigate("/homeuser/courses")}
                className="px-4 py-3 rounded-lg border hover:bg-gray-100 text-lg font-semibold"
              >
                Ir a Mis Cursos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
