# 🧪 Guia de Testes - Alessandra Zanetti E-commerce

## 1️⃣ Preparar Dados de Teste

### Popular Banco com Seed

```bash
cd backend
node seeds/seed-products.js
```

**Resultado esperado:**
- ✅ 6 produtos inseridos
- ✅ Inventário configurado
- ✅ 3 cupons de teste criados

---

## 2️⃣ Fluxo Completo de Compra

### 🏠 Home Page
1. Acesse: http://localhost:3000
2. Verificar:
   - ✅ Logo "ALESSANDRA ZANETTI" centralizado
   - ✅ Subtitle "Design Europeu com Alma Brasileira"
   - ✅ Seção SHOP com link
   - ✅ Newsletter input
   - ✅ Seletor de região (🇧🇷 Brasil)

### 🛍️ Shop Page
1. Clique em "SHOP" ou acesse: http://localhost:3000/shop
2. Verificar:
   - ✅ 6 produtos em grid 5 colunas
   - ✅ Preços em R$ (Brasil)
   - ✅ Titles: "VASOS CERÂMICA", "QUADRO ARTE", etc
   - ✅ View 2 | 3 | 5 controls

### 🌍 Testar Multi-Região
1. Abra seletor: "🇧🇷 Brasil (BRL)"
2. Selecione: "🇵🇹 Portugal (EUR)"
3. Recarregue página (F5)
4. Verificar:
   - ✅ Seletor mostra "PORTUGAL (EUR)"
   - ✅ Preços mudaram para €
   - ✅ Ex: "€ 850.00" em vez de "R$ 850.00"

### 🛒 Adicionar ao Carrinho
1. Passe mouse sobre produto → "ADD TO CART"
2. Clique em adicionar
3. Alert: "Produto adicionado ao carrinho!"
4. Ícone carrinho exibe badge com quantidade

### 🧺 Página Carrinho
1. Clique no ícone carrinho (canto superior direito)
2. Acesse: http://localhost:3000/cart
3. Verificar:
   - ✅ Produto listado com imagem
   - ✅ Preço em € (Portugal)
   - ✅ Quantidade ajustável (+/-)
   - ✅ Order Summary com:
     - Subtotal
     - Tax (23% Portugal)
     - Buttons: "Proceed to Checkout", "Continue Shopping"

### 🎟️ Testar Cupom
1. No carrinho, campo "Coupon code"
2. Digite: `TESTE10`
3. Clique "Apply Coupon"
4. Verificar:
   - ✅ Desconto de 10% aplicado
   - ✅ "Discount" exibido em verde
   - ✅ Total atualizado

### 🏪 Checkout - Step 1 (Endereço)
1. Clique "Proceed to Checkout"
2. Acesse: http://localhost:3000/checkout
3. Preencher:
   - Nome: `Flávio Ferreira`
   - Email: `teste@alessandrazanetti.com`
   - Telefone: `+55 11 98765-4321`
   - Street: `Avenida Paulista`
   - Number: `1000`
   - ZIP: `01310-100`
   - City: `São Paulo`
   - State: `SP`
4. Clique "Continue to Shipping"

### 📦 Checkout - Step 2 (Frete)
1. Mostra: "Calculating shipping options for 01310-100..."
2. Clique "Calculate Shipping"
3. Verificar:
   - ✅ Custo de frete simulado (€)
   - ✅ Button mostra: "Calculate Shipping (€ XX.XX)"
   - ✅ Order Summary atualizado com "Shipping"

### 💳 Checkout - Step 3 (Pagamento)
1. Preencher dados de cartão:
   - Card Number: `4111 1111 1111 1111`
   - Expiry: `12/25`
   - CVC: `123`
2. Clique "Place Order"

### ✅ Order Success
1. Deve redirecionar para: http://localhost:3000/checkout/success
2. Verificar:
   - ✅ Checkmark ✓
   - ✅ "Order Confirmed"
   - ✅ Order Number (UUID)
   - ✅ "Expected Delivery: 5-7 Business Days"
   - ✅ Buttons: "Continue Shopping", "Back to Home"

---

## 3️⃣ Admin Panel

### 📊 Dashboard
1. Acesse: http://localhost:3000/admin
2. Verificar cards:
   - ✅ Total Produtos: 6
   - ✅ Total Pedidos: 1 (após compra)
   - ✅ Faturamento: R$ 0,00 (simulado)
   - ✅ Status: Online

### 📦 Aba Produtos
1. Clique em "PRODUTOS"
2. Verificar:
   - ✅ Formulário "Adicionar Novo Produto"
   - ✅ Tabela com 6 produtos
   - ✅ Botão "Deletar" por produto
   - ✅ Colunas: Nome, Preço, Categoria, Ações

### 📋 Aba Pedidos
1. Clique em "PEDIDOS"
2. Verificar:
   - ✅ Tabela com pedido criado
   - ✅ Colunas: ID, Cliente, Total, Status, Data
   - ✅ Último status: "paid" ou "pending"

### ⚙️ Aba Configurações
1. Clique em "CONFIGURAÇÕES"
2. Verificar:
   - ✅ Seções: Brasil (18%), Portugal (23%), Europa (21%)
   - ✅ Campos de Taxa de Imposto
   - ✅ Campos de Moeda (R$, €, €)
   - ✅ Botão "Salvar Configurações"

---

## 4️⃣ Testar Regional Workflows

### 🇧🇷 Fluxo Brasil
1. Home → Seletor: "Brasil (BRL)"
2. Shop → Adicionar produto
3. Carrinho → Verificar R$
4. Checkout:
   - CEP Brasil: `01310-100`
   - Subtotal + 18% imposto
   - Frete Correios/Loggi
5. Pagamento: MercadoPago (simulado)
6. Sucesso

### 🇵🇹 Fluxo Portugal
1. Home → Seletor: "Portugal (EUR)"
2. Shop → Adicionar produto
3. Carrinho → Verificar €
4. Checkout:
   - CEP Portugal: `1000-000` (Lisboa)
   - Subtotal + 23% imposto
   - Frete CTT/GLS
5. Pagamento: Stripe (simulado)
6. Sucesso

---

## 5️⃣ Test Data Reference

### 📦 Produtos
| Nome | Preço | Categoria | Estoque |
|------|-------|-----------|---------|
| Vasos Cerâmica | 850 | Decoração | 15 |
| Quadro Arte | 1800 | Arte | 8 |
| Tapete Persa | 4500 | Tapetes | 3 |
| Poltrona Veludo | 3200 | Móveis | 5 |
| Luminária Bronze | 1200 | Iluminação | 12 |
| Aparador Espelho | 2500 | Móveis | 4 |

### 🎟️ Cupons
| Código | Desconto | Usos |
|--------|----------|------|
| TESTE10 | 10% | 100 |
| PRIMEIRACOMPRA | 15% | 50 |
| FRETE5 | 5% | 200 |

### 📍 Endereços de Teste
**Brasil:**
- CEP: 01310-100 (São Paulo)
- Rua: Avenida Paulista, 1000

**Portugal:**
- CEP: 1000-000 (Lisboa)
- Rua: Praça do Comércio, 100

---

## 6️⃣ Checklist Final

- [ ] Seed de dados executado
- [ ] Home page renderiza corretamente
- [ ] Shop mostra 6 produtos
- [ ] Seletor regional funciona (BR ↔ PT)
- [ ] Preços atualizam com moeda
- [ ] Adicionar ao carrinho funciona
- [ ] Cupom TESTE10 aplica desconto
- [ ] Checkout 3 steps completo
- [ ] Cálculo de impostos correto
- [ ] Order success exibido
- [ ] Admin dashboard mostra métricas
- [ ] Produtos listados no admin
- [ ] Pedido visível no admin

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "Nenhum produto" | Executar seed: `node seeds/seed-products.js` |
| "Cart vazio" | Recarregar Shop, adicionar novamente |
| "Preços em R$" | Mudar região, recarregar página (F5) |
| "Cupom não funciona" | Verificar código exato: `TESTE10` |
| "Erro 500 checkout" | Verificar console backend: `docker logs alessandra-api` |
| "Admin em branco" | Verificar se backend está rodando |

---

## 📊 Métricas Esperadas

Após completar fluxo 1x:
- Total Produtos: 6
- Total Pedidos: 1
- Faturamento: €5,000+ (com imposto)
- Admin atualizado em tempo real

---

**Status**: ✅ Pronto para QA
**Tempo Estimado**: 10-15 minutos para fluxo completo
