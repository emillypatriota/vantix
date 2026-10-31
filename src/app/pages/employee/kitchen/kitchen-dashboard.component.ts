import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../../services/orders.service';
import { Order, OrderStatus } from '../../../models';

@Component({
  selector: 'app-kitchen-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  template: `
    <div style="padding:0 1.5rem;height:calc(100vh - 140px);display:flex;flex-direction:column">

      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem" class="animate-fade-up">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.875rem;color:var(--text-primary);margin-bottom:.25rem">
            Separação & Expedição
          </h1>
          <p style="color:var(--text-tertiary);font-size:var(--text-base)">
            Pedidos aprovados em tempo real: separe, confira e embale
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <span class="online-badge"><span class="dot"></span>Ao vivo</span>
          <span style="padding:.4rem .875rem;border-radius:var(--r-full);background:var(--bg-card);border:1px solid var(--border);font-size:var(--text-sm);color:var(--text-secondary)">
            {{ allOrders.length }} pedido{{ allOrders.length !== 1 ? 's' : '' }} total
          </span>
        </div>
      </div>

      <!-- Kanban -->
      <div class="kanban" style="flex:1">

        <!-- Pendentes -->
        <div class="kanban-col col-pending">
          <div class="kanban-header">
            <div class="kanban-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--neutral)">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Aguardando
            </div>
            <span class="kanban-count">{{ pending.length }}</span>
          </div>
          <div class="kanban-body">
            <div *ngIf="pending.length === 0" class="empty-state" style="padding:2.5rem 1rem">
              <div class="empty-icon" style="font-size:1.25rem">⏳</div>
              <p style="font-size:var(--text-sm)">Nenhum pedido aguardando</p>
            </div>
            <div *ngFor="let o of pending; trackBy: trackById" class="kanban-card animate-scale-in">
              <div class="kanban-card-header">
                <div style="display:flex;align-items:center;gap:.5rem">
                  <span class="order-number">#{{ o.orderNumber }}</span>
                  <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-family:var(--font-mono)">{{ o.createdAt | date:'HH:mm' }}</span>
                </div>
                <span class="badge badge-pending">
                  <span class="badge-dot"></span>Aguardando
                </span>
              </div>

              <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary);margin-bottom:.75rem">
                {{ o.customer.name }}
              </div>

              <div class="kanban-card-items">
                <div *ngFor="let item of o.items" class="kanban-item">
                  <span class="item-qty">{{ item.quantity }}x</span>
                  <span>{{ item.name }}</span>
                </div>
              </div>

              <div *ngIf="o.observations"
                   style="margin-bottom:.875rem;padding:.625rem .75rem;background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--r-md);font-size:var(--text-xs);color:var(--danger-text)">
                ⚠️ {{ o.observations }}
              </div>

              <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:.875rem;display:flex;align-items:center;gap:.375rem">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {{ o.customer.address }}
              </div>

              <button class="btn btn-secondary btn-sm" style="width:100%;justify-content:center"
                      (click)="advance(o.id, 'preparing')">
                Iniciar separação
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Em separação -->
        <div class="kanban-col col-preparing">
          <div class="kanban-header">
            <div class="kanban-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--warning)">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
              Em separação
            </div>
            <span class="kanban-count" style="background:var(--warning-bg);color:var(--warning-text)">{{ preparing.length }}</span>
          </div>
          <div class="kanban-body">
            <div *ngIf="preparing.length === 0" class="empty-state" style="padding:2.5rem 1rem">
              <div class="empty-icon" style="font-size:1.25rem">📦</div>
              <p style="font-size:var(--text-sm)">Nenhum pedido em separação</p>
            </div>
            <div *ngFor="let o of preparing; trackBy: trackById" class="kanban-card animate-scale-in">
              <div class="kanban-card-header">
                <div style="display:flex;align-items:center;gap:.5rem">
                  <span class="order-number">#{{ o.orderNumber }}</span>
                  <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-family:var(--font-mono)">{{ o.createdAt | date:'HH:mm' }}</span>
                </div>
                <span class="badge badge-preparing">
                  <span class="badge-dot"></span>Separando
                </span>
              </div>

              <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary);margin-bottom:.75rem">
                {{ o.customer.name }}
              </div>

              <div class="kanban-card-items">
                <div *ngFor="let item of o.items" class="kanban-item">
                  <span class="item-qty" style="background:var(--warning-bg);color:var(--warning-text)">{{ item.quantity }}x</span>
                  <span>{{ item.name }}</span>
                </div>
              </div>

              <div *ngIf="o.observations"
                   style="margin-bottom:.875rem;padding:.625rem .75rem;background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--r-md);font-size:var(--text-xs);color:var(--danger-text)">
                ⚠️ {{ o.observations }}
              </div>

              <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:.875rem;display:flex;align-items:center;gap:.375rem">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {{ o.customer.address }}
              </div>

              <button class="btn btn-sm" style="width:100%;justify-content:center;background:var(--warning-bg);color:var(--warning-text);border:1px solid var(--warning-border)"
                      (click)="advance(o.id, 'ready')">
                Embalado · pronto p/ envio
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Prontos -->
        <div class="kanban-col col-ready">
          <div class="kanban-header">
            <div class="kanban-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--success)">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Prontos para envio
            </div>
            <span class="kanban-count" style="background:var(--success-bg);color:var(--success-text)">{{ ready.length }}</span>
          </div>
          <div class="kanban-body">
            <div *ngIf="ready.length === 0" class="empty-state" style="padding:2.5rem 1rem">
              <div class="empty-icon" style="font-size:1.25rem">📦</div>
              <p style="font-size:var(--text-sm)">Nenhum pedido pronto</p>
            </div>
            <div *ngFor="let o of ready; trackBy: trackById" class="kanban-card animate-scale-in">
              <div class="kanban-card-header">
                <div style="display:flex;align-items:center;gap:.5rem">
                  <span class="order-number">#{{ o.orderNumber }}</span>
                  <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-family:var(--font-mono)">{{ o.createdAt | date:'HH:mm' }}</span>
                </div>
                <span class="badge badge-ready">
                  <span class="badge-dot"></span>Pronto
                </span>
              </div>

              <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary);margin-bottom:.75rem">
                {{ o.customer.name }}
              </div>

              <div class="kanban-card-items">
                <div *ngFor="let item of o.items" class="kanban-item">
                  <span class="item-qty" style="background:var(--success-bg);color:var(--success-text)">{{ item.quantity }}x</span>
                  <span>{{ item.name }}</span>
                </div>
              </div>

              <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:.875rem;display:flex;align-items:center;gap:.375rem">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {{ o.customer.address }}
              </div>

              <button class="btn btn-sm" style="width:100%;justify-content:center;background:var(--success-bg);color:var(--success-text);border:1px solid var(--success-border)"
                      (click)="advance(o.id, 'delivering')">
                Despachado
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13" rx="1"/>
                  <path d="M16 8h4l3 4v5h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class KitchenDashboardComponent implements OnInit, OnDestroy {
  allOrders: Order[] = [];
  pending:   Order[] = [];
  preparing: Order[] = [];
  ready:     Order[] = [];
  private sub?: Subscription;

  constructor(private ordersService: OrdersService) {}

  ngOnInit() {
    this.sub = this.ordersService.orders.subscribe({
      next: orders => {
        this.allOrders = orders;
        this.pending   = orders.filter(o => o.status === 'pending');
        this.preparing = orders.filter(o => o.status === 'preparing');
        this.ready     = orders.filter(o => o.status === 'ready');
      },
      error: err => console.error('[Kitchen] orders error:', err),
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  trackById(_: number, o: Order) { return o.id; }

  async advance(id: string, next: OrderStatus) {
    await this.ordersService.updateStatus(id, next);
  }
}
