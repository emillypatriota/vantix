import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  template: `
    <div class="light-mode" style="display:flex;flex-direction:column;min-height:100vh;background:var(--bg-base)">

      <!-- Demo Banner -->
      <div class="demo-banner">
        <div class="demo-banner-inner">
          <div style="display:flex;align-items:center;gap:.625rem">
            <span class="status-dot online"></span>
            <span>Modo demonstração — loja virtual completa, sem vendas reais</span>
          </div>
          <a routerLink="/portais"
             style="display:inline-flex;align-items:center;gap:.375rem;padding:.2rem .75rem;border-radius:var(--r-full);border:1px solid var(--border-brand);font-size:.68rem;color:var(--brand-400);font-weight:500;transition:all var(--transition-fast)"
             onmouseenter="this.style.background='rgba(58,111,240,.08)'"
             onmouseleave="this.style.background=''">
            Portais Internos
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>

      <!-- Header -->
      <header class="site-header">
        <div class="header-inner">

          <!-- Logo -->
          <a routerLink="/" style="display:flex;flex-direction:column;gap:0;text-decoration:none;flex-shrink:0">
            <span class="logo-main">VOLTZ</span>
            <span class="logo-sub">TECH STORE</span>
          </a>

          <!-- Desktop nav -->
          <nav class="desktop-nav">
            <a routerLink="/"             routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">INÍCIO</a>
            <a routerLink="/produtos"     routerLinkActive="active">PRODUTOS</a>
            <a routerLink="/meus-pedidos" routerLinkActive="active">MEUS PEDIDOS</a>
          </nav>

          <!-- Right side actions -->
          <div style="display:flex;align-items:center;gap:.625rem">

            <!-- Cart button -->
            <div class="cart-btn-wrapper">
              <a routerLink="/carrinho"
                 style="display:flex;align-items:center;gap:.5rem;padding:.5rem .875rem;border-radius:var(--r-lg);background:rgba(255,255,255,.07);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.1);transition:all var(--transition-fast);text-decoration:none;font-size:.82rem;font-weight:500"
                 onmouseenter="this.style.background='rgba(255,255,255,.14)';this.style.borderColor='rgba(255,255,255,.22)'"
                 onmouseleave="this.style.background='rgba(255,255,255,.07)';this.style.borderColor='rgba(255,255,255,.1)'">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/>
                </svg>
                <span *ngIf="(cartCount$ | async)! > 0" style="font-weight:700">{{ cartCount$ | async }}</span>
                <span *ngIf="(cartCount$ | async)! === 0" style="opacity:.55;font-size:.78rem">Carrinho</span>
              </a>
              <span *ngIf="(cartCount$ | async)! > 0" class="cart-count">{{ cartCount$ | async }}</span>
            </div>

            <!-- Hamburger (mobile only) -->
            <button (click)="menuOpen = !menuOpen" class="hamburger-btn" aria-label="Menu">
              <svg *ngIf="!menuOpen" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              <svg *ngIf="menuOpen" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <line x1="18" y1="6"  x2="6" y2="18"/>
                <line x1="6"  y1="6"  x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Mobile overlay -->
      <div *ngIf="menuOpen"
           (click)="menuOpen = false"
           style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:149;backdrop-filter:blur(4px);animation:fadeIn .2s ease">
      </div>

      <!-- Mobile slide-in menu -->
      <div class="mobile-nav-panel" [class.mobile-nav-open]="menuOpen">
        <div style="padding:1.5rem 1.5rem 1rem;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-family:var(--font-display);font-size:1.5rem;letter-spacing:.12em;color:#fff">VOLTZ</div>
            <div style="font-size:.55rem;letter-spacing:.3em;color:var(--brand-500)">TECH STORE</div>
          </div>
          <button (click)="menuOpen = false" style="width:36px;height:36px;border-radius:var(--r-lg);background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <nav style="padding:1rem 1rem;display:flex;flex-direction:column;gap:.25rem">
          <a routerLink="/"             [routerLinkActiveOptions]="{exact:true}" routerLinkActive="mobile-nav-active" (click)="menuOpen=false" class="mobile-nav-link">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Início
          </a>
          <a routerLink="/produtos"     routerLinkActive="mobile-nav-active" (click)="menuOpen=false" class="mobile-nav-link">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Produtos
          </a>
          <a routerLink="/carrinho"     routerLinkActive="mobile-nav-active" (click)="menuOpen=false" class="mobile-nav-link">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/></svg>
            Carrinho
            <span *ngIf="(cartCount$ | async)! > 0"
                  style="margin-left:auto;background:var(--brand-600);color:#fff;border-radius:var(--r-full);padding:.1rem .5rem;font-size:.72rem;font-weight:700">
              {{ cartCount$ | async }}
            </span>
          </a>
          <a routerLink="/meus-pedidos" routerLinkActive="mobile-nav-active" (click)="menuOpen=false" class="mobile-nav-link">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Meus Pedidos
          </a>
        </nav>

        <div style="padding:1rem 1.5rem;border-top:1px solid rgba(255,255,255,.07);margin-top:auto">
          <a routerLink="/portais" (click)="menuOpen=false"
             style="display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.875rem;border-radius:var(--r-xl);background:rgba(58,111,240,.08);border:1px solid rgba(58,111,240,.2);color:var(--brand-400);font-size:.82rem;font-weight:600;text-decoration:none;transition:all .2s"
             onmouseenter="this.style.background='rgba(58,111,240,.14)'"
             onmouseleave="this.style.background='rgba(58,111,240,.08)'">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Portais Internos
          </a>
        </div>
      </div>

      <!-- Main content -->
      <main style="flex:1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="site-footer">
        <div class="container">
          <div class="grid-4" style="gap:3rem;margin-bottom:3rem">
            <div>
              <div style="margin-bottom:1.25rem">
                <div style="font-family:var(--font-display);font-size:1.6rem;color:#fff;letter-spacing:.12em">VOLTZ</div>
                <div style="font-size:.55rem;letter-spacing:.3em;color:var(--brand-500)">TECH STORE</div>
              </div>
              <p style="font-size:.82rem;color:rgba(255,255,255,.4);line-height:1.85;margin-bottom:1.25rem">
                Hardware, periféricos e eletrônicos das melhores marcas, com preço justo e entrega para todo o Brasil.
              </p>
              <div style="display:flex;align-items:center;gap:.5rem;font-size:.8rem;color:var(--success-text)">
                <span class="status-dot online"></span>
                Loja online 24h
              </div>
            </div>

            <div>
              <h4 style="color:rgba(255,255,255,.5);font-size:.68rem;letter-spacing:.2em;margin-bottom:1.25rem;font-family:var(--font-sans);text-transform:uppercase">Atendimento</h4>
              <div style="font-size:.82rem;color:rgba(255,255,255,.4);display:flex;flex-direction:column;gap:.5rem">
                <p>Seg – Sex: <span style="color:rgba(255,255,255,.8)">8h–20h</span></p>
                <p>Sábado: <span style="color:rgba(255,255,255,.8)">9h–15h</span></p>
              </div>
            </div>

            <div>
              <h4 style="color:rgba(255,255,255,.5);font-size:.68rem;letter-spacing:.2em;margin-bottom:1.25rem;font-family:var(--font-sans);text-transform:uppercase">Entrega</h4>
              <div style="font-size:.82rem;color:rgba(255,255,255,.4);display:flex;flex-direction:column;gap:.5rem">
                <p>Frete fixo: <span style="color:rgba(255,255,255,.8)">R$ 29,90</span></p>
                <p style="color:var(--brand-400);font-weight:500">Grátis acima de R$ 299</p>
                <p>Área: <span style="color:rgba(255,255,255,.8)">Todo o Brasil</span></p>
                <p>Envio: <span style="color:rgba(255,255,255,.8)">em até 24h</span></p>
              </div>
            </div>

            <div>
              <h4 style="color:rgba(255,255,255,.5);font-size:.68rem;letter-spacing:.2em;margin-bottom:1.25rem;font-family:var(--font-sans);text-transform:uppercase">Área Interna</h4>
              <div style="display:flex;flex-direction:column;gap:.625rem;font-size:.82rem">
                <a routerLink="/portais"        style="color:var(--brand-400);font-weight:500" onmouseenter="this.style.color='var(--brand-300)'" onmouseleave="this.style.color=''">→ Portais de Acesso</a>
                <a routerLink="/login/manager"  style="color:rgba(255,255,255,.4)" onmouseenter="this.style.color='rgba(255,255,255,.7)'" onmouseleave="this.style.color=''">Login Gerente</a>
                <a routerLink="/login/kitchen"  style="color:rgba(255,255,255,.4)" onmouseenter="this.style.color='rgba(255,255,255,.7)'" onmouseleave="this.style.color=''">Login Estoque</a>
                <a routerLink="/login/delivery" style="color:rgba(255,255,255,.4)" onmouseenter="this.style.color='rgba(255,255,255,.7)'" onmouseleave="this.style.color=''">Login Logística</a>
              </div>
            </div>
          </div>

          <div style="border-top:1px solid rgba(255,255,255,.07);padding-top:1.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;font-size:.78rem;color:rgba(255,255,255,.25)">
            <p>&copy; 2026 VOLTZ Tech Store. Todos os direitos reservados. Projeto acadêmico, sem vendas reais.</p>
            <p style="display:flex;align-items:center;gap:.5rem"><span class="status-dot online"></span> Sistema operacional</p>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }

    .desktop-nav {
      display: flex;
      gap: 2.5rem;
    }
    .desktop-nav a {
      font-size: .72rem;
      letter-spacing: .18em;
      font-weight: 500;
      color: rgba(255,255,255,.5);
      transition: color 150ms;
      text-transform: uppercase;
    }
    .desktop-nav a:hover, .desktop-nav a.active { color: var(--brand-400); }

    .hamburger-btn {
      display: none;
      width: 40px; height: 40px;
      border-radius: var(--r-lg);
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      color: rgba(255,255,255,.8);
      align-items: center; justify-content: center;
      transition: all 150ms;
    }
    .hamburger-btn:hover { background: rgba(255,255,255,.13); }

    .mobile-nav-panel {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: 288px;
      background: #0b1428;
      border-right: 1px solid rgba(255,255,255,.07);
      z-index: 150;
      display: flex;
      flex-direction: column;
      transform: translateX(-100%);
      transition: transform .3s cubic-bezier(.4,0,.2,1);
    }
    .mobile-nav-open { transform: translateX(0) !important; }

    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: .875rem;
      padding: .875rem 1rem;
      border-radius: var(--r-xl);
      color: rgba(255,255,255,.55);
      font-size: .9rem;
      font-weight: 500;
      transition: all .15s;
      text-decoration: none;
    }
    .mobile-nav-link:hover { background: rgba(255,255,255,.05); color: rgba(255,255,255,.9); }
    .mobile-nav-link.mobile-nav-active { background: rgba(58,111,240,.08); color: var(--brand-400); }
    .mobile-nav-link svg { flex-shrink: 0; }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
    }
    @media (max-width: 480px) {
      .grid-4 { grid-template-columns: 1fr 1fr !important; }
    }
  `]
})
export class MainLayoutComponent {
  cartCount$ = this.cart.count;
  menuOpen = false;
  constructor(private cart: CartService) {}
}
