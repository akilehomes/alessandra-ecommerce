> **Atenção:** os scripts `seed-admin.js` e `setup-admin.js` (com senha fixa) foram removidos.
> Para criar ou redefinir um administrador, use `npm run create-admin` na pasta `backend`
> (veja `backend/database/create-admin.js`); a senha é pedida no terminal e nunca fica no código.

# Admin Dashboard Setup

## Como Configurar o Admin Dashboard

### 1. Banco de Dados

Execute as migrações em ordem:

```bash
cd backend
psql -U postgres -d alessandra_ecommerce -f database/migration-admin-users.sql
```

### 2. Seed do Usuário Admin

```bash
cd backend
npm run seed:admin
```

Credenciais padrão:
- Email: `admin@alessandra.com`
- Senha: `<defina-sua-senha>`

**⚠️ IMPORTANTE: Mude a senha após o primeiro login!**

### 3. Backend

Não precisa fazer nada especial. As rotas já estão incluídas:

- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/dashboard` - Stats
- `GET/POST/PUT/DELETE /api/admin/products` - Gerenciar produtos
- `GET /api/admin/orders` - Listar pedidos
- `PUT /api/admin/orders/:id` - Atualizar status do pedido
- `GET/PUT /api/admin/shipping-rates` - Gerenciar fretes
- `GET/PUT /api/admin/tax-rates` - Gerenciar impostos
- `GET/PUT /api/admin/currency-rates` - Gerenciar câmbio

Todas as rotas usam middleware de autenticação JWT com `adminAuthMiddleware`.

### 4. Frontend

Acesse:
- Login: `http://localhost:3000/admin/login`
- Dashboard: `http://localhost:3000/admin/dashboard` (protegido por login)

## Fluxo de Autenticação

1. Admin acessa `/admin/login`
2. Faz login com email/senha
3. Backend retorna JWT token (30 dias)
4. Frontend armazena token em `localStorage.adminToken`
5. Todas as requisições incluem `Authorization: Bearer <token>`
6. Logout remove o token do localStorage

## Segurança

- JWT tokens assinados com `JWT_SECRET` do .env
- Middleware `adminAuthMiddleware` valida todos os acessos
- Tokens expiram em 30 dias
- Senhas hash com bcrypt (10 rounds)
- Campo `isAdmin` obrigatório no JWT

## Operações Principais

### Produtos
- Listar, criar, editar e deletar produtos
- Gerenciar imagens adicionais (até 6 por produto)
- Atualizar peso e dimensões para cálculo de frete

### Pedidos
- Listar todos os pedidos
- Atualizar status: pending → paid → processing → shipped → delivered (ou cancelled)
- Ver detalhes e itens de cada pedido

### Configurações
- **Frete**: Ajustar tarifas por região e peso
- **Impostos**: Definir alíquotas por país
- **Câmbio**: Atualizar taxas de conversão USD/EUR/BRL

## Estrutura do Banco

```sql
-- Admin Users
admin_users (id, email, password_hash, full_name, role, is_active, last_login_at)

-- Produto Images
product_images (id, product_id, image_url, is_primary, position)

-- Rates
shipping_rates (id, origin_city, dest_region, base_price, price_per_kg, estimated_days, carrier, active)
tax_rates (id, country, region, tax_rate, tax_type, active)
currency_rates (id, from_currency, to_currency, rate, last_updated)
```

## Variáveis de Ambiente Necessárias

```env
# Backend
JWT_SECRET=sua_chave_secreta_aqui
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alessandra_ecommerce

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

## Troubleshooting

### "401 - Invalid token"
- Logout e faça login novamente
- Verifique se o token não expirou (30 dias)
- Confirme que JWT_SECRET no backend é correto

### "403 - Admin access required"
- Verifique se o usuário é realmente um admin na tabela `admin_users`
- Confirme se o campo `is_active` está como `true`

### Admin não aparece no banco
- Execute `npm run seed:admin` novamente
- Verifique a conexão com o banco: `psql -U postgres -d alessandra_ecommerce`

## Próximos Passos

1. Trocar a senha padrão do admin
2. Criar usuários admin adicionais se necessário
3. Configurar as tarifas de frete reais
4. Atualizar taxas de câmbio
5. Configurar integração com provedores de frete/pagamento
