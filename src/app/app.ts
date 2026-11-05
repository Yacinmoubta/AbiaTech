import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StoreService } from './core/store.service';
import { IconComponent } from './shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="min-h-screen lg:flex">
      <!-- Barre latérale -->
      <aside class="no-print fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0"
             [class.-translate-x-full]="!menuOuvert()">
        <div class="flex h-16 items-center gap-3 px-5 border-b border-white/10">
          <div class="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white"><app-icon name="phone" /></div>
          <div class="min-w-0">
            <div class="truncate font-semibold text-white">{{ store.parametres().nomMagasin }}</div>
            <div class="text-xs text-slate-400">Gestion du magasin</div>
          </div>
        </div>
        <nav class="space-y-1 p-3">
          @for (l of liens; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="!bg-white/10 !text-white" [routerLinkActiveOptions]="{ exact: l.path === '/' }"
               (click)="menuOuvert.set(false)"
               class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-white">
              <app-icon [name]="l.icon" />
              <span class="flex-1">{{ l.label }}</span>
              @if (l.path === '/reparations' && reparationsActives() > 0) {
                <span class="badge bg-brand-600 text-white">{{ reparationsActives() }}</span>
              }
              @if (l.path === '/a-acheter' && store.resteAAcheter().length > 0) {
                <span class="badge bg-brand-600 text-white">{{ store.resteAAcheter().length }}</span>
              }
              @if (l.path === '/produits' && store.stockFaible().length > 0) {
                <span class="badge bg-amber-500 text-white">{{ store.stockFaible().length }}</span>
              }
            </a>
          }
        </nav>
      </aside>
      @if (menuOuvert()) {
        <div class="no-print fixed inset-0 z-30 bg-slate-900/40 lg:hidden" (click)="menuOuvert.set(false)"></div>
      }

      <div class="flex-1 min-w-0">
        <header class="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button class="btn-ghost" (click)="menuOuvert.set(true)" aria-label="Menu"><app-icon name="menu" /></button>
          <span class="font-semibold">{{ store.parametres().nomMagasin }}</span>
        </header>
        <main class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class App {
  protected store = inject(StoreService);
  protected menuOuvert = signal(false);
  protected reparationsActives = computed(() =>
    this.store.reparations().filter(r => !['Livré', 'Annulé'].includes(r.statut)).length);

  protected liens = [
    { path: '/', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/ventes', label: 'Ventes', icon: 'cart' },
    { path: '/reparations', label: 'Réparations', icon: 'wrench' },
    { path: '/produits', label: 'Produits & stock', icon: 'box' },
    { path: '/achats', label: 'Achats', icon: 'truck' },
    { path: '/a-acheter', label: 'À acheter', icon: 'list' },
    { path: '/clients', label: 'Clients', icon: 'users' },
    { path: '/fournisseurs', label: 'Fournisseurs', icon: 'factory' },
    { path: '/parametres', label: 'Paramètres', icon: 'settings' },
  ];
}
