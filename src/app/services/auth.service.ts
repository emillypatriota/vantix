import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../core/firebase/firebase.config';
import { UserRole } from '../models';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  username: string;
}

const ROLE_MAP: Record<string, { role: UserRole; username: string }> = {
  'gerente@voltz.com':    { role: 'manager',  username: 'Roberto Silva' },
  'estoque@voltz.com':    { role: 'kitchen',  username: 'Equipe Estoque' },
  'logistica@voltz.com': { role: 'delivery', username: 'Carlos Mendes' },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();

  // Resolve com o usuário (ou null) após o primeiro onAuthStateChanged.
  // Passar o valor na Promise elimina qualquer race condition de sinal.
  private _resolved = false;
  private _readyResolve!: (u: AuthUser | null) => void;
  readonly ready = new Promise<AuthUser | null>(res => { this._readyResolve = res; });

  constructor() {
    onAuthStateChanged(firebaseAuth, fbUser => {
      const email = fbUser?.email?.trim().toLowerCase() ?? '';
      const mapped = email ? ROLE_MAP[email] : null;
      const authUser: AuthUser | null = (mapped && fbUser)
        ? { uid: fbUser.uid, email: fbUser.email!, role: mapped.role, username: mapped.username }
        : null;

      this._user.set(authUser);

      if (!this._resolved) {
        this._resolved = true;
        this._readyResolve(authUser);
      }
    });
  }

  get isAuthenticated(): boolean { return this._user() !== null; }
  get role(): UserRole           { return this._user()?.role ?? null; }
  getUser()                      { return this._user(); }

  async loginWithEmail(email: string, password: string): Promise<AuthUser> {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const normalizedEmail = cred.user.email?.trim().toLowerCase() ?? '';
    const mapped = ROLE_MAP[normalizedEmail];
    if (!mapped) throw new Error('Conta não autorizada neste sistema.');

    const authUser: AuthUser = {
      uid:      cred.user.uid,
      email:    cred.user.email!,
      role:     mapped.role,
      username: mapped.username,
    };
    this._user.set(authUser);

    if (!this._resolved) {
      this._resolved = true;
      this._readyResolve(authUser);
    }
    return authUser;
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
    this._user.set(null);
  }
}
