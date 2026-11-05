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
      <div class="flex gap-2">
        <a routerLink="/reparations" [queryParams]="{ nouveau: 1 }" class="btn-secondary"><app-icon name="wrench" [size]="16" /> Nouvelle réparation</a>
        <a routerLink="/ventes" [queryParams]="{ nouveau: 1 }" class="btn-primary"><app-icon name="plus" [size]="16" /> Nouvelle vente</a>
      </div>
    </div>

    <!-- KPI -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      @for (k of kpis(); track k.label) {
        <div class="card p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">{{ k.label }}</span>
            <span class="grid h-9 w-9 place-items-center rounded-lg" [class]="k.couleur"><app-icon [name]="k.icon" [size]="18" /></span>
          </div>
          <div class="mt-3 text-2xl font-semibold tabular-nums">{{ k.valeur }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ k.sous }}</div>
        </div>
      }
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
      <!-- Graphique 7 jours -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold">Encaissements — 7 derniers jours</h2>
          <div class="flex gap-4 text-xs text-slate-500">
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-brand-500"></span>Ventes</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-emerald-500"></span>Réparations</span>
          </div>
        </div>
        <div class="flex h-56 items-end gap-3">
          @for (j of semaine(); track j.label) {
            <div class="flex flex-1 flex-col items-center gap-2 h-full">
              <div class="flex w-full flex-1 flex-col justify-end" [title]="(j.ventes + j.reparations | money)">
                <div class="w-full rounded-t bg-emerald-500" [style.height.%]="j.reparations / maxSemaine() * 100"></div>
                <div class="w-full bg-brand-500" [class.rounded-t]="!j.reparations" [style.height.%]="j.ventes / maxSemaine() * 100"></div>
              </div>
              <span class="text-xs text-slate-500">{{ j.label }}</span>
            </div>
          }
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
            <li class="px-5 py-8 text-center text-sm text-slate-500">Aucun produit en alerte 👍</li>
          }
        </ul>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
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
      { label: "Chiffre d'affaires du jour", valeur: this.money.transform(caJour), sous: `${ventesJour.length} vente(s) aujourd'hui`, icon: 'money', couleur: 'bg-brand-50 text-brand-600' },
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
