# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
# Entramos en la carpeta del proyecto React
COPY VisitFlow-React/package*.json ./
RUN npm install
COPY VisitFlow-React/ .

# Permite inyectar la URL de la API durante la compilación en Docker
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production Stage
FROM nginx:stable-alpine
# Los archivos compilados estarán en /app/dist dentro de la imagen de build
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos el nginx.conf que ahora está en la raíz
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
