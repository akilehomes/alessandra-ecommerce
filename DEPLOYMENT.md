# Deployment Guide - Alessandra Zanetti E-commerce

## 📋 Pré-requisitos
- Conta DigitalOcean
- Domínio: `alessandrazanetti.com`
- Git configurado
- Docker (opcional, recomendado)

---

## 🚀 FASE 5 - Deployment

### Opção A: Deploy com DigitalOcean App Platform (Recomendado)

#### 1. Preparar o projeto

```bash
# Frontend
cd frontend
npm run build

# Backend
cd ../backend
npm install
```

#### 2. Estrutura de Arquivos para Deploy

```
project/
├── frontend/          (React build)
├── backend/           (Node.js/Express)
├── docker-compose.yml (se usar Docker)
└── .env.production
```

#### 3. Configurar Variáveis de Ambiente

**Backend (.env)**
```
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/alessandra_db
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_xxx
MERCADOPAGO_ACCESS_TOKEN=APP_xxx
REACT_APP_API_URL=https://api.alessandrazanetti.com
```

**Frontend (.env)**
```
REACT_APP_API_URL=https://api.alessandrazanetti.com
```

#### 4. Deploy via DigitalOcean App Platform

1. **Criar App no DigitalOcean**
   - Acesse: https://cloud.digitalocean.com/apps
   - Clique em "Create App"
   - Conecte seu repositório GitHub

2. **Configurar Build**
   - Frontend: `npm install && npm run build`
   - Backend: `npm install && npm start`

3. **Configurar Banco de Dados**
   - Criar PostgreSQL Database no DigitalOcean
   - URL: `postgresql://...`
   - Conectar ao backend via DATABASE_URL

4. **Configurar Domínios**
   - Domínio principal: `alessandrazanetti.com` → Frontend
   - Subdomínio API: `api.alessandrazanetti.com` → Backend

#### 5. SSL/HTTPS
- DigitalOcean App Platform fornece SSL automático
- Certificado gerado automaticamente para ambos domínios

---

### Opção B: Deploy Manual com Droplet + Nginx

#### 1. Criar Droplet
- SO: Ubuntu 22.04 LTS
- Tamanho: 2GB RAM / 50GB SSD (inicial)
- Região: Europa (mais perto de Portugal)

#### 2. Conectar via SSH
```bash
ssh root@IP_DO_DROPLET
```

#### 3. Instalar Dependências
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Nginx
apt install -y nginx

# PM2 (gerenciar Node.js)
npm install -g pm2
```

#### 4. Clonar e Configurar Projeto
```bash
# Clonar repositório
git clone https://github.com/seu-user/alessandra-ecommerce.git
cd alessandra-ecommerce

# Backend
cd backend
npm install
cp .env.example .env
# Editar .env com credenciais reais

# Iniciar com PM2
pm2 start server.js --name "alessandra-api"
pm2 startup
pm2 save

# Frontend
cd ../frontend
npm install
npm run build
```

#### 5. Configurar Nginx
```bash
# /etc/nginx/sites-available/alessandra
server {
    listen 80;
    server_name alessandrazanetti.com www.alessandrazanetti.com;
    
    # Frontend
    location / {
        root /home/deployer/alessandra-ecommerce/frontend/build;
        try_files $uri /index.html;
    }
}

server {
    listen 80;
    server_name api.alessandrazanetti.com;
    
    # Backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. Configurar SSL com Certbot
```bash
apt install -y certbot python3-certbot-nginx

# Gerar certificados
certbot certonly --nginx -d alessandrazanetti.com -d www.alessandrazanetti.com -d api.alessandrazanetti.com

# Renovação automática
systemctl enable certbot.timer
```

#### 7. Ativar Nginx
```bash
nginx -t  # Testar config
systemctl restart nginx
```

---

## 📊 Configuração de Domínio

### No Registrador (GoDaddy, Namecheap, etc)

1. **Apontar Domínio para DigitalOcean**
   - Nameservers DigitalOcean:
     - ns1.digitalocean.com
     - ns2.digitalocean.com
     - ns3.digitalocean.com

2. **Records DNS** (via DigitalOcean Dashboard)
   ```
   A       @                    IP_APP_PLATFORM    (frontend)
   A       api                  IP_BACKEND         (backend)
   CNAME   www                  @
   ```

---

## 🗄️ Banco de Dados

### Criar Database no DigitalOcean

1. Managed Database → PostgreSQL
2. Configuração:
   - Engine: PostgreSQL 14+
   - Região: Europa
   - Tamanho: 1GB RAM (escalável)
3. Executar migrations:
```bash
psql $DATABASE_URL < backend/database/schema.sql
```

---

## 📝 Checklist Pré-Deployment

- [ ] Variáveis de ambiente configuradas
- [ ] Build frontend testado localmente
- [ ] Backend funcionando com BD de produção
- [ ] CORS configurado para domínio
- [ ] Stripe/MercadoPago em produção
- [ ] Email notifications ativadas
- [ ] Backups automáticos configurados
- [ ] Monitoramento ativo
- [ ] SSL/HTTPS funcionando
- [ ] DNS propagado

---

## 🔍 Testes Pós-Deployment

```bash
# Testar API
curl https://api.alessandrazanetti.com/health

# Testar Frontend
curl https://alessandrazanetti.com

# Verificar SSL
curl -I https://alessandrazanetti.com
```

---

## 📞 Suporte & Monitoramento

- **Logs DigitalOcean**: Dashboard → Apps → Logs
- **PM2 Monitoramento**: `pm2 monit`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL**: `psql -U postgres`

---

## 🔄 Atualizações Futuras

```bash
# Atualizar código
git pull origin main

# Frontend
npm run build

# Backend (com PM2)
pm2 restart alessandra-api

# Verificar status
pm2 status
```

---

**Deployment Status**: ✅ Pronto para produção
**Tempo Estimado**: 30-45 minutos
