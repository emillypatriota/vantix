import { Injectable, computed, inject, signal } from '@angular/core';
import { Order } from '../models';
import { OrdersService } from './orders.service';

export interface KnownCustomer {
  name: string;
  phone: string;
  email: string;
}

// Chaves já usadas pelo checkout desde a primeira versão (não renomear: apagaria os dados de quem já comprou).
const KEY_PHONE = 'voltz_customer_phone';
const KEY_EMAIL = 'voltz_customer_email';
const KEY_NAME  = 'voltz_customer_name';

/**
 * Perfil "Cliente" sem senha: o site reconhece o cliente pelo telefone usado nas compras.
 * Guarda quem é o cliente e os produtos que ele já comprou (base do "Recomendado para você").
 */
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private orders = inject(OrdersService);

  private _customer = signal<KnownCustomer | null>(readStored());
  private _historyIds = signal<string[]>([]);

  readonly customer = this._customer.asReadonly();
  /** Ids dos produtos comprados em pedidos não cancelados (mais recentes primeiro). */
  readonly historyIds = this._historyIds.asReadonly();
  readonly firstName = computed(() => this._customer()?.name.trim().split(/\s+/)[0] ?? '');

  constructor() {
    if (this._customer()) this.refreshHistory();
  }

  /**
   * Identifica o cliente pelo telefone, usando o pedido mais recente.
   * Devolve false se o telefone não tiver compras. Lança erro se a API falhar.
   */
  async identify(phone: string): Promise<boolean> {
    const list = await this.orders.fetchCustomerOrders(phone);
    if (!list.length) return false;
    const last = list[0];
    this.save({ name: last.customer.name, phone: last.customer.phone || phone, email: last.customer.email ?? '' });
    this._historyIds.set(productIds(list));
    return true;
  }

  /** Chamado pelo checkout depois de uma compra. */
  remember(c: KnownCustomer): void {
    this.save(c);
    this.refreshHistory();
  }

  /** "Não é você? Sair" */
  forget(): void {
    for (const k of [KEY_PHONE, KEY_EMAIL, KEY_NAME]) {
      try { localStorage.removeItem(k); } catch { /* ignora */ }
    }
    this._customer.set(null);
    this._historyIds.set([]);
  }

  async refreshHistory(): Promise<void> {
    const c = this._customer();
    if (!c) return;
    try {
      const list = await this.orders.fetchCustomerOrders(c.phone);
      this._historyIds.set(productIds(list));
      // Quem comprou antes desta versão tem só o telefone salvo: completa nome e e-mail.
      if (list.length && (!c.name || !c.email)) {
        this.save({ ...c, name: c.name || list[0].customer.name, email: c.email || (list[0].customer.email ?? '') });
      }
    } catch {
      // Sem histórico a recomendação só não aparece; não precisa avisar o cliente.
      this._historyIds.set([]);
    }
  }

  private save(c: KnownCustomer): void {
    try {
      localStorage.setItem(KEY_PHONE, c.phone);
      localStorage.setItem(KEY_EMAIL, c.email);
      localStorage.setItem(KEY_NAME, c.name);
    } catch { /* ignora */ }
    this._customer.set(c);
  }
}

export function productIds(orders: Order[]): string[] {
  const ids = orders.filter(o => o.status !== 'cancelled').flatMap(o => o.items.map(i => i.id));
  return [...new Set(ids)];
}

function readStored(): KnownCustomer | null {
  try {
    const phone = localStorage.getItem(KEY_PHONE);
    if (!phone) return null;
    return {
      phone,
      email: localStorage.getItem(KEY_EMAIL) ?? '',
      name:  localStorage.getItem(KEY_NAME) ?? '',
    };
  } catch {
    return null;
  }
}
