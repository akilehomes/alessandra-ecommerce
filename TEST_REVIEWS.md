# Guia de Testes - Sistema de Reviews

## Setup Inicial

### 1. Aplicar Migration
```bash
cd backend
node run-migration-reviews.js
```

Resposta esperada:
```
🔄 Running reviews migration...
✅ Reviews migration completed successfully!
✅ Created tables: reviews, review_helpful_votes, review_approvals
✅ Created indexes for performance optimization
```

### 2. Iniciar Servidores
```bash
# Terminal 1 - Backend
cd backend
npm start
# Deve mostrar: ✅ Database connected

# Terminal 2 - Frontend
cd frontend
npm start
# Deve abrir em http://localhost:3000
```

## Testes de API

### Teste 1: Listar Reviews de um Produto (Não Autenticado)
```bash
curl "http://localhost:3001/api/reviews/PRODUCT_ID/reviews?page=1&limit=10"
```

Resposta esperada:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

### Teste 2: Obter Estatísticas
```bash
curl "http://localhost:3001/api/reviews/PRODUCT_ID/stats"
```

Resposta esperada (sem reviews):
```json
{
  "product_id": "PRODUCT_ID",
  "total_reviews": 0,
  "average_rating": 0,
  "distribution": {
    "five_star": 0,
    "four_star": 0,
    "three_star": 0,
    "two_star": 0,
    "one_star": 0
  }
}
```

### Teste 3: Criar Review (Sem Token)
```bash
curl -X POST "http://localhost:3001/api/reviews/PRODUCT_ID/reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "title": "Ótimo produto!",
    "comment": "Muito bom mesmo"
  }'
```

Resposta esperada (erro):
```json
{
  "error": "Missing or invalid token"
}
```

### Teste 4: Login de Usuário
```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Resposta esperada:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "USER_ID",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Teste 5: Criar Review (Com Token)
```bash
# Salve o token da resposta anterior
TOKEN="seu_token_aqui"

curl -X POST "http://localhost:3001/api/reviews/PRODUCT_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "title": "Produto Excelente!",
    "comment": "Superou minhas expectativas. Entrega rápida e produto de excelente qualidade."
  }'
```

Resposta esperada:
```json
{
  "id": "REVIEW_ID",
  "product_id": "PRODUCT_ID",
  "user_id": "USER_ID",
  "rating": 5,
  "title": "Produto Excelente!",
  "comment": "Superou minhas expectativas...",
  "verified_purchase": false,
  "helpful_count": 0,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "user": {
    "id": "USER_ID",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### Teste 6: Verificar Estatísticas Atualizadas
```bash
curl "http://localhost:3001/api/reviews/PRODUCT_ID/stats"
```

Resposta esperada:
```json
{
  "product_id": "PRODUCT_ID",
  "total_reviews": 1,
  "average_rating": 5.0,
  "distribution": {
    "five_star": 1,
    "four_star": 0,
    "three_star": 0,
    "two_star": 0,
    "one_star": 0
  }
}
```

### Teste 7: Criar Outro Review (Mesmo Usuário)
```bash
curl -X POST "http://localhost:3001/api/reviews/PRODUCT_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "title": "Bom, mas poderia melhorar",
    "comment": "Bom custo-benefício"
  }'
```

Resposta esperada (erro):
```json
{
  "error": "You have already reviewed this product"
}
```

### Teste 8: Marcar Review como Útil
```bash
curl -X POST "http://localhost:3001/api/reviews/REVIEW_ID/helpful" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Resposta esperada:
```json
{
  "id": "REVIEW_ID",
  "helpful_count": 1,
  ...
}
```

### Teste 9: Editar Review
```bash
curl -X PUT "http://localhost:3001/api/reviews/REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Produto bom, mas o tamanho é um pouco pequeno"
  }'
```

Resposta esperada:
```json
{
  "id": "REVIEW_ID",
  "rating": 4,
  "comment": "Produto bom, mas o tamanho é um pouco pequeno",
  ...
}
```

### Teste 10: Listar Reviews com Filtro
```bash
# Apenas 5 estrelas
curl "http://localhost:3001/api/reviews/PRODUCT_ID/reviews?page=1&rating=5"

# Com paginação
curl "http://localhost:3001/api/reviews/PRODUCT_ID/reviews?page=1&limit=5"
```

## Testes de Admin

### Teste 1: Login Admin
```bash
curl -X POST "http://localhost:3001/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Resposta esperada:
```json
{
  "token": "admin_token",
  "admin": {
    "id": "ADMIN_ID",
    "email": "admin@example.com"
  }
}
```

### Teste 2: Listar Reviews (Admin)
```bash
ADMIN_TOKEN="seu_admin_token"

curl "http://localhost:3001/api/admin/reviews?page=1&status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Teste 3: Aprovar Review
```bash
curl -X PUT "http://localhost:3001/api/admin/reviews/REVIEW_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Teste 4: Rejeitar Review
```bash
curl -X PUT "http://localhost:3001/api/admin/reviews/REVIEW_ID/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Conteúdo inapropriado ou spam"
  }'
```

### Teste 5: Ver Estatísticas Detalhadas
```bash
curl "http://localhost:3001/api/admin/reviews/analytics/PRODUCT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Resposta esperada:
```json
{
  "total_reviews": 5,
  "approved": 4,
  "pending": 1,
  "rejected": 0,
  "average_rating": 4.4,
  "total_helpful_votes": 12,
  "verified_purchase_count": 3
}
```

## Testes de Frontend

### Teste 1: Página de Produto
1. Acesse http://localhost:3000/shop
2. Clique em um produto
3. Role até "Avaliações dos Clientes"
4. Deve ver seção de reviews

### Teste 2: Ver Estatísticas
1. Na seção de reviews, deve ver:
   - Rating médio com stars
   - Total de avaliações
   - Distribuição por rating

### Teste 3: Criar Review (Não Autenticado)
1. Não autenticado
2. Clique em "Deixar Avaliação"
3. Deve ver mensagem de login necessário

### Teste 4: Criar Review (Autenticado)
1. Faça login
2. Acesse página de produto
3. Clique em "Deixar Avaliação"
4. Preencha form:
   - Selecione rating (clique nas stars)
   - Escreva título
   - (Opcional) Escreva comentário
5. Clique "Enviar Avaliação"
6. Deve ver mensagem de sucesso
7. Review deve aparecer na lista

### Teste 5: Filtrar por Rating
1. Na lista de reviews, clique nos botões de filtro
2. "Todas", "5★", "4★", etc
3. Lista deve mostrar apenas reviews do rating selecionado

### Teste 6: Marcar como Útil
1. Clique no botão "👍 Útil"
2. Contador deve aumentar
3. Ao clicar novamente, deve diminuir (toggle)

### Teste 7: Admin Dashboard
1. Faça login como admin
2. Acesse Admin Dashboard
3. Vá para "Gerenciar Avaliações"
4. Filtre por status (Pendentes, Aprovados, Rejeitados)
5. Clique em um review para ver detalhes
6. Teste Aprovar/Rejeitar/Deletar

## Validações a Testar

### Rating
- [x] Aceita 1-5
- [x] Rejeita 0 ou maior que 5
- [x] Campo obrigatório

### Título
- [x] Campo obrigatório
- [x] Max 255 caracteres
- [x] Não aceita vazio ou apenas espaços

### Comentário
- [x] Opcional
- [x] Max 5000 caracteres

### Autenticação
- [x] Rejeita sem token
- [x] Rejeita com token inválido
- [x] Aceita com token válido

### Rate Limiting
- [x] Permite apenas 1 review por usuário por produto
- [x] Mostra erro ao tentar criar segundo review

## Checklist de Testes

- [ ] Migration aplicada com sucesso
- [ ] Reviews criados no banco
- [ ] API listando reviews
- [ ] Estatísticas atualizando corretamente
- [ ] Sistema de útil funcionando
- [ ] Validações de dados funcionando
- [ ] Autenticação funcionando
- [ ] Admin conseguindo aprovar reviews
- [ ] Admin conseguindo rejeitar reviews
- [ ] Admin conseguindo deletar reviews
- [ ] Frontend exibindo reviews
- [ ] Frontend permitindo criar reviews
- [ ] Filtros funcionando
- [ ] Paginação funcionando
- [ ] Responsive design funcionando em mobile

## Dados de Teste

### Usuário
```
Email: user@test.com
Senha: password123
```

### Admin
```
Email: admin@test.com
Senha: admin123
```

### Produto
Use qualquer ID de produto existente no banco
