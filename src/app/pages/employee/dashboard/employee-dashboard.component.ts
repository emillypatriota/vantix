import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { OrdersService } from '../../../services/orders.service';
import { Order, OrderStatus, STATUS_CONFIG } from '../../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, CurrencyPipe, RouterLink],
  template: `
    <div style="max-width:1280px;margin:0 auto;padding:0 1.5rem">

      <!-- Page header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem" class="animate-fade-up">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary);margin-bottom:.25rem">
            Dashboard
          </h1>
          <p style="color:var(--text-tertiary);font-size:var(--text-base)">
            Visão geral em tempo real de toda a operação
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <span class="online-badge">
            <span class="dot"></span>
            Atualização automática
          </span>
          <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-family:var(--font-mono)">
            {{ now | date:'HH:mm:ss' }}
          </span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4 stagger" style="margin-bottom:2rem">

        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--neutral-bg);color:var(--neutral-text)">⏳</div>
          <div class="kpi-label">Aguardando</div>
          <div class="kpi-value">{{ kpis.pending }}</div>
          <div class="kpi-trend flat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
            Novos pedidos
          </div>
          <div class="kpi-accent" style="background:var(--neutral)"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--warning-bg);color:var(--warning-text)">📦</div>
          <div class="kpi-label">Em separação</div>
          <div class="kpi-value">{{ kpis.preparing }}</div>
          <div class="kpi-trend" [class.up]="kpis.preparing > 0" [class.flat]="kpis.preparing === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            No estoque agora
          </div>
          <div class="kpi-accent" style="background:var(--warning)"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--success-bg);color:var(--success-text)">🚴</div>
          <div class="kpi-label">Em Entrega</div>
          <div class="kpi-value">{{ kpis.delivering }}</div>
          <div class="kpi-trend up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Pedidos a caminho
          </div>
          <div class="kpi-accent" style="background:var(--success)"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(58,111,240,.12);color:var(--brand-400)">💰</div>
          <div class="kpi-label">Faturamento do Dia</div>
          <div class="kpi-value" style="font-size:1.6rem">{{ kpis.revenue | currency:'BRL':'symbol':'1.2-2' }}</div>
          <div class="kpi-trend up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            {{ kpis.delivered }} entregues hoje
          </div>
          <div class="kpi-accent" style="background:var(--brand-600)"></div>
        </div>

      </div>

      <!-- Mini chart: pedidos por hora -->
      <div class="card" style="margin-bottom:2rem">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h2 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Pedidos por Hora — Hoje</h2>
            <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">Atualização automática em tempo real</p>
          </div>
          <a routerLink="/gerente/insights" style="font-size:var(--text-xs);color:var(--brand-400);text-decoration:none;font-weight:500">
            Ver analytics completo →
          </a>
        </div>
        <div class="card-body" style="padding-top:0">
          <div style="position:relative;height:160px">
            <canvas #ordersChart></canvas>
          </div>
        </div>
      </div>

      <!-- Body grid: orders table + quick stats -->
      <div style="display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:start" class="dash-grid">

        <!-- Orders table -->
        <div class="card">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <h2 style="font-family:var(--font-display);font-size:1.25rem;color:var(--text-primary)">Pedidos Recentes</h2>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">{{ orders.length }} pedido{{ orders.length !== 1 ? 's' : '' }} no total</p>
            </div>
            <div style="display:flex;align-items:center;gap:.5rem">
              <button class="btn btn-ghost btn-sm" (click)="filterAll()" [style.color]="activeFilter === 'all' ? 'var(--brand-400)' : ''">Todos</button>
              <button class="btn btn-ghost btn-sm" (click)="filterActive()" [style.color]="activeFilter === 'active' ? 'var(--brand-400)' : ''">Ativos</button>
            </div>
          </div>
          <div style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>PEDIDO</th>
                  <th>CLIENTE</th>
                  <th>HORÁRIO</th>
                  <th>ITENS</th>
                  <th>PAGAMENTO</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of filteredOrders; trackBy: trackById">
                  <td>
                    <span class="order-number">#{{ o.orderNumber }}</span>
                  </td>
                  <td>
                    <div style="font-weight:600;color:var(--text-primary);font-size:var(--text-base)">{{ o.customer.name }}</div>
                    <div style="font-size:var(--text-xs);color:var(--text-tertiary)">{{ o.customer.phone }}</div>
                  </td>
                  <td style="color:var(--text-secondary);font-size:var(--text-sm);font-family:var(--font-mono)">
                    {{ o.createdAt | date:'HH:mm' }}
                  </td>
                  <td style="color:var(--text-secondary);font-size:var(--text-sm)">
                    {{ o.items.length }} {{ o.items.length === 1 ? 'item' : 'itens' }}
                  </td>
                  <td>
                    <span class="chip">{{ paymentLabel(o.paymentMethod) }}</span>
                  </td>
                  <td>
                    <span style="font-family:var(--font-display);font-weight:600;color:var(--text-primary)">
                      {{ o.total | currency:'BRL':'symbol':'1.2-2' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class]="statusCfg(o).cssClass"
                          [style.background]="statusCfg(o).bg" [style.color]="statusCfg(o).color"
                          [style.border-color]="statusCfg(o).border">
                      <span class="badge-dot"></span>
                      {{ statusCfg(o).label }}
                    </span>
                  </td>
                  <td>
                    <button *ngIf="nextStatus(o)"
                            class="btn btn-sm"
                            [style.background]="nextBtnBg(o)"
                            [style.color]="nextBtnColor(o)"
                            [style.border]="'1px solid ' + nextBtnBorder(o)"
                            (click)="advance(o)"
                            style="font-size:.72rem;font-weight:600;white-space:nowrap">
                      {{ nextLabel(o) }}
                    </button>
                    <span *ngIf="!nextStatus(o)" style="color:var(--text-tertiary);font-size:var(--text-xs)">—</span>
                  </td>
                </tr>
                <tr *ngIf="filteredOrders.length === 0">
                  <td colspan="8">
                    <div class="empty-state" style="padding:3rem">
                      <div class="empty-icon">📋</div>
                      <h3>Nenhum pedido encontrado</h3>
                      <p>Os pedidos aparecerão aqui em tempo real</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right sidebar: quick info -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">

          <!-- Status breakdown -->
          <div class="card card-body">
            <h3 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary);margin-bottom:1.25rem">
              Status dos Pedidos
            </h3>
            <div style="display:flex;flex-direction:column;gap:.875rem">
              <div *ngFor="let s of statusBreakdown">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.375rem">
                  <span style="font-size:var(--text-sm);color:var(--text-secondary)">{{ s.label }}</span>
                  <span style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary)">{{ s.count }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width]="s.pct + '%'" [style.background]="s.color"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top items -->
          <div class="card card-body">
            <h3 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary);margin-bottom:1.25rem">
              Mais Vendidos
            </h3>
            <div style="display:flex;flex-direction:column;gap:.875rem">
              <div *ngFor="let item of topItems; let i = index"
                   style="display:flex;align-items:center;gap:.75rem">
                <div style="width:24px;height:24px;border-radius:var(--r-md);background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--text-tertiary);flex-shrink:0">
                  {{ i + 1 }}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:var(--text-sm);font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.name }}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-tertiary)">{{ item.qty }} unidades</div>
                </div>
                <div style="font-size:var(--text-sm);font-weight:600;color:var(--brand-400);white-space:nowrap">
                  {{ item.revenue | currency:'BRL':'symbol':'1.2-2' }}
                </div>
              </div>
              <div *ngIf="topItems.length === 0" style="text-align:center;color:var(--text-tertiary);font-size:var(--text-sm);padding:.5rem 0">
                Aguardando pedidos
              </div>
            </div>
          </div>

          <!-- Quick navigate -->
          <div class="card card-body">
            <h3 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary);margin-bottom:1rem">
              Acesso Rápido
            </h3>
            <div style="display:flex;flex-direction:column;gap:.5rem">
              <a routerLink="/gerente/produtos"
                 style="display:flex;align-items:center;gap:.75rem;padding:.625rem .75rem;border-radius:var(--r-lg);border:1px solid var(--border);text-decoration:none;transition:all var(--transition-fast)"
                 onmouseenter="this.style.borderColor='var(--border-brand)';this.style.background='var(--bg-selected)'"
                 onmouseleave="this.style.borderColor='';this.style.background=''">
                <span style="font-size:1rem">🏷️</span>
                <span style="font-size:var(--text-sm);font-weight:500;color:var(--text-secondary)">Gerenciar produtos</span>
              </a>
              <a routerLink="/gerente/estoque"
                 style="display:flex;align-items:center;gap:.75rem;padding:.625rem .75rem;border-radius:var(--r-lg);border:1px solid var(--border);text-decoration:none;transition:all var(--transition-fast)"
                 onmouseenter="this.style.borderColor='var(--border-brand)';this.style.background='var(--bg-selected)'"
                 onmouseleave="this.style.borderColor='';this.style.background=''">
                <span style="font-size:1rem">📦</span>
                <span style="font-size:var(--text-sm);font-weight:500;color:var(--text-secondary)">Separação de pedidos</span>
              </a>
              <a routerLink="/gerente/insights"
                 style="display:flex;align-items:center;gap:.75rem;padding:.625rem .75rem;border-radius:var(--r-lg);border:1px solid var(--border);text-decoration:none;transition:all var(--transition-fast)"
                 onmouseenter="this.style.borderColor='var(--border-brand)';this.style.background='var(--bg-selected)'"
                 onmouseleave="this.style.borderColor='';this.style.background=''">
                <span style="font-size:1rem">📈</span>
                <span style="font-size:var(--text-sm);font-weight:500;color:var(--text-secondary)">Analytics</span>
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    @media (max-width: 1024px) { .dash-grid { grid-template-columns: 1fr !important; } }
  `]
})
export class EmployeeDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ordersChart') ordersChartRef!: ElementRef<HTMLCanvasElement>;

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  activeFilter: 'all' | 'active' = 'all';
  now = new Date();
  private clockInterval?: ReturnType<typeof setInterval>;
  private sub?: Subscription;
  private ordersChart?: Chart;
  private viewReady = false;

  private readonly flow: Record<string, OrderStatus | null> = {
    pending:    'preparing',
    confirmed:  'preparing',
    preparing:  'ready',
    ready:      'delivering',
    delivering: 'delivered',
    delivered:  null,
    cancelled:  null,
  };

  private readonly nextLabels: Record<string, string> = {
    pending:    'Aprovar pagamento',
    confirmed:  'Iniciar separação',
    preparing:  'Pronto p/ envio',
    ready:      'Despachar',
    delivering: 'Entregue',
  };

  constructor(private ordersService: OrdersService) {}

  ngOnInit() {
    this.sub = this.ordersService.orders.subscribe({
      next: orders => {
        this.orders = orders;
        this.applyFilter();
        if (this.viewReady) this.updateOrdersChart();
      },
      error: err => console.error('[Dashboard] orders error:', err),
    });
    this.clockInterval = setInterval(() => this.now = new Date(), 1000);
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.buildOrdersChart();
    if (this.orders.length) this.updateOrdersChart();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    clearInterval(this.clockInterval);
    this.ordersChart?.destroy();
  }

  private buildOrdersChart() {
    this.ordersChart = new Chart(this.ordersChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: 'rgba(58,111,240,.2)',
          borderColor: 'rgba(58,111,240,1)',
          borderWidth: 1.5,
          borderRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: 'rgba(255,255,255,.45)', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: 'rgba(255,255,255,.45)', font: { size: 11 }, stepSize: 1 } },
        },
      } as any,
    });
  }

  private updateOrdersChart() {
    if (!this.ordersChart) return;
    const today = new Date().toDateString();
    const map = new Map<number, number>();
    for (const o of this.orders) {
      if (new Date(o.createdAt).toDateString() !== today) continue;
      const h = new Date(o.createdAt).getHours();
      map.set(h, (map.get(h) ?? 0) + 1);
    }
    const now = new Date().getHours();
    const labels: string[] = [];
    const values: number[] = [];
    for (let h = Math.max(0, now - 11); h <= now; h++) {
      labels.push(`${String(h).padStart(2, '0')}h`);
      values.push(map.get(h) ?? 0);
    }
    this.ordersChart.data.labels = labels;
    this.ordersChart.data.datasets[0].data = values;
    this.ordersChart.update('none');
  }

  filterAll()    { this.activeFilter = 'all';    this.applyFilter(); }
  filterActive() { this.activeFilter = 'active'; this.applyFilter(); }

  private applyFilter() {
    if (this.activeFilter === 'active') {
      this.filteredOrders = this.orders.filter(o =>
        !['delivered', 'cancelled'].includes(o.status)
      );
    } else {
      this.filteredOrders = this.orders;
    }
  }

  get kpis() {
    const today = new Date().toDateString();
    const todayOrders = this.orders.filter(o => new Date(o.createdAt).toDateString() === today);
    return {
      pending:    this.orders.filter(o => o.status === 'pending').length,
      preparing:  this.orders.filter(o => o.status === 'preparing').length,
      delivering: this.orders.filter(o => o.status === 'delivering').length,
      delivered:  this.orders.filter(o => o.status === 'delivered').length,
      revenue:    todayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
    };
  }

  get statusBreakdown() {
    const total = this.orders.length || 1;
    return [
      { label: 'Aguardando',  count: this.orders.filter(o => o.status === 'pending').length,    color: 'var(--neutral)',  pct: 0 },
      { label: 'Em separação', count: this.orders.filter(o => o.status === 'preparing').length,  color: 'var(--warning)',  pct: 0 },
      { label: 'Em Entrega',  count: this.orders.filter(o => o.status === 'delivering').length, color: 'var(--success)',  pct: 0 },
      { label: 'Entregues',   count: this.orders.filter(o => o.status === 'delivered').length,  color: 'var(--brand-500)', pct: 0 },
    ].map(s => ({ ...s, pct: Math.round((s.count / total) * 100) }));
  }

  get topItems(): { name: string; qty: number; revenue: number }[] {
    const map = new Map<string, { qty: number; revenue: number }>();
    for (const order of this.orders) {
      for (const item of order.items) {
        const prev = map.get(item.name) ?? { qty: 0, revenue: 0 };
        map.set(item.name, {
          qty:     prev.qty + item.quantity,
          revenue: prev.revenue + item.price * item.quantity,
        });
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }

  trackById(_: number, o: Order) { return o.id; }
  statusCfg(o: Order)           { return STATUS_CONFIG[o.status]; }
  nextStatus(o: Order)          { return this.flow[o.status] ?? null; }
  nextLabel(o: Order)           { return this.nextLabels[o.status] ?? ''; }
  paymentLabel(m: string)       {
    const map: Record<string, string> = { credit: 'Crédito', debit: 'Débito', pix: 'PIX', boleto: 'Boleto' };
    return map[m] ?? m;
  }

  nextBtnBg(o: Order)     { const s = this.nextStatus(o); return s === 'preparing' ? 'var(--warning-bg)' : s === 'delivering' ? 'var(--success-bg)' : 'var(--info-bg)'; }
  nextBtnColor(o: Order)  { const s = this.nextStatus(o); return s === 'preparing' ? 'var(--warning-text)' : s === 'delivering' ? 'var(--success-text)' : 'var(--info-text)'; }
  nextBtnBorder(o: Order) { const s = this.nextStatus(o); return s === 'preparing' ? 'var(--warning-border)' : s === 'delivering' ? 'var(--success-border)' : 'var(--info-border)'; }

  async advance(o: Order) {
    const next = this.nextStatus(o);
    if (!next) return;
    try {
      await this.ordersService.updateStatus(o.id, next);
    } catch (err) {
      console.error('[Dashboard] advance error:', err);
    }
  }
}
