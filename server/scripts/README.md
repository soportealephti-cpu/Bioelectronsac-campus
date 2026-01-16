# Scripts de Mantenimiento

## Scripts Disponibles

### 1. corregirletra.js (Básico)
Script de normalización Unicode para usuarios únicamente.

### 2. corregirletra-completo.js (Recomendado)
Script completo que normaliza usuarios Y certificados existentes.

### ¿Cuándo usar este script?

Usa este script cuando:
- Los usuarios con "ñ" u otros caracteres especiales no pueden loguearse
- Después de migrar datos de otro sistema
- Para normalizar todos los usuarios en la base de datos

### ¿Qué hace el script?

1. Se conecta a MongoDB
2. Obtiene todos los usuarios de la base de datos
3. Normaliza el formato Unicode de:
   - Nombres
   - Apellidos
   - Correos electrónicos
4. Guarda los cambios solo en usuarios que lo necesiten
5. Muestra un reporte detallado de los cambios

### Cómo ejecutar

#### Script Básico (solo usuarios)

**Opción 1: Usando npm script (recomendado)**
```bash
cd server
npm run corregirletra
```

**Opción 2: Con Node directamente**
```bash
cd server
node scripts/corregirletra.js
```

**Opción 3: Doble clic en Windows**
- Navegar a `server/scripts/`
- Hacer doble clic en `corregirletra.bat`

#### Script Completo (usuarios + certificados) ⭐

**Opción 1: Usando npm script (recomendado)**
```bash
cd server
npm run corregirletra:completo
```

**Opción 2: Con Node directamente**
```bash
cd server
node scripts/corregirletra-completo.js
```

### Ejemplo de salida

```
🔧 SCRIPT DE NORMALIZACIÓN UNICODE
====================================

📡 Conectando a MongoDB...
✅ Conexión exitosa

📋 Obteniendo usuarios de la base de datos...
✅ 150 usuarios encontrados

🔍 Analizando y normalizando usuarios...

✅ Usuario actualizado:
   DNI: 12345678
   Nombre: "josé" → "josé"
   Apellido: "peña" → "peña"

✅ Usuario actualizado:
   DNI: 87654321
   Correo: "nmunoz@bioelectronsac.com" → "nmuñoz@bioelectronsac.com"

====================================
📊 RESUMEN DE LA NORMALIZACIÓN
====================================
✅ Usuarios actualizados: 12
⚪ Usuarios sin cambios: 138
❌ Errores: 0
📋 Total procesado: 150
====================================

🎉 ¡Normalización completada exitosamente!
💡 Los usuarios ahora podrán loguearse sin problemas.

👋 Conexión a MongoDB cerrada
```

### Importante

- ✅ **Seguro**: El script solo actualiza usuarios que realmente necesitan normalización
- ✅ **No destructivo**: No elimina ni modifica datos importantes
- ✅ **Detallado**: Muestra exactamente qué cambios se realizaron
- ✅ **Idempotente**: Puedes ejecutarlo múltiples veces sin problemas

### Requisitos

- Node.js instalado
- Archivo `.env` configurado con `MONGO_URI`
- Conexión a la base de datos MongoDB

### Solución de problemas

**Error: Cannot find module 'dotenv'**
```bash
npm install
```

**Error: Connection refused**
- Verifica que MongoDB esté corriendo
- Verifica la variable `MONGO_URI` en el archivo `.env`

**Error: Usuario no encontrado después de normalizar**
- Ejecuta el script nuevamente
- Verifica que el frontend también tenga los cambios de normalización
