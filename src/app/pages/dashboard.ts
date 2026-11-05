import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreService } from '../core/store.service';
import { totalReparation } from '../core/models';
import { DatePipeFr, IconComponent, MoneyPipe, couleurStatut } from '../shared/ui';

const memeJour = (a: Date, b: Date) => a.toDateString() === b.toDateString();

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MoneyPipe, DatePipeFr, IconComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Tableau de bord</h1>
        <p class="text-sm text-slate-500 mt-1">{{ aujourdhui }}</p>
      </div>
      <div class="flex w-full flex-wrap gap-2 sm:w-auto">
        <a routerLink="/reparations" [queryParams]="{ nouveau: 1 }" class="btn-secondary flex-1 whitespace-nowrap sm:flex-none"><app-icon name="wrench" [size]="16" /> Nouvelle réparation</a>
        <a routerLink="/ventes" [queryParams]="{ nouveau: 1 }" class="btn-primary flex-1 whitespace-nowrap sm:flex-none"><app-icon name="plus" [size]="16" /> Nouvelle vente</a>
      </div>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      @for (k of kpis(); track k.label; let premier = $first) {
        <div class="card flex flex-col p-4 sm:p-5" [class]="premier ? '!border-transparent !bg-transparent bg-linear-to-br from-brand-600 to-brand-700 text-white' : ''">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm" [class]="premier ? 'text-brand-100' : 'text-slate-500'">{{ k.label }}</span>
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9" [class]="k.couleur"><app-icon [name]="k.icon" [size]="18" /></span>
          </div>
          <div class="mt-auto pt-3 text-xl font-bold tracking-tight tabular-nums sm:text-2xl" [class]="premier ? '' : 'text-slate-900'">{{ k.valeur }}</div>
          <div class="mt-1 text-xs" [class]="premier ? 'text-brand-100' : 'text-slate-500'">{{ k.sous }}</div>
        </div>
      }
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-3">
      <!-- Graphique 7 jours -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-8">
          <h2 class="font-semibold text-slate-900">Encaissements — 7 derniers jours</h2>
          <div class="flex gap-4 text-xs text-slate-500">
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-brand-500"></span>Ventes</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-emerald-600"></span>Réparations</span>
          </div>
        </div>
        <div class="relative">
          <!-- Repères : le haut du graphique correspond au meilleur jour -->
          <div class="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
            <div class="relative border-t border-dashed border-slate-200"><span class="absolute -top-5 left-0 text-[11px] text-slate-500">{{ maxSemaine() | money }}</span></div>
            <div class="border-t border-dashed border-slate-100"></div>
            <div class="border-t border-slate-200"></div>
          </div>
          <div class="relative flex h-48 items-stretch gap-1 sm:h-56 sm:gap-2">
            @for (j of semaine(); track j.label; let i = $index; let dernier = $last) {
              <div class="group relative flex min-w-0 flex-1 flex-col items-center gap-2 outline-none" tabindex="0"
                   [attr.aria-label]="j.label + ' : ventes ' + (j.ventes | money) + ', réparations ' + (j.reparations | money)">
                <div class="flex w-full max-w-6 flex-1 flex-col justify-end transition-opacity group-hover:opacity-85">
                  @if (j.reparations > 0) {
                    <div class="w-full rounded-t bg-emerald-600" [class.mb-0.5]="j.ventes > 0" [style.height.%]="j.reparations / maxSemaine() * 100"></div>
                  }
                  @if (j.ventes > 0) {
                    <div class="w-full bg-brand-500" [class.rounded-t]="!j.reparations" [style.height.%]="j.ventes / maxSemaine() * 100"></div>
                  }
                </div>
                <span class="h-4 text-xs" [class]="dernier ? 'font-semibold text-slate-900' : 'text-slate-500'">{{ j.label }}</span>
                <div class="pointer-events-none absolute top-1 z-10 hidden w-40 rounded-lg bg-ink-900 p-2.5 text-xs text-white shadow-lg group-hover:block group-focus:block"
                     [class]="i < 2 ? 'left-0' : i > 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'">
                  <div class="flex justify-between gap-2"><span class="text-slate-300">Ventes</span><span class="tabular-nums">{{ j.ventes | money }}</span></div>
                  <div class="flex justify-between gap-2"><span class="text-slate-300">Réparations</span><span class="tabular-nums">{{ j.reparations | money }}</span></div>
                  <div class="mt-1 flex justify-between gap-2 border-t border-white/15 pt-1 font-semibold"><span>Total</span><span class="tabular-nums">{{ j.ventes + j.reparations | money }}</span></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Stock faible -->
      <div class="card">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 class="font-semibold">Stock faible</h2>
          <a routerLink="/produits" class="text-sm text-brand-600 hover:underline">Voir tout</a>
        </div>
        <ul class="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          @for (p of store.stockFaible(); track p.id) {
            <li class="flex items-center justify-between px-5 py-3 text-sm">
              <div class="min-w-0"><div class="truncate font-medium">{{ p.nom }}</div><div class="text-xs text-slate-500">{{ p.categorie }}</div></div>
              <span class="badge" [class]="p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'">{{ p.stock }} en stock</span>
            </li>
          } @empty {
            <li class="px-5 py-8 text-center text-sm text-slate-500">Aucun produit en alerte</li>
          }
        </ul>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
      <div class="card">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 class="font-semibold">Réparations en cours</h2>
          <a routerLink="/reparations" class="text-sm text-brand-600 hover:underline">Voir tout</a>
        </div>
        <ul class="divide-y divide-slate-100">
          @for (r of reparationsEnCours(); track r.id) {
            <li class="flex items-center gap-3 px-5 py-3 text-sm">
              <div class="min-w-0 flex-1">
                <div class="font-medium truncate">{{ r.marque }} {{ r.modele }} <span class="text-slate-400 font-normal">· {{ r.numero }}</span></div>
                <div class="text-xs text-slate-500 truncate">{{ store.client(r.clientId)?.nom }} — {{ r.panne }}</div>
              </div>
              <span class="badge" [class]="couleur(r.statut)">{{ r.statut }}</span>
            </li>
          } @empty {
            <li class="px-5 py-8 text-center text-sm text-slate-500">Aucune réparation en cours</li>
          }
        </ul>
      </div>

      <div class="card">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 class="font-semibold">Dernières ventes</h2>
          <a routerLink="/ventes" class="text-sm text-brand-600 hover:underline">Voir tout</a>
        </div>
        <ul class="divide-y divide-slate-100">
          @for (v of dernieresVentes(); track v.id) {
            <li class="flex items-center gap-3 px-5 py-3 text-sm">
              <div class="min-w-0 flex-1">
                <div class="font-medium truncate">{{ v.lignes[0]?.designation }}@if (v.lignes.length > 1) { <span class="text-slate-400"> +{{ v.lignes.length - 1 }}</span> }</div>
                <div class="text-xs text-slate-500">{{ v.numero }} · {{ v.date | dt: true }} · {{ store.client(v.clientId)?.nom ?? 'Client comptoir' }}</div>
              </div>
              <span class="font-semibold tabular-nums">{{ v.total | money }}</span>
            </li>
          } @empty {
            <li class="px-5 py-8 text-center text-sm text-slate-500">Aucune vente</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class DashboardPage {
  protected store = inject(StoreService);
  protected couleur = couleurStatut;
  protected aujourdhui = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  private money = new MoneyPipe();

  private encaissementReparation = (dateRef: (d: Date) => boolean) =>
    this.store.reparations().filter(r => r.statut === 'Livré' && r.dateLivraison && dateRef(new Date(r.dateLivraison)))
      .reduce((s, r) => s + totalReparation(r), 0);

  protected kpis = computed(() => {
    const now = new Date();
    const ventesJour = this.store.ventes().filter(v => memeJour(new Date(v.date), now));
    const moisCourant = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const ventesMois = this.store.ventes().filter(v => moisCourant(new Date(v.date)));
    const caMois = ventesMois.reduce((s, v) => s + v.total, 0) + this.encaissementReparation(moisCourant);
    const marge = ventesMois.reduce((s, v) => s + v.total - v.lignes.reduce((a, l) => a + l.quantite * l.prixAchat, 0), 0);
    const actives = this.store.reparations().filter(r => !['Livré', 'Annulé'].includes(r.statut));
    const pretes = actives.filter(r => r.statut === 'Prêt').length;
    const caJour = ventesJour.reduce((s, v) => s + v.total, 0) + this.encaissementReparation(d => memeJour(d, now));
    return [
      { label: "Chiffre d'affaires du jour", valeur: this.money.transform(caJour), sous: `${ventesJour.length} vente(s) aujourd'hui`, icon: 'money', couleur: 'bg-white/15 text-white' },
      { label: 'Chiffre d\'affaires du mois', valeur: this.money.transform(caMois), sous: `Marge ventes : ${this.money.transform(marge)}`, icon: 'cart', couleur: 'bg-emerald-50 text-emerald-600' },
      { label: 'Réparations en cours', valeur: String(actives.length), sous: `${pretes} prête(s) à livrer`, icon: 'wrench', couleur: 'bg-violet-50 text-violet-600' },
      { label: 'Valeur du stock', valeur: this.money.transform(this.store.valeurStock()), sous: `${this.store.stockFaible().length} produit(s) en alerte`, icon: 'box', couleur: 'bg-amber-50 text-amber-600' },
    ];
  });

  protected semaine = computed(() => {
    const jours = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      jours.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
        ventes: this.store.ventes().filter(v => memeJour(new Date(v.date), d)).reduce((s, v) => s + v.total, 0),
        reparations: this.encaissementReparation(x => memeJour(x, d)),
      });
    }
    return jours;
  });
  protected maxSemaine = computed(() => Math.max(1, ...this.semaine().map(j => j.ventes + j.reparations)));

  protected reparationsEnCours = computed(() =>
    this.store.reparations().filter(r => !['Livré', 'Annulé'].includes(r.statut)).slice(0, 6));
  protected dernieresVentes = computed(() => this.store.ventes().slice(0, 6));
}
