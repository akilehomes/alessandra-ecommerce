# 🚀 Quick Deployment Guide - alessandrazanetti.com

## 1️⃣ Preparação (5 minutos)

```bash
# Clonar projeto
git clone seu-repo
cd alessandra-ecommerce

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com credenciais reais
nano .env
```

## 2️⃣ Deploy com DigitalOcean (Recomendado)

### Via App Platform (Mais Fácil)

1. Acessar: https://cloud.digitalocean.com/apps/create
2. Conectar GitHub (repositório do projeto)
3. Configurar Build & Run:
   - **Frontend**: `npm run build`
   - **Backend**: `npm start`
4. Adicionar PostgreSQL Managed Database
5. Definir Variáveis de Ambiente (copiar do .env)
6. Deploy automático!

### Configurar Domínios

1. No DigitalOcean Dashboard → Apps → Domains
2. Adicionar:
   - `alessandrazanetti.com` → Frontend
   - `api.alessandrazanetti.com` → Backend
3. Apontar Nameservers no Registrador (GoDaddy, etc):
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```

## 3️⃣ Testar Deployment

```bash
# Testar API
curl https://api.alessandrazanetti.com/health

# Testar Frontend
curl https://alessandrazanetti.com

# Verificar SSL
curl -I https://alessandrazanetti.com
```

## 4️⃣ Opção: Deploy com Docker (Local)

```bash
# Build e run
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f backend
```

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| API não conecta | Verificar DATABASE_URL em .env |
| Domínio não resolve | Aguardar 24h propagação DNS |
| SSL error | Certbot gerado automaticamente (DigitalOcean) |
| 500 error backend | Ver logs: `docker-compose logs backend` |

## 📋 Checklist Final

- [ ] .env configurado com credenciais reais
- [ ] Banco de dados criado e conectado
- [ ] Frontend build testado localmente
- [ ] Domínio apontando para DigitalOcean
- [ ] SSL funcionando (https)
- [ ] API respondendo
- [ ] Admin panel acessível em /admin

---

**Status**: ✅ Pronto para produção
**Tempo Total**: ~30 minutos
**Suporte**: Ver DEPLOYMENT.md para detalhes completos
