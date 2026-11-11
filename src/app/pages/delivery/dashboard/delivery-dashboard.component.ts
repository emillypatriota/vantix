import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, DatePipe, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../../services/orders.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { apiErrorMessage } from '../../../core/api/auth.interceptor';
import { Order } from '../../../models';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, CurrencyPipe],
  template: `
    <div style="max-width:900px;margin:0 auto;padding:0 1.5rem">

      <!-- Page header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem" class="animate-fade-up">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary);margin-bottom:.25rem">
            Painel da Logística
          </h1>
          <div style="display:flex;align-items:center;gap:.5rem;font-size:var(--text-sm);color:var(--text-tertiary)">
            <span class="status-dot online"></span>
            Online — disponível para entregas
          </div>
        </div>

        <!-- Earnings strip -->
        <div class="card earnings-strip">
          <div style="padding:1rem 1.5rem;text-align:center;border-right:1px solid var(--border)">
            <div style="font-size:var(--text-xs);color:var(--text-tertiary);letter-spacing:.08em;margin-bottom:.25rem;text-transform:uppercase">Valor entregue hoje</div>
            <div style="font-family:var(--font-display);font-size:1.375rem;color:var(--success-text);font-weight:700">
              {{ earnings | currency:'BRL':'symbol':'1.2-2' }}
            </div>
          </div>
          <div style="padding:1rem 1.25rem;text-align:center;border-right:1px solid var(--border)">
            <div style="font-size:var(--text-xs);color:var(--text-tertiary);letter-spacing:.08em;margin-bottom:.25rem;text-transform:uppercase">Entregas</div>
            <div style="font-family:var(--font-display);font-size:1.375rem;color:var(--text-primary)">{{ completed.length }}</div>
          </div>
          <div style="padding:1rem 1.25rem;text-align:center">
            <div style="font-size:var(--text-xs);color:var(--text-tertiary);letter-spacing:.08em;margin-bottom:.25rem;text-transform:uppercase">Em Rota</div>
            <div style="font-family:var(--font-display);font-size:1.375rem;color:var(--warning-text)">{{ active.length }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;border-bottom:1px solid var(--border);margin-bottom:1.75rem;gap:.25rem">
        <button *ngFor="let tab of tabs"
                (click)="activeTab = tab.key"
                style="padding:.75rem 1.25rem;font-size:var(--text-base);font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all var(--transition-fast);display:flex;align-items:center;gap:.5rem;border-radius:var(--r-md) var(--r-md) 0 0"
                [style.color]="activeTab === tab.key ? 'var(--brand-400)' : 'var(--text-tertiary)'"
                [style.border-bottom-color]="activeTab === tab.key ? 'var(--brand-500)' : 'transparent'"
                [style.background]="activeTab === tab.key ? 'var(--bg-selected)' : 'transparent'">
          {{ tab.icon }} {{ tab.label }}
          <span *ngIf="tab.count > 0"
                style="background:var(--danger);color:#fff;border-radius:var(--r-full);padding:.1rem .4rem;font-size:.65rem;font-weight:700;min-width:18px;text-align:center">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- TAB: Disponíveis -->
      <div *ngIf="activeTab === 'available'">
        <div *ngIf="available.length === 0" class="empty-state animate-fade-in">
          <div class="empty-icon">📭</div>
          <h3>Nenhuma entrega disponível</h3>
          <p>Pacotes embalados pelo estoque aparecem aqui automaticamente.</p>
        </div>

        <div *ngFor="let o of available; trackBy: trackById" class="card animate-fade-up" style="margin-bottom:1.25rem;overflow:hidden">
          <div style="height:3px;background:var(--brand-500);width:100%"></div>
          <div class="card-body">
            <!-- Order header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)">
              <div>
                <div style="display:flex;align-items:center;gap:.625rem;margin-bottom:.5rem">
                  <span class="order-number">#{{ o.orderNumber }}</span>
                  <span class="badge badge-ready"><span class="badge-dot"></span>Pronto para envio</span>
                </div>
                <div style="font-family:var(--font-display);font-size:1.125rem;font-weight:700;color:var(--text-primary)">{{ o.customer.name }}</div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.25rem">
                  {{ o.createdAt | date:'HH:mm' }} · {{ o.items.length }} {{ o.items.length === 1 ? 'item' : 'itens' }}
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-family:var(--font-display);font-size:1.375rem;color:var(--text-primary);font-weight:700">
                  {{ o.total | currency:'BRL':'symbol':'1.2-2' }}
                </div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:.125rem">
                  <span class="chip">{{ o.paymentMethod }}</span>
                </div>
              </div>
            </div>

            <!-- Address card -->
            <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-xl);padding:1.125rem;margin-bottom:1.25rem">
              <div style="display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">
                <div style="width:36px;height:36px;border-radius:var(--r-lg);background:var(--warning-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem">📍</div>
                <div>
                  <div style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:600;letter-spacing:.08em;margin-bottom:.375rem;text-transform:uppercase">Endereço de Entrega</div>
                  <div style="font-size:var(--text-base);font-weight:500;color:var(--text-primary);line-height:1.5">{{ o.customer.address }}</div>
                </div>
              </div>
              <a [href]="'tel:' + o.customer.phone"
                 style="display:flex;align-items:center;gap:.75rem;font-size:var(--text-base);font-weight:500;color:var(--text-secondary);text-decoration:none;transition:color var(--transition-fast)"
                 onmouseenter="this.style.color='var(--text-primary)'"
                 onmouseleave="this.style.color=''">
                <div style="width:36px;height:36px;border-radius:var(--r-lg);background:var(--bg-card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">📞</div>
                {{ o.customer.phone }}
              </a>
            </div>

            <!-- Items summary -->
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem">
              <div *ngFor="let item of o.items"
                   style="display:flex;align-items:center;gap:.375rem;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-lg);padding:.375rem .625rem;font-size:var(--text-xs)">
                <span style="font-weight:700;color:var(--brand-400)">{{ item.quantity }}×</span>
                <span style="color:var(--text-secondary)">{{ item.name }}</span>
              </div>
            </div>

            <div *ngIf="o.observations"
                 style="margin-bottom:1.25rem;padding:.75rem 1rem;background:var(--warning-bg);border:1px solid var(--warning-border);border-radius:var(--r-lg);font-size:var(--text-sm);color:var(--warning-text)">
              📝 {{ o.observations }}
            </div>

            <button class="btn btn-primary" style="width:100%;justify-content:center;height:2.875rem;font-size:var(--text-md)"
                    (click)="accept(o)">
              Despachar pacote
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB: Em Rota -->
      <div *ngIf="activeTab === 'active'">
        <div *ngIf="active.length === 0" class="empty-state animate-fade-in">
          <div class="empty-icon">🗺️</div>
          <h3>Nenhuma entrega em andamento</h3>
          <p>Aceite uma entrega na aba Disponíveis.</p>
        </div>

        <div *ngFor="let o of active; trackBy: trackById" class="card animate-fade-up" style="margin-bottom:1.25rem;overflow:hidden">
          <div style="height:3px;background:var(--success);width:100%"></div>
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)">
              <div>
                <div style="display:flex;align-items:center;gap:.625rem;margin-bottom:.5rem">
                  <span class="order-number">#{{ o.orderNumber }}</span>
                  <span class="badge badge-delivering" style="animation:pulse 2s infinite">
                    <span class="badge-dot"></span>Em rota
                  </span>
                </div>
                <div style="font-family:var(--font-display);font-size:1.125rem;font-weight:700;color:var(--text-primary)">{{ o.customer.name }}</div>
              </div>
              <div style="font-family:var(--font-display);font-size:1.375rem;color:var(--text-primary);font-weight:700">
                {{ o.total | currency:'BRL':'symbol':'1.2-2' }}
              </div>
            </div>

            <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-xl);padding:1.125rem;margin-bottom:1.25rem">
              <div style="display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">
                <div style="width:36px;height:36px;border-radius:var(--r-lg);background:var(--success-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem">📍</div>
                <div>
                  <div style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:600;letter-spacing:.08em;margin-bottom:.375rem;text-transform:uppercase">Entregar em</div>
                  <div style="font-size:var(--text-base);font-weight:500;color:var(--text-primary);line-height:1.5">{{ o.customer.address }}</div>
                </div>
              </div>
              <a [href]="'tel:' + o.customer.phone"
                 style="display:flex;align-items:center;gap:.75rem;font-size:var(--text-base);font-weight:500;color:var(--text-secondary);text-decoration:none">
                <div style="width:36px;height:36px;border-radius:var(--r-lg);background:var(--bg-card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">📞</div>
                {{ o.customer.phone }}
              </a>
            </div>

            <button class="btn btn-success" style="width:100%;justify-content:center;height:2.875rem;font-size:var(--text-md)"
                    (click)="complete(o.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Confirmar Entrega Realizada
            </button>
          </div>
        </div>
      </div>

      <!-- TAB: Concluídas -->
      <div *ngIf="activeTab === 'done'">
        <div *ngIf="completed.length === 0" class="empty-state animate-fade-in">
          <div class="empty-icon">✅</div>
          <h3>Nenhuma entrega concluída hoje</h3>
          <p>Seu histórico de entregas aparecerá aqui.</p>
        </div>

        <div *ngFor="let o of completed; trackBy: trackById"
             class="card" style="margin-bottom:.875rem;overflow:hidden">
          <div style="height:3px;background:var(--success);width:100%"></div>
          <div class="card-body" style="padding:1rem 1.25rem">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:.875rem">
                <div style="width:38px;height:38px;border-radius:50%;background:var(--success-bg);display:flex;align-items:center;justify-content:center;color:var(--success-text);flex-shrink:0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <div style="font-weight:600;font-size:var(--text-base);color:var(--text-primary)">{{ o.customer.name }}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-tertiary)">
                    <span class="order-number">#{{ o.orderNumber }}</span>
                    · {{ o.createdAt | date:'HH:mm' }}
                  </div>
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-family:var(--font-display);font-size:1.125rem;color:var(--text-primary)">{{ o.total | currency:'BRL':'symbol':'1.2-2' }}</div>
                <div style="font-size:var(--text-xs);color:var(--success-text);font-weight:600">Entregue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .earnings-strip { display:flex; gap:0; overflow:hidden; flex-shrink:0; }
    .earnings-strip > div { white-space:nowrap; }
    @media (max-width:640px) { .earnings-strip { width:100%; } .earnings-strip > div { flex:1; min-width:0; white-space:normal; padding:.75rem .5rem !important; } }
  `],
})
export class DeliveryDashboardComponent implements OnInit, OnDestroy {
  available: Order[] = [];
  active:    Order[] = [];
  completed: Order[] = [];
  activeTab = 'available';
  private sub?: Subscription;
  private deliveryUid = '';

  get tabs() {
    return [
      { key: 'available', label: 'Disponíveis', icon: '📦', count: this.available.length },
      { key: 'active',    label: 'Em Rota',     icon: '🚚', count: this.active.length    },
      { key: 'done',      label: 'Concluídas',  icon: '✅', count: 0                    },
    ];
  }

  /** Soma só as entregas concluídas hoje (pela data da última atualização do pedido). */
  get earnings() {
    const today = new Date().toDateString();
    return this.completed
      .filter(o => (o.updatedAt ?? o.createdAt).toDateString() === today)
      .reduce((s, o) => s + (o.total ?? 0), 0);
  }

  constructor(
    private ordersService: OrdersService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.deliveryUid = this.auth.getUser()?.uid ?? '';
    this.sub = this.ordersService.orders.subscribe({
      next: orders => {
        this.available = orders.filter(o =>
          o.status === 'ready' && !o.deliveryPersonId && o.orderType === 'delivery'
        );
        this.active = orders.filter(o =>
          o.status === 'delivering' && o.orderType === 'delivery'
        );
        this.completed = orders.filter(o =>
          o.status === 'delivered' && o.orderType === 'delivery'
        );
      },
      error: err => console.error('[Delivery] orders error:', err),
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  trackById(_: number, o: Order) { return o.id; }

  async accept(order: Order) {
    try {
      await this.ordersService.updateStatus(order.id, 'delivering', { deliveryPersonId: this.deliveryUid });
      this.toast.show('Entrega aceita! Bora lá!');
      this.activeTab = 'active';
    } catch (err) { this.toast.show(apiErrorMessage(err, 'Não foi possível aceitar a entrega.'), 'error'); }
  }

  async complete(id: string) {
    try {
      await this.ordersService.updateStatus(id, 'delivered');
      this.toast.show('Entrega confirmada!');
      this.activeTab = 'done';
    } catch (err) { this.toast.show(apiErrorMessage(err, 'Não foi possível confirmar a entrega.'), 'error'); }
  }
}
