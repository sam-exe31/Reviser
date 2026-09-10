# ---- Build stage --------------------------------------------------------
# Maven builds the Spring Boot jar. The frontend-maven-plugin (see pom.xml)
# downloads Node, runs `npm ci` + `npm run build:web`, and the result is copied
# into the classpath's /static, so the single jar serves both API and SPA.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# pom first for dependency-layer caching, then the sources.
COPY pom.xml ./
COPY src/ src/
COPY frontend/ frontend/

RUN mvn -B -DskipTests clean package

# ---- Runtime stage ------------------------------------------------------
# Slim JRE runs the fat jar. Render/PaaS inject $PORT, which application.properties
# binds via server.port=${PORT:8080}.
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
