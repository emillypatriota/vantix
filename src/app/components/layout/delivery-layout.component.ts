import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-delivery-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf],
  template: `
    <div style="display:flex;flex-direction:column;min-height:100vh;background:var(--bg-base)">

      <!-- Header -->
      <header style="
        background:var(--bg-surface);
        border-bottom:1px solid var(--border);
        position:sticky;top:0;z-index:100;
      ">
        <div style="
          max-width:1200px;margin:0 auto;padding:0 1rem;gap:.5rem;
          display:flex;align-items:center;justify-content:space-between;height:4rem
        ">
          <!-- Logo -->
          <a routerLink="/logistica/painel" style="display:flex;align-items:center;gap:.75rem;text-decoration:none">
            <div style="
              width:34px;height:34px;border-radius:var(--r-lg);
              background:linear-gradient(135deg,var(--success),#059669);
              display:flex;align-items:center;justify-content:center;
              font-family:var(--font-display);font-size:1rem;font-weight:700;color:#fff
            ">V</div>
            <div>
              <div style="font-family:var(--font-display);font-size:1.1rem;letter-spacing:.1em;color:var(--text-primary)">VOLTZ</div>
              <div style="font-size:.55rem;letter-spacing:.3em;color:var(--success-text);margin-top:-3px">LOGÍSTICA</div>
            </div>
          </a>

          <!-- Center stats -->
          <div *ngIf="activeDeliveries() > 0"
               style="display:flex;align-items:center;gap:.5rem;padding:.375rem .875rem;background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--r-full)">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--success);animation:pulse 2s infinite;flex-shrink:0"></span>
            <span style="font-size:var(--text-sm);font-weight:600;color:var(--success-text);white-space:nowrap">
              <span class="pill-icon-sm">🚚 </span>{{ activeDeliveries() }}<span class="pill-label"> entrega{{ activeDeliveries() > 1 ? 's' : '' }} ativa{{ activeDeliveries() > 1 ? 's' : '' }}</span>
            </span>
          </div>

          <!-- User + logout -->
          <div style="display:flex;align-items:center;gap:.75rem">
            <div style="text-align:right;display:none" class="user-info-lg">
              <p style="font-size:var(--text-sm);font-weight:600;color:var(--text-primary)">{{ userName }}</p>
              <p style="font-size:var(--text-xs);color:var(--success-text)">Logística</p>
            </div>
            <div style="
              width:34px;height:34px;border-radius:50%;
              background:linear-gradient(135deg,#059669,#047857);
              display:flex;align-items:center;justify-content:center;
              font-size:.8rem;font-weight:700;color:#fff;flex-shrink:0
            ">{{ initials }}</div>
            <button
              (click)="logout()"
              style="
                display:flex;align-items:center;gap:.375rem;
                padding:.4rem .875rem;border-radius:var(--r-lg);
                background:var(--danger-bg);border:1px solid var(--danger-border);
                color:var(--danger-text);font-size:var(--text-sm);font-weight:500;
                transition:all var(--transition-fast);cursor:pointer
              "
              onmouseenter="this.style.background='rgba(239,68,68,.18)'"
              onmouseleave="this.style.background='var(--danger-bg)'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main style="flex:1;padding:1.75rem 0">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer minimal -->
      <footer style="padding:1.25rem;text-align:center;border-top:1px solid var(--border)">
        <p style="font-size:var(--text-xs);color:var(--text-tertiary)">
          VOLTZ Tech Store &copy; 2026 — Portal da Logística
        </p>
      </footer>

    </div>
  `
})
export class DeliveryLayoutComponent implements OnInit {
  userName = '';
  initials = '';
  activeDeliveries = signal(0);

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    const u = this.auth.getUser();
    if (!u) { this.router.navigate(['/login/delivery']); return; }

    this.userName = u.username || 'Carlos Mendes';
    this.initials = this.userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    this.ordersService.orders.subscribe({
      next: orders => {
        this.activeDeliveries.set(
          orders.filter(o => o.status === 'delivering' && o.deliveryPersonId === u.uid).length
        );
      },
      error: err => console.error('[DeliveryLayout] orders error:', err),
    });
  }

  async logout() {
    await this.auth.logout();
    this.toast.show('Logout realizado com sucesso');
    this.router.navigate(['/login/delivery']);
  }
}
