// ============================================================
// VOLTZ — Enterprise Models & Types
// ============================================================

// ── Status & Role Types ───────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type UserRole = 'manager' | 'kitchen' | 'delivery' | null;
export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'boleto';
export type MenuCategory =
  | 'Hardware'
  | 'Periféricos'
  | 'Monitores'
  | 'Notebooks'
  | 'Smartphones'
  | 'Games';

export type OrderType = 'delivery' | 'retirada';

// ── Menu ──────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory | string;
  image: string;
  isSpecial?: boolean;
  active?: boolean;
  prepTime?: number;     // legado (restaurante) — não usado na loja
  calories?: number;     // legado
  brand?: string;        // marca/fabricante
  oldPrice?: number;     // preço "de" para exibir desconto
  stock?: number;        // unidades em estoque
  tags?: string[];       // 'RGB', 'Wi-Fi 6', etc.
  createdAt?: Date;
}

export interface CartItem extends MenuItem {
  quantity: number;
  observations?: string;
}

// ── Customer ──────────────────────────────────────────────────
export interface Customer {
  name: string;
  phone: string;
  address: string;
  email?: string;
  uid?: string;
}

// ── Order ─────────────────────────────────────────────────────
export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  customer: Customer;
  paymentMethod: string;
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  orderType: OrderType;
  createdAt: Date;
  updatedAt?: Date;
  deliveryPersonId?: string;
  observations?: string;
  isLocal?: boolean;
  customerUid?: string;
  estimatedTime?: number;   // dias úteis
  tableNumber?: number;     // legado
  cancelReason?: string;
}

// ── Auth ──────────────────────────────────────────────────────
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  username: string;
  avatar?: string;
  phone?: string;
  createdAt?: Date;
}

// ── Status Config ─────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; cssClass: string }
> = {
  pending:    { label: 'Aguardando pagamento', color: '#94a3b8', bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.2)', cssClass: 'badge-pending'    },
  confirmed:  { label: 'Pagamento aprovado',   color: '#c4b5fd', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.2)',  cssClass: 'badge-ready'      },
  preparing:  { label: 'Em separação',         color: '#fbbf24', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.2)',  cssClass: 'badge-preparing'  },
  ready:      { label: 'Pronto p/ envio',      color: '#5f8ff7', bg: 'rgba(58,111,240,.1)',  border: 'rgba(58,111,240,.2)',  cssClass: 'badge-ready'      },
  delivering: { label: 'Em transporte',        color: '#34d399', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.2)',  cssClass: 'badge-delivering' },
  delivered:  { label: 'Entregue',             color: '#34d399', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.2)',  cssClass: 'badge-delivered'  },
  cancelled:  { label: 'Cancelado',            color: '#f87171', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.2)',   cssClass: 'badge-cancelled'  },
};

// ── Navigation ────────────────────────────────────────────────
export interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  exact?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ── Dashboard KPI ─────────────────────────────────────────────
export interface KpiCard {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: string;
  iconBg: string;
  accentColor: string;
}

// ── Delivery ──────────────────────────────────────────────────
export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
  currentOrderId?: string;
  totalDeliveries?: number;
  earnings?: number;
}
