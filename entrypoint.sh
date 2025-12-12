#!/bin/sh

echo "=== Iniciando contenedor ==="

# Directorio del repositorio
REPO_DIR="/app/repo"
REPO_URL="https://github.com/soportealephti-cpu/Bioelectronsac-campus.git"

# Limpiar y clonar el repositorio
echo "=== Limpiando directorio anterior ==="
rm -rf $REPO_DIR

echo "=== Clonando repositorio desde Git ==="
git clone $REPO_URL $REPO_DIR

if [ $? -ne 0 ]; then
    echo "Error al clonar el repositorio"
    exit 1
fi

# Ir al directorio del servidor
cd $REPO_DIR/server

echo "=== Instalando dependencias con npm i -F ==="
npm i -F

if [ $? -ne 0 ]; then
    echo "Error al instalar dependencias"
    exit 1
fi

echo "=== Iniciando servidor en puerto 5000 ==="
node index.js
