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
      <aside class="no-print fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-linear-to-b from-ink-900 to-ink-950 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
             [class.-translate-x-full]="!menuOuvert()">
        <div class="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-white/10">
          <img src="logo.svg" alt="" class="h-9 w-9 shrink-0 rounded-lg" />
          <div class="min-w-0">
            <div class="truncate font-semibold text-white">{{ store.parametres().nomMagasin }}</div>
            <div class="text-xs text-slate-400">Gestion du magasin</div>
          </div>
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto p-3">
          @for (l of liens; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="!bg-brand-600 !text-white shadow-lg shadow-black/20" [routerLinkActiveOptions]="{ exact: l.path === '/' }"
               (click)="menuOuvert.set(false)"
               class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white">
              <app-icon [name]="l.icon" />
              <span class="flex-1">{{ l.label }}</span>
              @if (l.path === '/reparations' && reparationsActives() > 0) {
                <span class="badge bg-white/15 text-white">{{ reparationsActives() }}</span>
              }
              @if (l.path === '/a-acheter' && store.resteAAcheter().length > 0) {
                <span class="badge bg-white/15 text-white">{{ store.resteAAcheter().length }}</span>
              }
              @if (l.path === '/produits' && store.stockFaible().length > 0) {
                <span class="badge bg-amber-500 text-white">{{ store.stockFaible().length }}</span>
              }
            </a>
          }
        </nav>
      </aside>
      @if (menuOuvert()) {
        <div class="no-print modal-fond fixed inset-0 z-[35] bg-slate-900/50 backdrop-blur-sm lg:hidden" (click)="menuOuvert.set(false)"></div>
      }

      <div class="flex-1 min-w-0">
        <header class="no-print sticky top-0 z-20 flex h-14 items-center gap-2.5 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur lg:hidden">
          <img src="logo.svg" alt="" class="h-8 w-8 rounded-lg" />
          <span class="truncate font-semibold text-slate-900">{{ store.parametres().nomMagasin }}</span>
        </header>
        <main class="mx-auto max-w-7xl p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:p-8">
          <router-outlet />
        </main>
      </div>

      <!-- Navigation du téléphone -->
      <nav class="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navigation principale">
        @for (l of liensMobile; track l.path) {
          <a [routerLink]="l.path" routerLinkActive="!text-brand-600" [routerLinkActiveOptions]="{ exact: l.path === '/' }"
             class="relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
            <span class="relative">
              <app-icon [name]="l.icon" [size]="22" />
              @if (l.path === '/reparations' && reparationsActives() > 0) {
                <span class="badge absolute -right-3 -top-1.5 min-w-4 justify-center bg-brand-600 !px-1 !py-0 text-[10px] text-white">{{ reparationsActives() }}</span>
              }
              @if (l.path === '/produits' && store.stockFaible().length > 0) {
                <span class="badge absolute -right-3 -top-1.5 min-w-4 justify-center bg-amber-500 !px-1 !py-0 text-[10px] text-white">{{ store.stockFaible().length }}</span>
              }
            </span>
            {{ l.label }}
          </a>
        }
        <button class="flex h-16 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500" (click)="menuOuvert.set(true)">
          <app-icon name="menu" [size]="22" /> Plus
        </button>
      </nav>
    </div>
  `,
})
export class App {
  protected store = inject(StoreService);
  protected menuOuvert = signal(false);
  protected reparationsActives = computed(() =>
    this.store.reparations().filter(r => !['Livré', 'Annulé'].includes(r.statut)).length);

  protected liensMobile = [
    { path: '/', label: 'Accueil', icon: 'dashboard' },
    { path: '/ventes', label: 'Ventes', icon: 'cart' },
    { path: '/reparations', label: 'Réparations', icon: 'wrench' },
    { path: '/produits', label: 'Stock', icon: 'box' },
  ];

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
