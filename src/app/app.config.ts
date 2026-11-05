import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { StoreService } from './core/store.service';
import { MobileService } from './core/mobile.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Ouvre la base locale et charge les données avant d'afficher l'application
    provideAppInitializer(async () => {
      const store = inject(StoreService);
      const mobile = inject(MobileService);
      await store.init();
      mobile.init();
    }),
  ],
};
