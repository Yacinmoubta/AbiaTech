import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../core/store.service';
import { Donnees, Parametres } from '../core/models';
import { IconComponent } from '../shared/ui';
import { MobileService } from '../core/mobile.service';

@Component({
  selector: 'app-parametres',
  imports: [FormsModule, IconComponent],
  template: `
    <h1 class="page-title mb-6">Paramètres</h1>

    <div class="grid gap-6 lg:grid-cols-3">
      <form class="card p-6 lg:col-span-2 grid gap-4 sm:grid-cols-2" (ngSubmit)="enregistrer()">
        <h2 class="sm:col-span-2 font-semibold">Informations du magasin</h2>
        <div class="sm:col-span-2"><label class="label">Nom du magasin</label><input class="input" name="nom" [(ngModel)]="p.nomMagasin" /></div>
        <div class="sm:col-span-2"><label class="label">Adresse</label><input class="input" name="adr" [(ngModel)]="p.adresse" /></div>
        <div><label class="label">Téléphone</label><input class="input" name="tel" [(ngModel)]="p.telephone" /></div>
        <div><label class="label">E-mail</label><input class="input" name="email" [(ngModel)]="p.email" /></div>
        <div><label class="label">ICE / Identifiant fiscal</label><input class="input" name="ice" [(ngModel)]="p.ice" /></div>
        <div><label class="label">Devise</label><input class="input" name="devise" [(ngModel)]="p.devise" /></div>
        <div class="sm:col-span-2"><label class="label">Techniciens (séparés par des virgules)</label><input class="input" name="tech" [(ngModel)]="techniciens" /></div>
        <div class="sm:col-span-2"><label class="label">Pied de page des documents</label><textarea class="input" rows="2" name="pied" [(ngModel)]="p.piedFacture"></textarea></div>
        <div class="sm:col-span-2 flex items-center justify-end gap-3">
          @if (ok()) { <span class="text-sm text-emerald-600">Enregistré ✓</span> }
          <button class="btn-primary">Enregistrer</button>
        </div>
      </form>

      <div class="card p-6 space-y-4 h-fit">
        <h2 class="font-semibold">Données</h2>
        <p class="text-sm text-slate-500">
          @if (mobile.natif) { Les données sont enregistrées dans une base SQLite sur ce téléphone. Désinstaller l'application les efface : exportez régulièrement une sauvegarde (Drive, WhatsApp, e-mail…). }
          @else { Les données sont enregistrées dans ce navigateur. Exportez régulièrement une sauvegarde. }
        </p>
        <button class="btn-secondary w-full" (click)="exporter()"><app-icon name="download" [size]="16" /> Exporter (JSON)</button>
        <label class="btn-secondary w-full">
          <app-icon name="upload" [size]="16" /> Importer une sauvegarde
          <input type="file" accept="application/json" class="hidden" (change)="importer($event)" />
        </label>
        <hr class="border-slate-200" />
        <button class="btn-secondary w-full" (click)="demo()">Recharger les données de démo</button>
        <button class="btn-danger w-full" (click)="effacer()"><app-icon name="trash" [size]="16" /> Tout effacer</button>
      </div>
    </div>
  `,
})
export class ParametresPage {
  private store = inject(StoreService);
  protected mobile = inject(MobileService);
  protected p: Parametres = { ...this.store.parametres() };
  protected techniciens = this.p.techniciens.join(', ');
  protected ok = signal(false);

  enregistrer() {
    this.store.enregistrerParametres({ ...this.p, techniciens: this.techniciens.split(',').map(t => t.trim()).filter(Boolean) });
    this.ok.set(true);
    setTimeout(() => this.ok.set(false), 2000);
  }

  async exporter() {
    try {
      await this.mobile.partagerFichier(`sauvegarde-magasin-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(this.store.exporter(), null, 2));
    } catch { /* partage annulé */ }
  }

  importer(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    f.text().then(t => {
      try {
        const d = JSON.parse(t) as Donnees;
        if (!Array.isArray(d.produits)) throw new Error();
        if (confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) {
          this.store.appliquer(d);
          this.p = { ...this.store.parametres() };
          this.techniciens = this.p.techniciens.join(', ');
        }
      } catch { alert('Fichier de sauvegarde invalide.'); }
    });
    (e.target as HTMLInputElement).value = '';
  }

  demo() { if (confirm('Remplacer les données actuelles par les données de démonstration ?')) { this.store.reinitialiserDemo(); this.p = { ...this.store.parametres() }; } }
  effacer() { if (confirm('Effacer TOUTES les données (produits, ventes, réparations…) ? Cette action est irréversible.')) this.store.toutEffacer(); }
}
