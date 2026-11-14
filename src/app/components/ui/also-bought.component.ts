import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuItem } from '../../models';
import { RecommendationService } from '../../services/recommendation.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { ImgFallbackDirective } from './img-fallback.directive';

/**
 * Seção "Quem comprou também levou".
 * Uso: <app-also-bought [productIds]="['3','7']" title="..." subtitle="..." tag="..."></app-also-bought>
 * Não aparece se a API não devolver nenhuma recomendação.
 */
@Component({
  selector: 'app-also-bought',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ImgFallbackDirective],
  template: `
    <section *ngIf="items.length" class="ab-wrap animate-fade-up" aria-label="Recomendações">
      <div class="ab-head">
        <div>
          <p class="ab-tag">{{ tag }}</p>
          <h3 class="ab-title">{{ title }}</h3>
          <p *ngIf="subtitle" class="ab-sub">{{ subtitle }}</p>
        </div>
        <ng-content></ng-content>
      </div>
      <div class="ab-grid">
        <article *ngFor="let p of items; trackBy: trackById" class="ab-card">
          <a [routerLink]="['/produtos', p.id]" class="ab-link" [attr.aria-label]="'Ver detalhes de ' + p.name">
            <img [src]="p.image" [alt]="p.name" appImgFallback loading="lazy" class="ab-img">
          </a>
          <div class="ab-body">
            <p *ngIf="p.brand" class="ab-brand">{{ p.brand }}</p>
            <a [routerLink]="['/produtos', p.id]" class="ab-name">{{ p.name }}</a>
            <p class="ab-price">{{ brl(p.price) }}</p>
            <button class="btn btn-primary btn-sm ab-btn" (click)="add(p)">
              {{ inCart(p) ? '+1 no carrinho' : 'Adicionar' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .ab-wrap { background:#fff; border:1px solid var(--stone-200); border-radius:var(--r-xl); padding:1.25rem; margin:1.5rem 0; }
    .ab-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
    .ab-tag { font-size:.65rem; font-weight:700; letter-spacing:.14em; color:var(--brand-600); margin-bottom:.2rem; }
    .ab-title { font-family:var(--font-display); font-size:1.15rem; color:var(--stone-900); line-height:1.3; }
    .ab-sub { font-size:.8rem; color:var(--stone-500); margin-top:.15rem; }
    .ab-link { display:block; }
    .ab-name:hover { color:var(--brand-700); }
    .ab-link:focus-visible, .ab-name:focus-visible { outline:2px solid var(--brand-400); outline-offset:2px; }
    .ab-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:.875rem; }
    .ab-card { display:flex; flex-direction:column; border:1px solid var(--stone-100); border-radius:var(--r-lg); overflow:hidden; background:var(--stone-50); }
    .ab-img { width:100%; aspect-ratio:16/10; object-fit:cover; background:var(--stone-100); }
    .ab-body { padding:.75rem; display:flex; flex-direction:column; gap:.2rem; flex:1; }
    .ab-brand { font-size:.62rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--brand-600); }
    .ab-name { text-decoration:none; font-size:.8rem; font-weight:600; color:var(--stone-800); line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.7em; }
    .ab-price { font-family:var(--font-display); font-weight:800; color:var(--brand-700); margin:.15rem 0 .5rem; }
    .ab-btn { margin-top:auto; width:100%; justify-content:center; }
    @media (max-width:480px) { .ab-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  `],
})
export class AlsoBoughtComponent implements OnChanges, OnDestroy {
  @Input() productIds: string[] = [];
  @Input() title = 'Quem comprou também levou';
  @Input() subtitle = '';
  @Input() tag = 'RECOMENDADO PARA VOCÊ';
  @Input() limit = 4;

  items: MenuItem[] = [];
  private sub?: Subscription;
  private lastKey = '';

  private recs = inject(RecommendationService);
  private cart = inject(CartService);
  private toast = inject(ToastService);

  ngOnChanges() {
    const key = [...this.productIds].sort().join(',');
    if (key === this.lastKey) return;   // evita nova chamada quando só a quantidade muda
    this.lastKey = key;
    this.sub?.unsubscribe();
    this.sub = this.recs.forProducts(this.productIds, this.limit).subscribe(list => this.items = list);
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  trackById(_: number, p: MenuItem) { return p.id; }
  inCart(p: MenuItem) { return this.cart.getItems().some(i => i.id === p.id); }
  brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

  add(p: MenuItem) {
    this.cart.addItem(p);
    this.toast.show(`${p.name} adicionado! 🛒`);
  }
}
