import { Component, OnInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { MenuItem } from '../../models';
import { ImgFallbackDirective } from '../../components/ui/img-fallback.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, NgClass, ImgFallbackDirective],
  template: `
    <!-- HERO -->
    <section class="hero">
      <img class="hero-img" src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1600&q=85" alt="" aria-hidden="true">
      <div class="hero-overlay"></div>
      <div class="container" style="position:relative;z-index:1;padding-top:2rem">
        <div class="hero-content animate-fade-up">
          <div class="hero-tag">
            <div class="hero-tag-line"></div>
            <span>TECNOLOGIA COM PREÇO DE VERDADE</span>
          </div>
          <h1>MONTE SEU<br><span style="color:var(--brand-400)">SETUP.</span></h1>
          <p>Hardware, periféricos, notebooks e games das melhores marcas.<br>Em até 10x sem juros e entrega para todo o Brasil.</p>
          <div class="hero-actions">
            <a routerLink="/produtos" class="btn btn-primary btn-lg">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Ver Produtos
            </a>
            <a routerLink="/meus-pedidos" class="btn btn-outline btn-lg" style="border-color:rgba(255,255,255,.3);color:#fff">
              Rastrear Pedido
            </a>
          </div>
          <div class="hero-stats">
            <div *ngFor="let s of stats">
              <div class="hero-stat-value">{{ s.value }}</div>
              <div class="hero-stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DELIVERY INFO BAR -->
    <div style="background:var(--stone-900);border-bottom:1px solid var(--stone-800)">
      <div class="container" style="display:flex;align-items:center;justify-content:center;gap:3rem;padding:1rem 1.25rem;flex-wrap:wrap">
        <div *ngFor="let info of deliveryInfo" style="display:flex;align-items:center;gap:.625rem;color:var(--stone-300);font-size:.82rem">
          <span style="font-size:1.1rem">{{ info.icon }}</span>
          <span>{{ info.text }}</span>
        </div>
      </div>
    </div>

    <!-- DESTAQUES -->
    <section style="padding:5rem 0;background:#fff">
      <div class="container">
        <div style="text-align:center;margin-bottom:3rem">
          <div class="section-tag" style="justify-content:center">
            <div class="section-tag-line"></div>
            <span>OFERTAS EM DESTAQUE</span>
            <div class="section-tag-line"></div>
          </div>
          <h2 class="section-title">Mais vendidos da semana</h2>
          <p style="color:var(--stone-500);margin-top:.75rem;max-width:480px;margin-left:auto;margin-right:auto">Os produtos que mais saíram nos últimos 7 dias, com preço de oferta</p>
        </div>
        <div class="grid-3">
          <div *ngFor="let item of specials; let i = index" class="menu-card card-hover animate-fade-up" [style.animation-delay]="(i*0.1)+'s'">
            <div class="menu-card-img">
              <img [src]="item.image" [alt]="item.name" loading="lazy" appImgFallback>
              <span class="special-tag">★ DESTAQUE</span>
            </div>
            <div class="menu-card-body">
              <p *ngIf="item.brand" style="font-size:.68rem;font-weight:700;letter-spacing:.12em;color:var(--brand-600);text-transform:uppercase;margin-bottom:.25rem">{{ item.brand }}</p>
              <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:.375rem;color:var(--stone-900)">{{ item.name }}</h3>
              <p style="font-size:.82rem;color:var(--stone-500);line-height:1.6;margin-bottom:1.25rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{{ item.description }}</p>
              <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--stone-100);padding-top:1rem">
                <div>
                  <p *ngIf="item.oldPrice && item.oldPrice > item.price" style="font-size:.75rem;color:var(--stone-400);text-decoration:line-through">{{ brl(item.oldPrice) }}</p>
                  <span class="menu-card-price">{{ brl(item.price) }}</span>
                  <p style="font-size:.72rem;color:var(--stone-500)">ou 10x de {{ brl(item.price / 10) }}</p>
                </div>
                <button class="btn btn-secondary btn-sm" (click)="addToCart(item)">+ Adicionar</button>
              </div>
            </div>
          </div>
        </div>
        <div style="text-align:center;margin-top:2.5rem">
          <a routerLink="/produtos" class="btn btn-outline btn-lg">Ver todos os produtos →</a>
        </div>
      </div>
    </section>

    <!-- COMO FUNCIONA -->
    <section style="padding:5rem 0;background:var(--stone-50)">
      <div class="container">
        <div style="text-align:center;margin-bottom:3.5rem">
          <div class="section-tag" style="justify-content:center">
            <div class="section-tag-line"></div>
            <span>COMPRA SEM COMPLICAÇÃO</span>
            <div class="section-tag-line"></div>
          </div>
          <h2 class="section-title">Como funciona</h2>
        </div>
        <div class="grid-4">
          <div *ngFor="let step of howItWorks; let i = index" style="text-align:center;padding:1.5rem 1rem" class="animate-fade-up" [style.animation-delay]="(i*0.1)+'s'">
            <div style="width:4rem;height:4rem;border-radius:50%;background:var(--stone-900);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 1.25rem;position:relative">
              {{ step.icon }}
              <div style="position:absolute;top:-.5rem;right:-.5rem;width:1.5rem;height:1.5rem;border-radius:50%;background:var(--brand-600);color:#fff;font-size:.72rem;font-weight:700;display:flex;align-items:center;justify-content:center">{{ i+1 }}</div>
            </div>
            <h3 style="font-family:var(--font-serif);font-size:1.1rem;margin-bottom:.5rem;color:var(--stone-900)">{{ step.title }}</h3>
            <p style="font-size:.82rem;color:var(--stone-500);line-height:1.7">{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- DIFERENCIAIS -->
    <section style="padding:5rem 0;background:var(--stone-900)">
      <div class="container">
        <div style="text-align:center;margin-bottom:3.5rem">
          <div class="section-tag" style="justify-content:center">
            <div class="section-tag-line"></div>
            <span style="color:var(--brand-400)">POR QUE COMPRAR NA VOLTZ</span>
            <div class="section-tag-line"></div>
          </div>
          <h2 class="section-title" style="color:#fff">Feita para quem leva tecnologia a sério</h2>
        </div>
        <div class="grid-3" style="gap:2rem">
          <div *ngFor="let d of diferenciais" style="text-align:center;padding:2rem 1.5rem;border:1px solid rgba(255,255,255,.08);border-radius:var(--r-2xl);background:rgba(255,255,255,.03);transition:all .3s" onmouseenter="this.style.background='rgba(58,111,240,.1)';this.style.borderColor='rgba(58,111,240,.35)'" onmouseleave="this.style.background='rgba(255,255,255,.03)';this.style.borderColor='rgba(255,255,255,.08)'">
            <div style="font-size:2.5rem;margin-bottom:1.25rem">{{ d.icon }}</div>
            <h3 style="font-family:var(--font-serif);font-size:1.3rem;color:#fff;margin-bottom:.75rem">{{ d.title }}</h3>
            <p style="color:var(--stone-400);font-size:.85rem;line-height:1.75">{{ d.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="promo-banner">
      <div class="container" style="display:flex;align-items:center;justify-content:space-between;gap:2rem;flex-wrap:wrap">
        <div style="color:#fff">
          <h2 style="font-family:var(--font-serif);font-size:2rem;margin-bottom:.5rem">Frete grátis nas compras acima de R$ 299</h2>
          <p style="color:var(--stone-400);font-size:.9rem">Para todo o Brasil · Envio em até 24h após a aprovação do pagamento</p>
        </div>
        <a routerLink="/produtos" class="btn btn-primary btn-lg" style="flex-shrink:0">
          Aproveitar ofertas
        </a>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  specials: MenuItem[] = [];
  stats = [
    { value: '4.8★', label: 'AVALIAÇÃO DOS CLIENTES' },
    { value: '+50 mil', label: 'PEDIDOS ENTREGUES' },
    { value: '10x', label: 'SEM JUROS' },
  ];
  deliveryInfo = [
    { icon: '🚚', text: 'Entrega para todo o Brasil' },
    { icon: '🎁', text: 'Frete grátis acima de R$ 299' },
    { icon: '💳', text: 'Até 10x sem juros no cartão' },
    { icon: '🔒', text: 'Compra 100% segura' },
    { icon: '🛡️', text: 'Garantia oficial das marcas' },
  ];
  howItWorks = [
    { icon: '🔎', title: 'Escolha seus produtos', text: 'Navegue pelas categorias, compare marcas e adicione ao carrinho.' },
    { icon: '📍', title: 'Informe o endereço', text: 'Preencha os dados de entrega e escolha como quer pagar.' },
    { icon: '📦', title: 'Separamos com cuidado', text: 'Seu pedido é conferido, testado quando aplicável e embalado com proteção.' },
    { icon: '🏠', title: 'Receba em casa', text: 'Acompanhe cada etapa do envio pela página Meus Pedidos.' },
  ];
  diferenciais = [
    { icon: '🛡️', title: 'Garantia Oficial', text: 'Todos os produtos são novos, lacrados e com nota fiscal e garantia do fabricante.' },
    { icon: '📦', title: 'Embalagem Reforçada', text: 'Proteção extra com espuma e plástico bolha para eletrônicos chegarem intactos.' },
    { icon: '🧑‍🔧', title: 'Suporte Especializado', text: 'Time técnico para ajudar a escolher peças compatíveis e montar seu setup.' },
    { icon: '🔁', title: 'Troca Facilitada', text: 'Até 7 dias para devolução por arrependimento, com coleta no seu endereço.' },
    { icon: '⚡', title: 'Envio em 24h', text: 'Pedidos aprovados até as 14h saem do nosso centro de distribuição no mesmo dia.' },
    { icon: '💳', title: 'Pague como preferir', text: 'Pix, boleto, cartão de crédito em até 10x sem juros ou débito.' },
  ];

  constructor(private menu: MenuService, private cart: CartService, private toast: ToastService) {
    effect(() => { this.specials = this.menu.getSpecials(); });
  }
  ngOnInit() {}
  addToCart(item: MenuItem) { this.cart.addItem(item); this.toast.show(`${item.name} adicionado ao carrinho!`); }
  brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
}
