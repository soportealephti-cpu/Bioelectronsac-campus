# Despliegue con Docker - Bioelectron Cursos

## Requisitos
- Docker
- Docker Compose

## Instrucciones de Despliegue

### 1. Clonar o descargar el proyecto
```bash
git clone <repository-url>
cd BioelectronCursosReact
```

### 2. Configurar variables de entorno (opcional)
Edita el archivo `docker-compose.yml` y cambia:
- `JWT_SECRET`: Pon una clave secreta segura
- Otros parámetros según necesites

### 3. Ejecutar con Docker Compose
```bash
# Construir y ejecutar los contenedores
docker-compose up --build

# Para ejecutar en segundo plano
docker-compose up -d --build
```

### 4. Acceder a la aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### 5. Credenciales por defecto
El sistema creará automáticamente un usuario administrador:
- **Email**: admin@bioelectron.com
- **Contraseña**: admin123

### Comandos útiles

```bash
# Ver logs
docker-compose logs -f

# Parar los contenedores
docker-compose down

# Eliminar volúmenes (cuidado: borra datos)
docker-compose down -v

# Reconstruir solo la aplicación
docker-compose build app

# Ejecutar comandos dentro del contenedor
docker-compose exec app sh
```

### Estructura de archivos persistentes
- Los archivos subidos se guardan en `./server/uploads`
- Los datos de MongoDB se persisten en volúmenes de Docker

### Notas importantes
- El primer arranque puede tardar unos minutos en descargar las imágenes
- Asegúrate de que los puertos 3000, 5000 y 27017 estén disponibles
- Para producción, considera cambiar las configuraciones de seguridad