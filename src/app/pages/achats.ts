import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { Achat, CATEGORIES, Categorie, ETATS, Etat, LigneAchat, MODES_PAIEMENT, ModePaiement, TypeAchat } from '../core/models';
import { DatePipeFr, IconComponent, ModalComponent, MoneyPipe, filtreTexte } from '../shared/ui';
import { ClientSelectComponent } from '../shared/client-select';
import { MobileService } from '../core/mobile.service';
import { DocEnteteComponent, DocPiedComponent } from '../shared/doc';

@Component({
  selector: 'app-achats',
  imports: [FormsModule, IconComponent, ModalComponent, MoneyPipe, DatePipeFr, ClientSelectComponent, DocEnteteComponent, DocPiedComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Achats</h1>
        <p class="text-sm text-slate-500 mt-1">Réapprovisionnement fournisseurs et rachat d'appareils d'occasion</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary" (click)="nouveau('Rachat client')"><app-icon name="phone" [size]="16" /> Rachat client</button>
        <button class="btn-primary" (click)="nouveau('Fournisseur')"><app-icon name="plus" [size]="16" /> Achat fournisseur</button>
      </div>
    </div>

    <div class="card">
      <div class="flex flex-wrap gap-3 p-4 border-b border-slate-100">
        <div class="relative flex-1 min-w-56">
          <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
          <input class="input pl-9" placeholder="N°, fournisseur, client, produit…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        </div>
        <select class="input w-auto" [ngModel]="filtreType()" (ngModelChange)="filtreType.set($event)">
          <option value="">Tous les types</option><option>Fournisseur</option><option>Rachat client</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>N°</th><th>Date</th><th>Type</th><th>Fournisseur / Vendeur</th><th>Articles</th><th class="text-right">Total</th><th></th></tr></thead>
          <tbody>
            @for (a of liste(); track a.id) {
              <tr>
                <td class="font-medium">{{ a.numero }}</td>
                <td class="text-slate-600 whitespace-nowrap">{{ a.date | dt }}</td>
                <td><span class="badge" [class]="a.type === 'Fournisseur' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'">{{ a.type }}</span></td>
                <td>{{ tiers(a) }}</td>
                <td class="max-w-xs truncate text-slate-600">{{ resume(a) }}</td>
                <td class="text-right font-semibold tabular-nums">{{ a.total | money }}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" (click)="detail.set(a)" aria-label="Bon d'achat"><app-icon name="print" [size]="16" /></button>
                  <button class="btn-ghost hover:!text-red-600" (click)="annuler(a)" aria-label="Annuler"><app-icon name="trash" [size]="16" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center py-12 text-slate-500">Aucun achat</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Formulaire -->
    <app-modal [open]="!!type()" [title]="type() === 'Fournisseur' ? 'Achat auprès d\\'un fournisseur' : 'Rachat d\\'un appareil à un client'" width="max-w-3xl" (close)="type.set(null)">
      @if (type() === 'Fournisseur') {
        <div class="grid gap-4">
          <div><label class="label">Fournisseur *</label>
            <select class="input" [(ngModel)]="fournisseurId">
              <option value="">— Choisir —</option>
              @for (f of store.fournisseurs(); track f.id) { <option [value]="f.id">{{ f.nom }}</option> }
            </select>
          </div>
          <div class="rounded-lg border border-slate-200 overflow-hidden">
            <table class="table">
              <thead><tr><th>Produit</th><th class="w-24">Qté</th><th class="w-32">Coût unitaire</th><th class="text-right">Total</th><th></th></tr></thead>
              <tbody>
                @for (l of lignes(); track $index; let i = $index) {
                  <tr>
                    <td>
                      <select class="input !py-1" [ngModel]="l.produitId" (ngModelChange)="choisirProduit(i, $event)">
                        <option value="">— Produit —</option>
                        @for (p of store.produits(); track p.id) { <option [value]="p.id">{{ p.nom }} ({{ p.stock }})</option> }
                      </select>
                    </td>
                    <td><input type="number" min="1" class="input !py-1" [ngModel]="l.quantite" (ngModelChange)="majLigne(i, { quantite: +$event })" /></td>
                    <td><input type="number" min="0" class="input !py-1" [ngModel]="l.prixUnitaire" (ngModelChange)="majLigne(i, { prixUnitaire: +$event })" /></td>
                    <td class="text-right tabular-nums">{{ l.quantite * l.prixUnitaire | money }}</td>
                    <td><button class="btn-ghost !p-1" (click)="retirerLigne(i)" aria-label="Retirer"><app-icon name="x" [size]="14" /></button></td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="p-2 border-t border-slate-100">
              <button class="btn-ghost text-brand-600" (click)="ajouterLigne()"><app-icon name="plus" [size]="14" /> Ajouter une ligne</button>
            </div>
          </div>
          <p class="text-xs text-slate-500">Produit absent de la liste ? Créez-le d'abord dans « Produits & stock » avec un stock de 0.</p>
        </div>
      } @else if (type() === 'Rachat client') {
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2"><app-client-select [(clientId)]="clientId" label="Vendeur (client) *" [requis]="true" /></div>
          <div class="sm:col-span-2"><label class="label">Appareil (désignation) *</label><input class="input" [(ngModel)]="appareil.nom" placeholder="ex. iPhone 13 128 Go" /></div>
          <div><label class="label">Catégorie</label>
            <select class="input" [(ngModel)]="appareil.categorie">@for (c of categories; track c) { <option [value]="c">{{ c }}</option> }</select></div>
          <div><label class="label">Marque</label><input class="input" [(ngModel)]="appareil.marque" /></div>
          <div><label class="label">IMEI / N° de série *</label><input class="input" [(ngModel)]="appareil.numeroSerie" /></div>
          <div><label class="label">État</label>
            <select class="input" [(ngModel)]="appareil.etat">@for (e of etats; track e) { <option [value]="e">{{ e }}</option> }</select></div>
          <div><label class="label">Prix de rachat *</label><input type="number" min="0" class="input" [(ngModel)]="appareil.prixAchat" /></div>
          <div><label class="label">Prix de revente prévu</label><input type="number" min="0" class="input" [(ngModel)]="appareil.prixVente" /></div>
          <p class="sm:col-span-2 text-xs text-slate-500">Pensez à vérifier la pièce d'identité du vendeur et que l'appareil n'est pas bloqué (iCloud / compte Google).</p>
        </div>
      }
      @if (type()) {
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label class="label">Mode de paiement</label>
            <select class="input" [(ngModel)]="mode">@for (m of modes; track m) { <option [value]="m">{{ m }}</option> }</select></div>
          <div><label class="label">Notes</label><input class="input" [(ngModel)]="notes" /></div>
        </div>
        <div class="mt-5 flex items-center justify-between rounded-lg bg-slate-50 p-4">
          <span class="text-sm text-slate-600">Total de l'achat</span>
          <span class="text-2xl font-semibold tabular-nums">{{ totalForm() | money }}</span>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-secondary" (click)="type.set(null)">Annuler</button>
          <button class="btn-primary" [disabled]="!valide()" (click)="valider()"><app-icon name="check" [size]="16" /> Enregistrer l'achat</button>
        </div>
      }
    </app-modal>

    <!-- Bon d'achat -->
    <app-modal [open]="!!detail()" title="Bon d'achat" width="max-w-3xl" (close)="detail.set(null)">
      @if (detail(); as a) {
        <div class="print-area">
          <app-doc-entete [titre]="a.type === 'Rachat client' ? 'Bon de rachat' : 'Bon d\\'achat'" [numero]="a.numero" [date]="(a.date | dt: true)" />
          <div class="mb-4 text-sm"><span class="text-slate-500">{{ a.type === 'Fournisseur' ? 'Fournisseur' : 'Vendeur' }} :</span> <b>{{ tiers(a) }}</b></div>
          <table class="table">
            <thead><tr><th>Désignation</th><th class="text-center">Qté</th><th class="text-right">P.U.</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (l of a.lignes; track $index) {
                <tr><td>{{ l.designation }}@if (store.produit(l.produitId)?.numeroSerie; as sn) { <div class="text-xs text-slate-500">IMEI/SN : {{ sn }}</div> }</td>
                  <td class="text-center">{{ l.quantite }}</td><td class="text-right">{{ l.prixUnitaire | money }}</td><td class="text-right">{{ l.quantite * l.prixUnitaire | money }}</td></tr>
              }
            </tbody>
          </table>
          <div class="mt-4 ml-auto w-64 text-sm">
            <div class="flex justify-between text-lg font-semibold"><span>Total</span><span>{{ a.total | money }}</span></div>
            <div class="flex justify-between text-slate-500"><span>Paiement</span><span>{{ a.modePaiement }}</span></div>
          </div>
          @if (a.notes) { <p class="mt-3 text-sm text-slate-600">Notes : {{ a.notes }}</p> }
          @if (a.type === 'Rachat client') {
            <div class="mt-10 grid grid-cols-2 gap-8 text-sm text-slate-600">
              <div>Signature du vendeur :<div class="mt-12 border-t border-slate-300"></div></div>
              <div>Signature du magasin :<div class="mt-12 border-t border-slate-300"></div></div>
            </div>
          }
          <app-doc-pied />
        </div>
        <div class="mt-5 flex justify-end gap-2 no-print">
          <button class="btn-secondary" (click)="detail.set(null)">Fermer</button>
          <button class="btn-primary" (click)="imprimer(a.type + ' ' + a.numero)"><app-icon name="print" [size]="16" /> Imprimer</button>
        </div>
      }
    </app-modal>
  `,
})
export class AchatsPage {
  protected store = inject(StoreService);
  protected categories = CATEGORIES;
  protected etats = ETATS;
  protected modes = MODES_PAIEMENT;
  private mobile = inject(MobileService);
  protected imprimer = (titre?: string) => this.mobile.imprimer(titre);

  protected q = signal('');
  protected filtreType = signal('');
  protected type = signal<TypeAchat | null>(null);
  protected detail = signal<Achat | null>(null);

  protected fournisseurId = '';
  protected clientId: string | undefined;
  protected lignes = signal<LigneAchat[]>([]);
  protected mode: ModePaiement = 'Espèces';
  protected notes = '';
  protected appareil = { nom: '', categorie: 'Téléphone' as Categorie, marque: '', numeroSerie: '', etat: 'Occasion' as Etat, prixAchat: 0, prixVente: 0 };

  protected liste = computed(() => this.store.achats().filter(a =>
    (!this.filtreType() || a.type === this.filtreType())
    && filtreTexte(this.q(), a.numero, this.tiers(a), ...a.lignes.map(l => l.designation))));

  tiers(a: Achat) {
    return a.type === 'Fournisseur' ? this.store.fournisseur(a.fournisseurId)?.nom ?? '—' : this.store.client(a.clientId)?.nom ?? '—';
  }
  resume(a: Achat) { return a.lignes.map(l => (l.quantite > 1 ? l.quantite + '× ' : '') + l.designation).join(', '); }

  totalForm() {
    return this.type() === 'Fournisseur'
      ? this.lignes().reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)
      : +this.appareil.prixAchat || 0;
  }
  valide() {
    if (this.type() === 'Fournisseur') return !!this.fournisseurId && this.lignes().length > 0 && this.lignes().every(l => l.produitId && l.quantite > 0);
    return !!this.clientId && !!this.appareil.nom.trim() && !!this.appareil.numeroSerie.trim() && this.appareil.prixAchat > 0;
  }

  nouveau(t: TypeAchat) {
    this.fournisseurId = ''; this.clientId = undefined; this.mode = t === 'Fournisseur' ? 'Virement' : 'Espèces'; this.notes = '';
    this.lignes.set([{ produitId: '', designation: '', quantite: 1, prixUnitaire: 0 }]);
    this.appareil = { nom: '', categorie: 'Téléphone', marque: '', numeroSerie: '', etat: 'Occasion', prixAchat: 0, prixVente: 0 };
    this.type.set(t);
  }
  retirerLigne(i: number) { this.lignes.update(ls => ls.filter((_, j) => j !== i)); }
  ajouterLigne() { this.lignes.update(ls => [...ls, { produitId: '', designation: '', quantite: 1, prixUnitaire: 0 }]); }
  majLigne(i: number, patch: Partial<LigneAchat>) { this.lignes.update(ls => ls.map((l, j) => j === i ? { ...l, ...patch } : l)); }
  choisirProduit(i: number, id: string) {
    const p = this.store.produit(id);
    this.majLigne(i, { produitId: id, designation: p?.nom ?? '', prixUnitaire: p?.prixAchat ?? 0 });
  }

  valider() {
    let achat: Achat;
    if (this.type() === 'Fournisseur') {
      achat = this.store.creerAchat({ date: new Date().toISOString(), type: 'Fournisseur', fournisseurId: this.fournisseurId,
        lignes: this.lignes(), modePaiement: this.mode, notes: this.notes || undefined });
    } else {
      const a = this.appareil;
      const p = this.store.enregistrerProduit({
        id: '', reference: '', nom: a.nom.trim(), categorie: a.categorie, marque: a.marque, etat: a.etat,
        numeroSerie: a.numeroSerie.trim(), prixAchat: +a.prixAchat, prixVente: +a.prixVente || Math.round(a.prixAchat * 1.25),
        stock: 0, seuilAlerte: 0, garantieMois: 3, creeLe: '',
      });
      achat = this.store.creerAchat({ date: new Date().toISOString(), type: 'Rachat client', clientId: this.clientId,
        lignes: [{ produitId: p.id, designation: p.nom, quantite: 1, prixUnitaire: +a.prixAchat }], modePaiement: this.mode, notes: this.notes || undefined });
    }
    this.type.set(null);
    this.detail.set(achat);
  }
  annuler(a: Achat) {
    if (confirm(`Annuler l'achat ${a.numero} ? Les quantités seront retirées du stock.`)) this.store.annulerAchat(a.id);
  }
}
