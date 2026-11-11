import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { UserRole } from '../../../models';

// Usuários do 02_dados.sql (tabela usuario_painel):
// gerente@voltz.com    / voltz2024
// estoque@voltz.com    / voltz2024
// logistica@voltz.com / voltz2024

function makeLoginComponent(
  role: UserRole,
  label: string,
  subtitle: string,
  redirect: string,
  bgImage: string,
  accentColor: string,
  accentColorDark: string,
  emailHint: string
) {
  @Component({
    standalone: true,
    imports: [FormsModule, NgIf, NgFor, RouterLink],
    template: `
      <div class="login-grid" style="min-height:100vh;display:grid;grid-template-columns:1fr 1fr">

        <!-- Left: image panel -->
        <div class="login-left" style="position:relative;overflow:hidden">
          <img [src]="bgImg" alt="" style="width:100%;height:100%;object-fit:cover;display:block">
          <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(7,13,28,.96) 0%,rgba(7,13,28,.7) 55%,rgba(7,13,28,.2) 100%)"></div>

          <!-- Glow -->
          <div style="position:absolute;bottom:-10%;left:-10%;width:400px;height:400px;border-radius:50%;pointer-events:none"
               [style.background]="'radial-gradient(circle,' + accentCol + '14' + ' 0%,transparent 70%)'"></div>

          <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:2.5rem">
            <!-- Logo -->
            <a routerLink="/" style="display:inline-flex;align-items:center;gap:.75rem;text-decoration:none;width:fit-content">
              <div style="width:38px;height:38px;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:#fff"
                   [style.background]="'linear-gradient(135deg,' + accentCol + ',' + accentColDark + ')'">V</div>
              <div>
                <div style="font-family:var(--font-display);font-size:1.25rem;letter-spacing:.12em;color:#fff">VOLTZ</div>
                <div style="font-size:.55rem;letter-spacing:.3em;margin-top:-3px" [style.color]="accentCol">TECH STORE</div>
              </div>
            </a>

            <!-- Portal label -->
            <div>
              <div style="display:flex;align-items:center;gap:.625rem;margin-bottom:1.25rem">
                <div style="height:1px;width:2rem" [style.background]="accentCol"></div>
                <span style="font-size:.65rem;letter-spacing:.25em;font-weight:700;text-transform:uppercase" [style.color]="accentCol">ÁREA RESTRITA</span>
              </div>
              <h2 style="font-family:var(--font-display);font-size:2.75rem;color:#fff;line-height:1.1;margin-bottom:1rem">{{ portalLabel }}</h2>
              <p style="color:rgba(255,255,255,.45);font-size:.875rem;line-height:1.75;max-width:320px">{{ portalSubtitle }}</p>

              <!-- Feature bullets -->
              <div style="margin-top:1.75rem;display:flex;flex-direction:column;gap:.625rem">
                <div *ngFor="let f of features" style="display:flex;align-items:center;gap:.625rem">
                  <div style="width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.7rem"
                       [style.background]="accentCol + '22'" [style.color]="accentCol">✓</div>
                  <span style="font-size:.8rem;color:rgba(255,255,255,.5)">{{ f }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: form panel -->
        <div style="display:flex;align-items:center;justify-content:center;padding:3rem 2rem;background:#070d1c;position:relative;overflow:hidden">
          <!-- Subtle glow -->
          <div style="position:absolute;top:-10%;right:-10%;width:350px;height:350px;border-radius:50%;opacity:.05;pointer-events:none"
               [style.background]="accentCol"></div>

          <div style="width:100%;max-width:400px;position:relative;z-index:1">

            <!-- Header -->
            <div style="margin-bottom:2.5rem">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:1.25rem">
                <div style="height:2px;width:1.5rem;border-radius:var(--r-full)" [style.background]="accentCol"></div>
                <span style="font-size:.65rem;letter-spacing:.2em;font-weight:700;text-transform:uppercase" [style.color]="accentCol">LOGIN</span>
              </div>
              <h1 style="font-family:var(--font-display);font-size:2.25rem;color:var(--text-primary);margin-bottom:.375rem">Bem-vindo</h1>
              <p style="color:var(--text-tertiary);font-size:.875rem">Acesso exclusivo para colaboradores VOLTZ</p>
            </div>

            <!-- Form -->
            <form (ngSubmit)="login()" style="display:flex;flex-direction:column;gap:1.25rem">

              <div class="form-group">
                <label class="form-label">E-mail</label>
                <div class="search-input-wrapper">
                  <div class="search-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <input class="form-input" type="email" [(ngModel)]="email" name="email" required
                         [placeholder]="emailPlaceholder" autocomplete="email">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Senha</label>
                <div style="position:relative">
                  <input class="form-input" [type]="showPass?'text':'password'"
                         [(ngModel)]="password" name="password" required
                         placeholder="••••••••" autocomplete="current-password"
                         style="padding-right:4rem">
                  <button type="button" (click)="showPass=!showPass"
                          style="position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:.72rem;font-weight:600;padding:0;transition:color var(--transition-fast)"
                          [style.color]="accentCol">
                    {{ showPass ? 'OCULTAR' : 'MOSTRAR' }}
                  </button>
                </div>
              </div>

              <!-- Error -->
              <div *ngIf="error"
                   style="background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--r-lg);padding:.875rem 1rem;font-size:.84rem;color:var(--danger-text);display:flex;align-items:center;gap:.625rem;animation:fadeUp .3s ease">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ error }}
              </div>

              <!-- Submit -->
              <button type="submit"
                      style="height:3rem;border-radius:var(--r-lg);color:#fff;font-size:.9375rem;font-weight:600;border:none;cursor:pointer;transition:all var(--transition-base);display:flex;align-items:center;justify-content:center;gap:.625rem;margin-top:.25rem"
                      [style.background]="loading ? 'var(--text-tertiary)' : accentCol"
                      [style.opacity]="loading ? '.75' : '1'"
                      [disabled]="loading"
                      onmouseenter="if(!this.disabled){this.style.transform='translateY(-1px)';this.style.boxShadow='0 8px 20px rgba(0,0,0,.3)'}"
                      onmouseleave="this.style.transform='';this.style.boxShadow=''">
                <span *ngIf="loading" style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite"></span>
                {{ loading ? 'Autenticando...' : 'Entrar no Portal' }}
              </button>
            </form>

            <!-- Demo credentials card -->
            <div style="margin-top:2rem;padding:1.125rem;background:var(--bg-card-alt);border:1px solid var(--border-strong);border-radius:var(--r-xl)">
              <p style="font-size:.65rem;color:var(--text-tertiary);letter-spacing:.12em;font-weight:600;margin-bottom:.875rem;text-transform:uppercase">
                Credenciais de Demonstração
              </p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;font-size:.82rem;margin-bottom:1rem">
                <div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:.5rem .75rem">
                  <p style="font-size:.62rem;color:var(--text-tertiary);margin-bottom:2px;letter-spacing:.05em">E-MAIL</p>
                  <strong style="font-family:var(--font-mono);color:var(--text-primary);font-size:.78rem">{{ emailPlaceholder }}</strong>
                </div>
                <div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:.5rem .75rem">
                  <p style="font-size:.62rem;color:var(--text-tertiary);margin-bottom:2px;letter-spacing:.05em">SENHA</p>
                  <strong style="font-family:var(--font-mono);color:var(--text-primary)">voltz2024</strong>
                </div>
              </div>
              <button (click)="fillDemo()"
                      style="font-size:.8rem;font-weight:600;background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;gap:.375rem;transition:opacity var(--transition-fast)"
                      [style.color]="accentCol"
                      onmouseenter="this.style.opacity='.75'"
                      onmouseleave="this.style.opacity='1'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                Preencher automaticamente
              </button>
            </div>

            <div style="margin-top:1.5rem;text-align:center">
              <a routerLink="/portais"
                 style="font-size:.82rem;color:var(--text-tertiary);transition:color var(--transition-fast);display:inline-flex;align-items:center;gap:.375rem"
                 onmouseenter="this.style.color='var(--text-secondary)'"
                 onmouseleave="this.style.color=''">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Voltar aos portais
              </a>
            </div>
          </div>
        </div>

      </div>
    `,
    styles: [`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeUp { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
      @media (max-width: 768px) {
        .login-grid { grid-template-columns: minmax(0,1fr) !important; }
        .login-left { display: none !important; }
      }
    `]
  })
  class LoginComponent {
    email = '';
    password = '';
    error = '';
    loading = false;
    showPass = false;
    portalLabel   = label;
    portalSubtitle = subtitle;
    bgImg          = bgImage;
    accentCol      = accentColor;
    accentColDark  = accentColorDark;
    emailPlaceholder = emailHint;
    features: string[] = [];

    constructor(
      private auth: AuthService,
      private toast: ToastService,
      private router: Router
    ) {
      if (role === 'manager') {
        this.features = ['Dashboard com métricas em tempo real', 'Gestão completa do catálogo', 'Controle de pedidos e entregas'];
      } else if (role === 'kitchen') {
        this.features = ['Kanban visual de pedidos', 'Separação e conferência em tempo real', 'Notificações de novos pedidos'];
      } else {
        this.features = ['Pacotes prontos para envio', 'Acompanhamento de rotas', 'Histórico de entregas'];
      }
    }

    fillDemo() {
      this.email    = this.emailPlaceholder;
      this.password = 'voltz2024';
    }

    async login() {
      if (!this.email || !this.password) {
        this.error = 'Preencha todos os campos.';
        return;
      }
      this.error = '';
      this.loading = true;
      try {
        await this.auth.loginWithEmail(this.email, this.password);
        this.toast.show('Acesso autorizado. Bem-vindo!');
        // Usa navegação nativa: a sessão fica no localStorage, a página recarrega,
        // o AuthService lê a sessão ao iniciar e o guard libera a rota do painel.
        setTimeout(() => { window.location.assign(redirect); }, 400);
      } catch (err: any) {
        const msg = err?.message ?? '';
        this.error = msg.includes('não autorizada')
          ? msg
          : 'E-mail ou senha incorretos. Verifique as credenciais.';
        this.loading = false;
      }
    }
  }

  return LoginComponent;
}

export const ManagerLoginComponent = makeLoginComponent(
  'manager',
  'Portal do Gerente',
  'Gerencie pedidos, catálogo e acompanhe métricas em tempo real de toda a operação.',
  '/gerente/dashboard',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=85',
  '#1d5bd6',
  '#173d8c',
  'gerente@voltz.com'
);

export const KitchenLoginComponent = makeLoginComponent(
  'kitchen',
  'Portal do Estoque',
  'Kanban em tempo real. Da separação à embalagem de cada pedido.',
  '/estoque/painel',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=85',
  '#0284c7',
  '#075985',
  'estoque@voltz.com'
);

export const DeliveryLoginComponent = makeLoginComponent(
  'delivery',
  'Portal da Logística',
  'Despache pacotes, acompanhe envios e confirme entregas com facilidade.',
  '/logistica/painel',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=900&q=85',
  '#0d9488',
  '#115e59',
  'logistica@voltz.com'
);
