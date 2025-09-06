import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Star, BookOpen, School } from "lucide-react";
import api from "../../api"; // Importar la instancia de api
import { getMyCourses } from "../../services/assignments"; // Importar la nueva función
import { openCertificatePdf } from "../../services/certificates";

// imagen por defecto según título (evita links rotos)
const coverFor = (title = "") =>
  `https://source.unsplash.com/600x400/?${encodeURIComponent(
    title || "education"
  )}`;

export default function StudentCourses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState({});
  const navigate = useNavigate();

  const [userName, setUserName] = useState("estudiante");

  const fetchCertificates = async (userId) => {
    try {
      const { data } = await api.get(`/certificates/user/${userId}`);
      const certMap = {};
      data.forEach(cert => {
        certMap[cert.course] = cert._id;
      });
      setCertificates(certMap);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await getMyCourses(); // Usar la nueva función
        setRows(Array.isArray(data) ? data : []);

        // Obtener el nombre del usuario para el saludo
        const { data: userData } = await api.get("/auth/me");
        setUserName(userData?.nombre || "estudiante");
        
        // Obtener certificados del usuario
        if (userData?.id) {
          await fetchCertificates(userData.id);
        }

      } catch (e) {
        console.error(e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Mis Cursos</h1>
        <p className="text-gray-500 text-sm sm:text-base mt-2">
          Hola {userName}, aquí están tus cursos asignados.
        </p>
      </header>

      {/* skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl sm:rounded-2xl overflow-hidden border bg-white">
              <div className="h-32 sm:h-36 bg-gray-200 animate-pulse" />
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
                <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* vacío */}
      {!loading && rows.length === 0 && (
        <div className="rounded-xl sm:rounded-2xl border p-6 sm:p-10 text-center bg-white text-gray-600 mx-4 sm:mx-0">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No hay cursos asignados</h3>
            <p className="text-sm sm:text-base text-gray-500">
              Aún no tienes cursos asignados a tu cuenta. Comunícate con tu administrador para obtener acceso.
            </p>
          </div>
        </div>
      )}

      {/* grid */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {rows.map((assignment) => {
            if (!assignment.course) return null; // Si el curso fue eliminado, no mostrar

            const { _id: assignmentId, course, aprobado } = assignment;
            const { _id: courseId, titulo, categoria, imagenUrl } = course;
            const hasCertificate = certificates[courseId];
            
            // DEBUG: Mostrar en consola los datos del curso
            console.log("Datos del curso:", {
              courseId,
              titulo,
              categoria,
              imagenUrl,
              hasImagenUrl: !!imagenUrl,
              imagenUrlLength: imagenUrl?.length || 0
            });

            return (
              <article
                key={assignmentId}
                className="group bg-white border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                {/* cover */}
                <div className="relative">
                  {/* Verificar si hay imagen personalizada y mostrarla */}
                  {imagenUrl && imagenUrl.trim() !== "" ? (
                    <>
                      <img
                        src={imagenUrl}
                        alt={titulo}
                        className="h-32 sm:h-40 w-full object-cover"
                        onLoad={() => {
                          console.log("✅ Imagen personalizada cargada correctamente:", imagenUrl);
                        }}
                        onError={(e) => {
                          console.log("❌ Error cargando imagen personalizada:", imagenUrl);
                          // Si falla la imagen personalizada, mostrar imagen de respaldo
                          e.currentTarget.src = coverFor(titulo);
                        }}
                      />
                    </>
                  ) : (
                    <img
                      src={coverFor(titulo)}
                      alt={titulo}
                      className="h-32 sm:h-40 w-full object-cover"
                      onError={(e) => {
                        console.log("Error cargando imagen de Unsplash, mostrando gradiente");
                        // Si falla la imagen de Unsplash, ocultar imagen y mostrar gradiente
                        e.currentTarget.style.display = 'none';
                        const gradient = e.currentTarget.parentElement.querySelector('.fallback-gradient');
                        if (gradient) gradient.style.display = 'block';
                      }}
                    />
                  )}
                  
                  {/* Gradiente de respaldo (solo se muestra si fallan todas las imágenes) */}
                  <div className="fallback-gradient absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800" style={{ display: 'none' }}></div>
                  
                  {/* Overlay oscuro para mejorar legibilidad del texto */}
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <span
                    className={`absolute top-2 sm:top-3 left-2 sm:left-3 text-[10px] sm:text-[11px] px-2 py-1 rounded-full font-medium tracking-wide z-20 shadow-sm
                      ${
                        aprobado
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                  >
                    {aprobado ? "Aprobado" : "Asignado"}
                  </span>
                </div>

                {/* body */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base">
                    {titulo}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                    <School size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="truncate">Bioelectron Academy</span>
                    <span className="hidden sm:inline mx-2">•</span>
                    <Star size={12} className="text-yellow-500 hidden sm:inline sm:w-[14px] sm:h-[14px]" />
                    <span className="hidden sm:inline">4.5</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                    <BookOpen size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="truncate">{categoria}</span>
                  </div>

                  <div className="pt-2 sm:pt-3 space-y-2">
                    <button
                      onClick={() => navigate(`/homeuser/courses/${assignmentId}`)}
                      className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                      title="Ver curso"
                    >
                      Ver Curso
                    </button>

                    {hasCertificate && (
                      <button
                        onClick={() => navigate(`/homeuser/certificates?cert=${certificates[courseId]}`)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-medium hover:bg-emerald-700 transition-colors"
                        title="Ver certificado"
                      >
                        <Award size={14} />
                        Certificado
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}