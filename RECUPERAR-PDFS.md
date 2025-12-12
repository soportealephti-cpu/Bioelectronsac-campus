# 📄 Guía para Recuperar PDFs Faltantes

## ❌ Problema Identificado

**36 cursos NO tienen archivos PDF** en tu entorno local. Los archivos físicamente no existen en:
```
server/uploads/cursos/
```

Solo tienes **10 PDFs** que no corresponden a los cursos actuales en la base de datos.

---

## ✅ Soluciones Disponibles

### **Opción 1: Descargar PDFs desde el Servidor de Producción** (RECOMENDADO)

Si tienes acceso SSH al servidor de producción (`campus.bioelectronsac.com`):

#### 1. Conectarse al servidor
```bash
ssh usuario@campus.bioelectronsac.com
# o usar tu método de acceso (FileZilla, WinSCP, etc.)
```

#### 2. Comprimir los archivos en el servidor
```bash
cd /ruta/al/proyecto/server/uploads
tar -czf cursos-backup.tar.gz cursos/
```

#### 3. Descargar el archivo comprimido a tu PC
```bash
# En tu PC local (Windows PowerShell o Git Bash):
scp usuario@campus.bioelectronsac.com:/ruta/al/proyecto/server/uploads/cursos-backup.tar.gz .
```

#### 4. Extraer en tu proyecto local
```bash
# En Windows (PowerShell):
cd C:\Users\SoporteTi\Documents\fixpt2\server\uploads
tar -xzf cursos-backup.tar.gz

# O usar 7-Zip / WinRAR si prefieres interfaz gráfica
```

#### 5. Ejecutar el script de migración
```bash
cd server
node scripts/fix-file-encoding.js
```

---

### **Opción 2: Usar FileZilla/WinSCP** (MÁS FÁCIL)

1. Abre **FileZilla** o **WinSCP**
2. Conéctate al servidor de producción
3. Navega a: `/ruta/proyecto/server/uploads/cursos/`
4. Descarga TODOS los archivos `.pdf` a tu carpeta local:
   ```
   C:\Users\SoporteTi\Documents\fixpt2\server\uploads\cursos\
   ```
5. Ejecuta el script de migración:
   ```bash
   cd server
   node scripts/fix-file-encoding.js
   ```

---

### **Opción 3: Re-subir PDFs Manualmente desde el Panel Admin** (ÚLTIMA OPCIÓN)

Si NO tienes acceso al servidor de producción, deberás:

1. Obtener los archivos PDF originales de tu cliente/equipo
2. Acceder al panel de administración: `http://localhost:3000`
3. Ir a **Cursos**
4. Para cada curso, hacer clic en **Editar**
5. Subir el archivo PDF correspondiente
6. Guardar

**NOTA**: Los nuevos archivos se guardarán automáticamente sin acentos ni caracteres especiales.

---

## 📋 Lista de Cursos que Necesitan PDFs

### Módulo: PROTECCIÓN RADIOLÓGICA EN RADIOLOGÍA DENTAL (9 cursos)
- 1. Conceptos Fundamentales
- 2. Interacción de los Rayos X con la Materia
- 3. Magnitudes y Unidades de Radiación
- 4. Medición de las Radiaciones
- 5. Efectos Biológicos de las Radiaciones Ionizantes
- 6. Rayos X
- 7. Protección Radiológica en Radiodiagnóstico
- 8. Normativa en Protección Radiológica en el Perú
- 9. Evaluación Online

### Módulo: PROTECCIÓN RADIOLÓGICA EN RADIODIAGNÓSTICO MÉDICO (9 cursos)
- 1-8. Mismo contenido que el módulo dental
- 9. Evaluación Online

### Módulo: ACTUALIZACIÓN DE PROTECCIÓN RADIOLÓGICA EN RADIOLOGÍA DENTAL (9 cursos)
- 1-8. Mismo contenido que el módulo dental
- 9. Evaluación Online

### Módulo: ACTUALIZACIÓN DE PROTECCIÓN RADIOLÓGICA EN RADIODIAGNÓSTICO MÉDICO (9 cursos)
- 1-8. Mismo contenido que el módulo dental
- 9. Evaluación Online

**TOTAL: 36 cursos sin PDF**

---

## 🔧 Scripts Útiles Creados

### Verificar archivos faltantes
```bash
cd server
node scripts/check-missing-files.js
```

### Limpiar referencias a PDFs faltantes
```bash
cd server
node scripts/clean-missing-pdfs.js
```

### Normalizar nombres de archivos existentes
```bash
cd server
node scripts/fix-file-encoding.js
```

---

## ⚡ Próximos Pasos

1. **Decidir qué opción usar** (descargar del servidor o re-subir manualmente)
2. **Ejecutar el script de migración** después de tener los archivos
3. **Verificar** que todos los cursos muestren sus PDFs correctamente
4. **Probar** la descarga de materiales en la plataforma

---

## 🆘 ¿Necesitas Ayuda?

- ¿No tienes acceso SSH? → Pide credenciales al administrador del servidor
- ¿No encuentras los archivos en producción? → Verifica backups del servidor
- ¿Los archivos están en otro lado? → Indícame la ubicación y te ayudo a copiarlos
