import { Copyright } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Copyright size={16} className="text-green-600" />
            <span className="font-medium">{currentYear} BIOELECTRON S.A.C.</span>
          </div>
          <span className="hidden sm:inline">|</span>
          <span>Todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  );
}
