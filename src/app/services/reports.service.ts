import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EstoqueBaixoApi, FaturamentoDiaApi, FormaPagamentoRelApi, MaisVendidoApi,
  PedidosHoraApi, PedidosStatusApi, ResumoApi,
} from '../core/api/api.types';

export type ReportPeriod = '7d' | '30d' | 'all';

export interface ReportData {
  resumo: ResumoApi;
  faturamentoDiario: FaturamentoDiaApi[];
  pedidosPorStatus: PedidosStatusApi[];
  maisVendidos: MaisVendidoApi[];
  formasPagamento: FormaPagamentoRelApi[];
  pedidosPorHora: PedidosHoraApi[];
  estoqueBaixo: EstoqueBaixoApi[];
}

/** Relatórios do painel do gerente — cada endpoint chama uma consulta/view do MySQL. */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/relatorios`;

  load(period: ReportPeriod): Observable<ReportData> {
    const params = periodParams(period);
    const get = <T>(path: string, extra?: Record<string, string>) =>
      this.http.get<T>(`${this.base}/${path}`, { params: extra ? params.appendAll(extra) : params });

    return forkJoin({
      resumo:            get<ResumoApi>('resumo'),
      faturamentoDiario: get<FaturamentoDiaApi[]>('faturamento-diario'),
      pedidosPorStatus:  get<PedidosStatusApi[]>('pedidos-por-status'),
      maisVendidos:      get<MaisVendidoApi[]>('mais-vendidos', { limite: '5' }),
      formasPagamento:   get<FormaPagamentoRelApi[]>('formas-pagamento'),
      pedidosPorHora:    get<PedidosHoraApi[]>('pedidos-por-hora'),
      estoqueBaixo:      this.http.get<EstoqueBaixoApi[]>(`${this.base}/estoque-baixo`),
    });
  }
}

/** inicio/fim no formato YYYY-MM-DD. "Tudo" não manda filtro. */
function periodParams(period: ReportPeriod): HttpParams {
  if (period === 'all') return new HttpParams();
  const days = period === '7d' ? 7 : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return new HttpParams().set('inicio', ymd(start)).set('fim', ymd(end));
}

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
