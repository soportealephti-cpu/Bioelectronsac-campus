# Instrucciones para Portainer Stack

## Pasos para instalar en Portainer:

1. Accede a tu Portainer
2. Ve a **Stacks** → **Add Stack**
3. Dale un nombre: `bioelectron-campus-server`
4. Selecciona **Web editor**
5. Copia TODO el contenido del archivo `portainer-stack.yml` y pégalo en el editor
6. Haz clic en **Deploy the stack**

¡Listo! El servidor se descargará automáticamente desde Git y se iniciará en el puerto 5000.

## ¿Qué hace?

Cada vez que el contenedor inicia o reinicia:
- ✅ Descarga el código desde GitHub
- ✅ Instala dependencias con `npm i -F`
- ✅ Levanta el servidor en puerto 5000

## Configuración adicional (opcional)

Si necesitas variables de entorno (MongoDB, JWT, etc.), agrégalas en la sección `environment`:

```yaml
environment:
  - NODE_ENV=production
  - MONGO_URI=tu_mongodb_uri
  - JWT_SECRET=tu_secreto
  - PORT=5000
```

## Acceder al servidor

Una vez desplegado, accede en: `http://tu-ip:5000`

## Ver logs

En Portainer:
1. Ve a **Containers**
2. Haz clic en `bioelectron-campus-server`
3. Pestaña **Logs**

## Reiniciar (descarga nuevamente desde Git)

En Portainer, haz clic en **Restart** en el contenedor o en el stack.
