import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private zone = inject(NgZone);
  private toast = inject(ToastService);

  handleError(error: unknown): void {
    const message = this.extractMessage(error);
    console.error('[GlobalErrorHandler]', error);

    // Ignora erros de chunk load (lazy loading em browser antigo) — recarrega automaticamente
    if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) {
      window.location.reload();
      return;
    }

    // Erros de rede mostram feedback amigável
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      this.zone.run(() => this.toast.show('Sem conexão com a internet. Verifique sua rede.', 'error'));
      return;
    }

    // API fora do ar (status 0) ou sessão expirada (401/403)
    if (error instanceof HttpErrorResponse) {
      const msg = error.status === 0
        ? 'Não foi possível falar com o servidor. A API está rodando?'
        : error.status === 401 || error.status === 403
          ? 'Permissão negada. Faça login novamente.'
          : 'Erro no servidor. Tente novamente.';
      this.zone.run(() => this.toast.show(msg, 'error'));
      return;
    }

    // Em desenvolvimento, não engole o erro
    if (!this.isProduction()) {
      throw error;
    }
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return String(error);
  }

  private isProduction(): boolean {
    return window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  }
}
