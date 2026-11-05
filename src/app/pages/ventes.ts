import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../core/store.service';
import { LigneVente, MODES_PAIEMENT, ModePaiement, Produit, Vente } from '../core/models';
import { DatePipeFr, IconComponent, ModalComponent, MoneyPipe, filtreTexte } from '../shared/ui';
import { ClientSelectComponent } from '../shared/client-select';
import { MobileService } from '../core/mobile.service';
import { DocEnteteComponent, DocPiedComponent } from '../shared/doc';

@Component({
  selector: 'app-ventes',
  imports: [FormsModule, IconComponent, ModalComponent, MoneyPipe, DatePipeFr, ClientSelectComponent, DocEnteteComponent, DocPiedComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Ventes</h1>
        <p class="text-sm text-slate-500 mt-1">{{ liste().length }} vente(s) · total {{ totalListe() | money }}</p>
      </div>
      <button class="btn-primary" (click)="nouvelle()"><app-icon name="plus" [size]="16" /> Nouvelle vente</button>
    </div>

    <div class="card">
      <div class="flex flex-wrap gap-3 p-4 border-b border-slate-100">
        <div class="relative flex-1 min-w-56">
          <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
          <input class="input pl-9" placeholder="N° de vente, client, produit…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        </div>
        <input type="date" class="input w-auto" [ngModel]="du()" (ngModelChange)="du.set($event)" title="Du" />
        <input type="date" class="input w-auto" [ngModel]="au()" (ngModelChange)="au.set($event)" title="Au" />
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Articles</th><th>Paiement</th><th class="text-right">Total</th><th></th></tr></thead>
          <tbody>
            @for (v of liste(); track v.id) {
              <tr>
                <td class="font-medium">{{ v.numero }}</td>
                <td class="whitespace-nowrap text-slate-600">{{ v.date | dt: true }}</td>
                <td>{{ store.client(v.clientId)?.nom ?? 'Client comptoir' }}</td>
                <td class="max-w-xs truncate text-slate-600">{{ resume(v) }}</td>
                <td><span class="badge bg-slate-100 text-slate-700">{{ v.modePaiement }}</span></td>
                <td class="text-right font-semibold tabular-nums">{{ v.total | money }}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" (click)="facture.set(v)" aria-label="Facture"><app-icon name="print" [size]="16" /></button>
                  <button class="btn-ghost hover:!text-red-600" (click)="annuler(v)" aria-label="Annuler la vente"><app-icon name="trash" [size]="16" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center py-12 text-slate-500">Aucune vente</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Caisse -->
    <app-modal [open]="caisse()" title="Nouvelle vente" width="max-w-5xl" (close)="caisse.set(false)">
      <div class="grid gap-6 lg:grid-cols-5">
        <div class="lg:col-span-2">
          <div class="relative mb-3">
            <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
            <input class="input pl-9" placeholder="Rechercher un produit…" [ngModel]="qProduit()" (ngModelChange)="qProduit.set($event)" />
          </div>
          <ul class="max-h-96 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
            @for (p of produitsDispo(); track p.id) {
              <li>
                <button type="button" class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-brand-50 cursor-pointer" (click)="ajouter(p)">
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-medium">{{ p.nom }}</div>
                    <div class="text-xs text-slate-500">{{ p.categorie }} · {{ p.etat }} · stock {{ p.stock }}</div>
                  </div>
                  <span class="font-medium tabular-nums">{{ p.prixVente | money }}</span>
                </button>
              </li>
            } @empty {
              <li class="p-6 text-center text-sm text-slate-500">Aucun produit en stock</li>
            }
          </ul>
        </div>

        <div class="lg:col-span-3 flex flex-col gap-4">
          <div class="rounded-lg border border-slate-200 overflow-hidden">
            <table class="table">
              <thead><tr><th>Article</th><th class="w-20">Qté</th><th class="w-28">Prix</th><th class="text-right">Total</th><th></th></tr></thead>
              <tbody>
                @for (l of panier(); track l.produitId; let i = $index) {
                  <tr>
                    <td class="font-medium">{{ l.designation }}</td>
                    <td><input type="number" min="1" [max]="stockDe(l.produitId)" class="input !px-2 !py-1" [ngModel]="l.quantite" (ngModelChange)="majLigne(i, { quantite: +$event })" /></td>
                    <td><input type="number" min="0" class="input !px-2 !py-1" [ngModel]="l.prixUnitaire" (ngModelChange)="majLigne(i, { prixUnitaire: +$event })" /></td>
                    <td class="text-right tabular-nums">{{ l.quantite * l.prixUnitaire | money }}</td>
                    <td><button class="btn-ghost !p-1" (click)="retirer(i)" aria-label="Retirer"><app-icon name="x" [size]="14" /></button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="py-10 text-center text-slate-500">Cliquez sur un produit pour l'ajouter</td></tr>
                }
              </tbody>
            </table>
          </div>

          <app-client-select [(clientId)]="clientId" />

          <div class="grid gap-4 sm:grid-cols-2">
            <div><label class="label">Remise</label><input type="number" min="0" class="input" [ngModel]="remise()" (ngModelChange)="remise.set(+$event || 0)" /></div>
            <div><label class="label">Mode de paiement</label>
              <select class="input" [ngModel]="mode()" (ngModelChange)="mode.set($event)">@for (m of modes; track m) { <option [value]="m">{{ m }}</option> }</select>
            </div>
          </div>
          <div><label class="label">Notes</label><input class="input" [(ngModel)]="notes" placeholder="Optionnel" /></div>

          @if (erreurStock()) { <p class="text-sm text-red-600">{{ erreurStock() }}</p> }

          <div class="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div class="text-sm text-slate-600">Sous-total {{ sousTotal() | money }}@if (remise()) { · remise −{{ remise() | money }} }</div>
            <div class="text-2xl font-semibold tabular-nums">{{ total() | money }}</div>
          </div>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" (click)="caisse.set(false)">Annuler</button>
            <button class="btn-primary" [disabled]="!panier().length || !!erreurStock()" (click)="valider()"><app-icon name="check" [size]="16" /> Valider la vente</button>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- Facture -->
    <app-modal [open]="!!facture()" title="Facture" width="max-w-3xl" (close)="facture.set(null)">
      @if (facture(); as v) {
        <div class="print-area">
          <app-doc-entete titre="Facture" [numero]="v.numero" [date]="(v.date | dt: true)" />
          @if (store.client(v.clientId); as c) {
            <div class="mb-4 text-sm"><span class="text-slate-500">Client :</span> <b>{{ c.nom }}</b> · {{ c.telephone }}@if (c.adresse) { · {{ c.adresse }} }</div>
          }
          <table class="table">
            <thead><tr><th>Désignation</th><th class="text-center">Qté</th><th class="text-right">P.U.</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (l of v.lignes; track $index) {
                <tr><td>{{ l.designation }}@if (garantie(l.produitId); as g) { <div class="text-xs text-slate-500">Garantie {{ g }} mois</div> }</td>
                  <td class="text-center">{{ l.quantite }}</td><td class="text-right">{{ l.prixUnitaire | money }}</td><td class="text-right">{{ l.quantite * l.prixUnitaire | money }}</td></tr>
              }
            </tbody>
          </table>
          <div class="mt-4 ml-auto w-64 space-y-1 text-sm">
            @if (v.remise) { <div class="flex justify-between"><span>Remise</span><span>−{{ v.remise | money }}</span></div> }
            <div class="flex justify-between text-lg font-semibold border-t border-slate-200 pt-2"><span>Total TTC</span><span>{{ v.total | money }}</span></div>
            <div class="flex justify-between text-slate-500"><span>Paiement</span><span>{{ v.modePaiement }}</span></div>
          </div>
          <app-doc-pied />
        </div>
        <div class="mt-5 flex justify-end gap-2 no-print">
          <button class="btn-secondary" (click)="facture.set(null)">Fermer</button>
          <button class="btn-primary" (click)="imprimer('Facture ' + v.numero)"><app-icon name="print" [size]="16" /> Imprimer</button>
        </div>
      }
    </app-modal>
  `,
})
export class VentesPage implements OnInit {
  protected store = inject(StoreService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected modes = MODES_PAIEMENT;
  private mobile = inject(MobileService);
  protected imprimer = (titre?: string) => this.mobile.imprimer(titre);

  protected q = signal('');
  protected du = signal('');
  protected au = signal('');
  protected caisse = signal(false);
  protected facture = signal<Vente | null>(null);

  protected qProduit = signal('');
  protected panier = signal<LigneVente[]>([]);
  protected clientId: string | undefined;
  protected remise = signal(0);
  protected mode = signal<ModePaiement>('Espèces');
  protected notes = '';

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('nouveau')) {
      this.nouvelle();
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  protected liste = computed(() => this.store.ventes().filter(v => {
    const d = v.date.slice(0, 10);
    return (!this.du() || d >= this.du()) && (!this.au() || d <= this.au())
      && filtreTexte(this.q(), v.numero, this.store.client(v.clientId)?.nom, ...v.lignes.map(l => l.designation));
  }));
  protected totalListe = computed(() => this.liste().reduce((s, v) => s + v.total, 0));

  protected produitsDispo = computed(() => this.store.produits()
    .filter(p => p.stock > 0 && filtreTexte(this.qProduit(), p.nom, p.marque, p.reference, p.numeroSerie)));
  protected sousTotal = computed(() => this.panier().reduce((s, l) => s + l.quantite * l.prixUnitaire, 0));
  protected total = computed(() => Math.max(0, this.sousTotal() - this.remise()));
  protected erreurStock = computed(() => {
    const l = this.panier().find(l => l.quantite > this.stockDe(l.produitId) || l.quantite < 1);
    return l ? `Quantité invalide pour « ${l.designation} » (stock : ${this.stockDe(l.produitId)})` : '';
  });

  resume(v: Vente) { return v.lignes.map(l => (l.quantite > 1 ? l.quantite + '× ' : '') + l.designation).join(', '); }
  stockDe(id: string) { return this.store.produit(id)?.stock ?? 0; }
  garantie(id: string) { return this.store.produit(id)?.garantieMois || 0; }

  nouvelle() {
    this.panier.set([]); this.clientId = undefined; this.remise.set(0); this.mode.set('Espèces');
    this.notes = ''; this.qProduit.set(''); this.caisse.set(true);
  }
  ajouter(p: Produit) {
    const i = this.panier().findIndex(l => l.produitId === p.id);
    if (i >= 0) this.majLigne(i, { quantite: Math.min(p.stock, this.panier()[i].quantite + 1) });
    else this.panier.update(ls => [...ls, { produitId: p.id, designation: p.nom, quantite: 1, prixUnitaire: p.prixVente, prixAchat: p.prixAchat }]);
  }
  majLigne(i: number, patch: Partial<LigneVente>) { this.panier.update(ls => ls.map((l, j) => j === i ? { ...l, ...patch } : l)); }
  retirer(i: number) { this.panier.update(ls => ls.filter((_, j) => j !== i)); }

  valider() {
    const v = this.store.creerVente({
      date: new Date().toISOString(), clientId: this.clientId, lignes: this.panier(),
      remise: this.remise(), modePaiement: this.mode(), notes: this.notes || undefined,
    });
    this.caisse.set(false);
    this.facture.set(v);
  }
  annuler(v: Vente) {
    if (confirm(`Annuler la vente ${v.numero} ? Les articles seront remis en stock.`)) this.store.annulerVente(v.id);
  }
}
