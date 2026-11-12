import { Component, signal, computed } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { MenuItem } from '../../models';
import { ImgFallbackDirective } from '../../components/ui/img-fallback.directive';
import { AlsoBoughtComponent } from '../../components/ui/also-bought.component';

const ALL = 'Todos';
const CAT_ICONS: Record<string, string> = {
  'Todos': '🛍️',
  'Hardware': '🧩',
  'Periféricos': '⌨️',
  'Monitores': '🖥️',
  'Notebooks': '💻',
  'Smartphones': '📱',
  'Games': '🎮',
  'Áudio': '🎧',
};
const MAX_INSTALLMENTS = 10;

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ImgFallbackDirective, AlsoBoughtComponent],
  template: `
    <!-- Hero do catálogo -->
    <div style="background:linear-gradient(160deg,#070d1c 0%,#0b1b3f 60%,#173d8c 100%);padding:3.5rem 0 0;position:relative;overflow:hidden">
      <div style="position:absolute;top:-80px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(58,111,240,.18),transparent 70%);pointer-events:none"></div>

      <div class="container" style="text-align:center;position:relative;z-index:1">
        <div class="section-tag" style="justify-content:center;margin-bottom:.875rem">
          <div class="section-tag-line"></div>
          <span style="color:var(--amber-400)">OFERTAS TODOS OS DIAS</span>
          <div class="section-tag-line"></div>
        </div>
        <h1 style="font-family:var(--font-serif);font-size:clamp(2.5rem,5vw,4rem);color:#fff;margin-bottom:.625rem">Produtos</h1>
        <p style="color:rgba(255,255,255,.45);font-size:.9rem;margin-bottom:2rem">{{ allItems().length }} produtos · Hardware, periféricos, notebooks, games e mais</p>

        <!-- Search bar -->
        <div style="max-width:500px;margin:0 auto 0">
          <div style="position:relative">
            <svg style="position:absolute;left:1.125rem;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.35);pointer-events:none" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar produto, marca, categoria..."
              [value]="search()"
              (input)="search.set($any($event.target).value)"
              style="width:100%;padding:.875rem 1rem .875rem 3rem;border-radius:var(--r-full);border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;font-size:.9rem;backdrop-filter:blur(8px);outline:none;transition:all .2s"
              onfocus="this.style.borderColor='rgba(58,111,240,.4)';this.style.background='rgba(255,255,255,.1)'"
              onblur="this.style.borderColor='rgba(255,255,255,.12)';this.style.background='rgba(255,255,255,.07)'">
            <button *ngIf="search()" (click)="search.set('')"
              style="position:absolute;right:1rem;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.45);font-size:1.1rem;line-height:1;transition:color .2s"
              onmouseenter="this.style.color='#fff'" onmouseleave="this.style.color='rgba(255,255,255,.45)'">×</button>
          </div>
        </div>
      </div>

      <!-- Category nav -->
      <div style="margin-top:2rem;border-top:1px solid rgba(255,255,255,.06)">
        <div class="container" style="padding-top:0;padding-bottom:0">
          <div style="display:flex;gap:0;overflow-x:auto;scrollbar-width:none" class="cat-tab-row">
            <button *ngFor="let cat of categories"
              (click)="selectCategory(cat)"
              [class.cat-tab-active]="selectedCategory()===cat && !search()"
              class="cat-tab"
              [attr.aria-pressed]="selectedCategory()===cat && !search()"
              style="flex-shrink:0;display:flex;align-items:center;gap:.5rem;padding:.875rem 1.25rem;font-size:.82rem;font-weight:500;white-space:nowrap;border-bottom:2px solid transparent;color:rgba(255,255,255,.4);transition:all .2s;background:none">
              <span>{{ catIcon(cat) }}</span>
              <span>{{ cat }}</span>
              <span style="font-size:.7rem;opacity:.6">({{ countByCategory(cat) }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div *ngIf="loading()" style="background:var(--stone-50);padding:2.5rem 0 4rem">
      <div class="container">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.375rem">
          <div *ngFor="let s of skeletons" class="menu-card-premium" style="border-radius:var(--r-xl);overflow:hidden;background:#fff">
            <div style="aspect-ratio:16/10;background:linear-gradient(90deg,#e3e1da 25%,#cbd5e1 50%,#e3e1da 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
            <div style="padding:1.125rem 1.25rem 1.25rem">
              <div style="height:1rem;border-radius:4px;background:linear-gradient(90deg,#e3e1da 25%,#cbd5e1 50%,#e3e1da 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:.625rem;width:70%"></div>
              <div style="height:.75rem;border-radius:4px;background:linear-gradient(90deg,#e3e1da 25%,#cbd5e1 50%,#e3e1da 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:.375rem;width:100%"></div>
              <div style="height:.75rem;border-radius:4px;background:linear-gradient(90deg,#e3e1da 25%,#cbd5e1 50%,#e3e1da 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:1rem;width:85%"></div>
              <div style="height:2.25rem;border-radius:var(--r-lg);background:linear-gradient(90deg,#e3e1da 25%,#cbd5e1 50%,#e3e1da 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Items grid -->
    <div *ngIf="!loading()" style="background:var(--stone-50);padding:2.5rem 0 4rem">
      <div class="container">

        <!-- Search results header -->
        <div *ngIf="search()" style="margin-bottom:1.5rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
          <h2 style="font-family:var(--font-serif);font-size:1.5rem;color:var(--stone-900)">Resultados para "<em>{{ search() }}</em>"</h2>
          <span style="background:var(--stone-200);color:var(--stone-600);padding:.2rem .65rem;border-radius:var(--r-full);font-size:.75rem;font-weight:600">{{ displayItems().length }} {{ displayItems().length===1?'item':'itens' }}</span>
        </div>

        <!-- Category header (when not searching) -->
        <div *ngIf="!search()" style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:1.75rem;flex-wrap:wrap;gap:.5rem">
          <div style="display:flex;align-items:center;gap:.75rem">
            <span style="font-size:1.75rem">{{ catIcon(selectedCategory()) }}</span>
            <h2 style="font-family:var(--font-serif);font-size:2rem;color:var(--stone-900)">{{ selectedCategory() }}</h2>
          </div>
          <p style="color:var(--stone-400);font-size:.85rem">{{ displayItems().length }} {{ displayItems().length===1?'produto':'produtos' }}</p>
        </div>

        <!-- Quem comprou também levou (aparece depois de adicionar um produto) -->
        <app-also-bought *ngIf="lastAdded() as last"
                         [productIds]="[last.id]"
                         [title]="'Quem comprou ' + last.name + ' também levou'">
          <button (click)="lastAdded.set(null)" aria-label="Fechar recomendações"
                  style="color:var(--stone-400);font-size:1.25rem;line-height:1;background:none;border:none;cursor:pointer">×</button>
        </app-also-bought>

        <!-- Empty state -->
        <div *ngIf="displayItems().length===0" style="text-align:center;padding:4rem 2rem;background:#fff;border-radius:var(--r-2xl);border:1px solid var(--stone-100)">
          <div style="font-size:3.5rem;margin-bottom:1rem">🔍</div>
          <h3 style="font-family:var(--font-serif);font-size:1.5rem;color:var(--stone-700);margin-bottom:.5rem">Nenhum produto encontrado</h3>
          <p style="color:var(--stone-400);font-size:.875rem">Tente outro termo, confira a grafia ou explore as categorias acima.</p>
        </div>

        <!-- Cards grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.375rem" class="stagger">
          <div *ngFor="let item of displayItems()" class="menu-card-premium animate-fade-up">

            <!-- Image (abre os detalhes) -->
            <a [routerLink]="['/produtos', item.id]" [attr.aria-label]="'Ver detalhes de ' + item.name"
               style="display:block;position:relative;aspect-ratio:16/10;max-width:100%;overflow:hidden;background:var(--stone-100)">
              <img [src]="item.image" [alt]="item.name" loading="lazy"
                   appImgFallback
                   style="width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.4,0,.2,1)">

              <!-- Tags -->
              <div style="position:absolute;top:.75rem;left:.75rem;display:flex;gap:.375rem;flex-wrap:wrap">
                <span *ngIf="discount(item) > 0" style="background:var(--brand-600);color:#fff;padding:.25rem .6rem;font-size:.68rem;font-weight:800;border-radius:var(--r-sm)">-{{ discount(item) }}%</span>
                <span *ngIf="item.isSpecial" style="background:var(--stone-900);color:#fff;padding:.25rem .65rem;font-size:.65rem;letter-spacing:.12em;font-weight:700;border-radius:var(--r-sm)">★ DESTAQUE</span>
              </div>

            </a>

            <!-- Body -->
            <div style="padding:1.125rem 1.25rem 1.25rem;background:#fff;display:flex;flex-direction:column;flex:1">
              <p *ngIf="item.brand" style="font-size:.68rem;font-weight:700;letter-spacing:.12em;color:var(--brand-600);text-transform:uppercase;margin-bottom:.25rem">{{ item.brand }}</p>
              <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:600;margin-bottom:.375rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.7em"><a [routerLink]="['/produtos', item.id]" class="card-name-link">{{ item.name }}</a></h3>
              <p style="font-size:.78rem;color:var(--stone-500);line-height:1.6;margin-bottom:.875rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{{ item.description }}</p>

              <!-- Preço -->
              <div style="margin-top:auto;margin-bottom:.875rem">
                <p *ngIf="item.oldPrice && item.oldPrice > item.price" style="font-size:.75rem;color:var(--stone-400);text-decoration:line-through">{{ brl(item.oldPrice) }}</p>
                <p style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--brand-700);line-height:1.15">{{ brl(item.price) }}</p>
                <p style="font-size:.75rem;color:var(--stone-500)">em até {{ maxInstallments }}x de {{ brl(item.price / maxInstallments) }} sem juros</p>
                <p *ngIf="item.stock !== undefined && item.stock > 0 && item.stock <= 10" style="font-size:.72rem;color:#b45309;font-weight:600;margin-top:.375rem">Restam só {{ item.stock }} unidades</p>
              </div>

              <!-- Stepper se já está no carrinho, botão se não está -->
              <div *ngIf="getQty(item.id) === 0">
                <button class="btn btn-primary btn-sm" (click)="addToCart(item)"
                        style="width:100%;justify-content:center;gap:.5rem;border-radius:var(--r-lg)">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  Adicionar ao carrinho
                </button>
              </div>
              <div *ngIf="getQty(item.id) > 0"
                   style="display:flex;align-items:center;justify-content:space-between;background:var(--stone-900);border-radius:var(--r-lg);padding:.25rem .375rem">
                <button (click)="decrease(item)"
                  style="width:2rem;height:2rem;border-radius:var(--r-md);background:rgba(255,255,255,.1);color:#fff;font-size:1.1rem;display:flex;align-items:center;justify-content:center;transition:background .15s;border:none;cursor:pointer"
                  onmouseenter="this.style.background='rgba(255,255,255,.2)'" onmouseleave="this.style.background='rgba(255,255,255,.1)'">−</button>
                <span style="color:#fff;font-weight:700;font-size:.95rem;min-width:1.5rem;text-align:center">{{ getQty(item.id) }}</span>
                <button (click)="increase(item)"
                  style="width:2rem;height:2rem;border-radius:var(--r-md);background:var(--amber-600);color:#fff;font-size:1.1rem;display:flex;align-items:center;justify-content:center;transition:background .15s;border:none;cursor:pointer"
                  onmouseenter="this.style.background='var(--amber-700)'" onmouseleave="this.style.background='var(--amber-600)'">+</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Mobile floating cart button -->
    <div *ngIf="cartCount > 0" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:100" class="animate-fade-up">
      <a routerLink="/carrinho"
         style="display:flex;align-items:center;gap:.625rem;padding:.75rem 1.25rem;background:var(--stone-900);color:#fff;border-radius:var(--r-full);box-shadow:0 8px 24px rgba(0,0,0,.4),0 2px 6px rgba(0,0,0,.3);transition:all .2s;text-decoration:none;font-size:.875rem;font-weight:600"
         onmouseenter="this.style.transform='translateY(-2px)';this.style.background='var(--stone-800)'"
         onmouseleave="this.style.transform='';this.style.background='var(--stone-900)'">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/>
        </svg>
        <span>Ver Carrinho</span>
        <span style="background:var(--amber-500);color:#fff;border-radius:var(--r-full);min-width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;padding:0 .25rem">{{ cartCount }}</span>
      </a>
    </div>
  `,
  styles: [`
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .cat-tab-row::-webkit-scrollbar { display:none; }
    .cat-tab { border-bottom: 2px solid transparent; }
    .cat-tab-active { color: var(--amber-400) !important; border-bottom-color: var(--amber-400) !important; }
    .cat-tab:hover:not(.cat-tab-active) { color:rgba(255,255,255,.7) !important; }
    .menu-card-premium { display:flex; flex-direction:column; background:#fff; border:1px solid var(--stone-200); border-radius: var(--r-xl); overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,.07); transition: transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s; }
    .menu-card-premium:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(11,27,63,.14); border-color: var(--brand-200); }
    @media (prefers-reduced-motion: reduce) { .menu-card-premium, .menu-card-premium img { transition:none !important; } .menu-card-premium:hover { transform:none; } .menu-card-premium:hover img { transform:none; } }
    .menu-card-premium:hover img { transform: scale(1.04); }
    .card-name-link { color:var(--stone-900); text-decoration:none; }
    .card-name-link:hover { color:var(--brand-700); }
    .card-name-link:focus-visible { outline:2px solid var(--brand-400); outline-offset:2px; }
  `]
})
export class MenuComponent {
  get categories() { return [ALL, ...this.menuService.getCategories()]; }
  lastAdded = signal<MenuItem | null>(null);
  selectedCategory = signal(ALL);
  maxInstallments = MAX_INSTALLMENTS;
  search = signal('');
  cartCount = 0;
  cartQtyMap = signal<Map<string, number>>(new Map());

  skeletons = Array(6).fill(0);
  get allItems() { return this.menuService.items$; }
  loading = computed(() => !this.menuService.loaded$());

  displayItems = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (q) {
      return this.allItems().filter(i =>
        i.active !== false && (
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.brand ?? '').toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
        )
      );
    }
    const cat = this.selectedCategory();
    return this.allItems().filter(i => i.active !== false && (cat === ALL || i.category === cat));
  });

  constructor(private menuService: MenuService, private cart: CartService, private toast: ToastService) {
    this.cart.count.subscribe(c => this.cartCount = c);
    this.cart.items.subscribe(items =>
      this.cartQtyMap.set(new Map(items.map(i => [i.id, i.quantity])))
    );
  }

  selectCategory(cat: string) { this.selectedCategory.set(cat); this.search.set(''); }
  catIcon(cat: string) { return CAT_ICONS[cat] ?? '📦'; }
  countByCategory(cat: string) { return this.allItems().filter(i => i.active !== false && (cat === ALL || i.category === cat)).length; }
  discount(item: MenuItem) {
    return item.oldPrice && item.oldPrice > item.price ? Math.round((1 - item.price / item.oldPrice) * 100) : 0;
  }
  brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  getQty(id: string) { return this.cartQtyMap().get(id) ?? 0; }

  addToCart(item: MenuItem) {
    this.cart.addItem(item);
    this.lastAdded.set(item);
    this.toast.show(`${item.name} adicionado! 🛒`);
  }
  increase(item: MenuItem) { this.cart.addItem(item); }
  decrease(item: MenuItem) { this.cart.updateQuantity(item.id, this.getQty(item.id) - 1); }
}
