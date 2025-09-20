# Usar una imagen base de Node.js
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del servidor
COPY server/package*.json ./server/
RUN cd server && npm install

# Instalar dependencias del cliente
COPY client/package*.json ./client/
RUN cd client && npm install

# Copiar código fuente
COPY server/ ./server/
COPY client/ ./client/

# Crear directorio para uploads
RUN mkdir -p server/uploads

# Construir la aplicación React
RUN cd client && npm run build

# Instalar serve para servir archivos estáticos
RUN npm install -g serve

# Exponer puertos
EXPOSE 3000 5000

# Script de inicio que ejecuta tanto backend como frontend
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]