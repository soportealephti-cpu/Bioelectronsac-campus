// src/layouts/StudentLayout.jsx
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  UserRound,
  BookOpen,
  TrendingUp,
  Award,
  LogOut,
  Menu
} from "lucide-react";


export default function StudentLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // Empezar cerrado en móviles
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  const nav = [
    { to: "/homeuser", label: "Mi perfil", icon: UserRound },
    { to: "/homeuser/courses", label: "Cursos", icon: BookOpen },
    { to: "/homeuser/certificates", label: "Certificados", icon: Award },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/login", { replace: true }); // vuelve al login
   };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar Desktop */}
      <aside
        className={`relative hidden lg:flex flex-col transition-all duration-300 ${
          isDesktopSidebarCollapsed ? "w-20" : "w-72"
        } shadow-xl`}
      >
        {/* capa de color */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-600 via-emerald-600 to-blue-600" />

        {/* brillo superior */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full blur-3xl bg-white/20" />

        {/* contenido */}
        <div className="relative flex-1 text-white/90">
          {/* branding */}
          <div className="h-16 px-4 flex items-center gap-3 border-b border-white/10">
            <button 
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className="h-10 w-10 rounded-2xl bg-white/15 grid place-items-center backdrop-blur hover:bg-white/25 transition-colors"
            >
              <UserRound size={20} />
            </button>
            {!isDesktopSidebarCollapsed && (
              <div className="leading-tight">
                <div className="font-semibold text-white">Área del Estudiante</div>
                <div className="text-xs text-white/70">Bioelectron</div>
              </div>
            )}
          </div>

          <nav className="p-3">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/homeuser"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition
                   ${isActive
                     ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.15)]"
                     : "hover:bg-white/10 hover:text-white"}`
                }
              >
                <div className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center">
                  <Icon className="h-4 w-4" />
                </div>
                {!isDesktopSidebarCollapsed && <span className="font-medium">{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto p-3">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition"
            >
              <div className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center">
                <LogOut className="h-4 w-4" />
              </div>
              {!isDesktopSidebarCollapsed && <span className="font-medium">Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar móvil y tablet */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-b shadow-sm flex items-center justify-between px-4 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 grid place-items-center">
            <UserRound size={16} className="text-white" />
          </div>
          <div className="font-semibold text-gray-900">Estudiante</div>
        </div>
        <button 
          onClick={logout} 
          className="text-red-600 p-2.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Overlay para móvil */}
      {open && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Drawer móvil */}
      <div className={`lg:hidden fixed top-16 left-0 w-80 max-w-[85vw] h-[calc(100vh-64px)] bg-gradient-to-b from-green-600 via-emerald-600 to-blue-600 text-white z-50 transform transition-transform duration-300 shadow-2xl ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header del drawer */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/15 grid place-items-center backdrop-blur">
              <UserRound size={24} />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-white text-lg">Área del Estudiante</div>
              <div className="text-sm text-white/70">Bioelectron Academy</div>
            </div>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="p-4 space-y-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/homeuser"}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                 ${isActive 
                   ? "bg-white/15 text-white shadow-lg scale-105" 
                   : "hover:bg-white/10 hover:text-white hover:scale-102"}`
              }
              onClick={() => setOpen(false)}
            >
              <div className="h-10 w-10 rounded-lg bg-white/10 grid place-items-center">
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-lg">{label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Footer del drawer */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all hover:scale-102"
          >
            <div className="h-10 w-10 rounded-lg bg-white/10 grid place-items-center">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="font-medium text-lg">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Espacio para topbar móvil/tablet */}
        <div className="h-16 lg:hidden" />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
