// src/pages/Login.jsx
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, GraduationCap, Shield, Clock, Award } from "lucide-react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({ correo: "", contraseña: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
    if (error) setError(""); // Limpiar error cuando el usuario empiece a escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        correo: formData.correo,
        password: formData.contraseña,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.rol);

      if (data.rol === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/homeuser");
      }
    } catch (err) {
      console.error(err?.response?.data || err.message);
      setError("Credenciales inválidas o error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Diseño Móvil/Tablet */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-blue-900 flex flex-col">
        {/* Header con logo para móviles */}
        <div className="flex-shrink-0 p-4 sm:p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Bioelectron</h1>
              <p className="text-xs text-green-200">Academy</p>
            </div>
          </div>
        </div>

        {/* Contenido principal móvil */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-md mx-auto">
            {/* Formulario móvil */}
            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20">
              
              {/* Header del formulario */}
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">¡Bienvenido!</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Ingresa a tu cuenta para acceder a los cursos
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                
                {/* Campo Email */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="ejemplo@correo.com"
                      required
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-200 bg-white/50 backdrop-blur"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="contraseña"
                      value={formData.contraseña}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-200 bg-white/50 backdrop-blur"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                    <p className="text-red-700 text-sm sm:text-base text-center font-medium">{error}</p>
                  </div>
                )}

                {/* Botón de submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Iniciando sesión...
                    </div>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>
              </form>
            </div>

            {/* Features para móvil */}
            <div className="mt-6 sm:mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20">
                  <span className="text-xs sm:text-sm font-medium text-white">🔒 Acceso Seguro</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20">
                  <span className="text-xs sm:text-sm font-medium text-white">🎓 Certificado</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20 sm:col-span-3">
                  <span className="text-xs sm:text-sm font-medium text-white">⏱️ 24/7 Disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer móvil */}
        <div className="flex-shrink-0 p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-green-200">
            © 2024 Bioelectron Academy. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Diseño Desktop - Original */}
      <div 
        className="hidden lg:flex min-h-screen items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(22, 163, 74, 0.8), rgba(37, 99, 235, 0.8)),
            url('https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1950&q=80')
          `,
        }}
      >
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ingresa a tu cuenta para acceder a los cursos
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block mb-1 text-sm text-gray-700">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-60"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="flex justify-around mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">🔒 Acceso Seguro</div>
            <div className="flex items-center gap-1">🎓 Cursos Certificados</div>
            <div className="flex items-center gap-1">⏱️ 24/7 Disponible</div>
          </div>
        </div>
      </div>
    </>
  );
}