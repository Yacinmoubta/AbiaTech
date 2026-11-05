import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { CATEGORIES, ETATS, Produit } from '../core/models';
import { IconComponent, ModalComponent, MoneyPipe, filtreTexte } from '../shared/ui';

const vide = (): Produit => ({
  id: '', reference: '', nom: '', categorie: 'Téléphone', marque: '', etat: 'Neuf', numeroSerie: '',
  prixAchat: 0, prixVente: 0, stock: 0, seuilAlerte: 1, garantieMois: 12, creeLe: '',
});

@Component({
  selector: 'app-produits',
  imports: [FormsModule, IconComponent, ModalComponent, MoneyPipe],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Produits & stock</h1>
        <p class="text-sm text-slate-500 mt-1">{{ store.produits().length }} produits · valeur du stock {{ store.valeurStock() | money }}</p>
      </div>
      <button class="btn-primary" (click)="ouvrir()"><app-icon name="plus" [size]="16" /> Nouveau produit</button>
    </div>

    <div class="card">
      <div class="flex flex-wrap gap-3 p-4 border-b border-slate-100">
        <div class="relative flex-1 min-w-56">
          <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
          <input class="input pl-9" placeholder="Rechercher nom, marque, référence, IMEI…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        </div>
        <select class="input w-auto" [ngModel]="cat()" (ngModelChange)="cat.set($event)">
          <option value="">Toutes catégories</option>
          @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" class="h-4 w-4 accent-brand-600" [ngModel]="alerte()" (ngModelChange)="alerte.set($event)" /> Stock faible
        </label>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>Produit</th><th>Catégorie</th><th>État</th><th class="text-right">Prix achat</th><th class="text-right">Prix vente</th><th class="text-center">Stock</th><th></th></tr></thead>
          <tbody>
            @for (p of liste(); track p.id) {
              <tr>
                <td>
                  <div class="font-medium">{{ p.nom }}</div>
                  <div class="text-xs text-slate-500">{{ p.reference }} · {{ p.marque }}@if (p.numeroSerie) { · {{ p.numeroSerie }} }</div>
                </td>
                <td>{{ p.categorie }}</td>
                <td><span class="badge" [class]="p.etat === 'Neuf' ? 'bg-sky-50 text-sky-700' : p.etat === 'Occasion' ? 'bg-orange-50 text-orange-700' : 'bg-teal-50 text-teal-700'">{{ p.etat }}</span></td>
                <td class="text-right tabular-nums text-slate-500">{{ p.prixAchat | money }}</td>
                <td class="text-right tabular-nums font-medium">{{ p.prixVente | money }}</td>
                <td class="text-center">
                  <div class="inline-flex items-center gap-1">
                    <button class="btn-ghost !p-1" (click)="ajuster(p, -1)" [disabled]="p.stock <= 0" aria-label="Retirer"><app-icon name="minus" [size]="14" /></button>
                    <span class="badge min-w-10 justify-center"
                      [class]="p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock <= p.seuilAlerte ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'">{{ p.stock }}</span>
                    <button class="btn-ghost !p-1" (click)="ajuster(p, 1)" aria-label="Ajouter"><app-icon name="plus" [size]="14" /></button>
                  </div>
                </td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" (click)="ouvrir(p)" aria-label="Modifier"><app-icon name="edit" [size]="16" /></button>
                  <button class="btn-ghost hover:!text-red-600" (click)="supprimer(p)" aria-label="Supprimer"><app-icon name="trash" [size]="16" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center py-12 text-slate-500">Aucun produit trouvé</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <app-modal [open]="!!edit()" [title]="edit()?.id ? 'Modifier le produit' : 'Nouveau produit'" (close)="edit.set(null)">
      @if (edit(); as p) {
        <form class="grid gap-4 sm:grid-cols-2" (ngSubmit)="enregistrer(p)" #f="ngForm">
          <div class="sm:col-span-2"><label class="label">Désignation *</label><input class="input" name="nom" [(ngModel)]="p.nom" required /></div>
          <div><label class="label">Catégorie</label>
            <select class="input" name="cat" [(ngModel)]="p.categorie">@for (c of categories; track c) { <option [value]="c">{{ c }}</option> }</select></div>
          <div><label class="label">Marque</label><input class="input" name="marque" [(ngModel)]="p.marque" /></div>
          <div><label class="label">État</label>
            <select class="input" name="etat" [(ngModel)]="p.etat">@for (e of etats; track e) { <option [value]="e">{{ e }}</option> }</select></div>
          <div><label class="label">Référence</label><input class="input" name="ref" [(ngModel)]="p.reference" placeholder="Auto si vide" /></div>
          <div class="sm:col-span-2"><label class="label">IMEI / N° de série</label><input class="input" name="sn" [(ngModel)]="p.numeroSerie" /></div>
          <div><label class="label">Prix d'achat</label><input class="input" type="number" min="0" name="pa" [(ngModel)]="p.prixAchat" /></div>
          <div><label class="label">Prix de vente</label><input class="input" type="number" min="0" name="pv" [(ngModel)]="p.prixVente" />
            @if (p.prixVente > 0) { <p class="mt-1 text-xs" [class]="p.prixVente >= p.prixAchat ? 'text-emerald-600' : 'text-red-600'">Marge : {{ p.prixVente - p.prixAchat | money }}</p> }</div>
          <div><label class="label">Stock</label><input class="input" type="number" min="0" name="stock" [(ngModel)]="p.stock" /></div>
          <div><label class="label">Seuil d'alerte</label><input class="input" type="number" min="0" name="seuil" [(ngModel)]="p.seuilAlerte" /></div>
          <div><label class="label">Garantie (mois)</label><input class="input" type="number" min="0" name="gar" [(ngModel)]="p.garantieMois" /></div>
          <div class="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" class="btn-secondary" (click)="edit.set(null)">Annuler</button>
            <button class="btn-primary" [disabled]="f.invalid">Enregistrer</button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class ProduitsPage {
  protected store = inject(StoreService);
  protected categories = CATEGORIES;
  protected etats = ETATS;
  protected q = signal('');
  protected cat = signal('');
  protected alerte = signal(false);
  protected edit = signal<Produit | null>(null);

  protected liste = computed(() => this.store.produits().filter(p =>
    filtreTexte(this.q(), p.nom, p.marque, p.reference, p.numeroSerie)
    && (!this.cat() || p.categorie === this.cat())
    && (!this.alerte() || p.stock <= p.seuilAlerte)));

  ouvrir(p?: Produit) { this.edit.set(p ? { ...p } : vide()); }
  enregistrer(p: Produit) { this.store.enregistrerProduit({ ...p, nom: p.nom.trim() }); this.edit.set(null); }
  ajuster(p: Produit, d: number) { this.store.enregistrerProduit({ ...p, stock: Math.max(0, p.stock + d) }); }
  supprimer(p: Produit) { if (confirm(`Supprimer « ${p.nom} » ?`)) this.store.supprimerProduit(p.id); }
}
