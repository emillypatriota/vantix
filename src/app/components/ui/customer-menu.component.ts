import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { ToastService } from '../../services/toast.service';
import { apiErrorMessage } from '../../core/api/auth.interceptor';

/**
 * Perfil do cliente no cabeçalho da loja.
 * variant="header": botão + menu flutuante (computador).
 * variant="panel": bloco dentro do menu lateral (celular).
 */
@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [NgIf, NgTemplateOutlet, FormsModule, RouterLink],
  template: `
    <!-- Cliente conhecido -->
    <ng-container *ngIf="customers.customer(); else anon">
      <ng-container *ngIf="variant === 'header'; else panelKnown">
        <button type="button" class="cm-trigger" (click)="open = !open" [attr.aria-expanded]="open" aria-haspopup="true">
          <span class="cm-avatar">{{ initial }}</span>
          Olá, {{ customers.firstName() || 'cliente' }}
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div *ngIf="open" class="cm-pop" role="menu">
          <p class="cm-pop-name">{{ customers.customer()?.name || 'Cliente' }}</p>
          <p class="cm-pop-sub">{{ customers.customer()?.phone }}</p>
          <a routerLink="/meus-pedidos" (click)="close()" class="cm-item" role="menuitem">Meus pedidos</a>
          <button type="button" (click)="logout()" class="cm-item cm-item-muted" role="menuitem">Não é você? Sair</button>
        </div>
      </ng-container>
      <ng-template #panelKnown>
        <div class="cm-panel">
          <p class="cm-panel-hello"><span class="cm-avatar">{{ initial }}</span> Olá, {{ customers.firstName() || 'cliente' }}</p>
          <button type="button" (click)="logout()" class="cm-link">Não é você? Sair</button>
        </div>
      </ng-template>
    </ng-container>

    <!-- Cliente desconhecido -->
    <ng-template #anon>
      <ng-container *ngIf="variant === 'header'; else panelAnon">
        <button type="button" class="cm-trigger" (click)="open = !open" [attr.aria-expanded]="open">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Identificar-se
        </button>
        <div *ngIf="open" class="cm-pop">
          <ng-container *ngTemplateOutlet="form"></ng-container>
        </div>
      </ng-container>
      <ng-template #panelAnon>
        <div class="cm-panel"><ng-container *ngTemplateOutlet="form"></ng-container></div>
      </ng-template>
    </ng-template>

    <ng-template #form>
      <form (ngSubmit)="identify()" class="cm-form">
        <label class="cm-label" [for]="inputId">Já comprou aqui? Digite seu telefone</label>
        <input [id]="inputId" name="identifyPhone" class="cm-input" inputmode="tel" autocomplete="tel"
               placeholder="(11) 98765-4321" maxlength="15"
               [value]="phone" (input)="formatPhone($event)">
        <p *ngIf="error" class="cm-error">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-sm cm-submit" [disabled]="loading">
          {{ loading ? 'Buscando...' : 'Identificar-se' }}
        </button>
        <p class="cm-hint">Mostramos seus pedidos e recomendações com base nas suas compras.</p>
      </form>
    </ng-template>
  `,
  styles: [`
    :host { position: relative; display: block; }
    .cm-trigger { display:flex; align-items:center; gap:.45rem; padding:.45rem .8rem; border-radius:var(--r-lg);
      background:rgba(255,255,255,.07); color:rgba(255,255,255,.85); border:1px solid rgba(255,255,255,.1);
      font-size:.8rem; font-weight:500; cursor:pointer; white-space:nowrap; transition:all 150ms; }
    .cm-trigger:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.22); }
    .cm-trigger:focus-visible, .cm-item:focus-visible, .cm-link:focus-visible { outline:2px solid var(--brand-400); outline-offset:2px; }
    .cm-avatar { width:22px; height:22px; border-radius:50%; background:var(--brand-600); color:#fff; display:inline-flex;
      align-items:center; justify-content:center; font-size:.7rem; font-weight:700; flex-shrink:0; }
    .cm-pop { position:absolute; right:0; top:calc(100% + .5rem); width:270px; background:#fff; color:var(--stone-800);
      border:1px solid var(--stone-200); border-radius:var(--r-xl); box-shadow:0 12px 32px rgba(11,27,63,.22); padding:1rem; z-index:200; }
    .cm-pop-name { font-weight:700; color:var(--stone-900); }
    .cm-pop-sub { font-size:.78rem; color:var(--stone-500); margin-bottom:.625rem; }
    .cm-item { display:block; width:100%; text-align:left; padding:.55rem .625rem; border-radius:var(--r-md); font-size:.85rem;
      color:var(--stone-800); background:none; border:none; cursor:pointer; text-decoration:none; }
    .cm-item:hover { background:var(--stone-100); }
    .cm-item-muted { color:var(--stone-500); }
    .cm-form { display:flex; flex-direction:column; gap:.5rem; }
    .cm-label { font-size:.8rem; font-weight:600; color:inherit; }
    .cm-input { width:100%; padding:.6rem .75rem; border-radius:var(--r-md); border:1px solid var(--stone-300); font-size:.9rem;
      background:#fff; color:var(--stone-900); }
    .cm-input:focus { outline:2px solid var(--brand-400); border-color:transparent; }
    .cm-error { font-size:.78rem; color:var(--danger-text, #b91c1c); }
    .cm-submit { justify-content:center; width:100%; }
    .cm-hint { font-size:.72rem; color:var(--stone-500); line-height:1.5; }
    .cm-panel { padding:1rem 1.5rem; border-bottom:1px solid rgba(255,255,255,.07); color:rgba(255,255,255,.85); }
    .cm-panel .cm-label { color:rgba(255,255,255,.8); }
    .cm-panel .cm-hint { color:rgba(255,255,255,.4); }
    .cm-panel-hello { display:flex; align-items:center; gap:.5rem; font-weight:600; margin-bottom:.5rem; }
    .cm-link { background:none; border:none; padding:0; color:var(--brand-400); font-size:.82rem; cursor:pointer; }
  `],
})
export class CustomerMenuComponent {
  @Input() variant: 'header' | 'panel' = 'header';
  /** Avisa o menu lateral para fechar depois de identificar ou sair. */
  @Output() done = new EventEmitter<void>();

  customers = inject(CustomerService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  open = false;
  phone = '';
  error = '';
  loading = false;
  inputId = `cm-phone-${Math.random().toString(36).slice(2, 8)}`;

  get initial() { return (this.customers.firstName() || 'C').charAt(0).toUpperCase(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this.open && !this.host.nativeElement.contains(e.target as Node)) this.open = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.open = false; }

  close() { this.open = false; this.done.emit(); }

  formatPhone(e: Event) {
    const el = e.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 7)      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    this.phone = v;
    el.value = v;
    this.error = '';
  }

  async identify() {
    if (this.phone.replace(/\D/g, '').length < 10) { this.error = 'Digite o telefone com DDD.'; return; }
    this.error = '';
    this.loading = true;
    try {
      const found = await this.customers.identify(this.phone);
      if (!found) { this.error = 'Não encontramos compras com esse telefone.'; return; }
      this.toast.show(`Olá, ${this.customers.firstName() || 'cliente'}! Separamos recomendações para você.`);
      this.phone = '';
      this.close();
    } catch (err) {
      this.error = apiErrorMessage(err, 'Não foi possível buscar agora. Tente de novo.');
    } finally {
      this.loading = false;
    }
  }

  logout() {
    this.customers.forget();
    this.toast.show('Pronto, você saiu. Até a próxima!');
    this.close();
    if (this.router.url.startsWith('/meus-pedidos')) this.router.navigate(['/']);
  }
}
