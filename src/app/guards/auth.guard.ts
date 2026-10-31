import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

const ROLE_ROUTES: Record<string, string> = {
  manager:  '/gerente/insights',
  kitchen:  '/estoque/painel',
  delivery: '/logistica/painel',
};

export const authGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user = await auth.ready;
  if (user) return true;
  return router.createUrlTree(['/portais']);
};

export function roleGuard(role: UserRole): CanActivateFn {
  return async () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user = await auth.ready;

    if (!user) {
      return router.createUrlTree([`/login/${role}`]);
    }
    if (user.role !== role) {
      return router.createUrlTree([ROLE_ROUTES[user.role ?? ''] ?? '/portais']);
    }
    return true;
  };
}
