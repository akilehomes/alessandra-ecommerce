# 🔧 Setup - Alessandra Zanetti E-commerce

## 1️⃣ Instalação das Dependências

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## 2️⃣ Criar Banco de Dados PostgreSQL

### Opção A: Docker (Recomendado)

```bash
docker run --name alessandra-db \
  -e POSTGRES_DB=alessandra_db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Opção B: PostgreSQL Local

```bash
createdb alessandra_db
```

---

## 3️⃣ Criar Schema e Popular Dados

```bash
# Aplicar schema
psql -h localhost -U postgres -d alessandra_db < backend/database/schema.sql

# Seed de dados (6 produtos + cupons)
cd backend
node seeds/seed-products.js
```

**Esperado:**
```
🎉 SEED CONCLUÍDO COM SUCESSO!
📋 Dados de Teste:
🏪 PRODUTOS (6): Vasos, Quadro, Tapete, Poltrona, Luminária, Aparador
🎟️  CUPONS (3): TESTE10, PRIMEIRACOMPRA, FRETE5
```

---

## 4️⃣ Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Editar `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alessandra_db
PORT=3001
NODE_ENV=development
REACT_APP_API_URL=http://localhost:3001
```

---

## 5️⃣ Rodar Aplicação

### Terminal 1: Backend
```bash
cd backend
npm start
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
```

**Acesso:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Admin: http://localhost:3000/admin

---

## ✅ Verificação

```bash
# Testar produtos
curl http://localhost:3001/api/products

# Testar admin dados
curl http://localhost:3001/api/admin/dashboard
```

---

## 📊 Dados Populados

✅ 6 Produtos (Vasos, Quadro, Tapete, Poltrona, Luminária, Aparador)
✅ 3 Cupons (TESTE10 10%, PRIMEIRACOMPRA 15%, FRETE5 5%)
✅ Inventário completo
✅ Imagens de teste

---

## 🧪 Fluxo de Teste

Ver: [TESTING.md](TESTING.md) para testar checkout completo

---

**Setup completo em ~15 minutos!** ✨
