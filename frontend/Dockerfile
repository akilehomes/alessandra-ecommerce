FROM node:18-alpine AS builder

WORKDIR /app

ARG REACT_APP_API_URL=http://localhost:3001

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Servidor Nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copiar build para Nginx
COPY --from=builder /app/build .

# Copiar configuração Nginx (será validada ao iniciar)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Iniciar Nginx sem daemon mode
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;'"]
