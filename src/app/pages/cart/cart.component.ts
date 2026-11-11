import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { CartService, shippingFor, SHIPPING_FEE, FREE_SHIPPING_MIN } from '../../services/cart.service';
import { ImgFallbackDirective } from '../../components/ui/img-fallback.directive';
import { AlsoBoughtComponent } from '../../components/ui/also-bought.component';
import { CartItem } from '../../models';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, AsyncPipe, NgFor, NgIf, ImgFallbackDirective, AlsoBoughtComponent],
  template: `
    <div style="padding:2.5rem 0 4rem;background:var(--stone-50);min-height:60vh">
      <div class="container">

        <div *ngIf="(items$ | async)?.length === 0" style="display:flex;justify-content:center;padding:5rem 0">
          <div style="text-align:center;max-width:360px">
            <div style="width:6rem;height:6rem;border-radius:50%;background:var(--stone-100);display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin:0 auto 1.5rem">🛒</div>
            <h2 style="font-family:var(--font-serif);font-size:2rem;margin-bottom:.75rem">Carrinho vazio</h2>
            <p style="color:var(--stone-500);margin-bottom:2rem">Explore o catálogo e encontre as melhores ofertas em tecnologia.</p>
            <a routerLink="/produtos" class="btn btn-primary btn-lg" style="width:100%;justify-content:center">Ver produtos</a>
          </div>
        </div>

        <ng-container *ngIf="(items$ | async)?.length! > 0">
          <div style="margin-bottom:2rem">
            <h1 style="font-family:var(--font-serif);font-size:2.25rem;color:var(--stone-900)">Seu Carrinho</h1>
            <p style="color:var(--stone-500)">Revise os itens antes de finalizar</p>
          </div>

          <div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:2rem;align-items:start" class="cart-grid">
            <div>
              <div *ngFor="let item of (items$ | async)" class="cart-item animate-fade-in">
                <img class="cart-item-img" [src]="item.image" [alt]="item.name" appImgFallback>
                <div style="flex:1;min-width:0">
                  <h3 style="font-family:var(--font-serif);font-size:1.15rem;margin-bottom:.25rem;color:var(--stone-900)">{{ item.name }}</h3>
                  <p style="font-size:.78rem;color:var(--stone-400);margin-bottom:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ item.description }}</p>
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
                    <span style="font-family:var(--font-serif);font-size:1.2rem;color:var(--brand-700);font-weight:700">{{ brl((item.price * item.quantity)) }}</span>
                    <div style="display:flex;align-items:center;gap:.5rem">
                      <button class="qty-btn" (click)="updateQty(item, item.quantity-1)" [attr.aria-label]="'Diminuir quantidade de ' + item.name">−</button>
                      <span style="min-width:1.5rem;text-align:center;font-weight:600;font-size:.9rem;color:var(--stone-900)" aria-live="polite">{{ item.quantity }}</span>
                      <button class="qty-btn" (click)="updateQty(item, item.quantity+1)" [attr.aria-label]="'Aumentar quantidade de ' + item.name">+</button>
                      <button class="btn btn-danger btn-icon" style="margin-left:.25rem;width:2rem;height:2rem;font-size:.75rem" (click)="remove(item.id)" [attr.aria-label]="'Remover ' + item.name">✕</button>
                    </div>
                  </div>
                </div>
              </div>
              <a routerLink="/produtos" class="btn btn-outline" style="margin-top:.5rem">+ Adicionar mais itens</a>

              <app-also-bought *ngIf="(items$ | async) as items"
                               [productIds]="idsOf(items)"
                               title="Quem comprou estes produtos também levou"></app-also-bought>
            </div>

            <div style="position:sticky;top:5.5rem">
              <div *ngIf="(vm$ | async) as vm" class="card">
                <div class="card-body">
                  <h2 style="font-family:var(--font-serif);font-size:1.5rem;margin-bottom:1.25rem">Resumo do Pedido</h2>

                  <div *ngIf="vm.deliveryFee === 0" style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:var(--r-lg);padding:.875rem;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem">
                    <span style="font-size:1.5rem">🎉</span>
                    <div>
                      <p style="font-size:.85rem;font-weight:600;color:#15803d">Você ganhou frete grátis!</p>
                      <p style="font-size:.75rem;color:#166534">Economia de {{ brl(shippingFee) }} no frete</p>
                    </div>
                  </div>

                  <div *ngIf="vm.deliveryFee > 0" style="background:var(--stone-50);border-radius:var(--r-lg);padding:.875rem;margin-bottom:1rem">
                    <div style="display:flex;justify-content:space-between;margin-bottom:.5rem">
                      <p style="font-size:.78rem;font-weight:500;color:var(--stone-700)">Faltam {{ brl((freeMin-vm.subtotal)) }} para frete grátis</p>
                      <p style="font-size:.72rem;color:var(--stone-400)">{{ Math.min(Math.round(vm.subtotal/freeMin*100),100) }}%</p>
                    </div>
                    <div class="free-del-bar"><div class="free-del-fill" [style.width]="Math.min(vm.subtotal/freeMin*100,100)+'%'"></div></div>
                  </div>

                  <div style="background:var(--stone-50);border-radius:var(--r-lg);padding:.875rem;margin-bottom:1.25rem;font-size:.82rem;color:var(--stone-600);display:flex;flex-direction:column;gap:.375rem">
                    <span>🚚 Envio em até 24h após aprovação</span>
                    <span>🔒 Pagamento 100% seguro</span>
                  </div>

                  <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem">
                    <div *ngFor="let item of (items$ | async)" style="display:flex;justify-content:space-between;font-size:.82rem">
                      <span style="color:var(--stone-500)">{{ item.quantity }}× {{ item.name }}</span>
                      <span style="font-weight:500">{{ brl((item.price*item.quantity)) }}</span>
                    </div>
                  </div>

                  <div style="border-top:1px solid var(--stone-100);padding-top:.875rem;margin-bottom:1.25rem;display:flex;flex-direction:column;gap:.5rem">
                    <div style="display:flex;justify-content:space-between;font-size:.85rem">
                      <span style="color:var(--stone-500)">Subtotal</span>
                      <span>{{ brl(vm.subtotal) }}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:.85rem">
                      <span style="color:var(--stone-500)">Frete</span>
                      <span [style.color]="vm.deliveryFee===0?'var(--green-600)':''">{{ vm.deliveryFee===0?'Grátis':brl(vm.deliveryFee) }}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-family:var(--font-serif);font-size:1.35rem;border-top:1px solid var(--stone-100);padding-top:.875rem;margin-top:.375rem">
                      <span>Total</span><span>{{ brl(vm.total) }}</span>
                    </div>
                  </div>

                  <a routerLink="/checkout" class="btn btn-primary" style="width:100%;justify-content:center;height:3rem;font-size:.95rem">
                    Finalizar Pedido →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`@media(max-width:900px){.cart-grid{grid-template-columns:minmax(0,1fr) !important}}`]
})
export class CartComponent {
  brl(v: number) { return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  Math = Math;
  shippingFee = SHIPPING_FEE;
  freeMin = FREE_SHIPPING_MIN;
  items$ = this.cart.items;
  vm$ = combineLatest([this.cart.items, this.cart.total]).pipe(
    map(([_, subtotal]) => ({ subtotal, deliveryFee: shippingFor(subtotal), total: subtotal + shippingFor(subtotal) }))
  );
  constructor(private cart: CartService) {}
  updateQty(item: CartItem, qty: number) { this.cart.updateQuantity(item.id, qty); }
  remove(id: string) { this.cart.removeItem(id); }
  idsOf(items: CartItem[]) { return items.map(i => i.id); }
}
