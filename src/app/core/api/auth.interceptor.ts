import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

/** Coloca "Authorization: Bearer <token>" nas chamadas à API e trata sessão expirada. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const token = auth.token;
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      const isLogin = req.url.endsWith('/auth/login');
      if (err instanceof HttpErrorResponse && err.status === 401 && token && !isLogin) {
        auth.clear();
        router.navigate(['/portais']);
      }
      return throwError(() => err);
    }),
  );
};

/** Lê a mensagem de erro padrão da API ({ mensagem: "..." }). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Servidor indisponível. Verifique se a API está rodando.';
    const m = (err.error as { mensagem?: string } | null)?.mensagem;
    if (m) return m;
  }
  return fallback;
}
