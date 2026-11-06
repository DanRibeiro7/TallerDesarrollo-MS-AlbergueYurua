# Imagen base de Node.js
FROM node:22-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --omit=dev

# Copiar código del microservicio
COPY . .

# Puerto utilizado por Comedor
EXPOSE 3000

# Iniciar el microservicio
CMD ["node", "index.js"]