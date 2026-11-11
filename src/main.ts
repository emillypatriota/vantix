import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { GlobalErrorHandler } from './app/core/error-handler';
import { authInterceptor } from './app/core/api/auth.interceptor';
import { mockBackendInterceptor } from './app/core/mock/mock-backend.interceptor';

// Moeda e datas no formato brasileiro (R$ 1.234,56 · 11/11/2026)
registerLocaleData(localePt);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    // authInterceptor coloca o token; mockBackendInterceptor (último) responde no
    // lugar da API Java quando environment.useMock = true.
    provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ]
}).catch(err => console.error(err));
