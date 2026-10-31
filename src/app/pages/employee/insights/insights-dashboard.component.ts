import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, NgZone
} from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { OrdersService } from '../../../services/orders.service';
import { Order } from '../../../models';

Chart.register(...registerables);

const CHART_COLORS = {
  amber:   'rgba(58,111,240,1)',    // cor da marca (nome legado)
  amberBg: 'rgba(58,111,240,.15)',
  warning: 'rgba(245,158,11,1)',
  green:   'rgba(34,197,94,1)',
  greenBg: 'rgba(34,197,94,.15)',
  blue:    'rgba(99,102,241,1)',
  blueBg:  'rgba(99,102,241,.15)',
  red:     'rgba(239,68,68,1)',
  redBg:   'rgba(239,68,68,.15)',
  gray:    'rgba(100,116,139,1)',
  grayBg:  'rgba(100,116,139,.15)',
  purple:  'rgba(139,92,246,1)',
  purpleBg:'rgba(139,92,246,.15)',
  grid:    'rgba(255,255,255,.06)',
  text:    'rgba(255,255,255,.5)',
};

@Component({
  selector: 'app-insights-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  template: `
    <div style="max-width:1280px;margin:0 auto;padding:0 1.5rem 2rem">

      <!-- Header -->
      <div style="margin-bottom:2rem" class="animate-fade-up">
        <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary);margin-bottom:.25rem">
          Insights & Analytics
        </h1>
        <p style="color:var(--text-tertiary);font-size:var(--text-base)">
          Análise de desempenho em tempo real — {{ orders.length }} pedidos no banco
        </p>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4 stagger" style="margin-bottom:2rem">

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(58,111,240,.12);color:var(--brand-400)">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div class="kpi-label">Faturamento Total</div>
          <div class="kpi-value" style="font-size:1.55rem">{{ revenue | currency:'BRL':'symbol':'1.2-2' }}</div>
          <div class="kpi-trend up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            Receita acumulada
          </div>
          <div class="kpi-accent" style="background:var(--brand-600)"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(99,102,241,.12);color:#818cf8">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div class="kpi-label">Total de Pedidos</div>
          <div class="kpi-value">{{ orders.length }}</div>
          <div class="kpi-trend up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            {{ deliveredCount }} entregues
          </div>
          <div class="kpi-accent" style="background:#6366f1"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(34,197,94,.12);color:#4ade80">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="kpi-label">Taxa de Conclusão</div>
          <div class="kpi-value">{{ completionRate }}%</div>
          <div class="kpi-trend" [class.up]="completionRate >= 80" [class.flat]="completionRate < 80">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            {{ deliveredCount }} / {{ orders.length }} pedidos
          </div>
          <div class="kpi-accent" style="background:#22c55e"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(139,92,246,.12);color:#a78bfa">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="kpi-label">Ticket Médio</div>
          <div class="kpi-value" style="font-size:1.55rem">{{ avgTicket | currency:'BRL':'symbol':'1.2-2' }}</div>
          <div class="kpi-trend up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Por pedido
          </div>
          <div class="kpi-accent" style="background:#8b5cf6"></div>
        </div>

      </div>

      <!-- Charts row 1: Revenue Line + Status Donut -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem" class="chart-grid-main">

        <!-- Revenue line chart -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Faturamento por Hora</h3>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">Pedidos de hoje · atualização em tempo real</p>
            </div>
            <div style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;color:var(--brand-400)">
              {{ todayRevenue | currency:'BRL':'symbol':'1.0-0' }}
            </div>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:220px">
              <canvas #revenueChart></canvas>
              <div *ngIf="orders.length === 0" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
                <p style="color:var(--text-tertiary);font-size:var(--text-sm)">Aguardando pedidos para gerar o gráfico</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Status donut -->
        <div class="card">
          <div class="card-header">
            <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Status Atual</h3>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:180px;margin-bottom:1rem">
              <canvas #statusChart></canvas>
              <div *ngIf="orders.length === 0" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
                <p style="color:var(--text-tertiary);font-size:var(--text-xs);text-align:center">Sem dados</p>
              </div>
            </div>
            <!-- Legend -->
            <div style="display:flex;flex-direction:column;gap:.5rem">
              <div *ngFor="let s of statusDist" style="display:flex;align-items:center;justify-content:space-between;font-size:var(--text-xs)">
                <div style="display:flex;align-items:center;gap:.5rem">
                  <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0" [style.background]="s.color"></div>
                  <span style="color:var(--text-secondary)">{{ s.label }}</span>
                </div>
                <span style="font-weight:600;color:var(--text-primary)">{{ s.count }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Charts row 2: Top Items Bar + Payment Methods -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem" class="chart-grid-sec">

        <!-- Top items horizontal bar -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Produtos mais vendidos</h3>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">Top 5 por quantidade</p>
            </div>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:220px">
              <canvas #itemsChart></canvas>
              <div *ngIf="topItems.length === 0" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
                <p style="color:var(--text-tertiary);font-size:var(--text-sm)">Sem dados ainda</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment methods donut + list -->
        <div class="card">
          <div class="card-header">
            <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Formas de Pagamento</h3>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:180px;margin-bottom:1rem">
              <canvas #paymentChart></canvas>
              <div *ngIf="paymentDist.length === 0" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
                <p style="color:var(--text-tertiary);font-size:var(--text-xs);text-align:center">Sem dados</p>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.625rem">
              <div *ngFor="let p of paymentDist"
                   style="display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem;background:var(--bg-elevated);border-radius:var(--r-lg)">
                <div style="display:flex;align-items:center;gap:.625rem">
                  <span style="font-size:1rem">{{ p.icon }}</span>
                  <span style="font-size:var(--text-sm);font-weight:500;color:var(--text-secondary)">{{ p.method }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:.75rem">
                  <span style="font-size:var(--text-xs);color:var(--text-tertiary)">{{ p.count }} pedidos</span>
                  <span style="font-size:var(--text-xs);font-weight:700;color:var(--text-primary);background:var(--bg-card);padding:.1rem .4rem;border-radius:var(--r-sm)">{{ p.pct }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    @media (max-width: 1024px) {
      .chart-grid-main { grid-template-columns: 1fr !important; }
      .chart-grid-sec  { grid-template-columns: 1fr !important; }
    }
  `]
})
export class InsightsDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart')  revenueChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart')   statusChartRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('itemsChart')    itemsChartRef!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChart')  paymentChartRef!:  ElementRef<HTMLCanvasElement>;

  orders: Order[] = [];
  private sub?: Subscription;
  private charts: Chart[] = [];
  private viewReady = false;

  constructor(private ordersService: OrdersService, private ngZone: NgZone) {}

  ngOnInit() {
    this.sub = this.ordersService.orders.subscribe({
      next: orders => {
        this.orders = orders;
        if (this.viewReady) this.ngZone.runOutsideAngular(() => this.updateAllCharts());
      },
      error: err => console.error('[Insights] orders error:', err),
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    // setTimeout 0 evita bloquear o primeiro render; runOutsideAngular evita que
    // os ResizeObservers do Chart.js disparem change detection continuamente.
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.buildAllCharts();
        if (this.orders.length) this.updateAllCharts();
      }, 0);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.ngZone.runOutsideAngular(() => this.charts.forEach(c => c.destroy()));
  }

  // ── Computed data ──────────────────────────────────────────────

  get revenue()        { return this.orders.reduce((s, o) => s + o.total, 0); }
  get deliveredCount() { return this.orders.filter(o => o.status === 'delivered').length; }
  get completionRate() { return this.orders.length ? Math.round(this.deliveredCount / this.orders.length * 100) : 0; }
  get avgTicket()      { return this.orders.length ? this.revenue / this.orders.length : 0; }
  get todayRevenue() {
    const today = new Date().toDateString();
    return this.orders.filter(o => new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
  }

  get statusDist() {
    const total = this.orders.length || 1;
    return [
      { label: 'Aguardando',  key: 'pending',    color: CHART_COLORS.gray   },
      { label: 'Em separação', key: 'preparing', color: CHART_COLORS.warning },
      { label: 'Pronto',      key: 'ready',      color: CHART_COLORS.blue   },
      { label: 'Em Entrega',  key: 'delivering', color: CHART_COLORS.green  },
      { label: 'Entregue',    key: 'delivered',  color: CHART_COLORS.purple },
      { label: 'Cancelado',   key: 'cancelled',  color: CHART_COLORS.red    },
    ]
      .map(s => ({
        ...s,
        count: this.orders.filter(o => o.status === s.key).length,
        pct:   Math.round(this.orders.filter(o => o.status === s.key).length / total * 100),
      }))
      .filter(s => s.count > 0);
  }

  get topItems(): { name: string; qty: number; revenue: number }[] {
    const map = new Map<string, { qty: number; revenue: number }>();
    for (const order of this.orders) {
      for (const item of order.items) {
        const prev = map.get(item.name) ?? { qty: 0, revenue: 0 };
        map.set(item.name, { qty: prev.qty + item.quantity, revenue: prev.revenue + item.price * item.quantity });
      }
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }

  get paymentDist() {
    const icons: Record<string, string> = { PIX: '⚡', pix: '⚡', credit: '💳', debit: '🏧', boleto: '🧾', Crédito: '💳', Débito: '🏧', Boleto: '🧾' };
    const labels: Record<string, string> = { pix: 'PIX', credit: 'Crédito', debit: 'Débito', boleto: 'Boleto' };
    const total = this.orders.length || 1;
    const counts = new Map<string, number>();
    for (const o of this.orders) counts.set(o.paymentMethod, (counts.get(o.paymentMethod) ?? 0) + 1);
    return [...counts.entries()]
      .map(([key, count]) => ({ method: labels[key] ?? key, icon: icons[key] ?? '💳', count, pct: Math.round(count / total * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  private revenueByHour(): { labels: string[]; values: number[] } {
    const map = new Map<number, number>();
    const today = new Date().toDateString();
    for (const o of this.orders) {
      if (new Date(o.createdAt).toDateString() !== today) continue;
      const h = new Date(o.createdAt).getHours();
      map.set(h, (map.get(h) ?? 0) + o.total);
    }
    const now = new Date().getHours();
    const labels: string[] = [];
    const values: number[] = [];
    for (let h = Math.max(0, now - 11); h <= now; h++) {
      labels.push(`${String(h).padStart(2, '0')}:00`);
      values.push(map.get(h) ?? 0);
    }
    return { labels, values };
  }

  // ── Chart lifecycle ────────────────────────────────────────────

  private baseOptions(extra: object = {}): object {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: {} } },
      ...extra,
    };
  }

  private buildAllCharts() {
    // Revenue line
    const revChart = new Chart(this.revenueChartRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], borderColor: CHART_COLORS.amber, backgroundColor: CHART_COLORS.amberBg, borderWidth: 2, fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: CHART_COLORS.amber }] },
      options: {
        ...(this.baseOptions() as any),
        scales: {
          x: { grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text, font: { size: 11 } } },
          y: { grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text, font: { size: 11 }, callback: (v: any) => `R$${v}` } },
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` R$ ${ctx.parsed.y.toFixed(2)}` } } },
      } as any,
    });

    // Status donut
    const stChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 4 }] },
      options: { ...(this.baseOptions() as any), cutout: '68%', plugins: { legend: { display: false } } } as any,
    });

    // Items bar
    const itChart = new Chart(this.itemsChartRef.nativeElement, {
      type: 'bar',
      data: { labels: [], datasets: [{ data: [], backgroundColor: CHART_COLORS.amberBg, borderColor: CHART_COLORS.amber, borderWidth: 1.5, borderRadius: 6 }] },
      options: {
        ...(this.baseOptions() as any),
        indexAxis: 'y' as const,
        scales: {
          x: { grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text, font: { size: 11 } } },
          y: { grid: { display: false }, ticks: { color: CHART_COLORS.text, font: { size: 11 } } },
        },
        plugins: { legend: { display: false } },
      } as any,
    });

    // Payment donut
    const payChart = new Chart(this.paymentChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [CHART_COLORS.greenBg, CHART_COLORS.blueBg, CHART_COLORS.amberBg, CHART_COLORS.purpleBg],
          borderColor:     [CHART_COLORS.green,   CHART_COLORS.blue,   CHART_COLORS.amber,   CHART_COLORS.purple],
          borderWidth: 1.5,
          hoverOffset: 4,
        }],
      },
      options: { ...(this.baseOptions() as any), cutout: '65%', plugins: { legend: { display: false } } } as any,
    });

    this.charts = [revChart, stChart, itChart, payChart];
  }

  private updateAllCharts() {
    if (!this.charts.length) return;

    const [revChart, stChart, itChart, payChart] = this.charts;

    // Revenue line
    const { labels, values } = this.revenueByHour();
    revChart.data.labels = labels;
    revChart.data.datasets[0].data = values;
    revChart.update('none');

    // Status donut
    const sd = this.statusDist;
    stChart.data.labels = sd.map(s => s.label);
    stChart.data.datasets[0].data = sd.map(s => s.count);
    (stChart.data.datasets[0] as any).backgroundColor = sd.map(s => s.color.replace('1)', '.3)'));
    (stChart.data.datasets[0] as any).borderColor = sd.map(s => s.color);
    (stChart.data.datasets[0] as any).borderWidth = 1.5;
    stChart.update('none');

    // Items bar
    const ti = this.topItems;
    itChart.data.labels = ti.map(i => i.name.length > 22 ? i.name.slice(0, 22) + '…' : i.name);
    itChart.data.datasets[0].data = ti.map(i => i.qty);
    itChart.update('none');

    // Payment donut
    const pd = this.paymentDist;
    payChart.data.labels = pd.map(p => p.method);
    payChart.data.datasets[0].data = pd.map(p => p.count);
    payChart.update('none');
  }
}
