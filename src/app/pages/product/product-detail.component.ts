import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuItem } from '../../models';
import { MenuService } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { ImgFallbackDirective } from '../../components/ui/img-fallback.directive';
import { AlsoBoughtComponent } from '../../components/ui/also-bought.component';
import { apiErrorMessage } from '../../core/api/auth.interceptor';

const MAX_INSTALLMENTS = 10;   // mesmo valor do catálogo e do checkout
const LOW_STOCK = 10;

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NgIf, RouterLink, ImgFallbackDirective, AlsoBoughtComponent],
  template: `
    <div class="pd-page">
      <div class="container">

        <a routerLink="/produtos" class="pd-back">← Voltar aos produtos</a>

        <!-- Carregando -->
        <div *ngIf="state() === 'loading'" class="pd-grid" aria-busy="true">
          <div class="pd-img-box pd-skel"></div>
          <div class="pd-info">
            <div class="pd-skel" style="height:1rem;width:30%"></div>
            <div class="pd-skel" style="height:2rem;width:85%"></div>
            <div class="pd-skel" style="height:5rem;width:100%"></div>
            <div class="pd-skel" style="height:3rem;width:50%"></div>
          </div>
        </div>

        <!-- Não encontrado / erro -->
        <div *ngIf="state() === 'notfound' || state() === 'error'" class="pd-empty">
          <div style="font-size:3rem">🔍</div>
          <h1 class="pd-empty-title">{{ state() === 'notfound' ? 'Produto não encontrado' : 'Não foi possível carregar o produto' }}</h1>
          <p class="pd-empty-text">{{ state() === 'notfound' ? 'Ele pode ter saído do catálogo. Veja os outros produtos disponíveis.' : errorMsg }}</p>
          <a routerLink="/produtos" class="btn btn-primary">Ver produtos</a>
        </div>

        <!-- Produto -->
        <ng-container *ngIf="state() === 'ready' && product() as p">
          <nav class="pd-crumbs" aria-label="Caminho">
            <a routerLink="/produtos">Produtos</a> <span aria-hidden="true">›</span>
            <span>{{ p.category }}</span>
          </nav>

          <div class="pd-grid">
            <div class="pd-img-box">
              <img [src]="p.image" [alt]="p.name" appImgFallback class="pd-img">
              <div class="pd-badges">
                <span *ngIf="discount(p) > 0" class="pd-badge pd-badge-off">-{{ discount(p) }}%</span>
                <span *ngIf="p.isSpecial" class="pd-badge pd-badge-star">★ DESTAQUE</span>
              </div>
            </div>

            <div class="pd-info">
              <p *ngIf="p.brand" class="pd-brand">{{ p.brand }}</p>
              <h1 class="pd-name">{{ p.name }}</h1>
              <p class="pd-cat">{{ p.category }}</p>

              <div class="pd-price-box">
                <p *ngIf="p.oldPrice && p.oldPrice > p.price" class="pd-old">
                  {{ brl(p.oldPrice) }} <span>economize {{ brl(p.oldPrice - p.price) }}</span>
                </p>
                <p class="pd-price">{{ brl(p.price) }}</p>
                <p class="pd-inst">em até {{ maxInstallments }}x de {{ brl(p.price / maxInstallments) }} sem juros</p>
              </div>

              <p class="pd-stock" [class.pd-stock-low]="lowStock(p)" [class.pd-stock-out]="soldOut(p)">
                {{ soldOut(p) ? 'Esgotado' : lowStock(p) ? 'Restam só ' + p.stock + ' unidades' : 'Em estoque' }}
              </p>

              <div class="pd-actions">
                <button class="btn btn-primary btn-lg pd-btn" (click)="add(p)" [disabled]="soldOut(p) || !available(p)">
                  {{ soldOut(p) ? 'Esgotado' : !available(p) ? 'Indisponível' : 'Adicionar ao carrinho' }}
                </button>
                <button *ngIf="!soldOut(p) && available(p)" class="btn btn-outline btn-lg pd-btn" (click)="buyNow(p)">Comprar agora</button>
              </div>
              <p *ngIf="inCart(p) > 0" class="pd-incart">{{ inCart(p) }} no carrinho · <a routerLink="/carrinho">ver carrinho</a></p>

              <div class="pd-desc">
                <h2>Descrição</h2>
                <p>{{ p.description || 'Sem descrição cadastrada.' }}</p>
              </div>

              <ul class="pd-perks">
                <li>🚚 Frete grátis acima de R$ 299 · envio em até 24h</li>
                <li>🛡️ Garantia oficial do fabricante</li>
                <li>🔁 7 dias para troca ou devolução</li>
              </ul>
            </div>
          </div>

          <app-also-bought [productIds]="[p.id]" [title]="'Quem comprou ' + p.name + ' também levou'"></app-also-bought>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .pd-page { background:var(--stone-50); padding:2rem 0 4rem; min-height:70vh; }
    .pd-back { display:inline-block; font-size:.85rem; color:var(--stone-500); margin-bottom:1rem; text-decoration:none; }
    .pd-back:hover { color:var(--brand-700); }
    .pd-crumbs { font-size:.78rem; color:var(--stone-400); margin-bottom:1rem; display:flex; gap:.4rem; flex-wrap:wrap; }
    .pd-crumbs a { color:var(--stone-500); text-decoration:none; }
    .pd-crumbs a:hover { color:var(--brand-700); }
    .pd-grid { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); gap:2.5rem; align-items:start; }
    .pd-img-box { position:relative; background:#fff; border:1px solid var(--stone-200); border-radius:var(--r-2xl); overflow:hidden; aspect-ratio:4/3; max-width:100%; }
    .pd-img { width:100%; height:100%; object-fit:cover; display:block; }
    .pd-badges { position:absolute; top:1rem; left:1rem; display:flex; gap:.4rem; flex-wrap:wrap; }
    .pd-badge { padding:.3rem .65rem; font-size:.7rem; font-weight:800; border-radius:var(--r-sm); color:#fff; letter-spacing:.06em; }
    .pd-badge-off { background:var(--brand-600); }
    .pd-badge-star { background:var(--stone-900); }
    .pd-info { display:flex; flex-direction:column; gap:.875rem; min-width:0; }
    .pd-brand { font-size:.72rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--brand-600); }
    .pd-name { font-family:var(--font-display); font-size:clamp(1.5rem,3vw,2.1rem); line-height:1.2; color:var(--stone-900); text-wrap:balance; overflow-wrap:anywhere; }
    .pd-cat { font-size:.82rem; color:var(--stone-500); margin-top:-.4rem; }
    .pd-price-box { background:#fff; border:1px solid var(--stone-200); border-radius:var(--r-xl); padding:1rem 1.25rem; }
    .pd-old { font-size:.85rem; color:var(--stone-400); text-decoration:line-through; }
    .pd-old span { text-decoration:none; display:inline-block; margin-left:.4rem; color:#15803d; font-weight:600; font-size:.78rem; }
    .pd-price { font-family:var(--font-display); font-size:2.1rem; font-weight:800; color:var(--brand-700); line-height:1.15; }
    .pd-inst { font-size:.85rem; color:var(--stone-600); }
    .pd-stock { font-size:.85rem; font-weight:600; color:#15803d; }
    .pd-stock-low { color:#b45309; }
    .pd-stock-out { color:#b91c1c; }
    .pd-actions { display:flex; gap:.75rem; flex-wrap:wrap; }
    .pd-btn { flex:1 1 200px; justify-content:center; }
    .pd-incart { font-size:.82rem; color:var(--stone-500); }
    .pd-incart a { color:var(--brand-700); }
    .pd-desc h2 { font-family:var(--font-display); font-size:1.05rem; color:var(--stone-900); margin-bottom:.4rem; }
    .pd-desc p { font-size:.92rem; color:var(--stone-600); line-height:1.75; max-width:65ch; }
    .pd-perks { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:.4rem; font-size:.85rem; color:var(--stone-600);
      border-top:1px solid var(--stone-200); padding-top:.875rem; }
    .pd-empty { text-align:center; padding:4rem 1.5rem; background:#fff; border:1px solid var(--stone-200); border-radius:var(--r-2xl); display:flex; flex-direction:column; align-items:center; gap:.75rem; }
    .pd-empty-title { font-family:var(--font-display); font-size:1.5rem; color:var(--stone-900); }
    .pd-empty-text { color:var(--stone-500); font-size:.9rem; max-width:44ch; }
    .pd-skel { border-radius:var(--r-lg); background:linear-gradient(90deg,#e3e1da 25%,#cbd5e1 50%,#e3e1da 75%); background-size:200% 100%; animation:pdShimmer 1.4s infinite; }
    @keyframes pdShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @media (max-width: 860px) { .pd-grid { grid-template-columns:minmax(0,1fr); gap:1.5rem; } }
    @media (prefers-reduced-motion: reduce) { .pd-skel { animation:none; } }
  `],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menu = inject(MenuService);
  private cart = inject(CartService);
  private toast = inject(ToastService);

  product = signal<MenuItem | null>(null);
  state = signal<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  errorMsg = '';
  maxInstallments = MAX_INSTALLMENTS;
  private cartQty = signal<Map<string, number>>(new Map());
  private subs = new Subscription();

  ngOnInit() {
    // A mesma página troca de produto ao clicar numa recomendação, por isso escuta o id.
    this.subs.add(this.route.paramMap.subscribe(pm => this.load(pm.get('id') ?? '')));
    this.subs.add(this.cart.items.subscribe(items => this.cartQty.set(new Map(items.map(i => [i.id, i.quantity])))));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  private async load(id: string) {
    this.state.set('loading');
    window.scrollTo({ top: 0 });
    try {
      const p = await this.menu.getById(id);
      this.product.set(p);
      this.state.set(p ? 'ready' : 'notfound');
    } catch (err) {
      this.errorMsg = apiErrorMessage(err, 'Tente novamente em instantes.');
      this.state.set('error');
    }
  }

  brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  discount(p: MenuItem) { return p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }
  soldOut(p: MenuItem)   { return p.stock !== undefined && p.stock <= 0; }
  lowStock(p: MenuItem)  { return p.stock !== undefined && p.stock > 0 && p.stock <= LOW_STOCK; }
  available(p: MenuItem) { return p.active !== false; }
  inCart(p: MenuItem)    { return this.cartQty().get(p.id) ?? 0; }

  add(p: MenuItem) {
    this.cart.addItem(p);
    this.toast.show(`${p.name} adicionado! 🛒`);
  }

  buyNow(p: MenuItem) {
    if (this.inCart(p) === 0) this.cart.addItem(p);
    this.router.navigate(['/carrinho']);
  }
}
