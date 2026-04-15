# frontend/Dockerfile

# ÉTAPE 1: Build de l'application Angular
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Compiler l'application en production
RUN npm run build

# ÉTAPE 2: Servir avec Nginx
FROM nginx:stable-alpine

# Copier les fichiers compilés
COPY --from=builder /app/dist/site-e-commerce /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]