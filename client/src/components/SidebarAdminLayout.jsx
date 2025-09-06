import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  X,
  LogOut,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  FileCheck,
  CheckCircle,
  Database
} from "lucide-react";

export default function SidebarAdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/login");
  };

  const menuItems = [
    { label: "Usuarios", icon: <Users size={18} />, href: "/admin/usuarios" },
    { label: "Crear Curso", icon: <BookOpen size={18} />, href: "/admin/cursos" },
    { label: "Asignar Curso", icon: <ClipboardList size={18} />, href: "/admin/asignar" },
    { label: "Crear Examen", icon: <FileCheck size={18} />, href: "/admin/examenes" },
    { label: "Resumen", icon: <CheckCircle size={18} />, href: "/admin/resumen" },
    { label: "Certificados", icon: <GraduationCap size={18} />, href: "/admin/certificados" },
    { label: "Backup", icon: <Database size={18} />, href: "/admin/backup" }
  ];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Overlay para móvil */}
      {open && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar Móvil */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-green-600 to-blue-900 text-white transition-transform duration-300 z-50 shadow-2xl ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        {/* Top bar solo para móvil */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap size={24} className="text-white" />
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
          <button 
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Header móvil */}
        <div className="flex flex-col items-center justify-center text-center p-4 mb-4">
          <div className="bg-white rounded-full shadow-lg mb-3 p-3">
            <GraduationCap size={48} className="text-blue-900" />
          </div>
          <div className="text-center">
            <h1 className="text-sm font-semibold text-white leading-tight mb-1">
              Bienvenido
            </h1>
            <span className="text-xs text-green-300 font-medium">Administrador</span>
          </div>
        </div>

        {/* Navegación móvil */}
        <nav className="px-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.href} 
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/15 text-white/90 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Botón cerrar sesión móvil */}
        <div className="p-4">
          <button
            onClick={() => { cerrarSesion(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-white hover:bg-white/20 transition-all duration-200 rounded-lg border border-white/20 hover:border-white/40 justify-center"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <div className={`hidden lg:block lg:static bg-gradient-to-b from-green-600 to-blue-900 text-white transition-all duration-300 shadow-xl ${
        isDesktopCollapsed ? "lg:w-20" : "lg:w-64"
      }`}>

        {/* Header desktop */}
        <div className="flex flex-col items-center justify-center text-center p-4 lg:p-6 mb-4">
          <div className="bg-white rounded-full shadow-lg mb-3 p-3 lg:p-4">
            <button 
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="transition-all hover:scale-105 text-blue-900 hover:text-blue-700"
              title={isDesktopCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              <GraduationCap size={isDesktopCollapsed ? 32 : 48} />
            </button>
          </div>
          {!isDesktopCollapsed && (
            <div className="text-center">
              <h1 className="text-sm lg:text-base font-semibold text-white leading-tight mb-1">
                Bienvenido
              </h1>
              <span className="text-xs lg:text-sm text-green-300 font-medium">Administrador</span>
            </div>
          )}
        </div>

        {/* Navegación desktop */}
        <nav className="px-3 lg:px-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.href} 
                  className={`group flex items-center rounded-xl transition-all duration-200 hover:bg-white/15 hover:text-white text-white/90 ${
                    isDesktopCollapsed 
                      ? "justify-center p-3" 
                      : "gap-3 p-3"
                  }`}
                  title={isDesktopCollapsed ? item.label : undefined}
                >
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  {!isDesktopCollapsed && (
                    <span className="font-medium text-sm">
                      {item.label}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Botón cerrar sesión desktop */}
        <div className="p-3 lg:p-4">
          <button
            onClick={() => { cerrarSesion(); setOpen(false); }}
            className={`w-full flex items-center bg-white/10 text-white hover:bg-white/20 transition-all duration-200 rounded-lg border border-white/20 hover:border-white/40 ${
              isDesktopCollapsed 
                ? "justify-center p-3" 
                : "gap-3 px-4 py-3 justify-center"
            }`}
            title={isDesktopCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!isDesktopCollapsed && (
              <span className="font-medium text-sm">
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Top bar para móvil/tablet */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-b shadow-sm flex items-center justify-between px-4 z-30">
        <button 
          onClick={() => setOpen(true)} 
          className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={22} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600 to-blue-900 grid place-items-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
        <button 
          onClick={cerrarSesion} 
          className="text-red-600 p-2.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Contenido */}
      <div className={`flex-1 overflow-x-hidden transition-all duration-300 ${
        isDesktopCollapsed ? "lg:ml-20" : "lg:ml-64"
      }`}>
        {/* Espacio para top bar móvil */}
        <div className="h-16 lg:hidden" />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}