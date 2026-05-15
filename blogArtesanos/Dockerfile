# ────────────────────────────────────────────────────────────────────────
# Dockerfile multi-stage para Artesanos.ar backend
# ────────────────────────────────────────────────────────────────────────

# Stage 1: build con Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Descargamos dependencias primero para cachearlas (capa separada)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: runtime con solo el JRE (imagen mucho más chica)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Usuario no-root por seguridad
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

# Health check para que el orquestador (Docker, k8s, Render) sepa si está vivo
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
