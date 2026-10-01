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

# Copiar build para Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
