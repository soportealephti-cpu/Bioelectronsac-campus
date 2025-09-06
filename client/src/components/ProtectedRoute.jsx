import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("rol");

  if (!token) {
    // Si no hay token, redirigir al login
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    // Si se requiere un rol específico y el usuario no lo tiene,
    // redirigir (puedes redirigir a una página de "no autorizado" o al login)
    return <Navigate to="/login" replace />;
  }

  // Si el token existe y el rol es correcto (o no se requiere uno específico),
  // renderizar el contenido de la ruta protegida
  return <Outlet />;
};

export default ProtectedRoute;
