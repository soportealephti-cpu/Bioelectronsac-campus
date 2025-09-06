import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Toast from "../../components/Toast";
import { getMyCourses } from "../../services/assignments";
import { User, Mail, CreditCard, Phone, Briefcase, BookOpen, Award, Calendar, TrendingUp, Star } from "lucide-react"; // Importar iconos

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ courses: 0, certificates: 0, avgScore: 0 });
  const navigate = useNavigate();

  const showToast = (type, message, ms = 2200) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/auth/me");
        setUser(data);

        // Obtener estadísticas del usuario
        try {
          const [courses, certificatesRes] = await Promise.all([
            getMyCourses(),
            api.get(`/certificates/user/${data.id}`)
          ]);
          
          const coursesArray = Array.isArray(courses) ? courses : [];
          const certificates = Array.isArray(certificatesRes.data) ? certificatesRes.data : [];
          const completedCourses = coursesArray.filter(c => c.passed || c.aprobado);
          const avgScore = completedCourses.length > 0 
            ? Math.round(completedCourses.reduce((acc, c) => acc + (c.lastScore || 0), 0) / completedCourses.length)
            : 0;

          console.log('Stats debug:', { courses: coursesArray.length, certificates: certificates.length, avgScore });

          setStats({
            courses: coursesArray.length,
            certificates: certificates.length,
            avgScore
          });
        } catch (e) {
          console.error("Error loading stats:", e);
        }
      } catch (e) {
        console.error("Error al cargar perfil:", e?.response?.data || e.message);
        showToast("error", "No se pudo cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded mb-4 sm:mb-6 w-1/2 sm:w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 bg-gray-200 rounded-xl sm:rounded-2xl h-80 sm:h-96"></div>
            <div className="bg-gray-200 rounded-xl sm:rounded-2xl h-64 sm:h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-red-600 text-center">No se pudo cargar la información del usuario.</div>;
  }

  const getInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="px-4 sm:px-6 max-w-6xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-sm sm:text-base text-gray-600">Bienvenido de vuelta, gestiona tu información y revisa tu progreso académico.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Información Personal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            {/* Header de la tarjeta */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-4 sm:p-6 lg:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg sm:text-2xl font-bold text-white flex-shrink-0">
                  {getInitials(user.nombre, user.apellido)}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold">{user.nombre} {user.apellido}</h2>
                  <p className="text-blue-100 text-base sm:text-lg break-all sm:break-normal">{user.correo}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {user.rol === 'admin' ? 'Administrador' : 'Estudiante'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información detallada */}
            <div className="p-4 sm:p-6 lg:p-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Información Personal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Mail size={16} className="sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Correo Electrónico</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium truncate">{user.correo}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CreditCard size={16} className="sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">DNI</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium">{user.dni}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Phone size={16} className="sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Celular</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium">{user.celular}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <Briefcase size={16} className="sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Rol</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium">{user.rol === 'admin' ? 'Administrador' : 'Estudiante'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Mi Progreso</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <BookOpen size={16} className="sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Cursos Asignados</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.courses}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-emerald-50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                    <Award size={16} className="sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Certificados</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.certificates}</p>
                  </div>
                </div>
              </div>

              {stats.avgScore > 0 && (
                <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      <Star size={16} className="sm:w-5 sm:h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600">Promedio</p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.avgScore}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
