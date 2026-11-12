import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  EMPTY, Observable, Subject, catchError, firstValueFrom, map, merge, shareReplay, switchMap, tap, timer,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem, Customer, Order, OrderStatus, PaymentMethod } from '../models';
import { MudarStatusRequest, NovoPedidoRequest, PedidoApi } from '../core/api/api.types';
import { orderFromApi, paymentToApi, statusToApi } from '../core/api/mappers';

export interface NewOrderData {
  items: CartItem[];
  customer: Customer & { email: string };
  payment: { method: PaymentMethod; installments: number };
  observations?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pedidos`;

  private _orders = signal<Order[]>([]);
  readonly orders$ = this._orders.asReadonly();

  /** Força uma atualização imediata (após mudar status, por exemplo). */
  private refresh$ = new Subject<void>();

  /**
   * Lista de pedidos para os painéis (exige login).
   * Substitui o onSnapshot do Firebase: consulta a API a cada `pollingMs` e
   * compartilha uma única consulta entre todos os componentes inscritos.
   */
  readonly orders: Observable<Order[]> = merge(timer(0, environment.pollingMs), this.refresh$).pipe(
    switchMap(() => this.http.get<PedidoApi[]>(this.base).pipe(
      catchError(err => { console.error('[OrdersService] erro ao buscar pedidos:', err); return EMPTY; }),
    )),
    map(list => list.map(orderFromApi).sort((a, b) => +b.createdAt - +a.createdAt)),
    tap(list => this._orders.set(list)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getOrders(): Order[] { return this._orders(); }

  /** Pedidos de um cliente (público, sem login) — tela "Meus pedidos". */
  customerOrders(phone: string): Observable<Order[]> {
    const params = new HttpParams().set('telefone', phone);
    return timer(0, environment.pollingMs).pipe(
      switchMap(() => this.http.get<PedidoApi[]>(`${this.base}/cliente`, { params }).pipe(
        catchError(err => { console.error('[OrdersService] erro ao buscar meus pedidos:', err); return EMPTY; }),
      )),
      map(list => list.map(orderFromApi).sort((a, b) => +b.createdAt - +a.createdAt)),
    );
  }

  /** Busca os pedidos de um cliente uma única vez (sem polling). Lança erro se a API falhar. */
  async fetchCustomerOrders(phone: string): Promise<Order[]> {
    const params = new HttpParams().set('telefone', phone);
    const list = await firstValueFrom(this.http.get<PedidoApi[]>(`${this.base}/cliente`, { params }));
    return list.map(orderFromApi).sort((a, b) => +b.createdAt - +a.createdAt);
  }

  /**
   * Cria o pedido. Preço, frete, total e número são calculados pela API;
   * se faltar estoque a API responde 409 com { mensagem }.
   */
  async addOrder(data: NewOrderData): Promise<Order> {
    const body: NovoPedidoRequest = {
      cliente: {
        nome:     data.customer.name,
        email:    data.customer.email,
        telefone: data.customer.phone,
        endereco: data.customer.address,
      },
      itens:       data.items.map(i => ({ idProduto: Number(i.id), quantidade: i.quantity })),
      pagamento:   { forma: paymentToApi(data.payment.method), parcelas: data.payment.installments },
      tipoEntrega: 'entrega',
      observacoes: data.observations?.trim() || null,
    };
    const created = await firstValueFrom(this.http.post<PedidoApi>(this.base, body));
    return orderFromApi(created);
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    extra: { cancelReason?: string; deliveryPersonId?: string } = {},
  ): Promise<void> {
    const body: MudarStatusRequest = { status: statusToApi(status) };
    if (extra.cancelReason)     body.motivoCancelamento = extra.cancelReason;
    if (extra.deliveryPersonId) body.idEntregador = Number(extra.deliveryPersonId);
    await firstValueFrom(this.http.patch(`${this.base}/${orderId}/status`, body));
    this.refresh$.next();
  }
}
