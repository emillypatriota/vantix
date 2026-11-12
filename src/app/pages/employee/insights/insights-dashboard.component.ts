import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, NgZone
} from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { BehaviorSubject, Subscription, catchError, of, switchMap, timer } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ReportData, ReportPeriod, ReportsService } from '../../../services/reports.service';
import { StatusApi, FormaPagamentoApi } from '../../../core/api/api.types';

Chart.register(...registerables);

const CHART_COLORS = {
  brand:   'rgba(58,111,240,1)',
  brandBg: 'rgba(58,111,240,.15)',
  warning: 'rgba(245,158,11,1)',
  green:   'rgba(34,197,94,1)',
  greenBg: 'rgba(34,197,94,.15)',
  blue:    'rgba(99,102,241,1)',
  blueBg:  'rgba(99,102,241,.15)',
  red:     'rgba(239,68,68,1)',
  gray:    'rgba(100,116,139,1)',
  purple:  'rgba(139,92,246,1)',
  purpleBg:'rgba(139,92,246,.15)',
  teal:    'rgba(45,212,191,1)',
  grid:    'rgba(255,255,255,.06)',
  text:    'rgba(255,255,255,.5)',
};

const STATUS_META: Record<StatusApi, { label: string; color: string }> = {
  pendente:          { label: 'Aguardando pagamento', color: CHART_COLORS.gray    },
  confirmado:        { label: 'Pagamento aprovado',   color: CHART_COLORS.purple  },
  em_preparacao:     { label: 'Em separação',         color: CHART_COLORS.warning },
  pronto:            { label: 'Pronto p/ envio',      color: CHART_COLORS.blue    },
  saiu_para_entrega: { label: 'Em transporte',        color: CHART_COLORS.teal    },
  entregue:          { label: 'Entregue',             color: CHART_COLORS.green   },
  cancelado:         { label: 'Cancelado',            color: CHART_COLORS.red     },
};

const PAY_META: Record<FormaPagamentoApi, { label: string; icon: string }> = {
  pix:     { label: 'PIX',     icon: '⚡' },
  credito: { label: 'Crédito', icon: '💳' },
  debito:  { label: 'Débito',  icon: '🏧' },
  boleto:  { label: 'Boleto',  icon: '🧾' },
};

const REFRESH_MS = 15000;

@Component({
  selector: 'app-insights-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  template: `
    <div style="max-width:1280px;margin:0 auto;padding:0 1.5rem 2rem">

      <!-- Header + período -->
      <div style="margin-bottom:2rem;display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap" class="animate-fade-up">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary);margin-bottom:.25rem">
            Insights & Relatórios
          </h1>
          <p style="color:var(--text-tertiary);font-size:var(--text-base)">
            {{ data?.resumo?.totalPedidos ?? 0 }} pedidos no período · dados do MySQL, atualizados a cada 15s
          </p>
        </div>
        <div style="display:flex;gap:.375rem;background:var(--surface-1);border:1px solid var(--border);padding:.25rem;border-radius:var(--r-full)" role="group" aria-label="Período">
          <button *ngFor="let p of periods" (click)="setPeriod(p.value)"
                  [attr.aria-pressed]="period === p.value"
                  [style.background]="period === p.value ? 'var(--brand-600)' : 'transparent'"
                  [style.color]="period === p.value ? '#fff' : 'var(--text-muted)'"
                  style="padding:.4rem .9rem;border-radius:var(--r-full);font-size:.78rem;font-weight:600;border:none;cursor:pointer;transition:all .15s">
            {{ p.label }}
          </button>
        </div>
      </div>

      <p *ngIf="error" style="margin-bottom:1rem;padding:.75rem 1rem;border-radius:var(--r-lg);background:rgba(239,68,68,.1);color:#f87171;font-size:var(--text-sm)">
        {{ error }}
      </p>

      <!-- KPI Cards -->
      <div class="grid-4 stagger" style="margin-bottom:2rem">

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(58,111,240,.12);color:var(--brand-400)">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div class="kpi-label">Faturamento</div>
          <div class="kpi-value" style="font-size:1.55rem">{{ (data?.resumo?.faturamento ?? 0) | currency:'BRL':'symbol':'1.2-2' }}</div>
          <div class="kpi-trend up">Exclui pedidos cancelados</div>
          <div class="kpi-accent" style="background:var(--brand-600)"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(99,102,241,.12);color:#818cf8">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div class="kpi-label">Total de Pedidos</div>
          <div class="kpi-value">{{ data?.resumo?.totalPedidos ?? 0 }}</div>
          <div class="kpi-trend flat">{{ data?.resumo?.pedidosCancelados ?? 0 }} cancelados</div>
          <div class="kpi-accent" style="background:#6366f1"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(34,197,94,.12);color:#4ade80">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="kpi-label">Taxa de conclusão</div>
          <div class="kpi-value">{{ completionRate }}%</div>
          <div class="kpi-trend" [class.up]="completionRate >= 80" [class.flat]="completionRate < 80">
            {{ data?.resumo?.pedidosEntregues ?? 0 }} / {{ data?.resumo?.totalPedidos ?? 0 }} entregues
          </div>
          <div class="kpi-accent" style="background:#22c55e"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(139,92,246,.12);color:#a78bfa">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="kpi-label">Ticket Médio</div>
          <div class="kpi-value" style="font-size:1.55rem">{{ (data?.resumo?.ticketMedio ?? 0) | currency:'BRL':'symbol':'1.2-2' }}</div>
          <div class="kpi-trend up">Por pedido</div>
          <div class="kpi-accent" style="background:#8b5cf6"></div>
        </div>
      </div>

      <!-- Linha 1: faturamento por dia + status -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem" class="chart-grid-main">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Faturamento por dia</h3>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">vw_faturamento_diario</p>
            </div>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:220px">
              <canvas #revenueChart></canvas>
              <div *ngIf="!data?.faturamentoDiario?.length" class="chart-empty">Sem pedidos no período</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Pedidos por status</h3>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:180px;margin-bottom:1rem">
              <canvas #statusChart></canvas>
              <div *ngIf="!statusDist.length" class="chart-empty">Sem dados</div>
            </div>
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

      <!-- Linha 2: mais vendidos + formas de pagamento -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem" class="chart-grid-sec">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Produtos mais vendidos</h3>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">Top 5 por unidades</p>
            </div>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:220px">
              <canvas #itemsChart></canvas>
              <div *ngIf="!data?.maisVendidos?.length" class="chart-empty">Sem dados ainda</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Formas de pagamento</h3>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:180px;margin-bottom:1rem">
              <canvas #paymentChart></canvas>
              <div *ngIf="!paymentDist.length" class="chart-empty">Sem dados</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.625rem">
              <div *ngFor="let p of paymentDist"
                   style="display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem;background:var(--bg-elevated);border-radius:var(--r-lg)">
                <div style="display:flex;align-items:center;gap:.625rem">
                  <span style="font-size:1rem">{{ p.icon }}</span>
                  <span style="font-size:var(--text-sm);font-weight:500;color:var(--text-secondary)">{{ p.method }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:.75rem">
                  <span style="font-size:var(--text-xs);color:var(--text-tertiary)">{{ p.count }} pedidos · {{ p.value | currency:'BRL':'symbol':'1.0-0' }}</span>
                  <span style="font-size:var(--text-xs);font-weight:700;color:var(--text-primary);background:var(--bg-card);padding:.1rem .4rem;border-radius:var(--r-sm)">{{ p.pct }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Linha 3: pedidos por hora + estoque baixo -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem" class="chart-grid-main">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Pedidos por hora do dia</h3>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">Horários de maior movimento</p>
            </div>
          </div>
          <div class="card-body" style="padding-top:0">
            <div style="position:relative;height:200px">
              <canvas #hourChart></canvas>
              <div *ngIf="!data?.pedidosPorHora?.length" class="chart-empty">Sem dados</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">Estoque baixo</h3>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">10 unidades ou menos</p>
            </div>
          </div>
          <div class="card-body" style="padding-top:0;display:flex;flex-direction:column;gap:.5rem;max-height:240px;overflow-y:auto">
            <p *ngIf="!data?.estoqueBaixo?.length" style="color:var(--text-tertiary);font-size:var(--text-sm)">Nenhum produto com estoque baixo 🎉</p>
            <div *ngFor="let e of data?.estoqueBaixo"
                 style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.5rem .75rem;background:var(--bg-elevated);border-radius:var(--r-lg)">
              <span style="font-size:var(--text-sm);color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ e.nome }}</span>
              <span style="font-size:var(--text-xs);font-weight:700;padding:.1rem .5rem;border-radius:var(--r-full);flex-shrink:0"
                    [style.background]="e.estoque === 0 ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)'"
                    [style.color]="e.estoque === 0 ? '#f87171' : '#fbbf24'">
                {{ e.estoque === 0 ? 'esgotado' : e.estoque + ' un.' }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .chart-empty { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:var(--text-sm); }
    @media (max-width: 1024px) {
      .chart-grid-main { grid-template-columns: minmax(0,1fr) !important; }
      .chart-grid-sec  { grid-template-columns: minmax(0,1fr) !important; }
    }
  `]
})
export class InsightsDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart')  statusChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('itemsChart')   itemsChartRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChart') paymentChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourChart')    hourChartRef!:    ElementRef<HTMLCanvasElement>;

  periods: { label: string; value: ReportPeriod }[] = [
    { label: '7 dias',  value: '7d'  },
    { label: '30 dias', value: '30d' },
    { label: 'Tudo',    value: 'all' },
  ];
  period: ReportPeriod = 'all';
  data: ReportData | null = null;
  error = '';

  private period$ = new BehaviorSubject<ReportPeriod>(this.period);
  private sub?: Subscription;
  private charts: Chart[] = [];

  constructor(private reports: ReportsService, private ngZone: NgZone) {}

  ngOnInit() {
    this.sub = this.period$.pipe(
      switchMap(p => timer(0, REFRESH_MS).pipe(
        switchMap(() => this.reports.load(p).pipe(
          catchError(err => {
            console.error('[Insights] erro nos relatórios:', err);
            this.error = 'Não foi possível carregar os relatórios. Verifique se a API está rodando.';
            return of(null);
          }),
        )),
      )),
    ).subscribe(data => {
      if (!data) return;
      this.error = '';
      this.data = data;
      this.ngZone.runOutsideAngular(() => this.updateAllCharts());
    });
  }

  ngAfterViewInit() {
    // runOutsideAngular evita que os ResizeObservers do Chart.js disparem change detection.
    this.ngZone.runOutsideAngular(() => setTimeout(() => {
      this.buildAllCharts();
      this.updateAllCharts();
    }, 0));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.ngZone.runOutsideAngular(() => this.charts.forEach(c => c.destroy()));
  }

  setPeriod(p: ReportPeriod) {
    if (p === this.period) return;
    this.period = p;
    this.period$.next(p);
  }

  // ── Dados derivados ────────────────────────────────────────────
  get completionRate() {
    const r = this.data?.resumo;
    return r?.totalPedidos ? Math.round(r.pedidosEntregues / r.totalPedidos * 100) : 0;
  }

  get statusDist() {
    return (this.data?.pedidosPorStatus ?? [])
      .filter(s => s.pedidos > 0)
      .map(s => ({ ...STATUS_META[s.status] ?? { label: s.status, color: CHART_COLORS.gray }, count: s.pedidos }));
  }

  get paymentDist() {
    const list = this.data?.formasPagamento ?? [];
    const total = list.reduce((s, p) => s + p.pedidos, 0) || 1;
    return list.map(p => ({
      method: PAY_META[p.forma]?.label ?? p.forma,
      icon:   PAY_META[p.forma]?.icon ?? '💳',
      count:  p.pedidos,
      value:  p.valor,
      pct:    Math.round(p.pedidos / total * 100),
    }));
  }

  // ── Gráficos ───────────────────────────────────────────────────
  private axes(money = false) {
    return {
      x: { grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text, font: { size: 11 } } },
      y: { grid: { color: CHART_COLORS.grid }, beginAtZero: true,
           ticks: { color: CHART_COLORS.text, font: { size: 11 }, precision: 0, ...(money ? { callback: (v: any) => `R$${v}` } : {}) } },
    };
  }

  private buildAllCharts() {
    const base = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

    const revenue = new Chart(this.revenueChartRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], borderColor: CHART_COLORS.brand, backgroundColor: CHART_COLORS.brandBg, borderWidth: 2, fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: CHART_COLORS.brand }] },
      options: { ...base, scales: this.axes(true),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` R$ ${ctx.parsed.y.toFixed(2)}` } } } } as any,
    });

    const status = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 1.5, hoverOffset: 4 }] },
      options: { ...base, cutout: '68%' } as any,
    });

    const items = new Chart(this.itemsChartRef.nativeElement, {
      type: 'bar',
      data: { labels: [], datasets: [{ data: [], backgroundColor: CHART_COLORS.brandBg, borderColor: CHART_COLORS.brand, borderWidth: 1.5, borderRadius: 6 }] },
      options: { ...base, indexAxis: 'y' as const, scales: { ...this.axes(), y: { grid: { display: false }, ticks: { color: CHART_COLORS.text, font: { size: 11 } } } } } as any,
    });

    const payment = new Chart(this.paymentChartRef.nativeElement, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [],
        backgroundColor: [CHART_COLORS.greenBg, CHART_COLORS.blueBg, CHART_COLORS.brandBg, CHART_COLORS.purpleBg],
        borderColor:     [CHART_COLORS.green,   CHART_COLORS.blue,   CHART_COLORS.brand,   CHART_COLORS.purple],
        borderWidth: 1.5, hoverOffset: 4 }] },
      options: { ...base, cutout: '65%' } as any,
    });

    const hours = new Chart(this.hourChartRef.nativeElement, {
      type: 'bar',
      data: { labels: [], datasets: [{ data: [], backgroundColor: CHART_COLORS.purpleBg, borderColor: CHART_COLORS.purple, borderWidth: 1.5, borderRadius: 4 }] },
      options: { ...base, scales: this.axes() } as any,
    });

    this.charts = [revenue, status, items, payment, hours];
  }

  private updateAllCharts() {
    if (!this.charts.length || !this.data) return;
    const [revenue, status, items, payment, hours] = this.charts;
    const d = this.data;

    revenue.data.labels = d.faturamentoDiario.map(f => f.dia.slice(8, 10) + '/' + f.dia.slice(5, 7));
    revenue.data.datasets[0].data = d.faturamentoDiario.map(f => f.faturamento);
    revenue.update('none');

    const sd = this.statusDist;
    status.data.labels = sd.map(s => s.label);
    status.data.datasets[0].data = sd.map(s => s.count);
    (status.data.datasets[0] as any).backgroundColor = sd.map(s => s.color.replace('1)', '.3)'));
    (status.data.datasets[0] as any).borderColor = sd.map(s => s.color);
    status.update('none');

    items.data.labels = d.maisVendidos.map(i => i.nome.length > 22 ? i.nome.slice(0, 22) + '…' : i.nome);
    items.data.datasets[0].data = d.maisVendidos.map(i => i.unidadesVendidas);
    items.update('none');

    const pd = this.paymentDist;
    payment.data.labels = pd.map(p => p.method);
    payment.data.datasets[0].data = pd.map(p => p.count);
    payment.update('none');

    // Mostra todas as horas entre a primeira e a última com pedido (sem buracos).
    const byHour = new Map(d.pedidosPorHora.map(h => [h.hora, h.pedidos]));
    const hs = d.pedidosPorHora.map(h => h.hora);
    const labels: string[] = []; const values: number[] = [];
    if (hs.length) for (let h = Math.min(...hs); h <= Math.max(...hs); h++) {
      labels.push(`${String(h).padStart(2, '0')}h`);
      values.push(byHour.get(h) ?? 0);
    }
    hours.data.labels = labels;
    hours.data.datasets[0].data = values;
    hours.update('none');
  }
}
