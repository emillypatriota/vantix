import { Injectable, NgZone, signal } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { firestore } from '../core/firebase/firebase.config';
import { Order, OrderStatus, CartItem } from '../models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private _orders = signal<Order[]>([]);

  // Signal — para componentes modernos
  readonly orders$ = this._orders.asReadonly();

  constructor(private ngZone: NgZone) {}

  // Observable compartilhado (hot) — um único listener Firestore para todos os subscribers.
  // O listener roda fora da zona do Angular para evitar que reconexões do Firestore
  // disparem change detection desnecessariamente; os dados voltam para a zona via ngZone.run().
  readonly orders: Observable<Order[]> = new Observable<Order[]>(subscriber => {
    const q = query(
      collection(firestore, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = this.ngZone.runOutsideAngular(() =>
      onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data['createdAt'] instanceof Timestamp
              ? data['createdAt'].toDate()
              : new Date(data['createdAt'] ?? Date.now()),
          } as Order;
        });
        this.ngZone.run(() => {
          this._orders.set(orders);
          subscriber.next(orders);
        });
      }, err => this.ngZone.run(() => subscriber.error(err)))
    );

    return () => unsubscribe();
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  getOrders(): Order[] { return this._orders(); }
  getMyOrders(uid?: string): Order[] {
    return this._orders().filter(o => o.isLocal || o.customerUid === uid);
  }

  async addOrder(data: {
    items: CartItem[];
    customer: Order['customer'];
    paymentMethod: string;
    total: number;
    deliveryFee: number;
    observations?: string;
    customerUid?: string;
  }): Promise<Order> {
    const orders = this._orders();
    const orderNumber = (orders.length + 1).toString().padStart(4, '0');

    const newOrder = {
      ...data,
      orderNumber,
      status: 'pending' as OrderStatus,
      orderType: 'delivery' as const,
      isLocal: true,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(firestore, 'orders'), newOrder);

    return {
      ...newOrder,
      id: ref.id,
      createdAt: new Date(),
    } as Order;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    await updateDoc(doc(firestore, 'orders', orderId), { status });
  }

  async assignDelivery(orderId: string, deliveryPersonId: string): Promise<void> {
    await updateDoc(doc(firestore, 'orders', orderId), { deliveryPersonId });
  }
}
