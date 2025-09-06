import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, Download, Eye, Calendar, BookOpen, X, ArrowLeft } from "lucide-react";
import api from "../../api";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCertificate, setViewingCertificate] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        
        // Obtener información del usuario
        const { data: userData } = await api.get("/auth/me");
        
        // Obtener certificados del usuario
        const userId = userData?.id || userData?._id;
        if (userId) {
          console.log("Buscando certificados para usuario ID:", userId);
          const { data: certData } = await api.get(`/certificates/user/${userId}`);
          console.log("Certificados obtenidos:", certData);
          setCertificates(certData);
          
          // Si hay un certificado específico en la URL, abrirlo automáticamente
          const certId = searchParams.get('cert');
          if (certId) {
            const targetCert = certData.find(cert => cert._id === certId);
            if (targetCert) {
              setViewingCertificate(targetCert);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching certificates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [searchParams]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Award className="text-emerald-600" size={24} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Certificados</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Aquí puedes ver y descargar todos tus certificados de cursos completados.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border p-4 sm:p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border p-6 sm:p-12 text-center">
          <Award className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            No tienes certificados aún
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Completa y aprueba tus cursos para obtener certificados oficiales.
          </p>
          <button 
            onClick={() => window.location.href = '/homeuser/courses'}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            Ver mis cursos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {certificates.map((cert) => (
            <div 
              key={cert._id}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border hover:shadow-md transition-shadow p-4 sm:p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Award className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    #{cert.number}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  BIO-{new Date(cert.emitDate).getFullYear()}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {cert.courseTitle || cert.course?.titulo}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <BookOpen size={14} />
                  <span>{cert.course?.categoria || 'Curso'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>Emitido: {formatDate(cert.emitDate)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewingCertificate(cert)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
                >
                  <Eye size={16} />
                  Ver
                </button>
                <button
                  onClick={() => window.open(`http://localhost:5000/api/certificates/${cert._id}/pdf`, '_blank')}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  title="Descargar certificado"
                >
                  <Download size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visor de PDF Integrado */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
            {/* Header del visor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6 border-b">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm sm:text-base"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Volver</span>
                </button>
                <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <Award className="text-emerald-600" size={18} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {viewingCertificate.courseTitle || viewingCertificate.course?.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">Certificado #{viewingCertificate.number}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(`http://localhost:5000/api/certificates/${viewingCertificate._id}/pdf`, '_blank')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm sm:text-base"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Descargar</span>
                </button>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition sm:hidden"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Visor de PDF */}
            <div className="flex-1 p-4">
              <iframe
                src={`http://localhost:5000/api/certificates/${viewingCertificate._id}/pdf`}
                className="w-full h-full border-0 rounded-lg"
                title="Vista del certificado"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}