export default function Toast({ type = "success", message = "", onClose }) {
  const colors = {
    success: "bg-green-600",
    error:   "bg-red-600",
    info:    "bg-blue-600",
    warn:    "bg-yellow-600"
  }[type] || "bg-gray-800";

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-fadeIn">
      <div className={`${colors} text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3`}>
        <span className="font-semibold capitalize">{type === "warn" ? "Aviso" : type}</span>
        <span className="opacity-90">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}
