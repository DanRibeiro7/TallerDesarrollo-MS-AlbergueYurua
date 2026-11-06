# Imagen base de PHP
FROM php:8.2-cli

# Instalar extensión para conectar PHP con MySQL
RUN docker-php-ext-install pdo_mysql

# Directorio de trabajo del contenedor
WORKDIR /app

# Copiar archivos del microservicio
COPY . /app

# Puerto utilizado por Recepción
EXPOSE 8000

# Iniciar servidor PHP
CMD ["php", "-S", "0.0.0.0:8000", "-t", "/app"]