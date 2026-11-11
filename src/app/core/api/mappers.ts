// Converte o JSON da API (nomes do MySQL, em português) para os modelos
// que as telas já usam (em inglês), e vice-versa. Assim nenhuma tela precisa
// conhecer o formato do back-end.
import { CartItem, MenuItem, Order, OrderStatus, PaymentMethod, UserRole } from '../../models';
import {
  FormaPagamentoApi, PapelApi, PedidoApi, ProdutoApi, ProdutoRequest, StatusApi,
} from './api.types';

// ── Status ──────────────────────────────────────────────────
const STATUS_TO_API: Record<OrderStatus, StatusApi> = {
  pending:    'pendente',
  confirmed:  'confirmado',
  preparing:  'em_preparacao',
  ready:      'pronto',
  delivering: 'saiu_para_entrega',
  delivered:  'entregue',
  cancelled:  'cancelado',
};
const STATUS_FROM_API = Object.fromEntries(
  Object.entries(STATUS_TO_API).map(([k, v]) => [v, k]),
) as Record<StatusApi, OrderStatus>;

export const statusToApi   = (s: OrderStatus): StatusApi => STATUS_TO_API[s];
export const statusFromApi = (s: StatusApi): OrderStatus => STATUS_FROM_API[s] ?? 'pending';

// ── Papéis ──────────────────────────────────────────────────
const ROLE_TO_API: Record<Exclude<UserRole, null>, PapelApi> = {
  manager: 'gerente', kitchen: 'estoque', delivery: 'logistica',
};
export const roleToApi   = (r: Exclude<UserRole, null>): PapelApi => ROLE_TO_API[r];
export const roleFromApi = (p: PapelApi): Exclude<UserRole, null> =>
  p === 'gerente' ? 'manager' : p === 'estoque' ? 'kitchen' : 'delivery';

// ── Pagamento ───────────────────────────────────────────────
const PAY_TO_API: Record<PaymentMethod, FormaPagamentoApi> = {
  credit: 'credito', debit: 'debito', pix: 'pix', boleto: 'boleto',
};
export const paymentToApi   = (p: PaymentMethod): FormaPagamentoApi => PAY_TO_API[p];
export const paymentFromApi = (f: FormaPagamentoApi): PaymentMethod =>
  f === 'credito' ? 'credit' : f === 'debito' ? 'debit' : f;

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: 'PIX', credit: 'Cartão de Crédito', debit: 'Cartão de Débito', boleto: 'Boleto',
};
export function paymentLabel(method: PaymentMethod, installments = 1): string {
  const base = PAYMENT_LABEL[method] ?? method;
  return method === 'credit' && installments > 1 ? `${base} — ${installments}× sem juros` : base;
}

// ── Produto ─────────────────────────────────────────────────
export function productFromApi(p: ProdutoApi): MenuItem {
  return {
    id:          String(p.id),
    name:        p.nome,
    description: p.descricao ?? '',
    price:       Number(p.preco),
    category:    p.categoria,
    categoryId:  p.idCategoria,
    image:       p.imagemUrl ?? '',
    isSpecial:   !!p.destaque,
    active:      p.disponivel !== false,
    brand:       p.marca ?? undefined,
    oldPrice:    p.precoAntigo != null ? Number(p.precoAntigo) : undefined,
    stock:       p.estoque,
  };
}

export function productToApi(m: Partial<MenuItem>, categoryId: number): ProdutoRequest {
  return {
    idCategoria: categoryId,
    nome:        m.name ?? '',
    descricao:   m.description ?? null,
    marca:       m.brand || null,
    preco:       Number(m.price ?? 0),
    precoAntigo: m.oldPrice ? Number(m.oldPrice) : null,
    estoque:     Number(m.stock ?? 0),
    imagemUrl:   m.image || null,
    destaque:    !!m.isSpecial,
    disponivel:  m.active !== false,
  };
}

// ── Pedido ──────────────────────────────────────────────────
export function orderFromApi(p: PedidoApi): Order {
  const method = paymentFromApi(p.pagamento?.forma ?? 'pix');
  const installments = p.pagamento?.parcelas ?? 1;
  const items: CartItem[] = (p.itens ?? []).map(i => ({
    id:          String(i.idProduto),
    name:        i.nome,
    description: '',
    category:    '',
    image:       i.imagemUrl ?? '',
    price:       Number(i.precoUnitario),
    quantity:    i.quantidade,
  }));
  return {
    id:               String(p.id),
    orderNumber:      p.numero,
    items,
    customer: {
      name:    p.cliente?.nome ?? '',
      phone:   p.cliente?.telefone ?? '',
      email:   p.cliente?.email,
      address: p.enderecoEntrega ?? (p.tipoEntrega === 'retirada' ? 'Retirada na loja' : p.cliente?.endereco ?? ''),
    },
    paymentMethod:    paymentLabel(method, installments),
    payment:          { method, installments },
    total:            Number(p.valorTotal),
    deliveryFee:      Number(p.frete),
    status:           statusFromApi(p.status),
    orderType:        p.tipoEntrega === 'retirada' ? 'retirada' : 'delivery',
    createdAt:        parseApiDate(p.dataCriacao),
    updatedAt:        p.dataAtualizacao ? parseApiDate(p.dataAtualizacao) : undefined,
    deliveryPersonId: p.idEntregador != null ? String(p.idEntregador) : undefined,
    observations:     p.observacoes ?? undefined,
    cancelReason:     p.motivoCancelamento ?? undefined,
  };
}

/** Aceita "2026-11-05T20:18:29" e também "2026-11-05 20:18:29" (formato do MySQL). */
export function parseApiDate(v: string | null | undefined): Date {
  if (!v) return new Date();
  return new Date(v.includes('T') ? v : v.replace(' ', 'T'));
}
