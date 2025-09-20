#!/bin/sh

# Iniciar el servidor backend en segundo plano
cd /app/server && node index.js &

# Iniciar el frontend (servir archivos estáticos)
cd /app/client && serve -s build -l 3000

# Mantener el contenedor ejecutándose
wait