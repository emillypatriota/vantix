import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { Order } from '../../models';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor],
  template: `
    <div style="padding:4rem 0;background:var(--stone-50);min-height:70vh;display:flex;align-items:center">
      <div class="container" style="max-width:580px;margin:0 auto">

        <!-- Ícone de sucesso animado -->
        <div style="text-align:center;margin-bottom:2.5rem">
          <div style="width:5rem;height:5rem;border-radius:50%;background:#dcfce7;border:3px solid #86efac;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1.5rem;animation:fadeUp .5s ease">✓</div>
          <h1 style="font-family:var(--font-serif);font-size:2.5rem;color:var(--stone-900);margin-bottom:.5rem">Pedido Confirmado!</h1>
          <p style="color:var(--stone-500);font-size:.95rem">Seu pedido foi recebido. Você pode acompanhar cada etapa em Meus Pedidos.</p>
        </div>

        <!-- Card do pedido -->
        <div *ngIf="order" class="card" style="margin-bottom:1.5rem">
          <div style="background:var(--stone-900);padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center">
            <div>
              <p style="font-size:.68rem;color:var(--stone-400);letter-spacing:.12em;margin-bottom:2px">PEDIDO</p>
              <p style="font-family:var(--font-serif);font-size:1.5rem;color:#fff">#{{ order.orderNumber }}</p>
            </div>
            <div style="text-align:right">
              <p style="font-size:.68rem;color:var(--stone-400);letter-spacing:.12em;margin-bottom:2px">TOTAL</p>
              <p style="font-family:var(--font-serif);font-size:1.5rem;color:var(--amber-500)">{{ brl(order.total) }}</p>
            </div>
          </div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.25rem">
              <div *ngFor="let item of order.items" style="display:flex;align-items:center;gap:.875rem">
                <img [src]="item.image" [alt]="item.name" style="width:3rem;height:3rem;border-radius:8px;object-fit:cover;flex-shrink:0">
                <div style="flex:1">
                  <p style="font-size:.88rem;font-weight:500;color:var(--stone-800)">{{ item.quantity }}× {{ item.name }}</p>
                  <p style="font-size:.75rem;color:var(--stone-400)">{{ brl((item.price*item.quantity)) }}</p>
                </div>
              </div>
            </div>
            <div style="border-top:1px solid var(--stone-100);padding-top:1rem;display:flex;flex-direction:column;gap:.5rem;font-size:.85rem;color:var(--stone-600)">
              <p>👤 {{ order.customer.name }}</p>
              <p>📱 {{ order.customer.phone }}</p>
              <p>📍 {{ order.customer.address }}</p>
              <p>💳 {{ order.paymentMethod }}</p>
            </div>
            <div style="margin-top:1.25rem;background:#dbe6fe;border-radius:var(--r-lg);padding:1rem;display:flex;align-items:center;gap:.75rem">
              <span style="font-size:1.5rem">⏱️</span>
              <div>
                <p style="font-size:.88rem;font-weight:600;color:#173d8c">Envio em até 24h após a aprovação do pagamento</p>
                <p style="font-size:.75rem;color:#1747ad">Acompanhe o status em Meus Pedidos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          <a routerLink="/meus-pedidos" class="btn btn-primary btn-lg" style="flex:1;justify-content:center">📦 Acompanhar Pedido</a>
          <a routerLink="/produtos" class="btn btn-outline btn-lg" style="flex:1;justify-content:center">+ Novo Pedido</a>
        </div>
      </div>
    </div>
  `,
  styles: [`@keyframes fadeUp { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }`]
})
export class ConfirmationComponent implements OnInit {
  brl(v: number) { return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  order: Order | null = null;
  constructor(private router: Router) {}
  ngOnInit() {
    this.order = history.state?.order ?? null;
    if (!this.order) this.router.navigate(['/']);
  }
}
