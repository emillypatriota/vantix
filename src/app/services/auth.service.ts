import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserRole } from '../models';
import { LoginResponse } from '../core/api/api.types';
import { roleFromApi } from '../core/api/mappers';

export interface AuthUser {
  uid: string;       // id_usuario da tabela usuario_painel
  email: string;
  role: UserRole;
  username: string;
}

interface Session { token: string; user: AuthUser; }

const SESSION_KEY = 'voltz_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private _session = signal<Session | null>(readSession());

  readonly user = signal<AuthUser | null>(this._session()?.user ?? null);

  /**
   * Usuário logado AGORA (o guard e os layouts usam isto).
   * É um getter de propósito: um valor fixo guardaria o usuário de quando o app abriu,
   * e depois de "Sair" o guard ainda deixaria voltar ao painel sem recarregar a página.
   */
  get ready(): Promise<AuthUser | null> { return Promise.resolve(this.user()); }

  get isAuthenticated(): boolean { return this.user() !== null; }
  get role(): UserRole           { return this.user()?.role ?? null; }
  get token(): string | null     { return this._session()?.token ?? null; }
  getUser()                      { return this.user(); }

  async loginWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      const res = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
          email: email.trim().toLowerCase(),
          senha: password,
        }),
      );
      const user: AuthUser = {
        uid:      String(res.usuario.id),
        email:    res.usuario.email,
        role:     roleFromApi(res.usuario.papel),
        username: res.usuario.nome,
      };
      this.save({ token: res.token, user });
      return user;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 403) {
        throw new Error('Conta não autorizada neste sistema.');
      }
      if (err instanceof HttpErrorResponse && err.status === 0) {
        throw new Error('Servidor indisponível. Verifique se a API está rodando.');
      }
      throw new Error('E-mail ou senha incorretos.');
    }
  }

  async logout(): Promise<void> {
    this.clear();
  }

  /** Chamado pelo interceptor quando a API responde 401 (token inválido ou expirado). */
  clear(): void {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignora */ }
    this._session.set(null);
    this.user.set(null);
  }

  private save(session: Session): void {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* ignora */ }
    this._session.set(session);
    this.user.set(session.user);
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
