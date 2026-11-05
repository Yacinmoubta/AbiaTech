import { Component, inject, input } from '@angular/core';
import { StoreService } from '../core/store.service';

/** En-tête des documents imprimables (facture, bon de dépôt…) */
@Component({
  selector: 'app-doc-entete',
  template: `
    @let p = store.parametres();
    <div class="flex items-start justify-between gap-6 border-b border-slate-200 pb-4 mb-4">
      <div>
        <div class="text-xl font-bold text-slate-900">{{ p.nomMagasin }}</div>
        <div class="text-sm text-slate-600">{{ p.adresse }}</div>
        <div class="text-sm text-slate-600">Tél : {{ p.telephone }}@if (p.email) { · {{ p.email }} }</div>
        @if (p.ice) { <div class="text-xs text-slate-500">ICE : {{ p.ice }}</div> }
      </div>
      <div class="text-right">
        <div class="text-lg font-semibold uppercase tracking-wide text-brand-700">{{ titre() }}</div>
        <div class="text-sm font-medium">N° {{ numero() }}</div>
        <div class="text-sm text-slate-600">{{ date() }}</div>
      </div>
    </div>
  `,
})
export class DocEnteteComponent {
  protected store = inject(StoreService);
  titre = input.required<string>();
  numero = input.required<string>();
  date = input('');
}

@Component({
  selector: 'app-doc-pied',
  template: `<p class="mt-6 border-t border-slate-200 pt-3 text-center text-xs text-slate-500">{{ store.parametres().piedFacture }}</p>`,
})
export class DocPiedComponent {
  protected store = inject(StoreService);
}
