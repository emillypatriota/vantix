import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { OrdersService } from '../../services/orders.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badgeSignal?: () => number;
  exact?: boolean;
}

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor],
  template: `
    <!-- Loading enquanto auth resolve -->
    <div *ngIf="!ready" style="position:fixed;inset:0;background:#070d1c;display:flex;align-items:center;justify-content:center;z-index:9999">
      <div style="display:flex;flex-direction:column;align-items:center;gap:1.5rem">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#1d5bd6,#173d8c);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:#fff">V</div>
        <div style="width:24px;height:24px;border-radius:50%;border:2.5px solid rgba(58,111,240,.2);border-top-color:#3a6ff0;animation:spin .8s linear infinite"></div>
      </div>
    </div>

    <ng-container *ngIf="ready">

    <!-- Mobile overlay -->
    <div *ngIf="mobileOpen()" class="mobile-overlay" (click)="mobileOpen.set(false)"></div>

    <div class="admin-shell">

      <!-- ── Sidebar ────────────────────────────────────────── -->
      <aside class="admin-sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">

        <!-- Logo -->
        <div class="sidebar-logo">
          <a [routerLink]="dashboardRoute" class="logo-link" (click)="mobileOpen.set(false)">
            <div class="logo-mark">V</div>
            <div class="logo-text">
              <span class="logo-name">VANTIX</span>
              <span class="logo-sub">{{ roleSubtitle }}</span>
            </div>
          </a>
          <button class="sidebar-toggle-btn" (click)="toggleSidebar()" title="Recolher menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path *ngIf="!collapsed()" d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
              <path *ngIf="collapsed()"  d="M13 5l7 7-7 7M6 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">
          <ng-container *ngFor="let section of navSections">
            <span class="nav-section-label">{{ section.label }}</span>
            <a *ngFor="let item of section.items"
               class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: !!item.exact }"
               [title]="collapsed() ? item.label : ''"
               (click)="mobileOpen.set(false)">
              <span class="nav-icon" [innerHTML]="item.icon"></span>
              <span class="nav-label">{{ item.label }}</span>
              <span *ngIf="item.badgeSignal && item.badgeSignal() > 0" class="nav-badge">
                {{ item.badgeSignal() }}
              </span>
            </a>
          </ng-container>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <!-- Ver Site link -->
          <a routerLink="/" class="ver-site-link" [title]="collapsed() ? 'Ver Site' : ''" (click)="mobileOpen.set(false)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span class="nav-label">Ver Site</span>
          </a>

          <!-- User card -->
          <div class="user-card">
            <div class="user-avatar">{{ initials }}</div>
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ roleLabel }}</span>
            </div>
            <button class="logout-btn" (click)="logout()" title="Sair">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>

      </aside>

      <!-- ── Main body ──────────────────────────────────────── -->
      <div class="admin-body" [class.collapsed]="collapsed()">

        <!-- Topbar -->
        <header class="admin-topbar">
          <div class="topbar-left">
            <!-- Mobile hamburger -->
            <button class="hamburger-btn" (click)="mobileOpen.set(true)" title="Abrir menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>

            <div class="topbar-breadcrumb">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
              <span class="breadcrumb-current">{{ currentPage() }}</span>
            </div>
          </div>

          <div class="topbar-actions">
            <span class="online-badge">
              <span class="dot"></span>
              Online
            </span>

            <div class="topbar-divider"></div>

            <div class="topbar-user-info">
              <span class="topbar-user-name">{{ userName }}</span>
              <span class="topbar-user-role">{{ roleLabel }}</span>
            </div>

            <div class="topbar-avatar">{{ initials }}</div>
          </div>
        </header>

        <!-- Content -->
        <main class="admin-content">
          <router-outlet></router-outlet>
        </main>

      </div>
    </div>

    </ng-container>
  `,
  styles: [`
    :host { display: block; }

    /* Mobile overlay */
    .mobile-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      backdrop-filter: blur(2px); z-index: 199;
    }

    /* Sidebar collapsed: hide text elements */
    .admin-sidebar.collapsed .nav-section-label {
      opacity: 0; height: 0; padding: 0; margin: 0; overflow: hidden; pointer-events: none;
    }
    .admin-sidebar.collapsed .nav-label { display: none; }
    .admin-sidebar.collapsed .nav-badge { display: none; }
    .admin-sidebar.collapsed .logo-text { display: none; }
    .admin-sidebar.collapsed .user-info { display: none; }
    .admin-sidebar.collapsed .user-card { justify-content: center; gap: 0; }
    .admin-sidebar.collapsed .logout-btn { display: none; }
    .admin-sidebar.collapsed .ver-site-link { justify-content: center; }

    /* Nav section label */
    .nav-section-label {
      display: block; padding: .625rem 1.25rem .3rem;
      font-size: .65rem; font-weight: 700; letter-spacing: .1em;
      color: var(--text-muted, rgba(255,255,255,.3));
      transition: opacity .2s, height .2s;
      white-space: nowrap; overflow: hidden;
    }

    /* Nav item icon sizing */
    .nav-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .nav-icon svg { width: 18px; height: 18px; }

    /* Ver Site link */
    .ver-site-link {
      display: flex; align-items: center; gap: .75rem;
      padding: .6rem 1.25rem; margin: 0 .5rem .5rem;
      border-radius: 8px; font-size: .8rem; font-weight: 500;
      color: var(--text-muted, rgba(255,255,255,.4));
      text-decoration: none; transition: all .2s;
      border: 1px solid transparent;
      white-space: nowrap; overflow: hidden;
    }
    .ver-site-link:hover {
      color: var(--text-primary, #fff);
      background: rgba(255,255,255,.06);
      border-color: rgba(255,255,255,.08);
    }
    .ver-site-link svg { flex-shrink: 0; }

    /* Logo link */
    .logo-link { display: flex; align-items: center; gap: .75rem; text-decoration: none; min-width: 0; flex: 1; }

    /* Topbar left */
    .topbar-left { display: flex; align-items: center; gap: .75rem; }
    .hamburger-btn {
      display: none; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 8px;
      color: var(--text-secondary, rgba(255,255,255,.5));
      background: none; border: none; cursor: pointer; transition: all .2s;
    }
    .hamburger-btn:hover { color: var(--text-primary, #fff); background: rgba(255,255,255,.06); }

    /* Topbar divider */
    .topbar-divider { width: 1px; height: 1.25rem; background: var(--border, rgba(255,255,255,.1)); }

    /* Topbar user */
    .topbar-user-info { display: flex; flex-direction: column; align-items: flex-end; }
    .topbar-user-name { font-size: .8rem; font-weight: 600; color: var(--text-primary, #fff); }
    .topbar-user-role { font-size: .7rem; color: var(--text-brand, #3a6ff0); }
    .topbar-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-600, #1d5bd6), var(--brand-800, #173d8c));
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 700; color: #fff; flex-shrink: 0;
    }

    /* Breadcrumb current */
    .breadcrumb-current { font-size: .82rem; font-weight: 600; color: var(--text-primary, #fff); }

    /* Mobile sidebar */
    @media (max-width: 768px) {
      .hamburger-btn { display: flex !important; }
      .admin-sidebar {
        position: fixed !important; left: 0; top: 0; bottom: 0;
        z-index: 200; transform: translateX(-100%);
        transition: transform .3s cubic-bezier(.4,0,.2,1) !important;
      }
      .admin-sidebar.mobile-open { transform: translateX(0) !important; }
      .admin-sidebar.collapsed { width: 240px !important; }
      .admin-sidebar.collapsed .nav-section-label {
        opacity: 1 !important; height: auto !important; padding: .625rem 1.25rem .3rem !important;
        margin: 0 !important; pointer-events: auto !important;
      }
      .admin-sidebar.collapsed .nav-label { display: block !important; }
      .admin-sidebar.collapsed .nav-badge { display: flex !important; }
      .admin-sidebar.collapsed .logo-text { display: flex !important; }
      .admin-sidebar.collapsed .user-info { display: flex !important; }
      .admin-sidebar.collapsed .user-card { justify-content: flex-start !important; gap: .75rem !important; }
      .admin-sidebar.collapsed .logout-btn { display: flex !important; }
      .admin-sidebar.collapsed .ver-site-link { justify-content: flex-start !important; }
      .admin-body, .admin-body.collapsed { margin-left: 0 !important; }
      .topbar-user-info { display: none !important; }
    }
  `]
})
export class EmployeeLayoutComponent implements OnInit, OnDestroy {
  collapsed = signal(false);
  mobileOpen = signal(false);
  currentPage = signal('Dashboard');

  role = '';
  userName = '';
  roleLabel = '';
  roleSubtitle = '';
  initials = '';
  dashboardRoute = '/gerente/insights';

  navSections: { label: string; items: NavItem[] }[] = [];
  ready = false;

  private pendingCount = signal(0);
  private routerSub?: Subscription;
  private ordersSub?: Subscription;

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private ordersService: OrdersService,
    private cdr: ChangeDetectorRef
  ) {
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.currentPage.set(this.resolvePageTitle()));
  }

  async ngOnInit() {
    const u = await this.auth.ready;
    if (!u) { this.router.navigate(['/portais']); return; }

    this.role          = u.role ?? '';
    this.userName      = u.username || (u.role === 'manager' ? 'Roberto Silva' : 'Equipe Estoque');
    this.initials      = this.userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    this.currentPage.set(this.resolvePageTitle());

    if (u.role === 'manager') {
      this.roleLabel      = 'Gerente Geral';
      this.roleSubtitle   = 'ADMIN';
      this.dashboardRoute = '/gerente/insights';
      this.buildManagerNav();
    } else if (u.role === 'kitchen') {
      this.roleLabel      = 'Líder de Estoque';
      this.roleSubtitle   = 'ESTOQUE';
      this.dashboardRoute = '/estoque/painel';
      this.buildKitchenNav();
    }

    this.ordersSub = this.ordersService.orders.subscribe({
      // Gerente: pedidos aguardando pagamento · Estoque: pedidos pagos esperando separação
      next: orders => this.pendingCount.set(orders.filter(o => o.status === (u.role === 'kitchen' ? 'confirmed' : 'pending')).length),
      error: err => console.error('[EmployeeLayout] orders error:', err),
    });

    this.ready = true;
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.ordersSub?.unsubscribe();
  }

  private resolvePageTitle(): string {
    const url = this.router.url;
    if (url.includes('dashboard'))    return 'Dashboard';
    if (url.includes('pedidos'))      return 'Pedidos';
    if (url.includes('produtos'))     return 'Produtos';
    if (url.includes('estoque'))      return 'Estoque';
    if (url.includes('entregas'))     return 'Entregas';
    if (url.includes('insights'))     return 'Insights';
    if (url.includes('funcionarios')) return 'Funcionários';
    if (url.includes('painel'))       return 'Separação de Pedidos';
    return 'Dashboard';
  }

  private buildManagerNav() {
    this.navSections = [
      {
        label: 'VISÃO GERAL',
        items: [
          {
            label: 'Pedidos',
            route: '/gerente/pedidos',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
            badgeSignal: () => this.pendingCount(),
          },
        ]
      },
      {
        label: 'GESTÃO',
        items: [
          {
            label: 'Produtos',
            route: '/gerente/produtos',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/><path d="M9 12h6M9 16h4"/></svg>`,
          },
          {
            label: 'Separação',
            route: '/gerente/estoque',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>`,
          },
          {
            label: 'Entregas',
            route: '/gerente/entregas',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>`,
          },
        ]
      },
      {
        label: 'EQUIPE',
        items: [
          {
            label: 'Funcionários',
            route: '/gerente/funcionarios',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
          },
        ]
      },
      {
        label: 'ANALYTICS',
        items: [
          {
            label: 'Insights',
            route: '/gerente/insights',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
          },
        ]
      },
    ];
  }

  private buildKitchenNav() {
    this.navSections = [
      {
        label: 'OPERAÇÕES',
        items: [
          {
            label: 'Separação de Pedidos',
            route: '/estoque/painel',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>`,
            badgeSignal: () => this.pendingCount(),
          },
        ]
      },
    ];
  }

  toggleSidebar() {
    this.collapsed.update(v => !v);
  }

  async logout() {
    const role = this.role;
    await this.auth.logout();
    this.toast.show('Logout realizado com sucesso');
    this.router.navigate([`/login/${role}`]);
  }
}
