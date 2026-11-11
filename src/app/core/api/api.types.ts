// ============================================================
// CONTRATO DA API (JSON que a API Java recebe e devolve)
// Os nomes seguem as colunas do MySQL (database/01_estrutura.sql).
// A documentação completa está em docs/API_CONTRATO.md.
// ============================================================

export type PapelApi = 'gerente' | 'estoque' | 'logistica';
export type StatusApi =
  | 'pendente' | 'confirmado' | 'em_preparacao' | 'pronto'
  | 'saiu_para_entrega' | 'entregue' | 'cancelado';
export type FormaPagamentoApi = 'credito' | 'debito' | 'pix' | 'boleto';
export type TipoEntregaApi = 'entrega' | 'retirada';

// ── Auth ────────────────────────────────────────────────────
export interface LoginRequest { email: string; senha: string; }
export interface UsuarioApi {
  id: number;
  nome: string;
  email: string;
  papel: PapelApi;
  ativo: boolean;
  dataCriacao?: string;
}
export interface LoginResponse { token: string; usuario: UsuarioApi; }

// ── Catálogo ────────────────────────────────────────────────
export interface CategoriaApi { id: number; nome: string; descricao?: string | null; }

export interface ProdutoApi {
  id: number;
  idCategoria: number;
  categoria: string;          // nome da categoria (JOIN)
  nome: string;
  descricao: string | null;
  marca: string | null;
  preco: number;
  precoAntigo: number | null;
  estoque: number;
  imagemUrl: string | null;
  destaque: boolean;
  disponivel: boolean;
}
export type ProdutoRequest = Omit<ProdutoApi, 'id' | 'categoria'>;

// ── Pedidos ─────────────────────────────────────────────────
export interface ClienteApi {
  id?: number;
  nome: string;
  email: string;
  telefone: string;
  endereco: string | null;
}

export interface ItemPedidoApi {
  idProduto: number;
  nome: string;
  imagemUrl: string | null;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface PagamentoApi { forma: FormaPagamentoApi; parcelas: number; valor: number; }

export interface PedidoApi {
  id: number;
  numero: string;
  status: StatusApi;
  tipoEntrega: TipoEntregaApi;
  enderecoEntrega: string | null;
  frete: number;
  valorTotal: number;
  observacoes: string | null;
  motivoCancelamento: string | null;
  idEntregador: number | null;
  dataCriacao: string;        // ISO 8601
  dataAtualizacao: string | null;
  cliente: ClienteApi;
  itens: ItemPedidoApi[];
  pagamento: PagamentoApi;
}

export interface NovoPedidoRequest {
  cliente: ClienteApi;
  itens: { idProduto: number; quantidade: number }[];
  pagamento: { forma: FormaPagamentoApi; parcelas: number };
  tipoEntrega: TipoEntregaApi;
  observacoes: string | null;
}

export interface MudarStatusRequest {
  status: StatusApi;
  motivoCancelamento?: string;
  idEntregador?: number;
}

// ── Funcionários ────────────────────────────────────────────
export interface FuncionarioRequest {
  nome: string;
  email: string;
  papel: PapelApi;
  ativo: boolean;
  senha?: string;             // obrigatória no cadastro, opcional na edição
}

// ── Relatórios ──────────────────────────────────────────────
export interface ResumoApi {
  faturamento: number;
  totalPedidos: number;
  pedidosEntregues: number;
  pedidosCancelados: number;
  ticketMedio: number;
}
export interface FaturamentoDiaApi { dia: string; pedidos: number; faturamento: number; }
export interface PedidosStatusApi { status: StatusApi; pedidos: number; }
export interface MaisVendidoApi { idProduto: number; nome: string; categoria: string; unidadesVendidas: number; receita: number; }
export interface FormaPagamentoRelApi { forma: FormaPagamentoApi; pedidos: number; valor: number; }
export interface PedidosHoraApi { hora: number; pedidos: number; }
export interface EstoqueBaixoApi { idProduto: number; nome: string; estoque: number; }

/** Erro padrão da API: { mensagem: "..." } */
export interface ErroApi { mensagem: string; }
