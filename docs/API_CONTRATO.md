# Contrato da API — Voltz Tech Store

Este é o formato que o **Angular já usa**. Se a API Java seguir exatamente isto, o front
funciona sem nenhuma mudança: basta trocar `useMock: true` por `false` em
`src/environments/environment.ts`.

- URL base: `http://localhost:8080/api` (configurável em `environment.ts`)
- JSON com nomes em **camelCase**, seguindo as colunas do MySQL (`database/01_estrutura.sql`)
- Datas em ISO 8601: `"2026-11-05T20:18:29"`
- Valores em dinheiro como número: `4899.9`
- **CORS**: liberar `http://localhost:4200` com os métodos `GET, POST, PUT, PATCH, DELETE` e o header `Authorization`
- **Erros**: devolver o status HTTP certo e o corpo `{ "mensagem": "texto para o usuário" }`. O front mostra esse texto num aviso (toast).

| Status | Quando |
|---|---|
| 400 | dado inválido (preço ≤ 0, e-mail inválido, etc.) |
| 401 | sem token, token inválido/expirado, ou login errado |
| 403 | logado, mas o papel não pode fazer aquilo |
| 404 | registro não existe |
| 409 | conflito: estoque insuficiente, e-mail repetido, transição de status inválida, produto com pedidos não pode ser excluído |

> Referência executável: `src/app/core/mock/mock-backend.interceptor.ts` implementa todas as
> rotas abaixo em TypeScript, com as mesmas regras. Os tipos estão em `src/app/core/api/api.types.ts`.

---

## Valores dos enums (iguais ao MySQL)

- `papel`: `gerente` | `estoque` | `logistica`
- `status`: `pendente` | `confirmado` | `em_preparacao` | `pronto` | `saiu_para_entrega` | `entregue` | `cancelado`
- `forma` (pagamento): `credito` | `debito` | `pix` | `boleto`
- `tipoEntrega`: `entrega` | `retirada`

---

## 1. Login — Frente 2 (Lucas)

### `POST /api/auth/login` (público)
```json
{ "email": "gerente@voltz.com", "senha": "voltz2024" }
```
Resposta `200`:
```json
{
  "token": "eyJhbGciOi...",
  "usuario": { "id": 1, "nome": "Gerente Voltz", "email": "gerente@voltz.com", "papel": "gerente", "ativo": true }
}
```
- Senha errada → `401`. Usuário com `ativo = false` → `403`.
- Conferir a senha com BCrypt contra `senha_hash`. Os hashes do `02_dados.sql` são de `voltz2024`.
- Nas outras rotas o front envia `Authorization: Bearer <token>`.

**Quem acessa o quê:**

| Rota | Público | gerente | estoque | logistica |
|---|:-:|:-:|:-:|:-:|
| `GET /categorias`, `GET /produtos`, `GET /recomendacoes` | ✔ | ✔ | ✔ | ✔ |
| `POST /pedidos`, `GET /pedidos/cliente` | ✔ | ✔ | ✔ | ✔ |
| `GET /pedidos`, `PATCH /pedidos/{id}/status` | | ✔ | ✔ | ✔ |
| Escrita em `/produtos`, `/funcionarios`, todos os `/relatorios` | | ✔ | | |

---

## 2. Produtos e categorias — Frente 2 (Lucas)

### `GET /api/categorias`
```json
[ { "id": 1, "nome": "Hardware", "descricao": "Placas de vídeo, ..." } ]
```

### `GET /api/produtos`
Parâmetros opcionais: `categoria` (nome), `busca` (texto), `incluirInativos=true` (só gerente).
Sem `incluirInativos`, devolve só os produtos com `disponivel = true`.
```json
[{
  "id": 1, "idCategoria": 1, "categoria": "Hardware",
  "nome": "Placa de Vídeo GeForce RTX 4070 SUPER 12GB",
  "descricao": "Arquitetura Ada Lovelace...", "marca": "NVIDIA",
  "preco": 4899.9, "precoAntigo": 5599.9, "estoque": 14,
  "imagemUrl": "https://images.unsplash.com/...", "destaque": true, "disponivel": true
}]
```

### `GET /api/produtos/{id}` → o mesmo objeto acima

### `POST /api/produtos` e `PUT /api/produtos/{id}` (gerente)
Corpo: o objeto acima **sem** `id` e `categoria`. Resposta: o produto salvo.

### `PATCH /api/produtos/{id}/disponivel` (gerente)
```json
{ "disponivel": false }
```

### `DELETE /api/produtos/{id}` (gerente)
`204`. Se o produto já aparece em `item_pedido` (FK RESTRICT) → `409` com a mensagem
"Este produto já tem pedidos e não pode ser excluído. Desative-o."

---

## 3. Funcionários — Frente 2 (Lucas)

Tabela `usuario_painel`. Só o gerente acessa.

### `GET /api/funcionarios`
```json
[{ "id": 1, "nome": "Gerente Voltz", "email": "gerente@voltz.com", "papel": "gerente", "ativo": true, "dataCriacao": "2026-09-01T09:00:00" }]
```
**Nunca** devolver `senha_hash`.

### `POST /api/funcionarios`
```json
{ "nome": "Ana Souza", "email": "ana@voltz.com", "papel": "estoque", "ativo": true, "senha": "123456" }
```
A senha é obrigatória no cadastro (mínimo 6 caracteres) e é gravada com BCrypt. E-mail repetido → `409`.

### `PUT /api/funcionarios/{id}`
O mesmo corpo do cadastro. A `senha` é opcional: se não vier, mantém a senha atual.

### `PATCH /api/funcionarios/{id}/ativo`
```json
{ "ativo": false }
```
O gerente não pode desativar o próprio usuário → `409`.

---

## 4. Pedidos e estoque — Frente 3

### `POST /api/pedidos` (público — checkout)
```json
{
  "cliente": { "nome": "Cliente Demo", "email": "cliente@email.com", "telefone": "(11) 91234-5678",
               "endereco": "Av. Paulista, 1000 — Bela Vista, São Paulo — SP, CEP 01310-100" },
  "itens": [ { "idProduto": 1, "quantidade": 1 }, { "idProduto": 2, "quantidade": 2 } ],
  "pagamento": { "forma": "credito", "parcelas": 3 },
  "tipoEntrega": "entrega",
  "observacoes": "Deixar na portaria"
}
```
Tudo numa **única transação** (`@Transactional`):
1. Procurar o cliente pelo `email`. Se existir, atualizar nome, telefone e endereço; se não, inserir.
2. **Preço, frete, total e número são calculados pela API.** Não confiar em valores vindos do navegador.
   - Preço unitário = `produto.preco` atual.
   - Frete = `0` se subtotal ≥ 299,00, senão `29,90` (mesma regra mostrada no carrinho). Retirada = `0`.
   - Número = `VTZ-` + próximo número (ex.: `VTZ-1057`).
3. Inserir `pedido` (status `pendente`), `item_pedido` e `pagamento` (`valor` = total).
4. Se a forma **não** for `boleto`, o pagamento é aprovado na hora: fazer `UPDATE pedido SET status='confirmado'`.
   Isso dispara a `trg_pedido_estoque`, que baixa o estoque. Se faltar estoque, o `CHECK (estoque >= 0)`
   falha → rollback → responder `409` com `"Estoque insuficiente para \"<produto>\" (restam N)."`.
   Para não vender a última unidade para dois clientes, travar as linhas com
   `SELECT ... FOR UPDATE` (ou `@Lock(PESSIMISTIC_WRITE)`) antes do UPDATE.

Resposta `201`: o pedido completo (formato abaixo).

### Formato do pedido (usado em todas as respostas)
```json
{
  "id": 57, "numero": "VTZ-1057", "status": "confirmado", "tipoEntrega": "entrega",
  "enderecoEntrega": "Av. Paulista, 1000 ...", "frete": 0, "valorTotal": 7299.8,
  "observacoes": null, "motivoCancelamento": null, "idEntregador": null,
  "dataCriacao": "2026-11-11T17:46:02", "dataAtualizacao": "2026-11-11T17:46:02",
  "cliente": { "id": 16, "nome": "Cliente Demo", "email": "cliente@email.com", "telefone": "(11) 91234-5678", "endereco": "..." },
  "itens": [ { "idProduto": 1, "nome": "Placa de Vídeo ...", "imagemUrl": "https://...", "quantidade": 1, "precoUnitario": 4899.9, "subtotal": 4899.9 } ],
  "pagamento": { "forma": "credito", "parcelas": 3, "valor": 7299.8 }
}
```

### `GET /api/pedidos` (painéis, com login)
Todos os pedidos, mais recentes primeiro. Filtro opcional: `?status=pronto`.
Os painéis de Estoque e Logística chamam esta rota **a cada 5 segundos**, então ela precisa ser leve
(usar `JOIN FETCH` ou `@EntityGraph` para não cair no problema N+1).

### `GET /api/pedidos/cliente?telefone=(11) 91234-5678` (público — "Meus pedidos")
Também aceita `?email=`. Comparar o telefone **só pelos dígitos**.

### `PATCH /api/pedidos/{id}/status`
```json
{ "status": "saiu_para_entrega", "idEntregador": 3 }
{ "status": "cancelado", "motivoCancelamento": "Desistência do cliente" }
```
Transições permitidas (outras → `409`):

| De | Para | Quem usa no front |
|---|---|---|
| `pendente` | `confirmado` | Gerente ("Aprovar pagamento", boleto) |
| `confirmado` | `em_preparacao` | Estoque ("Iniciar separação") |
| `em_preparacao` | `pronto` | Estoque ("Embalado") |
| `pronto` | `saiu_para_entrega` | Logística ("Despachar pacote", envia `idEntregador`) |
| `saiu_para_entrega` | `entregue` | Logística ("Confirmar entrega") |
| `pendente`, `confirmado`, `em_preparacao`, `pronto` | `cancelado` | Só gerente, com `motivoCancelamento` |

A trigger devolve o estoque quando um pedido `confirmado`, `em_preparacao` ou `pronto` é cancelado.

---

## 5. Relatórios e recomendação — Frente 4

Todos os relatórios aceitam `?inicio=YYYY-MM-DD&fim=YYYY-MM-DD` (inclusivo, por `DATE(data_criacao)`).
Sem esses parâmetros = todo o período. Só o gerente acessa. O painel atualiza a cada 15 segundos.

| Rota | Resposta | Base no SQL |
|---|---|---|
| `GET /api/relatorios/resumo` | `{ "faturamento": 339416.7, "totalPedidos": 57, "pedidosEntregues": 46, "pedidosCancelados": 4, "ticketMedio": 6404.09 }` | faturamento e ticket **sem** cancelados |
| `GET /api/relatorios/faturamento-diario` | `[{ "dia": "2026-11-05", "pedidos": 3, "faturamento": 15699.2 }]` (ordem por dia) | `vw_faturamento_diario` |
| `GET /api/relatorios/pedidos-por-status` | `[{ "status": "entregue", "pedidos": 46 }]` | `vw_pedidos_por_status` |
| `GET /api/relatorios/mais-vendidos?limite=5` | `[{ "idProduto": 1, "nome": "...", "categoria": "Hardware", "unidadesVendidas": 9, "receita": 44099.1 }]` | `vw_produtos_mais_vendidos` |
| `GET /api/relatorios/formas-pagamento` | `[{ "forma": "pix", "pedidos": 20, "valor": 98000 }]` | `vw_formas_pagamento` |
| `GET /api/relatorios/pedidos-por-hora` | `[{ "hora": 14, "pedidos": 6 }]` | `vw_pedidos_por_hora` |
| `GET /api/relatorios/estoque-baixo` | `[{ "idProduto": 5, "nome": "PC Gamer ...", "estoque": 6 }]` (sem filtro de data) | `vw_estoque_baixo` |

> As views atuais não recebem período. Para o filtro funcionar, use a consulta da view com
> `WHERE DATE(data_criacao) BETWEEN :inicio AND :fim` (`@Query(nativeQuery = true)`).

### `GET /api/recomendacoes?produtos=1,7&limite=4` (público)
"Quem comprou também levou". Devolve uma **lista de produtos** (mesmo formato de `GET /produtos`):
1. Usar `vw_comprados_juntos` para os produtos informados, somando `vezes`.
2. Completar com `produto_relacionado`.
3. Tirar os próprios produtos informados, os indisponíveis e os sem estoque. Ordenar por relevância.

É usada na tela de produtos (1 id) e no carrinho (todos os ids do carrinho).

---

## Observações para a Letícia (SQL)

- A trigger só roda em `UPDATE`. Por isso o pedido é inserido como `pendente` e atualizado para `confirmado` logo depois (passo 4 do `POST /pedidos`).
- O pedido `VTZ-1056` do `02_dados.sql` é `retirada` com status `saiu_para_entrega`. Retirada normalmente não "sai para entrega"; trocar para `entregue` ou `tipo_entrega = 'entrega'`.
- O plano cita uma coluna `tags` em PRODUTO, mas ela não existe no `01_estrutura.sql`. O front não depende dela.
