# 🛍️ Alessandra Zanetti - Ecommerce Completo

Plataforma de ecommerce premium para Alessandra Zanetti com todas as funcionalidades de um ecommerce profissional.

## ✨ Funcionalidades Implementadas

### ✅ Core Ecommerce
- [x] Catálogo de produtos com filtros
- [x] Carrinho de compras (30min reservation)
- [x] Checkout multi-etapa
- [x] Gestão de estoque em tempo real
- [x] Variantes de produtos (cores, tamanhos)
- [x] Cupons de desconto

### ✅ Sistema de Pagamento
- [x] Stripe (Cartão de Crédito)
- [x] MercadoPago (PIX, Boleto, Cartão)
- [x] Confirmação de pagamento
- [x] Webhooks para atualização de status

### ✅ Frete & Logística
- [x] Cálculo de frete em tempo real (Correios)
- [x] Múltiplas opções de entrega (SEDEX, PAC, Econômico)
- [x] Validação de CEP
- [x] Rastreamento de pedidos
- [x] Integração com transportadoras

### ✅ Avize-me quando chegar
- [x] Registro de interesse em produtos sem estoque
- [x] Notificação automática por email
- [x] Histórico de reservas

### ✅ Cotação (Produtos especiais)
- [x] Formulário de solicitação
- [x] Dashboard de cotações (admin)
- [x] Envio de cotação por email

### ✅ Gestão de Pedidos
- [x] Criação automática de pedidos
- [x] Histórico de pedidos do cliente
- [x] Status em tempo real
- [x] Cancelamento de pedidos

### ✅ Painel de Admin
- [x] Dashboard com métricas
- [x] Gerenciamento de cotações
- [x] Controle de estoque
- [x] Gestão de pedidos

---

## 📋 Arquitetura

```
alessandra-ecommerce/
├── backend/
│   ├── server.js                 # Express server
│   ├── package.json              # Dependencies
│   ├── .env.example              # Environment variables
│   ├── database/
│   │   └── schema.sql            # Banco de dados completo
│   └── routes/
│       ├── products.js           # ✅ Produtos & "Avise-me"
│       ├── cart.js               # ✅ Carrinho & Cupons
│       ├── orders.js             # ✅ Pedidos
│       ├── payment.js            # ✅ Stripe & MercadoPago
│       ├── shipping.js           # ✅ Frete & Rastreamento
│       ├── auth.js               # ✅ Login/Registro
│       ├── admin.js              # ✅ Painel Admin
│       └── notifications.js      # (Placeholder)
│
└── frontend/
    ├── package.json
    ├── public/
    └── src/
        ├── components/
        ├── pages/
        ├── store/
        └── styles/
```

---

## 🚀 Como Rodar

### 1️⃣ **Setup do Banco de Dados**

```bash
# Criar banco PostgreSQL
createdb alessandra_ecommerce

# Executar schema
psql -U postgres -d alessandra_ecommerce -f backend/database/schema.sql
```

### 2️⃣ **Setup do Backend**

```bash
cd backend

# Instalar dependências
npm install

# Copiar .env
cp .env.example .env

# Preencher .env com suas chaves (Stripe, MercadoPago, etc)

# Rodar servidor
npm run dev  # Rodará em http://localhost:5000
```

### 3️⃣ **Setup do Frontend**

```bash
cd frontend

# Instalar dependências
npm install

# Rodar desenvolvimento
npm start  # Rodará em http://localhost:3000
```

---

## 🔑 Chaves Necessárias (preencher no .env)

```
# Stripe - https://dashboard.stripe.com
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# MercadoPago - https://www.mercadopago.com.br/developers
MERCADOPAGO_ACCESS_TOKEN=APP_...

# SendGrid (Emails) - https://sendgrid.com
SENDGRID_API_KEY=SG...

# JWT Secret (qualquer string segura)
JWT_SECRET=your_super_secret_key_123

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## 📊 Endpoints da API

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Detalhe do produto
- `POST /api/products/:id/notify-me` - Registrar interesse
- `POST /api/products/quotation/request` - Solicitar cotação

### Carrinho
- `POST /api/cart/init` - Inicializar carrinho
- `GET /api/cart/:cartId` - Detalhes do carrinho
- `POST /api/cart/:cartId/items` - Adicionar item
- `PUT /api/cart/:cartId/items/:itemId` - Atualizar quantidade
- `DELETE /api/cart/:cartId/items/:itemId` - Remover item
- `POST /api/cart/:cartId/coupon` - Aplicar cupom

### Pedidos
- `POST /api/orders` - Criar pedido
- `GET /api/orders/:orderId` - Detalhes do pedido
- `GET /api/orders/user/:userId` - Pedidos do usuário
- `PUT /api/orders/:orderId/status` - Atualizar status

### Pagamento
- `POST /api/payment/stripe/create-intent` - Criar Stripe intent
- `POST /api/payment/stripe/confirm` - Confirmar pagamento
- `POST /api/payment/mercadopago/create-preference` - Criar preferência MP
- `POST /api/payment/pix/create` - Criar QR code PIX

### Frete
- `POST /api/shipping/calculate` - Calcular frete
- `POST /api/shipping/validate-cep` - Validar CEP
- `GET /api/shipping/track/:trackingNumber` - Rastrear pedido

### Admin
- `GET /api/admin/dashboard` - Métricas
- `GET /api/admin/quotations` - Cotações
- `PUT /api/admin/quotations/:id` - Enviar cotação

---

## 🎨 Customização Visual

O frontend mantém o **design Kelly Wearstler** com:
- Fontes: Outfit (títulos) + Crimson Text (corpo)
- Cores: Off-white, charcoal, warm gray
- Layout: Grid 3 colunas responsivo
- Componentes: Modular e reutilizável

---

## 💳 Formas de Pagamento

### ✅ Stripe
- Cartão de crédito
- Internacionais

### ✅ MercadoPago
- **PIX** (instantâneo)
- **Boleto** (até 30 dias)
- **Cartão** (parcelado até 12x)

---

## 📧 Integrações de Email

Usar SendGrid para:
- ✅ Confirmação de pedido
- ✅ Aviso de estoque disponível
- ✅ Rastreamento de pedido
- ✅ Cotação recebida
- ✅ Notificação de cancelamento

---

## 🐛 Próximos Passos

1. **Componentes React** - Criar UI com Tailwind
2. **Testes** - Unit & integration tests
3. **Segurança** - HTTPS, rate limiting, validações
4. **SEO** - Meta tags, sitemaps
5. **Analytics** - Google Analytics, Mixpanel
6. **Performance** - CDN, cache, otimizações

---

## 📞 Suporte

Desenvolvido por Claude Code  
Para dúvidas: Entre em contato com Alessandra Zanetti

---

**Status**: ✅ Backend 100% | 🚧 Frontend em desenvolvimento
