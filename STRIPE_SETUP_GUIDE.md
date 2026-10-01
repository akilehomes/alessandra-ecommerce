# Guia de Configuração Stripe - Canario Diafano

## 🎯 Objetivo
Criar e configurar conta Stripe em **Portugal** em nome de **Canario Diafano** para vender em Brasil e Europa.

---

## ✅ PASSO 1: Criar Conta Stripe

### 1.1 Acesse o site
- URL: https://dashboard.stripe.com/register
- Clique em **"Criar conta"**

### 1.2 Informações Básicas
- **Email**: use um email de acesso da empresa
- **Senha**: criar senha segura
- **Clique**: "Criar conta"

---

## ✅ PASSO 2: Configurar Dados da Empresa

### 2.1 Informações da Empresa
- **Nome da Empresa**: Canario Diafano
- **Tipo de Negócio**: Comércio Eletrônico / E-commerce
- **País**: Portugal (PT)
- **Endereço**: Endereço registrado da Canario Diafano
- **Código Postal**: Código Postal Português

### 2.2 Detalhes do Negócio
- **Site**: alessandrazanetti.com (ou seu domínio)
- **Descrição**: Venda de móveis e decoração online (Brasil e Europa)
- **Volume estimado**: conforme sua projeção

### 2.3 Informações do Responsável (Flávio Ferreira)
- **Nome Completo**: Flávio Ferreira
- **Email**: filardiferreira@gmail.com
- **Telefone**: seu telefone
- **Cargo**: Proprietário/Gerente

---

## ✅ PASSO 3: Verificação de Identidade

### 3.1 Documentos Necessários
- Documento de identidade (passport ou cartão cidadão português)
- Comprovante de residência (últimos 3 meses)
- Documentos da empresa (se aplicável)

**Nota**: Stripe solicitará verificação. Isso pode levar 1-3 dias.

---

## ✅ PASSO 4: Configurar Conta Bancária

### 4.1 Dados Bancários
- **Tipo de Conta**: Conta bancária portuguesa (IBAN)
- **IBAN**: Número IBAN completo
- **Titular**: Canario Diafano
- **Banco**: Nome do banco

**Recebimentos**: Stripe deposita em EUR na conta cada 2 dias úteis

---

## ✅ PASSO 5: Obter Chaves da API

### 5.1 No Dashboard Stripe
1. Vá em **"Chaves de API"** (Developers → API keys)
2. Copie:
   - **Publishable Key** (começa com `pk_test_`)
   - **Secret Key** (começa com `sk_test_`)

### 5.2 Chaves de Teste
Stripe fornece 2 conjuntos:
- **Teste** (para desenvolvimento)
- **Produção** (para vendas reais)

---

## ✅ PASSO 6: Atualizar Variáveis de Ambiente

Edite o arquivo `/backend/.env`:

```bash
# Stripe (Teste)
STRIPE_PUBLIC_KEY=pk_test_sua_chave_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui

# Stripe (Produção - depois)
# STRIPE_PUBLIC_KEY=pk_live_sua_chave_aqui
# STRIPE_SECRET_KEY=sk_live_sua_chave_aqui
```

---

## ✅ PASSO 7: Testar Integração

### 7.1 Cartões de Teste Stripe

**Aprovado:**
- Número: `4242 4242 4242 4242`
- Expiração: qualquer futura (ex: 12/25)
- CVC: qualquer 3 dígitos (ex: 123)

**Rejeição de Pagamento:**
- Número: `4000 0000 0000 0002`

### 7.2 Fazer Teste de Pagamento
1. Acesse http://localhost:3000/checkout
2. Preencha dados
3. Use cartão 4242...
4. Verifique se email é enviado para filardiferreira@gmail.com

---

## ✅ PASSO 8: Ir para Produção

### 8.1 Quando estiver pronto:
1. **Ativar Modo Produção** no Dashboard Stripe
2. **Gerar Chaves de Produção**
3. **Atualizar `.env`** com chaves `pk_live_` e `sk_live_`
4. **Fazer teste real** com cartão de crédito (pequeno valor)

---

## 🔐 Segurança

### Boas Práticas:
- ✅ Nunca compartilhe `sk_live_` (Secret Key produção)
- ✅ Use `pk_test_` no frontend (seguro)
- ✅ Guarde `.env` com chaves em `.gitignore`
- ✅ Ative 2FA na conta Stripe
- ✅ Revise transações regularmente

---

## 📞 Suporte

Se tiver dúvidas durante o processo:
- **Stripe Support**: https://support.stripe.com
- **Chat**: disponível no Dashboard
- **Email**: support@stripe.com

---

## ✨ Próximos Passos

1. ✅ Criar conta Stripe (Portugal)
2. ✅ Verificar identidade (1-3 dias)
3. ✅ Obter chaves de API
4. ✅ Atualizar `.env`
5. ✅ Testar com cartão 4242...
6. ✅ Ir para produção quando pronto

**Após isso, o sistema Alessandra Zanetti estará 100% funcional!** 🚀
