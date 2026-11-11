// ============================================================
// BACK-END FALSO (só para desenvolvimento do front)
// Liga com environment.useMock = true. Responde às mesmas rotas do
// docs/API_CONTRATO.md, com os dados de database/02_dados.sql
// (gerados em mock-seed.json por scripts/sql-to-mock.mjs) e imita as
// regras do banco: trigger de estoque, FK RESTRICT, UNIQUE de e-mail etc.
// O estado fica no localStorage; para zerar rode voltzMockReset() no console.
// ============================================================
import {
  HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { mergeMap, of, throwError, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { shippingFor } from '../../services/cart.service';
import seed from './mock-seed.json';

// ── Tipos das "tabelas" ─────────────────────────────────────
interface Usuario   { id_usuario: number; nome: string; email: string; senha_hash: string; papel: string; ativo?: number; data_criacao?: string; senha_mock?: string; }
interface Categoria { id_categoria: number; nome: string; descricao: string | null; }
interface Produto   { id_produto: number; id_categoria: number; nome: string; descricao: string | null; marca: string | null; preco: number; preco_antigo: number | null; estoque: number; imagem_url: string | null; destaque: number; disponivel?: number; }
interface Relacao   { id_produto: number; id_produto_relacionado: number; }
interface Cliente   { id_cliente: number; nome: string; email: string; telefone: string; endereco: string | null; data_criacao?: string; }
interface Pedido    { id_pedido: number; numero: string; id_cliente: number; id_entregador: number | null; tipo_entrega: string; endereco_entrega: string | null; frete: number; valor_total: number; status: string; motivo_cancelamento: string | null; observacoes?: string | null; data_criacao: string; data_atualizacao: string; }
interface Item      { id_item: number; id_pedido: number; id_produto: number; quantidade: number; preco_unitario: number; }
interface Pagamento { id_pagamento: number; id_pedido: number; forma: string; parcelas: number; valor: number; }

interface Db {
  usuario_painel: Usuario[]; categoria: Categoria[]; produto: Produto[];
  produto_relacionado: Relacao[]; cliente: Cliente[]; pedido: Pedido[];
  item_pedido: Item[]; pagamento: Pagamento[];
}

const STORAGE_KEY = 'voltz_mock_db_v1';
const DEMO_PASSWORD = 'voltz2024'; // senha dos usuários do 02_dados.sql

class ApiError { constructor(public status: number, public mensagem: string) {} }

// ── Persistência ────────────────────────────────────────────
function freshDb(): Db {
  const db = JSON.parse(JSON.stringify(seed)) as Db;
  db.usuario_painel.forEach(u => { u.ativo ??= 1; u.data_criacao ??= '2026-09-01 09:00:00'; u.senha_mock = DEMO_PASSWORD; });
  db.produto.forEach(p => { p.disponivel ??= 1; });
  db.pedido.forEach(p => { p.observacoes ??= null; });
  return db;
}

let db: Db = load();

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch { /* ignora */ }
  return freshDb();
}
function save(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* ignora */ }
}
(window as unknown as Record<string, unknown>)['voltzMockReset'] = () => {
  db = freshDb(); save(); location.reload();
};

// ── Utilitários ─────────────────────────────────────────────
const nextId = <T>(rows: T[], key: keyof T) => rows.reduce((m, r) => Math.max(m, Number(r[key])), 0) + 1;
const money = (v: number) => Math.round(v * 100) / 100;
function now(): string {
  const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
const iso = (sqlDate: string | null | undefined) => (sqlDate ? sqlDate.replace(' ', 'T') : null);

// ── DTOs (formato do contrato) ──────────────────────────────
function produtoDto(p: Produto) {
  return {
    id: p.id_produto, idCategoria: p.id_categoria,
    categoria: db.categoria.find(c => c.id_categoria === p.id_categoria)?.nome ?? '',
    nome: p.nome, descricao: p.descricao, marca: p.marca,
    preco: p.preco, precoAntigo: p.preco_antigo, estoque: p.estoque,
    imagemUrl: p.imagem_url, destaque: !!p.destaque, disponivel: p.disponivel !== 0,
  };
}
function usuarioDto(u: Usuario) {
  return { id: u.id_usuario, nome: u.nome, email: u.email, papel: u.papel, ativo: u.ativo !== 0, dataCriacao: iso(u.data_criacao) };
}
function pedidoDto(p: Pedido) {
  const c = db.cliente.find(x => x.id_cliente === p.id_cliente);
  const pg = db.pagamento.find(x => x.id_pedido === p.id_pedido);
  return {
    id: p.id_pedido, numero: p.numero, status: p.status, tipoEntrega: p.tipo_entrega,
    enderecoEntrega: p.endereco_entrega, frete: p.frete, valorTotal: p.valor_total,
    observacoes: p.observacoes ?? null, motivoCancelamento: p.motivo_cancelamento,
    idEntregador: p.id_entregador, dataCriacao: iso(p.data_criacao), dataAtualizacao: iso(p.data_atualizacao),
    cliente: c ? { id: c.id_cliente, nome: c.nome, email: c.email, telefone: c.telefone, endereco: c.endereco } : null,
    itens: db.item_pedido.filter(i => i.id_pedido === p.id_pedido).map(i => {
      const prod = db.produto.find(x => x.id_produto === i.id_produto);
      return { idProduto: i.id_produto, nome: prod?.nome ?? '', imagemUrl: prod?.imagem_url ?? null,
               quantidade: i.quantidade, precoUnitario: i.preco_unitario, subtotal: money(i.quantidade * i.preco_unitario) };
    }),
    pagamento: pg ? { forma: pg.forma, parcelas: pg.parcelas, valor: pg.valor } : null,
  };
}

// ── Autenticação ────────────────────────────────────────────
function currentUser(req: HttpRequest<unknown>): Usuario | null {
  const m = /^Bearer mock\.(\d+)$/.exec(req.headers.get('Authorization') ?? '');
  return m ? db.usuario_painel.find(u => u.id_usuario === Number(m[1]) && u.ativo !== 0) ?? null : null;
}
function requireUser(req: HttpRequest<unknown>, ...papeis: string[]): Usuario {
  const u = currentUser(req);
  if (!u) throw new ApiError(401, 'Faça login para continuar.');
  if (papeis.length && !papeis.includes(u.papel)) throw new ApiError(403, 'Seu perfil não tem acesso a este recurso.');
  return u;
}

// ── Trigger trg_pedido_estoque ──────────────────────────────
function applyStockTrigger(p: Pedido, oldStatus: string, newStatus: string): void {
  const itens = db.item_pedido.filter(i => i.id_pedido === p.id_pedido);
  if (oldStatus === 'pendente' && newStatus === 'confirmado') {
    for (const i of itens) {
      const prod = db.produto.find(x => x.id_produto === i.id_produto)!;
      if (prod.estoque - i.quantidade < 0) {
        throw new ApiError(409, `Estoque insuficiente para "${prod.nome}" (restam ${prod.estoque}).`);
      }
    }
    itens.forEach(i => { db.produto.find(x => x.id_produto === i.id_produto)!.estoque -= i.quantidade; });
  } else if (newStatus === 'cancelado' && ['confirmado', 'em_preparacao', 'pronto'].includes(oldStatus)) {
    itens.forEach(i => { db.produto.find(x => x.id_produto === i.id_produto)!.estoque += i.quantidade; });
  }
}

const TRANSITIONS: Record<string, string[]> = {
  pendente:          ['confirmado', 'cancelado'],
  confirmado:        ['em_preparacao', 'cancelado'],
  em_preparacao:     ['pronto', 'cancelado'],
  pronto:            ['saiu_para_entrega', 'cancelado'],
  saiu_para_entrega: ['entregue'],
  entregue:          [],
  cancelado:         [],
};

// ── Relatórios ──────────────────────────────────────────────
function inPeriod(req: HttpRequest<unknown>) {
  const ini = req.params.get('inicio');
  const fim = req.params.get('fim');
  return db.pedido.filter(p => {
    const dia = p.data_criacao.slice(0, 10);
    return (!ini || dia >= ini) && (!fim || dia <= fim);
  });
}

// ── Rotas ───────────────────────────────────────────────────
type Handler = (req: HttpRequest<any>, params: string[]) => unknown;
const routes: [string, RegExp, Handler][] = [];
const route = (method: string, path: string, h: Handler) =>
  routes.push([method, new RegExp('^' + path.replace(/:\w+/g, '(\\d+)') + '$'), h]);

route('POST', '/auth/login', req => {
  const { email, senha } = req.body ?? {};
  const u = db.usuario_painel.find(x => x.email === String(email ?? '').trim().toLowerCase());
  if (!u || (u.senha_mock ?? DEMO_PASSWORD) !== senha) throw new ApiError(401, 'E-mail ou senha incorretos.');
  if (u.ativo === 0) throw new ApiError(403, 'Usuário desativado.');
  return { token: `mock.${u.id_usuario}`, usuario: usuarioDto(u) };
});

route('GET', '/categorias', () => db.categoria.map(c => ({ id: c.id_categoria, nome: c.nome, descricao: c.descricao })));

route('GET', '/produtos', req => {
  const todos = req.params.get('incluirInativos') === 'true';
  const cat = req.params.get('categoria');
  const q = (req.params.get('busca') ?? '').toLowerCase();
  if (todos) requireUser(req, 'gerente');
  return db.produto
    .filter(p => todos || p.disponivel !== 0)
    .map(produtoDto)
    .filter(p => !cat || p.categoria === cat)
    .filter(p => !q || `${p.nome} ${p.marca} ${p.descricao}`.toLowerCase().includes(q));
});

route('GET', '/produtos/:id', (_r, [id]) => {
  const p = db.produto.find(x => x.id_produto === +id);
  if (!p) throw new ApiError(404, 'Produto não encontrado.');
  return produtoDto(p);
});

function validateProduto(b: any): void {
  if (!b?.nome?.trim()) throw new ApiError(400, 'O nome do produto é obrigatório.');
  if (!(Number(b.preco) > 0)) throw new ApiError(400, 'O preço deve ser maior que zero.');
  if (Number(b.estoque) < 0) throw new ApiError(400, 'O estoque não pode ser negativo.');
  if (!db.categoria.some(c => c.id_categoria === Number(b.idCategoria))) throw new ApiError(400, 'Categoria inválida.');
}
function produtoFromBody(b: any): Omit<Produto, 'id_produto'> {
  return { id_categoria: Number(b.idCategoria), nome: b.nome.trim(), descricao: b.descricao ?? null, marca: b.marca ?? null,
           preco: Number(b.preco), preco_antigo: b.precoAntigo ?? null, estoque: Number(b.estoque ?? 0),
           imagem_url: b.imagemUrl ?? null, destaque: b.destaque ? 1 : 0, disponivel: b.disponivel === false ? 0 : 1 };
}

route('POST', '/produtos', req => {
  requireUser(req, 'gerente');
  validateProduto(req.body);
  const p: Produto = { id_produto: nextId(db.produto, 'id_produto'), ...produtoFromBody(req.body) };
  db.produto.push(p);
  return produtoDto(p);
});

route('PUT', '/produtos/:id', (req, [id]) => {
  requireUser(req, 'gerente');
  validateProduto(req.body);
  const p = db.produto.find(x => x.id_produto === +id);
  if (!p) throw new ApiError(404, 'Produto não encontrado.');
  Object.assign(p, produtoFromBody(req.body));
  return produtoDto(p);
});

route('PATCH', '/produtos/:id/disponivel', (req, [id]) => {
  requireUser(req, 'gerente');
  const p = db.produto.find(x => x.id_produto === +id);
  if (!p) throw new ApiError(404, 'Produto não encontrado.');
  p.disponivel = req.body?.disponivel ? 1 : 0;
  return produtoDto(p);
});

route('DELETE', '/produtos/:id', (req, [id]) => {
  requireUser(req, 'gerente');
  if (db.item_pedido.some(i => i.id_produto === +id)) {
    throw new ApiError(409, 'Este produto já tem pedidos e não pode ser excluído. Desative-o.');
  }
  db.produto = db.produto.filter(x => x.id_produto !== +id);
  db.produto_relacionado = db.produto_relacionado.filter(r => r.id_produto !== +id && r.id_produto_relacionado !== +id);
  return null;
});

route('GET', '/pedidos', req => {
  requireUser(req);
  const st = req.params.get('status');
  return db.pedido.filter(p => !st || p.status === st).map(pedidoDto);
});

route('GET', '/pedidos/cliente', req => {
  const tel = (req.params.get('telefone') ?? '').replace(/\D/g, '');
  const email = (req.params.get('email') ?? '').toLowerCase();
  if (!tel && !email) throw new ApiError(400, 'Informe telefone ou e-mail.');
  const ids = db.cliente
    .filter(c => (tel && c.telefone.replace(/\D/g, '') === tel) || (email && c.email === email))
    .map(c => c.id_cliente);
  return db.pedido.filter(p => ids.includes(p.id_cliente)).map(pedidoDto);
});

route('POST', '/pedidos', req => {
  const b = req.body ?? {};
  const cli = b.cliente ?? {};
  if (!cli.nome?.trim() || !cli.email?.trim() || !cli.telefone?.trim()) {
    throw new ApiError(400, 'Nome, e-mail e telefone do cliente são obrigatórios.');
  }
  if (!Array.isArray(b.itens) || !b.itens.length) throw new ApiError(400, 'O pedido precisa ter pelo menos um item.');
  if (!['credito', 'debito', 'pix', 'boleto'].includes(b.pagamento?.forma)) throw new ApiError(400, 'Forma de pagamento inválida.');
  const parcelas = Number(b.pagamento?.parcelas ?? 1);
  if (parcelas < 1 || parcelas > 12) throw new ApiError(400, 'Parcelas devem ser entre 1 e 12.');

  // Transação: trabalha numa cópia e só grava se tudo der certo.
  const backup = JSON.stringify(db);
  try {
    const email = cli.email.trim().toLowerCase();
    let c = db.cliente.find(x => x.email === email);
    if (c) Object.assign(c, { nome: cli.nome.trim(), telefone: cli.telefone, endereco: cli.endereco ?? c.endereco });
    else {
      c = { id_cliente: nextId(db.cliente, 'id_cliente'), nome: cli.nome.trim(), email, telefone: cli.telefone, endereco: cli.endereco ?? null, data_criacao: now() };
      db.cliente.push(c);
    }

    const idPedido = nextId(db.pedido, 'id_pedido');
    let subtotal = 0;
    const itens: Item[] = [];
    for (const it of b.itens) {
      const prod = db.produto.find(x => x.id_produto === Number(it.idProduto));
      if (!prod || prod.disponivel === 0) throw new ApiError(400, `Produto ${it.idProduto} indisponível.`);
      const qtd = Number(it.quantidade);
      if (!(qtd > 0)) throw new ApiError(400, 'Quantidade inválida.');
      if (prod.estoque < qtd) throw new ApiError(409, `Estoque insuficiente para "${prod.nome}" (restam ${prod.estoque}).`);
      const existing = itens.find(x => x.id_produto === prod.id_produto);
      if (existing) existing.quantidade += qtd;
      else itens.push({ id_item: 0, id_pedido: idPedido, id_produto: prod.id_produto, quantidade: qtd, preco_unitario: prod.preco });
      subtotal += prod.preco * qtd;
    }
    const retirada = b.tipoEntrega === 'retirada';
    const frete = retirada ? 0 : shippingFor(subtotal);
    const total = money(subtotal + frete);
    const maxNum = db.pedido.reduce((m, p) => Math.max(m, Number(p.numero.replace(/\D/g, '')) || 0), 1000);

    const pedido: Pedido = {
      id_pedido: idPedido, numero: `VTZ-${maxNum + 1}`, id_cliente: c.id_cliente, id_entregador: null,
      tipo_entrega: retirada ? 'retirada' : 'entrega', endereco_entrega: retirada ? null : (cli.endereco ?? null),
      frete, valor_total: total, status: 'pendente', motivo_cancelamento: null,
      observacoes: b.observacoes ?? null, data_criacao: now(), data_atualizacao: now(),
    };
    db.pedido.push(pedido);
    let nextItem = nextId(db.item_pedido, 'id_item');
    itens.forEach(i => { i.id_item = nextItem++; db.item_pedido.push(i); });
    db.pagamento.push({ id_pagamento: nextId(db.pagamento, 'id_pagamento'), id_pedido: idPedido, forma: b.pagamento.forma, parcelas, valor: total });

    // PIX e cartão: pagamento aprovado na hora -> UPDATE para 'confirmado' (dispara a trigger).
    if (b.pagamento.forma !== 'boleto') {
      applyStockTrigger(pedido, 'pendente', 'confirmado');
      pedido.status = 'confirmado';
    }
    return pedidoDto(pedido);
  } catch (e) {
    db = JSON.parse(backup) as Db; // ROLLBACK
    throw e;
  }
});

route('PATCH', '/pedidos/:id/status', (req, [id]) => {
  const user = requireUser(req);
  const p = db.pedido.find(x => x.id_pedido === +id);
  if (!p) throw new ApiError(404, 'Pedido não encontrado.');
  const novo = String(req.body?.status ?? '');
  if (!(TRANSITIONS[p.status] ?? []).includes(novo)) {
    throw new ApiError(409, `Não é possível mudar de "${p.status}" para "${novo}".`);
  }
  if (novo === 'cancelado' && user.papel !== 'gerente') throw new ApiError(403, 'Só o gerente cancela pedidos.');
  applyStockTrigger(p, p.status, novo);
  p.status = novo;
  p.data_atualizacao = now();
  if (novo === 'cancelado') p.motivo_cancelamento = req.body?.motivoCancelamento ?? 'Cancelado pelo gerente';
  if (req.body?.idEntregador) p.id_entregador = Number(req.body.idEntregador);
  return pedidoDto(p);
});

route('GET', '/funcionarios', req => { requireUser(req, 'gerente'); return db.usuario_painel.map(usuarioDto); });

function validateFuncionario(b: any, editingId?: number): void {
  if (!b?.nome?.trim()) throw new ApiError(400, 'O nome é obrigatório.');
  if (!/^\S+@\S+\.\S+$/.test(b?.email ?? '')) throw new ApiError(400, 'E-mail inválido.');
  if (!['gerente', 'estoque', 'logistica'].includes(b?.papel)) throw new ApiError(400, 'Papel inválido.');
  if (db.usuario_painel.some(u => u.email === b.email && u.id_usuario !== editingId)) throw new ApiError(409, 'Já existe um usuário com este e-mail.');
  if (!editingId && (b.senha ?? '').length < 6) throw new ApiError(400, 'A senha precisa ter pelo menos 6 caracteres.');
}

route('POST', '/funcionarios', req => {
  requireUser(req, 'gerente');
  validateFuncionario(req.body);
  const u: Usuario = { id_usuario: nextId(db.usuario_painel, 'id_usuario'), nome: req.body.nome.trim(), email: req.body.email,
    senha_hash: '(bcrypt na API)', senha_mock: req.body.senha, papel: req.body.papel, ativo: req.body.ativo === false ? 0 : 1, data_criacao: now() };
  db.usuario_painel.push(u);
  return usuarioDto(u);
});

route('PUT', '/funcionarios/:id', (req, [id]) => {
  requireUser(req, 'gerente');
  const u = db.usuario_painel.find(x => x.id_usuario === +id);
  if (!u) throw new ApiError(404, 'Funcionário não encontrado.');
  validateFuncionario(req.body, u.id_usuario);
  Object.assign(u, { nome: req.body.nome.trim(), email: req.body.email, papel: req.body.papel, ativo: req.body.ativo === false ? 0 : 1 });
  if (req.body.senha) u.senha_mock = req.body.senha;
  return usuarioDto(u);
});

route('PATCH', '/funcionarios/:id/ativo', (req, [id]) => {
  const me = requireUser(req, 'gerente');
  const u = db.usuario_painel.find(x => x.id_usuario === +id);
  if (!u) throw new ApiError(404, 'Funcionário não encontrado.');
  if (u.id_usuario === me.id_usuario && !req.body?.ativo) throw new ApiError(409, 'Você não pode desativar o próprio usuário.');
  u.ativo = req.body?.ativo ? 1 : 0;
  return usuarioDto(u);
});

route('GET', '/recomendacoes', req => {
  const ids = (req.params.get('produtos') ?? '').split(',').map(Number).filter(Boolean);
  const limite = Number(req.params.get('limite') ?? 4);
  const score = new Map<number, number>();
  const add = (id: number, pts: number) => { if (!ids.includes(id)) score.set(id, (score.get(id) ?? 0) + pts); };

  // 1) vw_comprados_juntos: quem comprou X também levou Y (pedidos não cancelados)
  const validos = new Set(db.pedido.filter(p => p.status !== 'cancelado').map(p => p.id_pedido));
  const pedidosComX = new Set(db.item_pedido.filter(i => ids.includes(i.id_produto) && validos.has(i.id_pedido)).map(i => i.id_pedido));
  db.item_pedido.filter(i => pedidosComX.has(i.id_pedido)).forEach(i => add(i.id_produto, 10));
  // 2) produto_relacionado (cadastro manual)
  db.produto_relacionado.filter(r => ids.includes(r.id_produto)).forEach(r => add(r.id_produto_relacionado, 5));

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => db.produto.find(p => p.id_produto === id))
    .filter((p): p is Produto => !!p && p.disponivel !== 0 && p.estoque > 0)
    .slice(0, limite)
    .map(produtoDto);
});

route('GET', '/relatorios/resumo', req => {
  requireUser(req, 'gerente');
  const all = inPeriod(req);
  const validos = all.filter(p => p.status !== 'cancelado');
  const faturamento = money(validos.reduce((s, p) => s + p.valor_total, 0));
  return { faturamento, totalPedidos: all.length,
           pedidosEntregues: all.filter(p => p.status === 'entregue').length,
           pedidosCancelados: all.length - validos.length,
           ticketMedio: validos.length ? money(faturamento / validos.length) : 0 };
});

route('GET', '/relatorios/faturamento-diario', req => {
  requireUser(req, 'gerente');
  const map = new Map<string, { pedidos: number; faturamento: number }>();
  inPeriod(req).filter(p => p.status !== 'cancelado').forEach(p => {
    const dia = p.data_criacao.slice(0, 10);
    const v = map.get(dia) ?? { pedidos: 0, faturamento: 0 };
    map.set(dia, { pedidos: v.pedidos + 1, faturamento: money(v.faturamento + p.valor_total) });
  });
  return [...map.entries()].sort().map(([dia, v]) => ({ dia, ...v }));
});

route('GET', '/relatorios/pedidos-por-status', req => {
  requireUser(req, 'gerente');
  const map = new Map<string, number>();
  inPeriod(req).forEach(p => map.set(p.status, (map.get(p.status) ?? 0) + 1));
  return [...map.entries()].map(([status, pedidos]) => ({ status, pedidos }));
});

route('GET', '/relatorios/mais-vendidos', req => {
  requireUser(req, 'gerente');
  const ids = new Set(inPeriod(req).filter(p => p.status !== 'cancelado').map(p => p.id_pedido));
  const map = new Map<number, { unidadesVendidas: number; receita: number }>();
  db.item_pedido.filter(i => ids.has(i.id_pedido)).forEach(i => {
    const v = map.get(i.id_produto) ?? { unidadesVendidas: 0, receita: 0 };
    map.set(i.id_produto, { unidadesVendidas: v.unidadesVendidas + i.quantidade, receita: money(v.receita + i.quantidade * i.preco_unitario) });
  });
  return [...map.entries()]
    .map(([idProduto, v]) => { const p = produtoDto(db.produto.find(x => x.id_produto === idProduto)!); return { idProduto, nome: p.nome, categoria: p.categoria, ...v }; })
    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
    .slice(0, Number(req.params.get('limite') ?? 5));
});

route('GET', '/relatorios/formas-pagamento', req => {
  requireUser(req, 'gerente');
  const ids = new Set(inPeriod(req).filter(p => p.status !== 'cancelado').map(p => p.id_pedido));
  const map = new Map<string, { pedidos: number; valor: number }>();
  db.pagamento.filter(pg => ids.has(pg.id_pedido)).forEach(pg => {
    const v = map.get(pg.forma) ?? { pedidos: 0, valor: 0 };
    map.set(pg.forma, { pedidos: v.pedidos + 1, valor: money(v.valor + pg.valor) });
  });
  return [...map.entries()].map(([forma, v]) => ({ forma, ...v })).sort((a, b) => b.pedidos - a.pedidos);
});

route('GET', '/relatorios/pedidos-por-hora', req => {
  requireUser(req, 'gerente');
  const map = new Map<number, number>();
  inPeriod(req).forEach(p => { const h = Number(p.data_criacao.slice(11, 13)); map.set(h, (map.get(h) ?? 0) + 1); });
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([hora, pedidos]) => ({ hora, pedidos }));
});

route('GET', '/relatorios/estoque-baixo', req => {
  requireUser(req, 'gerente');
  return db.produto.filter(p => p.disponivel !== 0 && p.estoque <= 10)
    .sort((a, b) => a.estoque - b.estoque)
    .map(p => ({ idProduto: p.id_produto, nome: p.nome, estoque: p.estoque }));
});

// ── Interceptor ─────────────────────────────────────────────
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock || !req.url.startsWith(environment.apiUrl)) return next(req);

  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  const found = routes
    .filter(([method]) => method === req.method)
    .map(([, re, h]) => [re.exec(path), h] as const)
    .find(([m]) => m);

  const latency = 120 + Math.random() * 180;
  const fail = (status: number, mensagem: string) =>
    timer(latency).pipe(mergeMap(() => throwError(() =>
      new HttpErrorResponse({ status, error: { mensagem }, url: req.url, statusText: mensagem }))));

  if (!found) return fail(404, `[mock] rota não existe: ${req.method} ${path}`);

  try {
    const [match, handler] = found;
    const body = handler(req, match!.slice(1));
    if (req.method !== 'GET') save();
    const status = req.method === 'POST' && body !== null ? 201 : body === null ? 204 : 200;
    return timer(latency).pipe(mergeMap(() => of(new HttpResponse({ status, body, url: req.url }))));
  } catch (e) {
    if (e instanceof ApiError) return fail(e.status, e.mensagem);
    console.error('[mock] erro interno', e);
    return fail(500, 'Erro interno no mock.');
  }
};
