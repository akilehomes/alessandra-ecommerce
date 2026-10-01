# Admin Dashboard - Quick Start

## 5 Minutos Para Começar

### 1. Preparar o Banco (2 min)

```bash
cd backend
npm run setup:admin
```

Isso faz:
- ✅ Cria tabelas (admin_users, product_images)
- ✅ Cria usuário admin padrão
- ✅ Mostra as credenciais

### 2. Iniciar Backend (1 min)

```bash
cd backend
npm run dev
```

Espere pela mensagem:
```
✅ Database connected
🚀 Server running on http://localhost:5000
```

### 3. Iniciar Frontend (1 min)

```bash
cd frontend
npm start
```

Abre automaticamente em http://localhost:3000

### 4. Login (1 min)

1. Acesse http://localhost:3000/admin/login
2. Email: `admin@alessandra.com`
3. Senha: `<defina-sua-senha>`
4. Clique em "Entrar"

### 5. Você Está Dentro! 🎉

Agora você pode:

## Dashboard

Ver estatísticas em tempo real:
- Total de produtos
- Total de pedidos
- Faturamento total
- Pedidos pendentes

## Produtos

**Criar:**
1. Abra aba "Produtos"
2. Preencha nome, preço, descrição
3. Clique "Criar Produto"

**Editar:**
1. Clique "Editar" em um produto
2. Modifique os campos
3. Clique "Atualizar Produto"

**Deletar:**
1. Clique "Deletar" em um produto
2. Confirme na caixa de diálogo

**Adicionar Imagens:**
1. Clique "Editar" em um produto
2. Role até "Adicionar Imagens Adicionais"
3. Selecione arquivo
4. Clique "+ Adicionar"

## Pedidos

**Ver Lista:**
1. Abra aba "Pedidos"
2. Veja todos os pedidos

**Atualizar Status:**
1. Selecione novo status no dropdown
2. Muda automaticamente

**Status Disponíveis:**
- Pendente
- Pago
- Processando
- Enviado
- Entregue
- Cancelado

## Frete

**Editar Tarifas:**
1. Abra aba "Frete"
2. Modifique "Base (R$)" e "Por kg (R$)"
3. Clique fora ou pressione Enter
4. Salva automaticamente

Tarifas pré-configuradas:
- São Paulo → Brasil
- São Paulo → Portugal
- São Paulo → Europa
- Porto → Brasil
- Porto → Portugal
- Porto → Europa

## Impostos

**Editar Alíquotas:**
1. Abra aba "Impostos"
2. Modifique a taxa (%)
3. Clique fora
4. Salva automaticamente

Países pré-configurados:
- Brasil (18%)
- Portugal (23%)
- Espanha (21%)
- França (20%)
- Alemanha (19%)
- Itália (22%)

## Câmbio

**Atualizar Taxas:**
1. Abra aba "Câmbio"
2. Modifique a taxa de conversão
3. Clique fora
4. Salva automaticamente

Pares pré-configurados:
- EUR → BRL
- BRL → EUR
- USD → BRL
- USD → EUR

## Logout

1. Clique em "Sair" (canto superior direito)
2. Você será redirecionado para login
3. Token será removido do navegador

## Dicas Importantes

⚠️ **SEGURANÇA:**
- Mude a senha padrão assim que possível
- Nunca compartilhe o token JWT
- Use HTTPS em produção

📱 **RESPONSIVO:**
- Dashboard funciona em desktop, tablet e mobile
- Acesse em qualquer dispositivo

🔄 **SÍNCRONO:**
- Dados carregam automaticamente ao trocar abas
- Mudanças são salvadas em tempo real

🚀 **SEM COMPLEXIDADE:**
- Funciona direto, sem configurações extras
- Pronto para produção

## Troubleshooting Rápido

**"Erro ao fazer login"**
- Verifique credenciais
- Execute `npm run setup:admin` novamente
- Limpe cache do navegador (Ctrl+Shift+Del)

**"Dados não carregam"**
- Verifique se backend está rodando
- Verifique conexão com banco
- Recarregue a página (F5)

**"Não consigo deletar"**
- Só admin pode deletar
- Confirme que fez login corretamente
- Token pode ter expirado (faça login novamente)

**"Mudanças não salvam"**
- Verifique console (F12)
- Verifique se backend está online
- Tente novamente

## Comandos Úteis

```bash
# Iniciar setup completo
npm run setup:admin

# Apenas criar admin (se tabelas já existem)
npm run seed:admin

# Iniciar backend
npm run dev

# Iniciar frontend
npm start

# Parar servidor
Ctrl+C
```

## Estrutura de URLs

```
http://localhost:3000/admin/login        → Login
http://localhost:3000/admin/dashboard    → Dashboard (protegido)

http://localhost:5000/api/admin/login           → POST login
http://localhost:5000/api/admin/dashboard       → GET stats
http://localhost:5000/api/admin/products        → CRUD produtos
http://localhost:5000/api/admin/orders          → Gerenciar pedidos
http://localhost:5000/api/admin/shipping-rates  → Configurar frete
http://localhost:5000/api/admin/tax-rates       → Configurar impostos
http://localhost:5000/api/admin/currency-rates  → Configurar câmbio
```

## Próximos Passos

1. ✅ Fazer login
2. ✅ Mude a senha
3. ✅ Crie alguns produtos de teste
4. ✅ Verifique se os pedidos de clientes aparecem
5. ✅ Teste editar tarifas/impostos/câmbio
6. ✅ Familiarize-se com a interface

## Suporte Rápido

Algo não funciona? Verifique:

1. Backend rodando? `http://localhost:5000/api/health` (deve mostrar OK)
2. Banco conectado? Verifique logs do backend
3. Token válido? Faça login novamente
4. Dados corretos? Verifique console (F12)

Tudo certo? **Você está pronto para usar!** 🚀
