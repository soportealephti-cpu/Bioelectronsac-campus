import { useEffect, useState, useMemo } from "react";
import { Plus, X, Trash2, Edit2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { listUsers, createUser, updateUser, deleteUser } from "../services/users";
import Toast from "../components/Toast";

const DOMAIN = "@bioelectronsac.com";
const USUARIOS_POR_PAGINA = 10;

export default function Usuarios() {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null); // null = crear, id = editar
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const showToast = (type, message, ms = 2200) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type, message: "" }), ms);
  };

  const [form, setForm] = useState({
    dni: "",
    apellido: "",
    nombre: "",
    correoBase: "",
    correoPersonal: "",
    telefono: ""
  });

  const abrirModalCrear = () => {
    setEditId(null);
    setForm({ dni: "", apellido: "", nombre: "", correoBase: "", correoPersonal: "", telefono: "" });
    setShowModal(true);
  };

  const abrirModalEditar = (u) => {
    setEditId(u._id);
    // extraer base del correo si termina en el dominio
    let base = u.correo || "";
    if (base.endsWith(DOMAIN)) base = base.replace(DOMAIN, "");
    setForm({
      dni: u.dni || "",
      apellido: u.apellido || "",
      nombre: u.nombre || "",
      correoBase: base,
      correoPersonal: u.correoPersonal || "",
      telefono: u.celular || u.telefono || ""
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ dni: "", apellido: "", nombre: "", correoBase: "", correoPersonal: "", telefono: "" });
  };

  const generarCorreoUnico = (nombre, apellido) => {
    const nombreCompleto = `${nombre.trim().toLowerCase()} ${apellido.trim().toLowerCase()}`;
    const primerApellido = apellido.split(' ')[0].toLowerCase();
    
    // Generar correo con 1 letra
    const primeraLetraNombre = nombre.charAt(0).toLowerCase();
    const correoBase1 = primeraLetraNombre + primerApellido;
    
    // Verificar si ya existe alguien con este correo
    const usuarioExistente1 = usuarios.find(u => 
      u.correo === `${correoBase1}@bioelectronsac.com`
    );
    
    if (usuarioExistente1) {
      // Si existe, verificar si es la misma persona (mismo nombre completo)
      const nombreCompletoExistente = `${usuarioExistente1.nombre.toLowerCase()} ${usuarioExistente1.apellido.toLowerCase()}`;
      
      if (nombreCompletoExistente === nombreCompleto) {
        return null; // No permitir registro de persona duplicada
      } else {
        // Diferentes personas, probar con 2 letras
        const dosLetrasNombre = nombre.substring(0, 2).toLowerCase();
        const correoBase2 = dosLetrasNombre + primerApellido;
        
        // Verificar si el correo con 2 letras también existe
        const usuarioExistente2 = usuarios.find(u => 
          u.correo === `${correoBase2}@bioelectronsac.com`
        );
        
        if (usuarioExistente2) {
          const nombreCompletoExistente2 = `${usuarioExistente2.nombre.toLowerCase()} ${usuarioExistente2.apellido.toLowerCase()}`;
          
          if (nombreCompletoExistente2 === nombreCompleto) {
            return null; // Persona duplicada
          } else {
            // Agregar número al final para hacer único
            let contador = 1;
            let correoFinal = correoBase2 + contador;
            while (usuarios.find(u => u.correo === `${correoFinal}@bioelectronsac.com`)) {
              contador++;
              correoFinal = correoBase2 + contador;
            }
            return correoFinal;
          }
        }
        
        return correoBase2; // Correo con 2 letras disponible
      }
    }
    
    return correoBase1; // Correo disponible con 1 letra
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updatedForm = { ...f, [name]: value };
      
      // Solo generar correo automáticamente al crear (no al editar)
      if (!editId && (name === 'nombre' || name === 'apellido')) {
        const nombre = name === 'nombre' ? value : f.nombre;
        const apellido = name === 'apellido' ? value : f.apellido;
        
        if (nombre && apellido) {
          const correoGenerado = generarCorreoUnico(nombre, apellido);
          if (correoGenerado === null) {
            // Mostrar error si es persona duplicada
            showToast("error", "Esta persona ya está registrada");
            updatedForm.correoBase = "";
          } else {
            updatedForm.correoBase = correoGenerado;
          }
        }
      }
      
      return updatedForm;
    });
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("error", "No se pudo cargar la lista");
      console.error(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dni || !form.apellido || !form.nombre || !form.correoBase) {
      showToast("warn", "Completa DNI, Apellido, Nombre y Correo");
      return;
    }

    // Validación adicional para creación: verificar si la persona ya existe
    if (!editId) {
      const nombreCompleto = `${form.nombre.trim().toLowerCase()} ${form.apellido.trim().toLowerCase()}`;
      const personaExistente = usuarios.find(u => 
        `${u.nombre.toLowerCase()} ${u.apellido.toLowerCase()}` === nombreCompleto
      );
      
      if (personaExistente) {
        showToast("error", "Esta persona ya está registrada en el sistema");
        return;
      }
    }

    const payload = {
      dni: form.dni,
      apellido: form.apellido,
      nombre: form.nombre,
      correo: form.correoBase, // backend agrega @bioelectronsac.com al crear; en editar enviamos base y que backend lo maneje si así lo definiste
      correoPersonal: form.correoPersonal,
      telefono: form.telefono,
      password: form.dni // Contraseña será el DNI
    };

    try {
      setLoading(true);

      if (editId) {
        // EDITAR
        await updateUser(editId, payload);
        showToast("success", "Usuario actualizado");
      } else {
        // CREAR
        await createUser(payload);
        showToast("success", "Usuario creado correctamente");
      }

      cerrarModal();
      await cargarUsuarios();
    } catch (e) {
      const msg =
        e?.response?.data?.mensaje ||
        (editId ? "Error al actualizar usuario" : "Error al crear usuario");
      showToast("error", msg);
      console.error(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      setLoading(true);
      await deleteUser(id);
      await cargarUsuarios();
      showToast("success", "Usuario eliminado");
    } catch (e) {
      showToast("error", "No se pudo eliminar");
      console.error(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios según término de búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;

    const term = searchTerm.toLowerCase().trim();
    return usuarios.filter(u => {
      const nombreCompleto = `${u.apellido || ''} ${u.nombre || ''}`.toLowerCase();
      const correo = (u.correo || '').toLowerCase();
      const dni = (u.dni || '').toLowerCase();
      const telefono = (u.celular || u.telefono || '').toLowerCase();

      return nombreCompleto.includes(term) ||
             correo.includes(term) ||
             dni.includes(term) ||
             telefono.includes(term);
    });
  }, [usuarios, searchTerm]);

  // Calcular paginación con usuarios filtrados
  const totalPaginas = Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * USUARIOS_POR_PAGINA;
  const indiceFin = indiceInicio + USUARIOS_POR_PAGINA;
  const usuariosPaginados = usuariosFiltrados.slice(indiceInicio, indiceFin);

  const irAPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
  };

  // Generar array de números de página para mostrar
  const obtenerNumerosPagina = () => {
    const numeros = [];
    const maxPaginasVisibles = 5;

    if (totalPaginas <= maxPaginasVisibles) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPaginas; i++) {
        numeros.push(i);
      }
    } else {
      // Mostrar páginas con elipsis
      if (paginaActual <= 3) {
        for (let i = 1; i <= 4; i++) numeros.push(i);
        numeros.push('...');
        numeros.push(totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        numeros.push(1);
        numeros.push('...');
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) numeros.push(i);
      } else {
        numeros.push(1);
        numeros.push('...');
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) numeros.push(i);
        numeros.push('...');
        numeros.push(totalPaginas);
      }
    }

    return numeros;
  };

  return (
    <div className="w-full">
      {toast.show && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast({ show: false })} />
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 text-center sm:text-left">Usuarios Registrados</h1>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 text-sm sm:text-base w-full sm:w-auto justify-center"
          disabled={loading}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Crear Usuario</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPaginaActual(1); // Reset a la primera página al buscar
            }}
            placeholder="Buscar por nombre, DNI, correo o teléfono..."
            className="w-full border-2 border-gray-300 rounded-lg pl-12 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPaginaActual(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Limpiar búsqueda"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Mostrando {usuariosFiltrados.length} resultado{usuariosFiltrados.length !== 1 ? 's' : ''} de {usuarios.length} total{usuarios.length !== 1 ? 'es' : ''}
          </p>
        )}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-green-100 text-gray-700">
                <th className="px-4 py-3 text-left font-semibold">DNI</th>
                <th className="px-4 py-3 text-left font-semibold">Apellido</th>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Correo</th>
                <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                <th className="px-4 py-3 text-left font-semibold w-36">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="px-4 py-4 text-gray-500 text-center" colSpan={6}>Cargando...</td></tr>
              )}
              {!loading && usuarios.length === 0 && (
                <tr><td className="px-4 py-4 text-gray-500 text-center" colSpan={6}>No hay usuarios registrados.</td></tr>
              )}
              {!loading && usuariosPaginados.map((u) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{u.dni}</td>
                  <td className="px-4 py-3">{u.apellido || "-"}</td>
                  <td className="px-4 py-3">{u.nombre}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="font-medium text-gray-700">{u.correo}</div>
                      {u.correoPersonal && (
                        <div className="text-gray-600 text-xs">{u.correoPersonal}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.celular || u.telefono || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        title="Editar"
                        className="p-2 rounded-lg border hover:bg-blue-50 text-blue-600 transition-colors"
                        onClick={() => abrirModalEditar(u)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        title="Eliminar"
                        className="p-2 rounded-lg border hover:bg-red-50 text-red-600 transition-colors"
                        onClick={() => onDelete(u._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de paginación Desktop */}
        {!loading && usuarios.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{indiceInicio + 1}</span> a{" "}
              <span className="font-medium">{Math.min(indiceFin, usuarios.length)}</span> de{" "}
              <span className="font-medium">{usuarios.length}</span> usuarios
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={paginaAnterior}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>
              {obtenerNumerosPagina().map((num, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof num === 'number' && irAPagina(num)}
                  disabled={num === '...'}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    num === paginaActual
                      ? 'bg-green-600 text-white'
                      : num === '...'
                      ? 'cursor-default'
                      : 'border hover:bg-white'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={paginaSiguiente}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vista Móvil/Tablet - Tarjetas */}
      <div className="lg:hidden">
        <div className="space-y-4">
          {loading && (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              Cargando usuarios...
            </div>
          )}
          {!loading && usuarios.length === 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
              No hay usuarios registrados.
            </div>
          )}
          {!loading && usuariosPaginados.map((u) => (
            <div key={u._id} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">{u.nombre} {u.apellido}</h3>
                  <p className="text-sm text-gray-600 font-medium">DNI: {u.dni}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    title="Editar"
                    className="p-2 rounded-lg border hover:bg-blue-50 text-blue-600 transition-colors"
                    onClick={() => abrirModalEditar(u)}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    title="Eliminar"
                    className="p-2 rounded-lg border hover:bg-red-50 text-red-600 transition-colors"
                    onClick={() => onDelete(u._id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start text-sm">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Correo:</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-700 break-all font-medium">{u.correo}</span>
                    {u.correoPersonal && (
                      <span className="text-gray-600 break-all text-xs">{u.correoPersonal}</span>
                    )}
                  </div>
                </div>
                {(u.celular || u.telefono) && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">Teléfono:</span>
                    <span className="text-gray-600">{u.celular || u.telefono}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Controles de paginación Móvil */}
        {!loading && usuarios.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 text-center mb-3">
              Mostrando {indiceInicio + 1} - {Math.min(indiceFin, usuarios.length)} de {usuarios.length}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={paginaAnterior}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {obtenerNumerosPagina().map((num, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof num === 'number' && irAPagina(num)}
                  disabled={num === '...'}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    num === paginaActual
                      ? 'bg-green-600 text-white'
                      : num === '...'
                      ? 'cursor-default'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={paginaSiguiente}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-600 hover:text-red-500">
              <X size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 pr-8">
              {editId ? "Editar Usuario" : "Registrar Nuevo Usuario"}
            </h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI
                  {!editId && (
                    <span className="text-xs text-green-600 ml-1">(También será la contraseña)</span>
                  )}
                </label>
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="DNI"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  required
                />
                {!editId && (
                  <p className="text-xs text-gray-500 mt-1">
                    El DNI se usará como contraseña para el login del usuario
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Apellido"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Institucional
                  {!editId && (
                    <span className="text-xs text-green-600 ml-1">(Se genera automáticamente)</span>
                  )}
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20">
                  <input
                    name="correoBase"
                    value={form.correoBase}
                    onChange={handleChange}
                    placeholder={editId ? "usuario" : "Se generará automáticamente"}
                    className="flex-1 px-4 py-3 focus:outline-none"
                    required
                    readOnly={!editId && form.nombre && form.apellido}
                  />
                  <span className="bg-gray-50 px-3 py-3 text-sm text-gray-600 border-l">{DOMAIN}</span>
                </div>
                {!editId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: 1 letra del nombre + apellido (ej: jperez). Si existe, se usan 2 letras (ej: juperez)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Personal
                  <span className="text-xs text-gray-500 ml-1">(opcional)</span>
                </label>
                <input
                  name="correoPersonal"
                  type="email"
                  value={form.correoPersonal}
                  onChange={handleChange}
                  placeholder="ejemplo@gmail.com"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Correo personal del usuario para contacto adicional
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium transition-colors" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {editId ? "Actualizando..." : "Guardando..."}
                  </div>
                ) : (
                  editId ? "Actualizar Usuario" : "Guardar Usuario"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
