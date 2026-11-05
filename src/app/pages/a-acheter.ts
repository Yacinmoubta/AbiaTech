import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { ProduitAAcheter } from '../core/models';
import { IconComponent, ModalComponent, MoneyPipe, filtreTexte } from '../shared/ui';

const vide = (): ProduitAAcheter => ({
  id: '', nom: '', quantite: 1, produitId: '', fournisseurId: '', prixEstime: 0, notes: '', statut: 'À acheter', creeLe: '',
});

@Component({
  selector: 'app-a-acheter',
  imports: [FormsModule, IconComponent, ModalComponent, MoneyPipe],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">À acheter</h1>
        <p class="text-sm text-slate-500 mt-1">{{ store.resteAAcheter().length }} produit(s) à acheter · {{ totalEstime() | money }} estimés</p>
      </div>
      <div class="flex gap-2">
        @if (nbAchetes() > 0) {
          <button class="btn-secondary" (click)="retirerAchetes()"><app-icon name="trash" [size]="16" /> Retirer les achetés</button>
        }
        <button class="btn-primary" (click)="edit.set(vide())"><app-icon name="plus" [size]="16" /> Ajouter un produit</button>
      </div>
    </div>

    <div class="card">
      <div class="flex flex-wrap gap-3 p-4 border-b border-slate-100">
        <div class="relative flex-1 min-w-56">
          <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
          <input class="input pl-9" placeholder="Produit, fournisseur, notes…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        </div>
        <select class="input w-auto" [ngModel]="filtreStatut()" (ngModelChange)="filtreStatut.set($event)">
          <option value="">Tous</option><option>À acheter</option><option>Acheté</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th class="w-10"></th><th>Produit</th><th class="text-center">Qté</th><th>Fournisseur</th><th class="text-right">Prix estimé</th><th class="text-right">Total</th><th></th></tr></thead>
          <tbody>
            @for (a of liste(); track a.id) {
              <tr [class.text-slate-400]="a.statut === 'Acheté'">
                <td>
                  <input type="checkbox" class="h-5 w-5 align-middle" [checked]="a.statut === 'Acheté'"
                         (change)="store.basculerAAcheter(a.id)" [attr.aria-label]="'Marquer ' + a.nom + ' comme acheté'" />
                </td>
                <td>
                  <div class="font-medium" [class.line-through]="a.statut === 'Acheté'">{{ a.nom }}</div>
                  @if (a.notes) { <div class="text-xs text-slate-500">{{ a.notes }}</div> }
                </td>
                <td class="text-center">{{ a.quantite }}</td>
                <td>{{ store.fournisseur(a.fournisseurId)?.nom ?? '—' }}</td>
                <td class="text-right tabular-nums whitespace-nowrap">{{ a.prixEstime ? (a.prixEstime | money) : '—' }}</td>
                <td class="text-right tabular-nums whitespace-nowrap font-medium">{{ a.prixEstime ? (a.quantite * a.prixEstime | money) : '—' }}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" (click)="edit.set({ ...vide(), ...a })" aria-label="Modifier"><app-icon name="edit" [size]="16" /></button>
                  <button class="btn-ghost hover:!text-red-600" (click)="supprimer(a)" aria-label="Supprimer"><app-icon name="trash" [size]="16" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center py-12 text-slate-500">Aucun produit dans la liste</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <app-modal [open]="!!edit()" [title]="edit()?.id ? 'Modifier le produit à acheter' : 'Ajouter un produit à acheter'" (close)="edit.set(null)">
      @if (edit(); as a) {
        <form class="grid gap-4 sm:grid-cols-2" (ngSubmit)="enregistrer(a)" #form="ngForm">
          <div class="sm:col-span-2"><label class="label">Produit du stock (facultatif)</label>
            <select class="input" name="produit" [ngModel]="a.produitId" (ngModelChange)="choisirProduit(a, $event)">
              <option value="">— Nouveau produit —</option>
              @for (p of store.produits(); track p.id) { <option [value]="p.id">{{ p.nom }} ({{ p.stock }})</option> }
            </select>
          </div>
          <div class="sm:col-span-2"><label class="label">Désignation *</label><input class="input" name="nom" [(ngModel)]="a.nom" required placeholder="ex. Écran iPhone 13" /></div>
          <div><label class="label">Quantité *</label><input type="number" min="1" class="input" name="quantite" [(ngModel)]="a.quantite" required /></div>
          <div><label class="label">Prix unitaire estimé</label><input type="number" min="0" class="input" name="prix" [(ngModel)]="a.prixEstime" /></div>
          <div class="sm:col-span-2"><label class="label">Fournisseur</label>
            <select class="input" name="fournisseur" [(ngModel)]="a.fournisseurId">
              <option value="">— Aucun —</option>
              @for (f of store.fournisseurs(); track f.id) { <option [value]="f.id">{{ f.nom }}</option> }
            </select>
          </div>
          <div class="sm:col-span-2"><label class="label">Notes</label><textarea class="input" rows="2" name="notes" [(ngModel)]="a.notes"></textarea></div>
          <div class="sm:col-span-2 flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="edit.set(null)">Annuler</button>
            <button class="btn-primary" [disabled]="form.invalid || !a.nom.trim()">Enregistrer</button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class AAcheterPage {
  protected store = inject(StoreService);
  protected vide = vide;
  protected q = signal('');
  protected filtreStatut = signal('');
  protected edit = signal<ProduitAAcheter | null>(null);

  protected nbAchetes = computed(() => this.store.aAcheter().filter(a => a.statut === 'Acheté').length);
  protected totalEstime = computed(() => this.store.resteAAcheter().reduce((s, a) => s + a.quantite * (a.prixEstime ?? 0), 0));

  /** Les produits restant à acheter d'abord, les achetés en bas */
  protected liste = computed(() => this.store.aAcheter()
    .filter(a => (!this.filtreStatut() || a.statut === this.filtreStatut())
      && filtreTexte(this.q(), a.nom, a.notes, this.store.fournisseur(a.fournisseurId)?.nom))
    .sort((x, y) => Number(x.statut === 'Acheté') - Number(y.statut === 'Acheté')));

  choisirProduit(a: ProduitAAcheter, id: string) {
    a.produitId = id;
    const p = this.store.produit(id);
    if (p) { a.nom = p.nom; a.prixEstime = p.prixAchat; }
  }

  enregistrer(a: ProduitAAcheter) {
    this.store.enregistrerAAcheter({ ...a, nom: a.nom.trim(), quantite: +a.quantite, prixEstime: +(a.prixEstime ?? 0) });
    this.edit.set(null);
  }
  supprimer(a: ProduitAAcheter) { if (confirm(`Retirer « ${a.nom} » de la liste ?`)) this.store.supprimerAAcheter(a.id); }
  retirerAchetes() {
    if (confirm(`Retirer les ${this.nbAchetes()} produit(s) achetés de la liste ?`)) this.store.retirerAAcheterAchetes();
  }
}
