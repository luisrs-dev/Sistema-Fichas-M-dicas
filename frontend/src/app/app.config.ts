import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { TokenInterceptor } from './auth/interceptors/token-interceptor';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MONDAY_FIRST_DATE_PROVIDERS } from './shared/date/monday-first-date-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    ...MONDAY_FIRST_DATE_PROVIDERS,
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom(HttpClientModule),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }, provideAnimationsAsync(),
  ],
};
