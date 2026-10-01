# 🚚 Shipping Integration - Estrutura Completa

## Resumo

Implementação de **cálculo de frete multi-país** com suporte para Brasil (Melhor Envio) e Portugal/EU (EasyPost).

**Status:** ✅ Estrutura mockada pronta para testes. APIs reais podem ser ativadas com 1 linha de código.

---

## 📁 Arquivos Criados

### Backend (Node.js + Express)

```
backend/services/
├── melhorEnvioService.js       # Serviço Brasil (Melhor Envio)
├── easyPostService.js          # Serviço EU (EasyPost)
└── shippingRouter.js           # Roteador que detecta país

backend/routes/
└── shippingIntegration.js      # Endpoints públicos

server.js                        # Registra a rota
```

### Frontend (React)

```
frontend/src/components/
└── ShippingSelector.jsx        # Componente seletor de frete

frontend/src/pages/
└── Checkout.jsx                # Atualizado para usar ShippingSelector
```

---

## 🔌 Endpoints da API

### `POST /api/shipping-integration/calculate`

**Calcula opções de frete baseado no país e CEP**

```bash
curl -X POST http://localhost:5000/api/shipping-integration/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "country": "BR",
    "zipCode": "01047912",
    "weight": 2.5,
    "dimensions": {
      "width": 20,
      "height": 20,
      "length": 30
    }
  }'
```

**Response:**
```json
{
  "country": "BR",
  "zipCode": "01047912",
  "weight": 2.5,
  "options": [
    {
      "id": "melhor-envio-1",
      "carrier": "PAC",
      "service": "PAC",
      "price": 30.50,
      "delivery_time": 8,
      "delivery_date": "2026-10-15",
      "currency": "BRL"
    },
    {
      "id": "melhor-envio-2",
      "carrier": "Sedex",
      "service": "Sedex",
      "price": 55.50,
      "delivery_time": 2,
      "delivery_date": "2026-10-09",
      "currency": "BRL"
    },
    {
      "id": "melhor-envio-3",
      "carrier": "Loggi",
      "service": "Loggi Express",
      "price": 40.50,
      "delivery_time": 2,
      "delivery_date": "2026-10-09",
      "currency": "BRL"
    }
  ]
}
```

### `GET /api/shipping-integration/supported-countries`

**Retorna lista de países suportados**

```bash
curl http://localhost:5000/api/shipping-integration/supported-countries
```

**Response:**
```json
{
  "brazil": ["BR"],
  "europe": ["PT", "ES", "FR", "DE", "IT", "NL", "BE", "AT", "CH", "PL", "GR", "SE", "DK", "NO", "FI", "IE", "GB"]
}
```

### `GET /api/shipping-integration/health`

**Health check dos serviços**

```bash
curl http://localhost:5000/api/shipping-integration/health
```

---

## 🧪 Como Testar

### 1. Iniciar o Backend

```bash
cd backend
npm install  # Se necessário
npm start    # ou node server.js
```

### 2. Testar via cURL

**Brasil (Melhor Envio mockado):**
```bash
curl -X POST http://localhost:5000/api/shipping-integration/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "country": "BR",
    "zipCode": "01047912",
    "weight": 1.5
  }'
```

**Portugal (EasyPost mockado):**
```bash
curl -X POST http://localhost:5000/api/shipping-integration/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "country": "PT",
    "zipCode": "1050-001",
    "weight": 1.5
  }'
```

### 3. Testar na Checkout

1. Abrir frontend: `http://localhost:3000`
2. Adicionar produtos ao carrinho
3. Ir para checkout
4. Preencher endereço com CEP `01047-912`
5. Avançar para Step 2
6. Ver opções de frete carregando dinamicamente

---

## 🔑 Ativar APIs Reais

### Para Melhor Envio (Brasil)

1. **Criar conta:** https://melhorenvio.com.br
2. **Gerar token:** No dashboard → Configurações → API
3. **Adicionar ao `.env`:**
   ```
   MELHOR_ENVIO_TOKEN=seu_token_aqui
   ```
4. **Descomentar código em `melhorEnvioService.js`** (linhas ~45)
5. Remover função `generateMockShippingOptions`

**Custo:** 10-15% de comissão por envio (sem taxa fixa)

### Para EasyPost (Portugal/EU)

1. **Criar conta:** https://www.easypost.com
2. **Gerar API key:** No dashboard → API Keys
3. **Adicionar ao `.env`:**
   ```
   EASYPOST_API_KEY=sua_chave_aqui
   ```
4. **Descomentar código em `easyPostService.js`** (linhas ~45)
5. Remover função `generateMockShippingOptions`

**Custo:** Varia por transportadora (UPS, DHL, FedEx)

---

## 🎯 Detecção de País

O sistema detecta automaticamente qual API usar baseado no país:

| País | Serviço | Transportadoras |
|------|---------|-----------------|
| BR | Melhor Envio | PAC, Sedex, Loggi, Jadlog, etc |
| PT, ES, FR, DE, IT, etc | EasyPost | DHL, CTT, Correos, La Poste, etc |

**Lógica de roteamento:** `services/shippingRouter.js`

---

## 💾 Dados Mockados (Desenvolvimento)

**Preços realistas de teste:**
- Brasil (PAC): R$ 30-40 (8 dias)
- Brasil (Sedex): R$ 50-60 (2 dias)
- Portugal (CTT): €18-25 (5 dias)
- Portugal (DHL): €35-45 (1-2 dias)

Cálculo: `basePrice + (weight × multiplicador)`

---

## 📊 Fluxo na Checkout

```
1. Cliente preenche endereço + CEP
2. Avança para Step 2 (Shipping)
3. ShippingSelector chama API
4. API detecta país do CEP
5. API roteia para Melhor Envio (BR) ou EasyPost (EU)
6. Retorna opções de frete
7. Cliente seleciona uma opção
8. Preço é adicionado ao total
9. Avança para Step 3 (Payment)
10. Cria order com frete selecionado
```

---

## 🚀 Próximos Passos

### MVP (Agora)
- ✅ Estrutura multi-país
- ✅ Dados mockados
- ✅ Integração frontend/backend
- ✅ Seletor interativo

### V1 (Próximas semanas)
1. **Ativar APIs reais** (Melhor Envio + EasyPost)
2. **Salvar frete no banco** (orders.shipping_id, shipping_cost)
3. **Gerar etiqueta** após pagamento confirmado
4. **Webhook de rastreamento** (atualizar status)

### V2 (Futuro)
1. **Frete grátis condicional** (acima de R$ X)
2. **Múltiplas origens** (if Alessandra expande)
3. **Cache de resultados** (1 hora)
4. **Analytics** de frete (qual transportadora é mais usada)

---

## 📝 Variáveis de Ambiente

Adicionar ao `.env`:

```
# Opcional (deixar vazio para usar dados mockados)
MELHOR_ENVIO_TOKEN=
EASYPOST_API_KEY=

# Origem padrão (já configurado em código)
ORIGIN_CEP=01047912
ORIGIN_STATE=SP
```

---

## 🔍 Troubleshooting

### "País não suportado"
**Causa:** País não está na lista de BRAZIL_COUNTRIES ou EU_COUNTRIES
**Solução:** Adicionar país em `shippingRouter.js`

### "Failed to calculate shipping"
**Causa:** Erro na API (provavelmente token inválido)
**Solução:** Verificar logs do backend (`npm start` mostra logs)

### "Nenhuma opção de frete disponível"
**Causa:** CEP inválido ou fora de cobertura
**Solução:** Tentar outro CEP

---

## 📞 Suporte

- **Melhor Envio API Docs:** https://melhorenvio.com.br/api
- **EasyPost API Docs:** https://www.easypost.com/docs
- **Código:** Ver comentários nos services
