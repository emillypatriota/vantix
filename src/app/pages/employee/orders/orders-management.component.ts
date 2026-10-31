import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../../services/orders.service';
import { Order, OrderStatus, STATUS_CONFIG } from '../../../models';

const TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Todos',      value: 'all' },
  { label: 'Aguardando', value: 'pending' },
  { label: 'Em separação', value: 'preparing' },
  { label: 'Prontos',    value: 'ready' },
  { label: 'A Caminho',  value: 'delivering' },
  { label: 'Entregues',  value: 'delivered' },
  { label: 'Cancelados', value: 'cancelled' },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:    'preparing',
  confirmed:  'preparing',
  preparing:  'ready',
  ready:      'delivering',
  delivering: 'delivered',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:    'Aprovar pagamento',
  confirmed:  'Iniciar separação',
  preparing:  'Pronto para envio',
  ready:      'Despachar',
  delivering: 'Marcar Entregue',
};

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  template: `
    <div style="padding:2rem 2rem 4rem">

      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.75rem">
        <div>
          <h1 style="font-family:var(--font-serif);font-size:1.875rem;color:var(--text-primary)">Gestão de Pedidos</h1>
          <p style="font-size:.82rem;color:var(--text-muted);margin-top:.25rem">Atualizações em tempo real via Firebase</p>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-full);padding:.5rem 1rem;font-size:.78rem;color:var(--text-muted)">
          <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite"></span>
          {{ allOrders().length }} pedidos carregados
        </div>
      </div>

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.875rem;margin-bottom:1.75rem">
        <div *ngFor="let kpi of kpis()" style="background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-xl);padding:1rem 1.125rem">
          <p style="font-size:.68rem;font-weight:600;letter-spacing:.1em;color:var(--text-muted);margin-bottom:.375rem">{{ kpi.label }}</p>
          <p style="font-size:1.75rem;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums">{{ kpi.value }}</p>
        </div>
      </div>

      <!-- Search + Filters -->
      <div style="display:flex;gap:.875rem;flex-wrap:wrap;margin-bottom:1.25rem">
        <div style="position:relative;flex:1;min-width:200px">
          <svg style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);color:var(--text-muted)" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Buscar por nº do pedido ou cliente..."
            [value]="search()" (input)="search.set($any($event.target).value)"
            style="width:100%;padding:.625rem .875rem .625rem 2.375rem;background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-primary);font-size:.82rem;outline:none">
        </div>
      </div>

      <!-- Status tabs -->
      <div style="display:flex;gap:.25rem;overflow-x:auto;margin-bottom:1.5rem;padding-bottom:.25rem;scrollbar-width:none">
        <button *ngFor="let tab of tabs"
          (click)="activeTab.set(tab.value)"
          [style.background]="activeTab()===tab.value ? 'var(--brand-600)' : 'var(--surface-1)'"
          [style.color]="activeTab()===tab.value ? '#fff' : 'var(--text-muted)'"
          [style.borderColor]="activeTab()===tab.value ? 'var(--brand-600)' : 'var(--border)'"
          style="padding:.5rem 1rem;border-radius:var(--r-full);font-size:.78rem;font-weight:500;white-space:nowrap;border:1px solid;transition:all .15s;cursor:pointer;flex-shrink:0">
          {{ tab.label }}
          <span *ngIf="countByStatus(tab.value) > 0"
            style="margin-left:.375rem;background:rgba(255,255,255,.2);padding:.05rem .4rem;border-radius:var(--r-full);font-size:.7rem">
            {{ countByStatus(tab.value) }}
          </span>
        </button>
      </div>

      <!-- Empty state -->
      <div *ngIf="filtered().length === 0" style="text-align:center;padding:4rem 2rem;background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-2xl)">
        <div style="font-size:3rem;margin-bottom:1rem">📋</div>
        <p style="color:var(--text-muted);font-size:.9rem">Nenhum pedido encontrado</p>
      </div>

      <!-- Orders list -->
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div *ngFor="let order of filtered()" class="order-card"
             style="background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;transition:box-shadow .2s">

          <!-- Top color bar -->
          <div style="height:3px" [style.background]="cfg(order.status).color"></div>

          <div style="padding:1.25rem 1.375rem">
            <!-- Header row -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1rem">
              <div style="display:flex;align-items:center;gap:.875rem;flex-wrap:wrap">
                <span style="font-family:monospace;font-size:.9rem;font-weight:700;color:var(--text-primary)">#{{ order.orderNumber }}</span>
                <span class="status-pill"
                  [style.background]="cfg(order.status).bg"
                  [style.color]="cfg(order.status).color"
                  [style.borderColor]="cfg(order.status).border">
                  {{ cfg(order.status).label }}
                </span>
                <span style="font-size:.75rem;color:var(--text-muted)">{{ order.createdAt | date:'dd/MM HH:mm' }}</span>
              </div>
              <div style="text-align:right">
                <p style="font-family:var(--font-serif);font-size:1.375rem;color:var(--text-primary)">R$ {{ order.total.toFixed(2) }}</p>
                <p style="font-size:.72rem;color:var(--text-muted)">{{ order.paymentMethod }}</p>
              </div>
            </div>

            <!-- Customer info -->
            <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.875rem;font-size:.82rem;color:var(--text-secondary)">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
              <span>{{ order.customer.name }}</span>
              <span style="color:var(--text-muted)">·</span>
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
              <span>{{ order.customer.phone }}</span>
            </div>

            <!-- Items -->
            <div style="background:var(--surface-2,rgba(255,255,255,.03));border-radius:var(--r-lg);padding:.75rem 1rem;margin-bottom:1rem">
              <div *ngFor="let item of order.items" style="display:flex;align-items:center;gap:.625rem;padding:.3rem 0">
                <img [src]="item.image" [alt]="item.name" style="width:2rem;height:2rem;border-radius:5px;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">
                <span style="font-size:.82rem;color:var(--text-secondary);flex:1">{{ item.quantity }}× {{ item.name }}</span>
                <span style="font-size:.8rem;font-weight:500;color:var(--text-primary)">R$ {{ (item.price*item.quantity).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Address + obs -->
            <div style="display:flex;gap:.5rem;align-items:flex-start;font-size:.78rem;color:var(--text-muted);margin-bottom:.875rem">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{{ order.customer.address }}</span>
            </div>
            <div *ngIf="order.observations" style="background:#eef4ff;border:1px solid #bfd2fd;border-radius:var(--r-md);padding:.5rem .75rem;font-size:.78rem;color:#173d8c;margin-bottom:.875rem">
              📝 {{ order.observations }}
            </div>

            <!-- Actions -->
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.625rem">
              <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                <button *ngIf="nextStatus(order.status)"
                  (click)="advance(order)"
                  [disabled]="updating === order.id"
                  style="padding:.5rem 1rem;background:var(--brand-600);color:#fff;border:none;border-radius:var(--r-lg);font-size:.78rem;font-weight:600;cursor:pointer;transition:opacity .15s"
                  [style.opacity]="updating === order.id ? '.6' : '1'">
                  {{ updating === order.id ? 'Atualizando...' : nextLabel(order.status) }}
                </button>
                <button *ngIf="order.status !== 'cancelled' && order.status !== 'delivered'"
                  (click)="cancel(order)"
                  style="padding:.5rem 1rem;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:var(--r-lg);font-size:.78rem;cursor:pointer;transition:all .15s"
                  onmouseenter="this.style.color='#ef4444';this.style.borderColor='#ef4444'"
                  onmouseleave="this.style.color='';this.style.borderColor=''">
                  Cancelar
                </button>
              </div>
              <span style="font-size:.7rem;color:var(--text-muted)">
                {{ order.estimatedTime ? '⏱ ' + order.estimatedTime + ' min' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); }
    .status-pill {
      padding:.2rem .65rem; border-radius: var(--r-full);
      font-size: .7rem; font-weight: 600; border: 1px solid;
    }
  `]
})
export class OrdersManagementComponent implements OnInit, OnDestroy {
  tabs = TABS;
  activeTab = signal<OrderStatus | 'all'>('all');
  search = signal('');
  updating: string | null = null;

  allOrders = signal<Order[]>([]);
  private sub?: Subscription;

  kpis = computed(() => {
    const orders = this.allOrders();
    const today = new Date();
    const todayOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.toDateString() === today.toDateString();
    });
    const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
    return [
      { label: 'HOJE',      value: todayOrders.length },
      { label: 'PENDENTES', value: orders.filter(o => o.status === 'pending').length },
      { label: 'PREPARANDO',value: orders.filter(o => o.status === 'preparing').length },
      { label: 'PRONTOS',   value: orders.filter(o => o.status === 'ready').length },
      { label: 'FATURAMENTO', value: `R$ ${revenue.toFixed(0)}` },
    ];
  });

  filtered = computed(() => {
    let list = this.allOrders();
    if (this.activeTab() !== 'all') list = list.filter(o => o.status === this.activeTab());
    const q = this.search().toLowerCase().trim();
    if (q) list = list.filter(o =>
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q)
    );
    return list;
  });

  constructor(private ordersService: OrdersService) {}

  ngOnInit() {
    this.sub = this.ordersService.orders.subscribe({
      next: orders => this.allOrders.set(orders),
      error: err => console.error('[OrdersManagement] orders error:', err),
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cfg(status: string) { return STATUS_CONFIG[status as OrderStatus] ?? STATUS_CONFIG['pending']; }
  nextStatus(status: string): OrderStatus | undefined { return NEXT_STATUS[status as OrderStatus]; }
  nextLabel(status: string): string { return NEXT_LABEL[status as OrderStatus] ?? ''; }

  countByStatus(tab: OrderStatus | 'all'): number {
    if (tab === 'all') return this.allOrders().length;
    return this.allOrders().filter(o => o.status === tab).length;
  }

  async advance(order: Order) {
    const next = this.nextStatus(order.status);
    if (!next || this.updating) return;
    this.updating = order.id;
    try { await this.ordersService.updateStatus(order.id, next); }
    finally { this.updating = null; }
  }

  async cancel(order: Order) {
    if (this.updating) return;
    this.updating = order.id;
    try { await this.ordersService.updateStatus(order.id, 'cancelled'); }
    finally { this.updating = null; }
  }
}
