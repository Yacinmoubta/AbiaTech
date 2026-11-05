import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { Fournisseur } from '../core/models';
import { IconComponent, ModalComponent, MoneyPipe, filtreTexte } from '../shared/ui';

const vide = (): Fournisseur => ({ id: '', nom: '', contact: '', telephone: '', email: '', adresse: '', notes: '', creeLe: '' });

@Component({
  selector: 'app-fournisseurs',
  imports: [FormsModule, IconComponent, ModalComponent, MoneyPipe],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Fournisseurs</h1>
        <p class="text-sm text-slate-500 mt-1">{{ store.fournisseurs().length }} fournisseur(s)</p>
      </div>
      <button class="btn-primary" (click)="edit.set(vide())"><app-icon name="plus" [size]="16" /> Nouveau fournisseur</button>
    </div>

    <div class="card">
      <div class="p-4 border-b border-slate-100">
        <div class="relative max-w-md">
          <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
          <input class="input pl-9" placeholder="Nom, contact, téléphone…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>Fournisseur</th><th>Contact</th><th>Téléphone</th><th>E-mail</th><th class="text-center">Achats</th><th class="text-right">Total acheté</th><th></th></tr></thead>
          <tbody>
            @for (x of liste(); track x.f.id) {
              <tr>
                <td><div class="font-medium">{{ x.f.nom }}</div>@if (x.f.adresse) { <div class="text-xs text-slate-500">{{ x.f.adresse }}</div> }</td>
                <td>{{ x.f.contact || '—' }}</td>
                <td class="whitespace-nowrap">{{ x.f.telephone }}</td>
                <td>{{ x.f.email || '—' }}</td>
                <td class="text-center">{{ x.nb }}</td>
                <td class="text-right tabular-nums font-medium">{{ x.total | money }}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" (click)="edit.set({ ...x.f })" aria-label="Modifier"><app-icon name="edit" [size]="16" /></button>
                  <button class="btn-ghost hover:!text-red-600" (click)="supprimer(x.f)" aria-label="Supprimer"><app-icon name="trash" [size]="16" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="text-center py-12 text-slate-500">Aucun fournisseur</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <app-modal [open]="!!edit()" [title]="edit()?.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'" (close)="edit.set(null)">
      @if (edit(); as f) {
        <form class="grid gap-4 sm:grid-cols-2" (ngSubmit)="enregistrer(f)" #form="ngForm">
          <div class="sm:col-span-2"><label class="label">Raison sociale *</label><input class="input" name="nom" [(ngModel)]="f.nom" required /></div>
          <div><label class="label">Personne de contact</label><input class="input" name="contact" [(ngModel)]="f.contact" /></div>
          <div><label class="label">Téléphone *</label><input class="input" name="tel" [(ngModel)]="f.telephone" required /></div>
          <div><label class="label">E-mail</label><input class="input" type="email" name="email" [(ngModel)]="f.email" /></div>
          <div><label class="label">Adresse</label><input class="input" name="adr" [(ngModel)]="f.adresse" /></div>
          <div class="sm:col-span-2"><label class="label">Notes</label><textarea class="input" rows="2" name="notes" [(ngModel)]="f.notes"></textarea></div>
          <div class="sm:col-span-2 flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="edit.set(null)">Annuler</button>
            <button class="btn-primary" [disabled]="form.invalid">Enregistrer</button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class FournisseursPage {
  protected store = inject(StoreService);
  protected vide = vide;
  protected q = signal('');
  protected edit = signal<Fournisseur | null>(null);

  protected liste = computed(() => this.store.fournisseurs()
    .filter(f => filtreTexte(this.q(), f.nom, f.contact, f.telephone, f.email))
    .map(f => {
      const achats = this.store.achats().filter(a => a.fournisseurId === f.id);
      return { f, nb: achats.length, total: achats.reduce((s, a) => s + a.total, 0) };
    }));

  enregistrer(f: Fournisseur) { this.store.enregistrerFournisseur({ ...f, nom: f.nom.trim() }); this.edit.set(null); }
  supprimer(f: Fournisseur) { if (confirm(`Supprimer le fournisseur « ${f.nom} » ?`)) this.store.supprimerFournisseur(f.id); }
}
