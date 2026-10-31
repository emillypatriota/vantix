import { Routes } from '@angular/router';
import { roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ── Client area ───────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./components/layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '',          loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'produtos',  loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent) },
      { path: 'carrinho',  loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) },
      { path: 'checkout',  loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'confirmacao', loadComponent: () => import('./pages/confirmation/confirmation.component').then(m => m.ConfirmationComponent) },
      { path: 'meus-pedidos', loadComponent: () => import('./pages/my-orders/my-orders.component').then(m => m.MyOrdersComponent) },
    ]
  },

  // ── Portals selection ─────────────────────────────────────
  { path: 'portais', loadComponent: () => import('./pages/portals/portals.component').then(m => m.PortalsComponent) },

  // ── Auth pages ────────────────────────────────────────────
  { path: 'login/manager',  loadComponent: () => import('./pages/auth/manager-login/manager-login.component').then(m => m.ManagerLoginComponent) },
  { path: 'login/kitchen',  loadComponent: () => import('./pages/auth/manager-login/manager-login.component').then(m => m.KitchenLoginComponent) },
  { path: 'login/delivery', loadComponent: () => import('./pages/auth/manager-login/manager-login.component').then(m => m.DeliveryLoginComponent) },

  // ── Manager area ──────────────────────────────────────────
  {
    path: 'gerente',
    loadComponent: () => import('./components/layout/employee-layout.component').then(m => m.EmployeeLayoutComponent),
    canActivate: [roleGuard('manager')],
    children: [
      { path: '',          redirectTo: 'insights', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'insights', pathMatch: 'full' },
      { path: 'pedidos',   loadComponent: () => import('./pages/employee/orders/orders-management.component').then(m => m.OrdersManagementComponent) },
      { path: 'produtos',  loadComponent: () => import('./pages/employee/menu-management/menu-management.component').then(m => m.MenuManagementComponent) },
      { path: 'estoque',   loadComponent: () => import('./pages/employee/kitchen/kitchen-dashboard.component').then(m => m.KitchenDashboardComponent) },
      { path: 'entregas',  loadComponent: () => import('./pages/delivery/dashboard/delivery-dashboard.component').then(m => m.DeliveryDashboardComponent) },
      { path: 'insights',      loadComponent: () => import('./pages/employee/insights/insights-dashboard.component').then(m => m.InsightsDashboardComponent) },
      { path: 'funcionarios',  loadComponent: () => import('./pages/employee/staff/staff-management.component').then(m => m.StaffManagementComponent) },
    ]
  },

  // ── Kitchen area ──────────────────────────────────────────
  {
    path: 'estoque',
    loadComponent: () => import('./components/layout/employee-layout.component').then(m => m.EmployeeLayoutComponent),
    canActivate: [roleGuard('kitchen')],
    children: [
      { path: '',      redirectTo: 'painel', pathMatch: 'full' },
      { path: 'painel', loadComponent: () => import('./pages/employee/kitchen/kitchen-dashboard.component').then(m => m.KitchenDashboardComponent) },
    ]
  },

  // ── Delivery area ─────────────────────────────────────────
  {
    path: 'logistica',
    loadComponent: () => import('./components/layout/delivery-layout.component').then(m => m.DeliveryLayoutComponent),
    canActivate: [roleGuard('delivery')],
    children: [
      { path: '',       redirectTo: 'painel', pathMatch: 'full' },
      { path: 'painel', loadComponent: () => import('./pages/delivery/dashboard/delivery-dashboard.component').then(m => m.DeliveryDashboardComponent) },
    ]
  },

  // ── Fallback ──────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
