# ETAPA 1: Compilar el proyecto con Maven
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copiar configuración de Maven
COPY pom.xml .

# Copiar código fuente
COPY src ./src

# Compilar y generar el archivo JAR
RUN mvn clean package -DskipTests

# ETAPA 2: Ejecutar Spring Boot
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copiar el JAR generado en la primera etapa
COPY --from=build /app/target/*.jar app.jar

# Puerto de Portería
EXPOSE 8080

# Iniciar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]