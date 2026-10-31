# VOLTZ Tech Store — Angular 17 + Firebase

Loja virtual de tecnologia (hardware, periféricos, notebooks, smartphones e games),
derivada do projeto acadêmico **Maka Delivery**. O design system e a arquitetura
foram mantidos; mudaram a paleta (azul + navy + off-white), a tipografia e o domínio.

## Como rodar

```bash
npm install
npm start
```

Acesse: http://localhost:4200 — antes, configure o Firebase (veja `FIREBASE_SETUP.md`).

## Credenciais de acesso (demo)

| Portal    | E-mail              | Senha     |
|-----------|---------------------|-----------|
| Gerente   | gerente@voltz.com   | voltz2024 |
| Estoque   | estoque@voltz.com   | voltz2024 |
| Logística | logistica@voltz.com | voltz2024 |

## Rotas principais

| Rota                   | Descrição                          |
|------------------------|------------------------------------|
| /                      | Home                               |
| /produtos              | Catálogo com busca e categorias    |
| /carrinho              | Carrinho                           |
| /checkout              | Finalizar pedido                   |
| /meus-pedidos          | Acompanhar pedidos                 |
| /portais               | Seleção de portais internos        |
| /login/manager         | Login gerente                      |
| /login/kitchen         | Login estoque                      |
| /login/delivery        | Login logística                    |
| /gerente/insights      | Relatórios                         |
| /gerente/pedidos       | Gestão de pedidos                  |
| /gerente/produtos      | Cadastro de produtos               |
| /gerente/estoque       | Separação (visão do gerente)       |
| /gerente/entregas      | Entregas (visão do gerente)        |
| /gerente/funcionarios  | Equipe                             |
| /estoque/painel        | Kanban de separação                |
| /logistica/painel      | Painel da logística                |

## Onde mudar as coisas

| O quê                          | Arquivo                                              |
|--------------------------------|------------------------------------------------------|
| Paleta, fontes, sombras        | `src/styles.scss` (bloco `:root` e `.light-mode`)    |
| Catálogo inicial e categorias  | `src/app/services/menu.service.ts`                   |
| Frete e frete grátis           | `src/app/services/cart.service.ts` (`SHIPPING_FEE`, `FREE_SHIPPING_MIN`) |
| Máximo de parcelas             | `MAX_INSTALLMENTS` em `pages/menu` e `pages/checkout` |
| Rótulos dos status do pedido   | `src/app/models/index.ts` (`STATUS_CONFIG`) e `pages/my-orders` |
| Nome da loja                   | busque por `VOLTZ` no projeto                        |

### Paleta

| Token          | Hex       | Uso                                  |
|----------------|-----------|--------------------------------------|
| `--brand-600`  | `#1D5BD6` | Botões, links, preços, destaques     |
| `--brand-400`  | `#5F8FF7` | Acento sobre fundos escuros          |
| `--navy`       | `#0B1B3F` | Header, footer, seções escuras       |
| `--bg-base` (portais) | `#070D1C` | Fundo dos portais internos    |
| `--offwhite`   | `#F7F5F0` | Fundo das páginas do cliente         |
| `--warning`    | `#F59E0B` | Status "Em separação" (não é marca)  |

Tipografia: **Sora** (títulos) + **Inter** (texto). Para voltar à serifada original,
troque `--font-display` em `src/styles.scss`.

## Observações técnicas

- Os nomes internos (`MenuService`, `MenuItem`, papéis `kitchen`/`delivery`) foram
  mantidos para não reescrever a base; só o que o usuário vê foi renomeado.
- Imagens de produto usam a diretiva `appImgFallback`: se a URL falhar, aparece um placeholder.
- O build de produção baixa a fonte do Google Fonts para embuti-la no CSS — precisa de internet.
