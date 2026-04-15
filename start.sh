#!/bin/sh
echo 'Copie des images vers uploads...'
mkdir -p /app/uploads/images
cp -n /app/images-init/*.jpg /app/uploads/images/ 2>/dev/null || true
echo 'Images copiees'
exec java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar /app/app.jar
