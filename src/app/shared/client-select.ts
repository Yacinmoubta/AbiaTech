import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { IconComponent } from './ui';

/** Sélection d'un client avec création rapide */
@Component({
  selector: 'app-client-select',
  host: { class: 'block' },
  imports: [FormsModule, IconComponent],
  template: `
    <label class="label">{{ label() }}</label>
    @if (!ajout()) {
      <div class="flex gap-2">
        <select class="input" [ngModel]="clientId() ?? ''" (ngModelChange)="clientId.set($event || undefined)" [required]="requis()">
          <option value="">{{ requis() ? '— Choisir un client —' : 'Client comptoir (anonyme)' }}</option>
          @for (c of clients(); track c.id) { <option [value]="c.id">{{ c.nom }} — {{ c.telephone }}</option> }
        </select>
        <button type="button" class="btn-secondary whitespace-nowrap" (click)="ajout.set(true)"><app-icon name="plus" [size]="14" /> Nouveau</button>
      </div>
    } @else {
      <div class="rounded-lg border border-brand-100 bg-brand-50/50 p-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input class="input" placeholder="Nom complet *" [(ngModel)]="nom" [ngModelOptions]="{ standalone: true }" />
        <input class="input" placeholder="Téléphone *" [(ngModel)]="tel" [ngModelOptions]="{ standalone: true }" />
        <div class="flex gap-1">
          <button type="button" class="btn-primary" [disabled]="!nom.trim() || !tel.trim()" (click)="creer()">Ajouter</button>
          <button type="button" class="btn-ghost" (click)="ajout.set(false)" aria-label="Annuler"><app-icon name="x" [size]="16" /></button>
        </div>
      </div>
    }
  `,
})
export class ClientSelectComponent {
  private store = inject(StoreService);
  clientId = model<string | undefined>();
  label = input('Client');
  requis = input(false);
  protected ajout = signal(false);
  protected clients = computed(() => [...this.store.clients()].sort((a, b) => a.nom.localeCompare(b.nom)));
  protected nom = '';
  protected tel = '';

  creer() {
    const c = this.store.enregistrerClient({ id: '', nom: this.nom.trim(), telephone: this.tel.trim(), creeLe: '' });
    this.clientId.set(c.id);
    this.nom = this.tel = '';
    this.ajout.set(false);
  }
}

