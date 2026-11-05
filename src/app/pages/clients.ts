import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { Client, totalReparation } from '../core/models';
import { DatePipeFr, IconComponent, ModalComponent, MoneyPipe, couleurStatut, filtreTexte, TableCartesDirective } from '../shared/ui';

const vide = (): Client => ({ id: '', nom: '', telephone: '', email: '', adresse: '', cin: '', notes: '', creeLe: '' });

@Component({
  selector: 'app-clients',
  imports: [TableCartesDirective, FormsModule, IconComponent, ModalComponent, MoneyPipe, DatePipeFr],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Clients</h1>
        <p class="text-sm text-slate-500 mt-1">{{ store.clients().length }} client(s)</p>
      </div>
      <button class="btn-primary" (click)="edit.set(vide())"><app-icon name="plus" [size]="16" /> Nouveau client</button>
    </div>

    <div class="card">
      <div class="p-4 border-b border-slate-100">
        <div class="relative max-w-md">
          <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
          <input class="input pl-9" placeholder="Nom, téléphone, e-mail…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="table" appCartes>
          <thead><tr><th>Client</th><th>Téléphone</th><th class="text-center">Achats</th><th class="text-center">Réparations</th><th class="text-right">Total dépensé</th><th></th></tr></thead>
          <tbody>
            @for (c of liste(); track c.c.id) {
              <tr>
                <td><button class="font-medium text-left hover:text-brand-600 cursor-pointer" (click)="fiche.set(c.c)">{{ c.c.nom }}</button>
                  @if (c.c.email) { <div class="text-xs text-slate-500">{{ c.c.email }}</div> }</td>
                <td class="whitespace-nowrap">{{ c.c.telephone }}</td>
                <td class="text-center">{{ c.nbVentes }}</td>
                <td class="text-center">{{ c.nbRep }}</td>
                <td class="text-right tabular-nums font-medium">{{ c.total | money }}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" (click)="fiche.set(c.c)" aria-label="Fiche"><app-icon name="eye" [size]="16" /></button>
                  <button class="btn-ghost" (click)="edit.set({ ...c.c })" aria-label="Modifier"><app-icon name="edit" [size]="16" /></button>
                  <button class="btn-ghost hover:!text-red-600" (click)="supprimer(c.c)" aria-label="Supprimer"><app-icon name="trash" [size]="16" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center py-12 text-slate-500">Aucun client</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <app-modal [open]="!!edit()" [title]="edit()?.id ? 'Modifier le client' : 'Nouveau client'" (close)="edit.set(null)">
      @if (edit(); as c) {
        <form class="grid gap-4 sm:grid-cols-2" (ngSubmit)="enregistrer(c)" #f="ngForm">
          <div class="sm:col-span-2"><label class="label">Nom complet *</label><input class="input" name="nom" [(ngModel)]="c.nom" required /></div>
          <div><label class="label">Téléphone *</label><input class="input" name="tel" [(ngModel)]="c.telephone" required /></div>
          <div><label class="label">E-mail</label><input class="input" type="email" name="email" [(ngModel)]="c.email" /></div>
          <div><label class="label">CIN</label><input class="input" name="cin" [(ngModel)]="c.cin" /></div>
          <div><label class="label">Adresse</label><input class="input" name="adr" [(ngModel)]="c.adresse" /></div>
          <div class="sm:col-span-2"><label class="label">Notes</label><textarea class="input" rows="2" name="notes" [(ngModel)]="c.notes"></textarea></div>
          <div class="sm:col-span-2 flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="edit.set(null)">Annuler</button>
            <button class="btn-primary" [disabled]="f.invalid">Enregistrer</button>
          </div>
        </form>
      }
    </app-modal>

    <app-modal [open]="!!fiche()" [title]="fiche()?.nom ?? ''" width="max-w-3xl" (close)="fiche.set(null)">
      @if (fiche(); as c) {
        <div class="grid gap-2 text-sm sm:grid-cols-2 mb-6">
          <div><span class="text-slate-500">Téléphone :</span> {{ c.telephone }}</div>
          <div><span class="text-slate-500">E-mail :</span> {{ c.email || '—' }}</div>
          <div><span class="text-slate-500">Adresse :</span> {{ c.adresse || '—' }}</div>
          <div><span class="text-slate-500">CIN :</span> {{ c.cin || '—' }}</div>
          @if (c.notes) { <div class="sm:col-span-2"><span class="text-slate-500">Notes :</span> {{ c.notes }}</div> }
        </div>
        <h3 class="font-semibold mb-2">Achats</h3>
        <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200 mb-6 text-sm">
          @for (v of ventesDe(c.id); track v.id) {
            <li class="flex justify-between gap-3 px-3 py-2"><span>{{ v.numero }} · {{ v.date | dt }} · {{ articles(v) }}</span><b class="tabular-nums">{{ v.total | money }}</b></li>
          } @empty { <li class="px-3 py-4 text-center text-slate-500">Aucun achat</li> }
        </ul>
        <h3 class="font-semibold mb-2">Réparations</h3>
        <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          @for (r of reparationsDe(c.id); track r.id) {
            <li class="flex items-center justify-between gap-3 px-3 py-2">
              <span>{{ r.numero }} · {{ r.dateDepot | dt }} · {{ r.marque }} {{ r.modele }} — {{ r.panne }}</span>
              <span class="flex items-center gap-2"><span class="badge" [class]="couleur(r.statut)">{{ r.statut }}</span><b class="tabular-nums">{{ totalRep(r) | money }}</b></span>
            </li>
          } @empty { <li class="px-3 py-4 text-center text-slate-500">Aucune réparation</li> }
        </ul>
      }
    </app-modal>
  `,
})
export class ClientsPage {
  protected store = inject(StoreService);
  protected vide = vide;
  protected couleur = couleurStatut;
  protected totalRep = totalReparation;
  protected q = signal('');
  protected edit = signal<Client | null>(null);
  protected fiche = signal<Client | null>(null);

  protected liste = computed(() => this.store.clients()
    .filter(c => filtreTexte(this.q(), c.nom, c.telephone, c.email, c.cin))
    .map(c => {
      const ventes = this.ventesDe(c.id);
      const reps = this.reparationsDe(c.id);
      return {
        c, nbVentes: ventes.length, nbRep: reps.length,
        total: ventes.reduce((s, v) => s + v.total, 0) + reps.filter(r => r.statut === 'Livré').reduce((s, r) => s + totalReparation(r), 0),
      };
    }));

  articles(v: { lignes: { designation: string }[] }) { return v.lignes.map(l => l.designation).join(', '); }
  ventesDe(id: string) { return this.store.ventes().filter(v => v.clientId === id); }
  reparationsDe(id: string) { return this.store.reparations().filter(r => r.clientId === id); }

  enregistrer(c: Client) { this.store.enregistrerClient({ ...c, nom: c.nom.trim() }); this.edit.set(null); }
  supprimer(c: Client) {
    if (this.reparationsDe(c.id).some(r => !['Livré', 'Annulé'].includes(r.statut))) {
      alert('Ce client a une réparation en cours : impossible de le supprimer.');
      return;
    }
    if (confirm(`Supprimer le client « ${c.nom} » ?`)) this.store.supprimerClient(c.id);
  }
}
