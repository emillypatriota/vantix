import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CartItem, MenuItem } from '../models';

const STORAGE_KEY = 'voltz_cart';

// Regras de frete da loja — altere aqui e vale para carrinho e checkout.
export const SHIPPING_FEE = 29.9;
export const FREE_SHIPPING_MIN = 299;
export const shippingFor = (subtotal: number) => (subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE);

@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>(this.loadFromStorage());

  constructor() {
    // Persiste no localStorage a cada mudança
    this.items$.subscribe(items => this.saveToStorage(items));
  }

  get items(): Observable<CartItem[]> { return this.items$.asObservable(); }
  get count(): Observable<number> { return this.items$.pipe(map(items => items.reduce((s, i) => s + i.quantity, 0))); }
  get total(): Observable<number> { return this.items$.pipe(map(items => items.reduce((s, i) => s + i.price * i.quantity, 0))); }
  getItems(): CartItem[] { return this.items$.value; }
  getTotal(): number { return this.items$.value.reduce((s, i) => s + i.price * i.quantity, 0); }
  getCount(): number { return this.items$.value.reduce((s, i) => s + i.quantity, 0); }

  addItem(item: MenuItem): void {
    const cur = this.items$.value;
    const existing = cur.find(i => i.id === item.id);
    if (existing) {
      this.items$.next(cur.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      this.items$.next([...cur, { ...item, quantity: 1 }]);
    }
  }

  updateQuantity(id: string, qty: number): void {
    if (qty <= 0) { this.removeItem(id); return; }
    this.items$.next(this.items$.value.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }

  removeItem(id: string): void {
    this.items$.next(this.items$.value.filter(i => i.id !== id));
  }

  clear(): void { this.items$.next([]); }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage quota exceeded — ignora silenciosamente
    }
  }
}
