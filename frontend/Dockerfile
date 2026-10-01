FROM node:18-alpine

WORKDIR /app

ARG REACT_APP_API_URL=http://localhost:3001

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Build React app
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

EXPOSE 80

# Servir com Express
CMD ["node", "server.js"]
