import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Cursos from "./pages/Cursos";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import AsignarCurso from "./pages/AsignarCurso";
import SidebarAdminLayout from "./components/SidebarAdminLayout";
import Examenes from "./pages/Examenes";
import Resumen from "./pages/Resumen";
import Certificados from "./pages/Certificados";
import Backup from "./pages/Backup";
import StudentLayout from "./layouts/StudentLayout";
import StudentCourses from "./pages/student/StudentCourses";
import CourseViewer from "./pages/student/CourseViewer";
import ExamTake from "./pages/student/ExamTake";
import Profile from "./pages/student/Profile"; // Importar el componente Profile
import StudentCertificates from "./pages/student/Certificates"; // Importar certificados de estudiante
import ProtectedRoute from "./components/ProtectedRoute"; // Importar el componente

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas de Administrador Protegidas */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<SidebarAdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/usuarios" element={<Usuarios />} />
            <Route path="/admin/cursos" element={<Cursos />} />
            <Route path="/admin/asignar" element={<AsignarCurso />} />
            <Route path="/admin/examenes" element={<Examenes />} />
            <Route path="/admin/resumen" element={<Resumen />} />
            <Route path="/admin/certificados" element={<Certificados />} />
            <Route path="/admin/backup" element={<Backup />} />
          </Route>
        </Route>

        {/* Rutas de Estudiante Protegidas */}
        <Route element={<ProtectedRoute role="user" />}>
          <Route path="/homeuser" element={<StudentLayout />}>
            <Route index element={<Profile />} /> {/* Renderizar Profile en la ruta índice */}
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:id" element={<CourseViewer />} />
            <Route path="exam/:examId" element={<ExamTake />} />
            <Route path="certificates" element={<StudentCertificates />} />
          </Route>
        </Route>

        {/* Catch-all: Redirigir a la página apropiada si está logueado, si no al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

