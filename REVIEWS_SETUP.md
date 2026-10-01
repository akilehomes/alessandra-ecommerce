# Sistema de Reviews - Alessandra Zanetti E-commerce

## Overview

Sistema completo de avaliações de produtos com suporte a:
- Criar, editar e deletar avaliações
- Validação de compra verificada
- Sistema de "útil" para avaliações
- Aprovação/rejeição de avaliações por admin
- Estatísticas e ratings de produtos
- Filtros por rating

## Instalação e Setup

### 1. Backend - Aplicar Migration

```bash
cd backend
node run-migration-reviews.js
```

Isso criará as seguintes tabelas:
- `reviews` - Armazena as avaliações
- `review_helpful_votes` - Rastreia votos úteis
- `review_approvals` - Controle de aprovação por admin

### 2. API Routes

#### Criar Review
```
POST /api/reviews/:productId/reviews
Authorization: Bearer <token>

Body:
{
  "rating": 5,
  "title": "Produto excelente!",
  "comment": "Superou minhas expectativas..."
}

Response: Review criado com dados do usuário
```

#### Listar Reviews de um Produto
```
GET /api/reviews/:productId/reviews?page=1&limit=10&rating=5
```

#### Obter Estatísticas
```
GET /api/reviews/:productId/stats

Response:
{
  "product_id": "...",
  "total_reviews": 32,
  "average_rating": 4.5,
  "distribution": {
    "five_star": 20,
    "four_star": 8,
    "three_star": 3,
    "two_star": 1,
    "one_star": 0
  }
}
```

#### Marcar como Útil
```
POST /api/reviews/:reviewId/helpful
Authorization: Bearer <token>
```

#### Editar Review (próprio)
```
PUT /api/reviews/:reviewId
Authorization: Bearer <token>

Body: { rating, title, comment } - pelo menos um campo
```

#### Deletar Review
```
DELETE /api/reviews/:reviewId
Authorization: Bearer <token>
```

### 3. Admin Routes

#### Listar Reviews (com aprovação)
```
GET /api/admin/reviews?page=1&status=pending&limit=20
Authorization: Bearer <admin_token>
```

#### Aprovar Review
```
PUT /api/admin/reviews/:reviewId/approve
Authorization: Bearer <admin_token>
```

#### Rejeitar Review
```
PUT /api/admin/reviews/:reviewId/reject
Authorization: Bearer <admin_token>

Body:
{
  "reason": "Conteúdo inapropriado"
}
```

#### Deletar Review (admin)
```
DELETE /api/admin/reviews/:reviewId
Authorization: Bearer <admin_token>
```

#### Estatísticas Detalhadas
```
GET /api/admin/reviews/analytics/:productId
Authorization: Bearer <admin_token>

Response:
{
  "total_reviews": 32,
  "approved": 30,
  "pending": 1,
  "rejected": 1,
  "average_rating": 4.5,
  "total_helpful_votes": 156,
  "verified_purchase_count": 28
}
```

## Frontend - Componentes

### ReviewRating
Exibe estrelas com rating

```jsx
<ReviewRating rating={4.5} count={32} size="large" />
```

### ReviewStats
Mostra estatísticas e distribuição de ratings

```jsx
<ReviewStats productId={productId} />
```

### ReviewForm
Formulário para criar/editar reviews

```jsx
<ReviewForm
  productId={productId}
  onReviewCreated={handleReviewCreated}
  canReview={hasVerifiedPurchase}
  token={authToken}
/>
```

### ReviewsList
Lista de reviews com paginação e filtros

```jsx
<ReviewsList
  productId={productId}
  token={authToken}
  refresh={triggerRefresh}
/>
```

### AdminReviewsManager
Painel de administração de reviews

```jsx
<AdminReviewsManager token={adminToken} />
```

## Features Implementadas

### ✅ Backend
- [x] Tabela `reviews` com validação
- [x] Verificação de compra (verified_purchase)
- [x] Bloqueio de múltiplas avaliações do mesmo usuário
- [x] Sistema de "útil"
- [x] Aprovação/rejeição de reviews
- [x] Estatísticas agregadas
- [x] Validação de dados (rating 1-5, título obrigatório, etc)
- [x] Auditoria (admin pode deletar reviews)

### ✅ Frontend
- [x] Componente de stars com rating
- [x] Formulário de avaliação
- [x] Lista de reviews com paginação
- [x] Filtros por rating
- [x] Marcar como útil
- [x] Badge de "Compra Verificada"
- [x] Painel admin para gerenciar reviews
- [x] Responsive design

## Validações e Segurança

1. **Autenticação**: Requer JWT válido para criar/editar reviews
2. **Verificação de Compra**: Valida se usuário comprou o produto
3. **Rate Limiting**: Uma avaliação por usuário por produto
4. **Validações de Dados**:
   - Rating: 1-5
   - Título: obrigatório, max 255 chars
   - Comentário: max 5000 chars
5. **Aprovação**: Apenas reviews aprovados aparecem para usuários
6. **Admin Only**: Apenas admins podem deletar/rejeitar reviews

## Dados no Banco

### Tabela: reviews
```sql
id UUID - Chave primária
product_id UUID - FK para products
user_id UUID - FK para users
rating INTEGER (1-5)
title VARCHAR(255) - Obrigatório
comment TEXT - Opcional
verified_purchase BOOLEAN - True se comprou
helpful_count INTEGER - Contagem de úteis
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Tabela: review_helpful_votes
```sql
id UUID
review_id UUID - FK para reviews
user_id UUID - FK para users
created_at TIMESTAMP
UNIQUE(review_id, user_id) - Previne duplicatas
```

### Tabela: review_approvals
```sql
id UUID
review_id UUID - FK para reviews
status VARCHAR(20) - pending/approved/rejected
reason TEXT - Motivo da rejeição
reviewed_by UUID - FK para users (admin)
reviewed_at TIMESTAMP
created_at TIMESTAMP
```

## Como Usar

### Para Usuários

1. **Ver avaliações**: Acesse qualquer página de produto e veja a seção "Avaliações dos Clientes"
2. **Ver rating médio**: Na página do produto, veja o rating agregado
3. **Deixar avaliação**: Clique em "Deixar Avaliação" (apenas se comprou o produto)
4. **Marcar como útil**: Clique no botão "Útil" para ajudar outros

### Para Admin

1. Acesse o Admin Dashboard
2. Vá para "Gerenciar Avaliações"
3. Filtre por status (Pendentes, Aprovados, Rejeitados)
4. Clique em um review para ver detalhes
5. Use os botões para Aprovar/Rejeitar/Deletar

## Exemplos de Uso

### Criar Review via API
```bash
curl -X POST http://localhost:3001/api/reviews/product-id/reviews \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "title": "Produto excelente!",
    "comment": "Entrega rápida e produto de ótima qualidade."
  }'
```

### Listar Reviews
```bash
curl http://localhost:3001/api/reviews/product-id/reviews?page=1&rating=5
```

### Obter Estatísticas
```bash
curl http://localhost:3001/api/reviews/product-id/stats
```

### Admin: Aprovar Review
```bash
curl -X PUT http://localhost:3001/api/admin/reviews/review-id/approve \
  -H "Authorization: Bearer admin-token"
```

## Troubleshooting

### Reviews não aparecem na página do produto
- Verifique se a migration foi aplicada: `node run-migration-reviews.js`
- Confirme se o banco de dados está conectado
- Verifique os logs do servidor

### Formulário de review não aparece
- Usuário não está autenticado (falta token)
- Usuário não comprou o produto (verified_purchase = false)

### Erro ao criar review
- Email de erro deve indicar o problema (rating inválido, titulo vazio, etc)
- Verifique se o usuário já avaliou este produto

## Próximos Passos (Opcional)

- [ ] Fotos nos reviews
- [ ] Reviews verificados por admin antes de aparecer
- [ ] Sistema de respostas do vendedor aos reviews
- [ ] Análise de sentimento automática
- [ ] Exportação de reviews para CSV
- [ ] Notificações quando novo review é criado
