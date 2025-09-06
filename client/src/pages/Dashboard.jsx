import { useEffect, useState } from "react";
import { Users, BookOpen, Award, BarChart3, Calendar, Settings, TrendingUp } from "lucide-react";
import { getDashboardStats } from "../services/dashboard";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-24 sm:h-32 rounded-xl sm:rounded-2xl mb-6 sm:mb-8"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-100 h-20 sm:h-24 rounded-lg sm:rounded-xl"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-48 sm:h-64 rounded-xl sm:rounded-2xl mb-6"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-red-500">Error cargando estadísticas</div>;
  }

  const quickStats = [
    { title: "Total Usuarios", value: stats.totals.users.toString(), icon: Users, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Cursos Activos", value: stats.totals.courses.toString(), icon: BookOpen, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "Certificados Emitidos", value: stats.totals.certificates.toString(), icon: Award, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    { title: "Asignaciones", value: stats.totals.assignments.toString(), icon: BarChart3, color: "text-purple-600", bgColor: "bg-purple-50" }
  ];

  // Obtener el valor máximo para normalizar las barras
  const maxValue = Math.max(
    ...stats.monthlyProgress.map(month => 
      Math.max(month.users, month.certificates, month.assignments)
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl text-white p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">¡Bienvenido al Panel! 👋</h1>
        <p className="text-green-100 text-sm sm:text-base lg:text-lg leading-relaxed">
          Gestiona tu plataforma educativa desde aquí. Acceso completo a usuarios, cursos, exámenes y más.
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 sm:mb-2 lg:mb-4">
              <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} w-fit`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.color}`} />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <h3 className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base leading-tight">{stat.title}</h3>
          </div>
        ))}
      </div>

      {/* Gráfico de Progreso Mensual */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Progreso Últimos 6 Meses</h2>
        </div>
        
        {/* Gráfico - Responsive con scroll horizontal en móvil */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-48 sm:h-56 lg:h-64 min-w-[300px]">
            {stats.monthlyProgress.map((month, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="flex-1 flex flex-col justify-end w-full space-y-1">
                  {/* Barra de Usuarios */}
                  <div 
                    className="bg-blue-500 rounded-sm transition-all duration-1000 ease-out min-h-[3px]" 
                    style={{ 
                      height: `${maxValue > 0 ? (month.users / maxValue) * 100 : 0}%`,
                      animationDelay: `${index * 200}ms`
                    }}
                    title={`Usuarios: ${month.users}`}
                  ></div>
                  
                  {/* Barra de Certificados */}
                  <div 
                    className="bg-yellow-500 rounded-sm transition-all duration-1000 ease-out min-h-[3px]" 
                    style={{ 
                      height: `${maxValue > 0 ? (month.certificates / maxValue) * 100 : 0}%`,
                      animationDelay: `${index * 200 + 100}ms`
                    }}
                    title={`Certificados: ${month.certificates}`}
                  ></div>
                  
                  {/* Barra de Asignaciones */}
                  <div 
                    className="bg-purple-500 rounded-sm transition-all duration-1000 ease-out min-h-[3px]" 
                    style={{ 
                      height: `${maxValue > 0 ? (month.assignments / maxValue) * 100 : 0}%`,
                      animationDelay: `${index * 200 + 200}ms`
                    }}
                    title={`Asignaciones: ${month.assignments}`}
                  ></div>
                </div>
                
                {/* Etiqueta del mes */}
                <div className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2 text-center">
                  <div className="font-medium">{month.month}</div>
                  <div className="text-gray-400 hidden sm:block">{month.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-sm"></div>
            <span>Usuarios</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-sm"></div>
            <span>Certificados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-sm"></div>
            <span>Asignaciones</span>
          </div>
        </div>
      </div>

      {/* Cursos Populares */}
      {stats.popularCourses.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Cursos Más Populares</h2>
          <div className="space-y-3 sm:space-y-4">
            {stats.popularCourses.map((course, index) => (
              <div key={course._id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{course.courseName}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="inline sm:hidden">{course.assignmentCount} asig. • {course.approvedCount} aprob.</span>
                      <span className="hidden sm:inline">{course.assignmentCount} asignaciones • {course.approvedCount} aprobados</span>
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base sm:text-lg font-bold text-green-600">
                    {course.assignmentCount > 0 ? Math.round((course.approvedCount / course.assignmentCount) * 100) : 0}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">aprobación</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-blue-50 hover:bg-blue-100 transition-all duration-200 text-left hover:scale-105">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Actividad Reciente</h3>
              <p className="text-blue-700 text-xs sm:text-sm">Ver últimas acciones</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-green-50 hover:bg-green-100 transition-all duration-200 text-left hover:scale-105">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-green-900 text-sm sm:text-base">Configuración</h3>
              <p className="text-green-700 text-xs sm:text-sm">Ajustar plataforma</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-purple-50 hover:bg-purple-100 transition-all duration-200 text-left hover:scale-105 sm:col-span-2 lg:col-span-1">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-purple-900 text-sm sm:text-base">Reportes</h3>
              <p className="text-purple-700 text-xs sm:text-sm">Analizar rendimiento</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
