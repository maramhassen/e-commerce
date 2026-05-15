FROM --platform=linux/amd64 maven:3.8-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM --platform=linux/amd64 eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
RUN mkdir -p /app/uploads/images && chown -R spring:spring /app
COPY --chown=spring:spring uploads/images/ /app/images-init/
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar
COPY --chown=spring:spring start.sh /app/start.sh
RUN chmod +x /app/start.sh
USER spring:spring
ENV SPRING_PROFILES_ACTIVE=production
ENV SERVER_PORT=8080
ENV FILE_UPLOAD_DIR=/app/uploads/images
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["/app/start.sh"]

