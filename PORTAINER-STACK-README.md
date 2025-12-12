# Docker Stack para Portainer - Bioelectron Campus Server

Este stack de Docker está diseñado para ejecutarse en Portainer y descarga automáticamente el código desde GitHub cada vez que el contenedor se reinicia.

## Características

- ✅ Descarga automática desde Git en cada reinicio
- ✅ Instalación automática de dependencias con `npm i -F`
- ✅ Solo ejecuta la carpeta `server` (backend)
- ✅ Se ejecuta en el puerto 5000
- ✅ Reinicio automático si el contenedor falla
- ✅ Volumen persistente para uploads

## Archivos Creados

1. **Dockerfile.server** - Imagen de Docker para el servidor
2. **entrypoint.sh** - Script que se ejecuta automáticamente al iniciar
3. **docker-compose-server-stack.yml** - Configuración del stack para Portainer

## Instalación en Portainer

### Opción 1: Usando el Web Editor de Portainer

1. Accede a Portainer
2. Ve a **Stacks** → **Add Stack**
3. Dale un nombre al stack: `bioelectron-campus-server`
4. Copia y pega el contenido de `docker-compose-server-stack.yml` en el editor
5. En la sección **Build method**, activa "Build from repository"
6. Configura:
   - **Repository URL**: `https://github.com/soportealephti-cpu/Bioelectronsac-campus.git`
   - **Compose path**: `docker-compose-server-stack.yml`
   - **Dockerfile path**: `Dockerfile.server`
7. Haz clic en **Deploy the stack**

### Opción 2: Usando Git Repository

1. Accede a Portainer
2. Ve a **Stacks** → **Add Stack**
3. Selecciona **Repository**
4. Configura:
   - **Repository URL**: `https://github.com/soportealephti-cpu/Bioelectronsac-campus.git`
   - **Repository reference**: `refs/heads/main` (o la rama que uses)
   - **Compose path**: `docker-compose-server-stack.yml`
5. Haz clic en **Deploy the stack**

### Opción 3: Subir archivos manualmente

1. Sube los siguientes archivos a tu servidor:
   - `Dockerfile.server`
   - `entrypoint.sh`
   - `docker-compose-server-stack.yml`
2. En Portainer, ve a **Stacks** → **Add Stack**
3. Selecciona **Upload**
4. Sube el archivo `docker-compose-server-stack.yml`
5. Haz clic en **Deploy the stack**

## ¿Qué hace el entrypoint.sh?

Cada vez que el contenedor se inicia o reinicia:

1. **Limpia** el directorio anterior (si existe)
2. **Clona** el repositorio completo desde GitHub
3. **Entra** a la carpeta `server`
4. **Instala** las dependencias con `npm i -F`
5. **Inicia** el servidor con `node index.js` en el puerto 5000

## Variables de Entorno

Si necesitas configurar variables de entorno (como credenciales de MongoDB, JWT secrets, etc.), puedes agregarlas en el docker-compose:

```yaml
environment:
  - NODE_ENV=production
  - MONGO_URI=tu_uri_de_mongodb
  - JWT_SECRET=tu_secreto_jwt
  - PORT=5000
```

O mejor aún, usa un archivo `.env` en Portainer:

1. Ve a tu stack en Portainer
2. Haz clic en **Editor**
3. Añade las variables de entorno necesarias

## Puerto Expuesto

- **5000**: Puerto del servidor backend

Puedes acceder al servidor en: `http://tu-ip:5000`

## Volúmenes

- **uploads-data**: Volumen persistente para la carpeta `server/uploads` (certificados, archivos subidos, etc.)

## Reinicio Automático

El contenedor está configurado con `restart: always`, lo que significa:
- Se reiniciará automáticamente si falla
- Se iniciará automáticamente cuando el servidor Docker arranque
- Cada reinicio ejecutará nuevamente el proceso de descarga desde Git

## Logs

Para ver los logs del contenedor en Portainer:

1. Ve a **Containers**
2. Haz clic en `bioelectron-campus-server`
3. Ve a la pestaña **Logs**

También puedes ver logs desde la línea de comandos:

```bash
docker logs bioelectron-campus-server -f
```

## Comandos Útiles

### Reconstruir el stack
```bash
docker-compose -f docker-compose-server-stack.yml up --build -d
```

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose-server-stack.yml logs -f
```

### Detener el stack
```bash
docker-compose -f docker-compose-server-stack.yml down
```

### Reiniciar el contenedor (descargará nuevamente desde Git)
```bash
docker restart bioelectron-campus-server
```

## Troubleshooting

### El servidor no inicia

1. Verifica los logs: `docker logs bioelectron-campus-server`
2. Asegúrate de que las dependencias del `package.json` sean correctas
3. Verifica que el archivo `.env` tenga las variables necesarias

### Error al clonar el repositorio

1. Verifica que la URL del repositorio sea correcta
2. Si el repositorio es privado, necesitarás configurar credenciales de Git

### Puerto 5000 en uso

Si el puerto 5000 ya está en uso, cámbialo en el `docker-compose-server-stack.yml`:

```yaml
ports:
  - "5001:5000"  # Cambia 5001 al puerto que prefieras
```

## Notas Importantes

- ⚠️ Cada reinicio descarga el código completo desde Git, asegurándote de tener siempre la última versión
- ⚠️ Los cambios locales en el contenedor se perderán al reiniciar
- ⚠️ Asegúrate de que el archivo `.env` o las variables de entorno estén configuradas correctamente
- ⚠️ La carpeta `uploads` se mantiene persistente entre reinicios gracias al volumen Docker

## Contacto

Para soporte técnico, contacta al equipo de desarrollo de Bioelectron SAC.
