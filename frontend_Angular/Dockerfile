# ETAPA 1: Compilar Angular
FROM node:22-alpine AS build

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar proyecto Angular
COPY . .

# Compilar Angular
RUN npm run build

# ETAPA 2: Servir Angular con Nginx
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=build /app/dist/frontend-angular/browser /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto de Nginx
EXPOSE 80