import { useState } from "react";
import { Database, Download, Upload, Users, BookOpen, Award, FileCheck, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Toast from "../components/Toast";
import { exportDatabaseToExcel, importDatabaseFromExcel } from "../services/backup";

export default function Backup() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const showToast = (type, message, ms = 3000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  const handleExportAll = async () => {
    try {
      setLoading(true);
      showToast("info", "Generando backup completo...", 5000);
      
      const blob = await exportDatabaseToExcel();
      
      // Crear nombre de archivo con fecha actual
      const now = new Date();
      const fileName = `backup_biocursos_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast("success", "Backup descargado exitosamente");
      
    } catch (error) {
      console.error("Error al exportar backup:", error);
      showToast("error", "Error al generar el backup");
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast("error", "Por favor selecciona un archivo Excel válido (.xlsx o .xls)");
      return;
    }

    try {
      setImporting(true);
      showToast("info", "Procesando archivo Excel...", 8000);
      
      const result = await importDatabaseFromExcel(file);
      
      setImportResults(result);
      setShowImportModal(true);
      showToast("success", "Importación completada exitosamente");
      
    } catch (error) {
      console.error("Error al importar Excel:", error);
      const errorMessage = error?.response?.data?.mensaje || "Error al procesar el archivo Excel";
      showToast("error", errorMessage);
    } finally {
      setImporting(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const backupSections = [
    {
      title: "Usuarios",
      description: "Datos completos de usuarios registrados",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      fields: ["Nombre", "Apellido", "DNI", "Correo", "Celular", "Rol", "Fecha de registro"]
    },
    {
      title: "Cursos",
      description: "Información de todos los cursos",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
      fields: ["Título", "Categoría", "URL del PDF", "Fecha de creación"]
    },
    {
      title: "Asignaciones",
      description: "Historial de cursos asignados",
      icon: FileCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      fields: ["Usuario", "Curso", "Estado", "Intentos", "Resultado", "Fecha de asignación"]
    },
    {
      title: "Certificados",
      description: "Registros de certificados emitidos",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      fields: ["Usuario", "Curso", "Número de certificado", "Fecha de emisión", "Horas"]
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 sm:mb-8 text-center sm:text-left">
        <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
          <Database className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Backup de Base de Datos</h1>
          <p className="text-sm sm:text-base text-gray-600">Exporta todos los datos del sistema a formato Excel</p>
        </div>
      </div>

      {/* Botón de exportar principal */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-0 text-center sm:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Backup Completo</h2>
            <p className="text-sm sm:text-base text-blue-100 mb-4">
              Descarga un archivo Excel con todos los datos de la plataforma
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-blue-200">
              <Calendar size={16} />
              <span>Incluye datos desde el inicio hasta hoy</span>
            </div>
          </div>
          <button
            onClick={handleExportAll}
            disabled={loading}
            className="bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold flex items-center gap-3 transition-colors w-full sm:w-auto justify-center text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Generando...</span>
                <span className="sm:hidden">Generando</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span className="hidden sm:inline">Descargar Backup</span>
                <span className="sm:hidden">Descargar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sección de Importar */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-0 text-center sm:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Restaurar desde Excel</h2>
            <p className="text-sm sm:text-base text-blue-100 mb-4">
              Sube un archivo Excel para restaurar o importar datos al sistema
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-blue-200">
              <Upload size={16} />
              <span>Compatible con archivos .xlsx y .xls</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              disabled={importing}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className={`bg-white text-green-600 hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold flex items-center gap-3 transition-colors cursor-pointer text-sm sm:text-base ${importing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {importing ? (
                <>
                  <div className="w-5 h-5 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Procesando...</span>
                  <span className="sm:hidden">Procesando</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span className="hidden sm:inline">Seleccionar Excel</span>
                  <span className="sm:hidden">Subir</span>
                </>
              )}
            </label>
            <p className="text-xs text-blue-200">Máximo 10MB</p>
          </div>
        </div>
      </div>

      {/* Información sobre las secciones incluidas */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 text-center sm:text-left">Datos Incluidos en el Backup</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {backupSections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl p-4 sm:p-6 border shadow-sm">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4">
                <div className={`p-3 rounded-lg ${section.bgColor} mx-auto sm:mx-0`}>
                  <section.icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800">{section.title}</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">{section.description}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Campos incluidos:</h5>
                <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                  {section.fields.map((field, fieldIndex) => (
                    <span
                      key={fieldIndex}
                      className="text-xs bg-white px-2 py-1 rounded text-gray-600"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6 rounded-r-xl">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mx-auto sm:mx-0" />
          <div className="text-center sm:text-left">
            <h4 className="text-yellow-800 font-semibold mb-2 text-sm sm:text-base">Información Importante</h4>
            <ul className="text-yellow-700 text-xs sm:text-sm space-y-1 text-left">
              <li>• El archivo se descargará en formato .xlsx (Excel)</li>
              <li>• Cada tabla de la base de datos será una hoja separada</li>
              <li>• Los datos se exportan con la información actual del sistema</li>
              <li>• El proceso puede tomar unos momentos según la cantidad de datos</li>
              <li>• Se recomienda realizar backups regularmente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de resultados de importación */}
      {showImportModal && importResults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Resultados de la Importación</h3>
                    <p className="text-sm text-gray-600">Total procesado: {importResults.totalProcesado} registros</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Usuarios */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Usuarios</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResults.resultados.users.created}</div>
                      <div className="text-gray-600">Creados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{importResults.resultados.users.updated}</div>
                      <div className="text-gray-600">Actualizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResults.resultados.users.errors}</div>
                      <div className="text-gray-600">Errores</div>
                    </div>
                  </div>
                </div>

                {/* Cursos */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-800">Cursos</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResults.resultados.courses.created}</div>
                      <div className="text-gray-600">Creados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{importResults.resultados.courses.updated}</div>
                      <div className="text-gray-600">Actualizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResults.resultados.courses.errors}</div>
                      <div className="text-gray-600">Errores</div>
                    </div>
                  </div>
                </div>

                {/* Asignaciones */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-gray-800">Asignaciones</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResults.resultados.assignments.created}</div>
                      <div className="text-gray-600">Creadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{importResults.resultados.assignments.updated}</div>
                      <div className="text-gray-600">Actualizadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResults.resultados.assignments.errors}</div>
                      <div className="text-gray-600">Errores</div>
                    </div>
                  </div>
                </div>

                {/* Certificados */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Award className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-800">Certificados</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResults.resultados.certificates.created}</div>
                      <div className="text-gray-600">Creados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{importResults.resultados.certificates.updated}</div>
                      <div className="text-gray-600">Actualizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResults.resultados.certificates.errors}</div>
                      <div className="text-gray-600">Errores</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}