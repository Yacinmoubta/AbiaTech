import { Component, Pipe, PipeTransform, effect, inject, input, output } from '@angular/core';
import { MobileService } from '../core/mobile.service';
import { StoreService } from '../core/store.service';
import { StatutReparation } from '../core/models';

/** Montant formaté : 1 234,50 DH */
@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private store = inject(StoreService);
  transform(v: number | null | undefined): string {
    const n = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v ?? 0);
    return `${n} ${this.store.parametres().devise}`;
  }
}

/** Date courte : 05/11/2026 14:30 */
@Pipe({ name: 'dt' })
export class DatePipeFr implements PipeTransform {
  transform(v?: string, avecHeure = false): string {
    if (!v) return '—';
    const d = new Date(v);
    return d.toLocaleDateString('fr-FR') + (avecHeure ? ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
  }
}

const ICONES: Record<string, string> = {
  dashboard: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  cart: 'M3 3h2l2.4 12.2a2 2 0 002 1.6h8.8a2 2 0 002-1.6L22 7H6M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z',
  truck: 'M1 4h14v12H1zM15 9h4l3 3v4h-7M5.5 19a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z',
  wrench: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  factory: 'M2 20h20M4 20V9l5 3V9l5 3V5h6v15',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
  x: 'M18 6L6 18M6 6l12 12',
  alert: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  phone: 'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01',
  menu: 'M3 6h18M3 12h18M3 18h18',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  check: 'M20 6L9 17l-5-5',
  minus: 'M5 12h14',
};

@Component({
  selector: 'app-icon',
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="d()" /></svg>`,
  host: { class: 'inline-flex shrink-0' },
})
export class IconComponent {
  name = input.required<string>();
  size = input(18);
  d = () => ICONES[this.name()] ?? '';
}

@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8 no-print-backdrop" (click)="close.emit()">
        <div class="card w-full my-auto" [class]="width()" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4 no-print">
            <h2 class="text-lg font-semibold">{{ title() }}</h2>
            <button class="btn-ghost" (click)="close.emit()" aria-label="Fermer"><app-icon name="x" /></button>
          </div>
          <div class="p-5"><ng-content /></div>
          <ng-content select="[footer]" />
        </div>
      </div>
    }`,
})
export class ModalComponent {
  open = input(false);
  title = input('');
  width = input('max-w-2xl');
  close = output<void>();

  constructor() {
    const mobile = inject(MobileService);
    const fermer = () => this.close.emit();
    // Le bouton retour d'Android (ou Échap) ferme la fenêtre ouverte
    effect(onCleanup => {
      if (!this.open()) return;
      mobile.ouvrirFenetre(fermer);
      onCleanup(() => mobile.oublierFenetre(fermer));
    });
  }
}

export function couleurStatut(s: StatutReparation): string {
  return {
    'Reçu': 'bg-slate-100 text-slate-700',
    'Diagnostic': 'bg-violet-100 text-violet-700',
    'En attente pièce': 'bg-amber-100 text-amber-800',
    'En réparation': 'bg-blue-100 text-blue-700',
    'Prêt': 'bg-emerald-100 text-emerald-700',
    'Livré': 'bg-slate-200 text-slate-600',
    'Annulé': 'bg-red-100 text-red-700',
  }[s];
}

export const filtreTexte = (q: string, ...champs: (string | undefined)[]) => {
  const t = q.trim().toLowerCase();
  return !t || champs.some(c => (c ?? '').toLowerCase().includes(t));
};
