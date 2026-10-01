# 📊 Dados de Teste - Alessandra Zanetti E-commerce

## 🛍️ Produtos (6)

| ID | Nome | Preço | Categoria | Estoque | Imagem |
|---|------|-------|-----------|---------|--------|
| 1 | Vasos Cerâmica Artesanal | R$ 850.00 | Decoração | 15 | Pexels |
| 2 | Quadro Arte Moderna | R$ 1.800,00 | Arte | 8 | Pexels |
| 3 | Tapete Persa Vintage | R$ 4.500,00 | Tapetes | 3 | Pexels |
| 4 | Poltrona Veludo Cinza | R$ 3.200,00 | Móveis | 5 | Pexels |
| 5 | Luminária Pendente Bronze | R$ 1.200,00 | Iluminação | 12 | Pexels |
| 6 | Móvel Aparador Espelho | R$ 2.500,00 | Móveis | 4 | Pexels |

---

## 🎟️ Cupons de Desconto (3)

| Código | Desconto | Máx Usos | Validade | Status |
|--------|----------|----------|----------|--------|
| TESTE10 | 10% | 100 | 90 dias | Ativo |
| PRIMEIRACOMPRA | 15% | 50 | 30 dias | Ativo |
| FRETE5 | 5% | 200 | 60 dias | Ativo |

### Como usar cupom:
1. Adicionar produtos ao carrinho
2. Página Carrinho → "Coupon code"
3. Digitar código (ex: `TESTE10`)
4. Clicar "Apply Coupon"
5. Desconto aplicado ao total

---

## 👤 Dados de Cliente (Checkout)

### Informações Pessoais
```
Nome: Flávio Ferreira
Email: teste@alessandrazanetti.com
Telefone: +55 11 98765-4321
```

### Endereço Brasil
```
CEP: 01310-100
Rua: Avenida Paulista
Número: 1000
Cidade: São Paulo
Estado: SP
País: Brasil
```

### Endereço Portugal (Alternativo)
```
CEP: 1000-000
Rua: Praça do Comércio
Número: 100
Cidade: Lisboa
País: Portugal
```

---

## 💳 Cartão de Pagamento (Teste)

### Stripe Test Card
```
Número: 4111 1111 1111 1111
Validade: 12/25
CVC: 123
```

### Outros Cards de Teste Stripe
| Cenário | Número |
|---------|--------|
| Sucesso | 4242 4242 4242 4242 |
| Recusado | 4000 0000 0000 0002 |
| Expirado | 4000 0000 0000 0069 |
| 3D Secure | 4000 2500 0000 3010 |

---

## 🌍 Configurações Regionais

### Brasil (BRL)
- Moeda: R$
- Imposto: 18% (ICMS)
- Pagamento: MercadoPago (PIX, Boleto, Cartão)
- Frete: Correios, Loggi, SEDEX
- Exemplo Cálculo:
  - Subtotal: R$ 850
  - Tax (18%): R$ 153
  - Frete: R$ 20-50
  - **Total: R$ 1.023-1.053**

### Portugal (EUR)
- Moeda: €
- Imposto: 23% (IVA)
- Pagamento: Stripe, SEPA, PayPal
- Frete: CTT, GLS
- Exemplo Cálculo:
  - Subtotal: € 850
  - Tax (23%): € 195,50
  - Frete: € 5-15
  - **Total: € 1.050,50-1.060,50**

### Europa (EUR)
- Moeda: €
- Imposto: 21% (VAT)
- Pagamento: Stripe, Klarna
- Frete: DHL, GLS
- Exemplo Cálculo:
  - Subtotal: € 850
  - Tax (21%): € 178,50
  - Frete: € 10-20
  - **Total: € 1.038,50-1.048,50**

---

## 🛒 Cenários de Teste

### Cenário 1: Compra Simples (Brasil)
1. Home → Region: Brasil ✅
2. Shop → Adicionar 1x Vasos (R$ 850)
3. Carrinho → Verificar R$
4. Checkout:
   - Endereço: CEP 01310-100
   - Frete: R$ 30
   - Total com imposto 18%: R$ 1.012,30
5. Pagamento: 4111 1111 1111 1111
6. Sucesso ✅

### Cenário 2: Compra com Desconto (Portugal)
1. Home → Region: Portugal ✅
2. Shop → Adicionar 2x Quadro (€ 1.800 cada)
3. Carrinho → Cupom: TESTE10 (10% desconto)
4. Checkout:
   - Endereço: CEP 1000-000
   - Subtotal: € 3.600
   - Desconto (10%): -€ 360
   - Tax (23%): € 759,20
   - Frete: € 10
   - **Total: € 4.009,20**
5. Pagamento sucesso ✅

### Cenário 3: Múltiplos Produtos (Europa)
1. Home → Region: Europa ✅
2. Shop → Adicionar:
   - 1x Tapete Persa (€ 4.500)
   - 1x Poltrona (€ 3.200)
   - 1x Luminária (€ 1.200)
3. Carrinho → Cupom: FRETE5 (5% desconto)
4. Checkout → Total com 21% tax ✅

---

## 📈 Métricas Esperadas Após Testes

Após executar 3 cenários acima:

### Admin Dashboard
- Total Produtos: 6
- Total Pedidos: 3
- Faturamento: > €10.000
- Regiões: BR, PT, EU (ativas)

### Cupons Utilizados
- TESTE10: 2x usado (limite: 100)
- PRIMEIRACOMPRA: 0x (não usado)
- FRETE5: 1x usado (limite: 200)

### Pedidos Criados
| Pedido | Cliente | Total | Status | Região |
|--------|---------|-------|--------|--------|
| #1 | Flávio (BR) | R$ 1.012,30 | paid | BR |
| #2 | Flávio (PT) | € 4.009,20 | paid | PT |
| #3 | Flávio (EU) | € 10.800+ | paid | EU |

---

## 🔄 Teste de Regras de Negócio

### ✅ Validações a Testar

- [x] Produtos fora de estoque mostram "OUT OF STOCK"
- [x] Cupom inválido: alerta de erro
- [x] CEP inválido: erro checkout
- [x] Cartão inválido: recusa pagamento
- [x] Impostos calculados corretamente por região
- [x] Preços atualizam ao mudar região
- [x] Total = Subtotal + Imposto + Frete - Desconto

### ⏰ Reserva de Estoque

- Produtos ficam reservados por 30 minutos no checkout
- Após 30 min, volta ao estoque se não pago
- Sistema rejeita compra se estoque < quantidade

---

## 📝 Log de Teste

Ao executar testes, registrar:

```
Data: 2024-XX-XX
Teste: [Cenário 1/2/3]
Status: PASSOU ✅ / FALHOU ❌
Observações: ...
Tempo: X minutos
```

---

**Total de Dados Criados:**
- 6 Produtos
- 3 Cupons
- 50+ campos de teste
- 3 Cenários completos

**Pronto para QA!** 🧪
