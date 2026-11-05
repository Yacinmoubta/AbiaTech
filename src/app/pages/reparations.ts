import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../core/store.service';
import { CATEGORIES, PieceUtilisee, Reparation, STATUTS_REPARATION, StatutReparation, totalReparation } from '../core/models';
import { DatePipeFr, IconComponent, ModalComponent, MoneyPipe, couleurStatut, filtreTexte, TableCartesDirective } from '../shared/ui';
import { ClientSelectComponent } from '../shared/client-select';
import { MobileService } from '../core/mobile.service';
import { DocEnteteComponent, DocPiedComponent } from '../shared/doc';

const vide = (): Reparation => ({
  id: '', numero: '', dateDepot: new Date().toISOString(), clientId: '', typeAppareil: 'Téléphone',
  marque: '', modele: '', numeroSerie: '', codeDeverrouillage: '', accessoires: '', panne: '', diagnostic: '',
  technicien: '', statut: 'Reçu', pieces: [], mainOeuvre: 0, devis: 0, acompte: 0, garantieJours: 90, notes: '',
});

@Component({
  selector: 'app-reparations',
  imports: [TableCartesDirective, FormsModule, IconComponent, ModalComponent, MoneyPipe, DatePipeFr, ClientSelectComponent, DocEnteteComponent, DocPiedComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Réparations</h1>
        <p class="text-sm text-slate-500 mt-1">{{ actives().length }} en cours · {{ pretes() }} prête(s) à livrer</p>
      </div>
      <div class="flex gap-2">
        <div class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
          <button class="btn !py-1.5" [class]="vue() === 'tableau' ? 'bg-slate-900 text-white' : 'text-slate-600'" (click)="vue.set('tableau')">Tableau</button>
          <button class="btn !py-1.5" [class]="vue() === 'liste' ? 'bg-slate-900 text-white' : 'text-slate-600'" (click)="vue.set('liste')">Liste</button>
        </div>
        <button class="btn-primary" (click)="ouvrir()"><app-icon name="plus" [size]="16" /> Nouvelle réparation</button>
      </div>
    </div>

    <div class="relative mb-4 max-w-md">
      <span class="absolute left-3 top-2.5 text-slate-400"><app-icon name="search" [size]="16" /></span>
      <input class="input pl-9" placeholder="N°, client, appareil, IMEI…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
    </div>

    @if (vue() === 'tableau') {
      <div class="flex gap-3 overflow-x-auto pb-4">
        @for (s of colonnes; track s) {
          <div class="min-w-48 flex-1 rounded-xl bg-slate-100/80 p-3">
            <div class="mb-3 flex items-center justify-between px-1">
              <span class="badge" [class]="couleur(s)">{{ s }}</span>
              <span class="text-xs text-slate-500">{{ parStatut(s).length }}</span>
            </div>
            <div class="space-y-2">
              @for (r of parStatut(s); track r.id) {
                <div class="card p-3 cursor-pointer hover:border-brand-500 transition" (click)="ouvrir(r)">
                  <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>{{ r.numero }}</span>
                    <span [class.text-red-600]="enRetard(r)" [class.font-medium]="enRetard(r)">{{ r.datePrevue ? 'Prévu ' + (r.datePrevue | dt) : (r.dateDepot | dt) }}</span>
                  </div>
                  <div class="mt-1 font-medium">{{ r.marque }} {{ r.modele }}</div>
                  <div class="text-sm text-slate-600 line-clamp-2">{{ r.panne }}</div>
                  <div class="mt-2 flex items-center justify-between text-xs">
                    <span class="text-slate-500 truncate">{{ store.client(r.clientId)?.nom }}</span>
                    @if (r.technicien) { <span class="badge bg-white border border-slate-200 text-slate-600">{{ r.technicien }}</span> }
                  </div>
                  <select class="input !py-1 !text-xs mt-2" [ngModel]="r.statut" (click)="$event.stopPropagation()" (ngModelChange)="changerStatut(r, $event)">
                    @for (st of statuts; track st) { <option [value]="st">{{ st }}</option> }
                  </select>
                </div>
              } @empty {
                <div class="rounded-lg border-2 border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">Vide</div>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="card overflow-x-auto">
        <table class="table" appCartes>
          <thead><tr><th>N°</th><th>Dépôt</th><th>Client</th><th>Appareil</th><th>Panne</th><th>Statut</th><th class="text-right">Total</th><th class="text-right">Reste</th><th></th></tr></thead>
          <tbody>
            @for (r of filtrees(); track r.id) {
              <tr>
                <td class="font-medium">{{ r.numero }}</td>
                <td class="text-slate-600 whitespace-nowrap">{{ r.dateDepot | dt }}</td>
                <td>{{ store.client(r.clientId)?.nom }}</td>
                <td>{{ r.marque }} {{ r.modele }}</td>
                <td class="max-w-56 truncate text-slate-600">{{ r.panne }}</td>
                <td><span class="badge" [class]="couleur(r.statut)">{{ r.statut }}</span></td>
                <td class="text-right tabular-nums">{{ total(r) | money }}</td>
                <td class="text-right tabular-nums" [class.text-red-600]="total(r) - r.acompte > 0">{{ total(r) - r.acompte | money }}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" (click)="ouvrir(r)" aria-label="Modifier"><app-icon name="edit" [size]="16" /></button>
                  <button class="btn-ghost" (click)="doc.set({ r, type: 'depot' })" aria-label="Bon de dépôt"><app-icon name="print" [size]="16" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="text-center py-12 text-slate-500">Aucune réparation</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Formulaire -->
    <app-modal [open]="!!edit()" [title]="edit()?.id ? 'Réparation ' + edit()!.numero : 'Nouvelle réparation'" width="max-w-4xl" (close)="edit.set(null)">
      @if (edit(); as r) {
        <div class="grid gap-6 lg:grid-cols-2">
          <section class="space-y-4">
            <h3 class="text-sm font-semibold text-slate-900">Client & appareil</h3>
            <app-client-select [(clientId)]="r.clientId" [requis]="true" />
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">Type</label>
                <select class="input" [(ngModel)]="r.typeAppareil">@for (c of categories; track c) { <option [value]="c">{{ c }}</option> }</select></div>
              <div><label class="label">Marque *</label><input class="input" [(ngModel)]="r.marque" /></div>
              <div><label class="label">Modèle *</label><input class="input" [(ngModel)]="r.modele" /></div>
              <div><label class="label">IMEI / N° série</label><input class="input" [(ngModel)]="r.numeroSerie" /></div>
              <div><label class="label">Code / schéma</label><input class="input" [(ngModel)]="r.codeDeverrouillage" /></div>
              <div><label class="label">Accessoires laissés</label><input class="input" [(ngModel)]="r.accessoires" placeholder="Chargeur, coque…" /></div>
            </div>
            <div><label class="label">Panne déclarée *</label><textarea class="input" rows="2" [(ngModel)]="r.panne"></textarea></div>
            <div><label class="label">Diagnostic</label><textarea class="input" rows="2" [(ngModel)]="r.diagnostic"></textarea></div>
          </section>

          <section class="space-y-4">
            <h3 class="text-sm font-semibold text-slate-900">Suivi & facturation</h3>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">Statut</label>
                <select class="input" [(ngModel)]="r.statut">@for (s of statuts; track s) { <option [value]="s">{{ s }}</option> }</select></div>
              <div><label class="label">Technicien</label>
                <select class="input" [(ngModel)]="r.technicien"><option value="">—</option>
                  @for (t of store.parametres().techniciens; track t) { <option [value]="t">{{ t }}</option> }</select></div>
              <div><label class="label">Date prévue</label><input type="date" class="input" [ngModel]="r.datePrevue?.slice(0, 10)" (ngModelChange)="r.datePrevue = $event ? $event : undefined" /></div>
              <div><label class="label">Garantie (jours)</label><input type="number" min="0" class="input" [(ngModel)]="r.garantieJours" /></div>
              <div><label class="label">Devis annoncé</label><input type="number" min="0" class="input" [(ngModel)]="r.devis" /></div>
              <div><label class="label">Acompte versé</label><input type="number" min="0" class="input" [(ngModel)]="r.acompte" /></div>
            </div>

            <div>
              <label class="label">Pièces utilisées (déduites du stock)</label>
              <div class="rounded-lg border border-slate-200 divide-y divide-slate-100">
                @for (p of r.pieces; track $index; let i = $index) {
                  <div class="flex items-center gap-2 px-3 py-2 text-sm">
                    <span class="flex-1 truncate">{{ p.designation }}</span>
                    <input type="number" min="1" class="input !w-16 !px-2 !py-1" [(ngModel)]="p.quantite" />
                    <input type="number" min="0" class="input !w-24 !px-2 !py-1" [(ngModel)]="p.prixUnitaire" />
                    <button class="btn-ghost !p-1" (click)="r.pieces.splice(i, 1)" aria-label="Retirer"><app-icon name="x" [size]="14" /></button>
                  </div>
                }
                <div class="p-2">
                  <select class="input !py-1.5" [ngModel]="''" (ngModelChange)="ajouterPiece(r, $event)">
                    <option value="">+ Ajouter une pièce…</option>
                    @for (p of piecesDispo(); track p.id) { <option [value]="p.id">{{ p.nom }} — {{ p.prixVente | money }} (stock {{ p.stock }})</option> }
                  </select>
                </div>
              </div>
            </div>
            <div><label class="label">Main d'œuvre</label><input type="number" min="0" class="input" [(ngModel)]="r.mainOeuvre" /></div>

            <div class="rounded-lg bg-slate-50 p-4 text-sm space-y-1">
              <div class="flex justify-between"><span>Total réparation</span><b class="tabular-nums">{{ total(r) | money }}</b></div>
              <div class="flex justify-between text-slate-500"><span>Acompte</span><span class="tabular-nums">−{{ r.acompte | money }}</span></div>
              <div class="flex justify-between text-base font-semibold border-t border-slate-200 pt-1"><span>Reste à payer</span><span class="tabular-nums">{{ total(r) - r.acompte | money }}</span></div>
            </div>
            <div><label class="label">Notes internes</label><input class="input" [(ngModel)]="r.notes" /></div>
          </section>
        </div>
        @if (erreur()) { <p class="mt-4 text-sm text-red-600">{{ erreur() }}</p> }
        <div class="mt-6 flex flex-wrap justify-between gap-2">
          <div class="flex gap-2">
            @if (r.id) {
              <button class="btn-danger" (click)="supprimer(r)"><app-icon name="trash" [size]="16" /> Supprimer</button>
              <button class="btn-secondary" (click)="doc.set({ r, type: 'depot' })"><app-icon name="print" [size]="16" /> Bon de dépôt</button>
              <button class="btn-secondary" (click)="doc.set({ r, type: 'facture' })"><app-icon name="print" [size]="16" /> Facture</button>
            }
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary" (click)="edit.set(null)">Annuler</button>
            <button class="btn-primary" (click)="enregistrer(r)"><app-icon name="check" [size]="16" /> Enregistrer</button>
          </div>
        </div>
      }
    </app-modal>

    <!-- Documents imprimables -->
    <app-modal [open]="!!doc()" [title]="doc()?.type === 'depot' ? 'Bon de dépôt' : 'Facture de réparation'" width="max-w-3xl" (close)="doc.set(null)">
      @if (doc(); as d) {
        @let r = d.r;
        @let c = store.client(r.clientId);
        <div class="print-area">
          <app-doc-entete [titre]="d.type === 'depot' ? 'Bon de dépôt' : 'Facture réparation'" [numero]="r.numero"
            [date]="d.type === 'depot' ? (r.dateDepot | dt: true) : (r.dateLivraison ?? r.dateDepot | dt)" />
          <div class="grid grid-cols-2 gap-6 text-sm mb-4">
            <div><div class="text-xs uppercase text-slate-500 mb-1">Client</div><b>{{ c?.nom }}</b><div>{{ c?.telephone }}</div></div>
            <div><div class="text-xs uppercase text-slate-500 mb-1">Appareil</div><b>{{ r.typeAppareil }} {{ r.marque }} {{ r.modele }}</b>
              @if (r.numeroSerie) { <div>IMEI/SN : {{ r.numeroSerie }}</div> }
              @if (r.accessoires) { <div>Accessoires : {{ r.accessoires }}</div> }</div>
          </div>
          <div class="text-sm mb-4"><span class="text-slate-500">Panne déclarée :</span> {{ r.panne }}</div>
          @if (r.diagnostic) { <div class="text-sm mb-4"><span class="text-slate-500">Diagnostic :</span> {{ r.diagnostic }}</div> }

          @if (d.type === 'depot') {
            <div class="grid grid-cols-3 gap-3 text-sm rounded-lg border border-slate-200 p-3">
              <div><div class="text-xs text-slate-500">Devis estimé</div><b>{{ r.devis ? (r.devis | money) : 'Après diagnostic' }}</b></div>
              <div><div class="text-xs text-slate-500">Acompte versé</div><b>{{ r.acompte | money }}</b></div>
              <div><div class="text-xs text-slate-500">Date prévue</div><b>{{ r.datePrevue | dt }}</b></div>
            </div>
            <p class="mt-4 text-xs text-slate-500">Le client reconnaît avoir déposé l'appareil décrit ci-dessus. Le magasin n'est pas responsable des données : pensez à les sauvegarder. Présentez ce bon pour récupérer l'appareil.</p>
            <div class="mt-8 grid grid-cols-2 gap-8 text-sm text-slate-600">
              <div>Signature du client :<div class="mt-12 border-t border-slate-300"></div></div>
              <div>Cachet du magasin :<div class="mt-12 border-t border-slate-300"></div></div>
            </div>
          } @else {
            <table class="table">
              <thead><tr><th>Désignation</th><th class="text-center">Qté</th><th class="text-right">P.U.</th><th class="text-right">Total</th></tr></thead>
              <tbody>
                @for (p of r.pieces; track $index) {
                  <tr><td>{{ p.designation }}</td><td class="text-center">{{ p.quantite }}</td><td class="text-right">{{ p.prixUnitaire | money }}</td><td class="text-right">{{ p.quantite * p.prixUnitaire | money }}</td></tr>
                }
                <tr><td>Main d'œuvre</td><td class="text-center">1</td><td class="text-right">{{ r.mainOeuvre | money }}</td><td class="text-right">{{ r.mainOeuvre | money }}</td></tr>
              </tbody>
            </table>
            <div class="mt-4 ml-auto w-64 space-y-1 text-sm">
              <div class="flex justify-between text-lg font-semibold"><span>Total</span><span>{{ total(r) | money }}</span></div>
              <div class="flex justify-between text-slate-500"><span>Acompte</span><span>−{{ r.acompte | money }}</span></div>
              <div class="flex justify-between font-medium border-t border-slate-200 pt-1"><span>Reste à payer</span><span>{{ total(r) - r.acompte | money }}</span></div>
            </div>
            <p class="mt-4 text-sm text-slate-600">Garantie : {{ r.garantieJours }} jours sur les pièces et la main d'œuvre.</p>
          }
          <app-doc-pied />
        </div>
        <div class="mt-5 flex justify-end gap-2 no-print">
          <button class="btn-secondary" (click)="doc.set(null)">Fermer</button>
          <button class="btn-primary" (click)="imprimer((d.type === 'depot' ? 'Bon de dépôt ' : 'Facture ') + r.numero)"><app-icon name="print" [size]="16" /> Imprimer</button>
        </div>
      }
    </app-modal>
  `,
})
export class ReparationsPage implements OnInit {
  protected store = inject(StoreService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected statuts = STATUTS_REPARATION;
  protected colonnes: StatutReparation[] = ['Reçu', 'Diagnostic', 'En attente pièce', 'En réparation', 'Prêt'];
  protected categories = CATEGORIES;
  protected couleur = couleurStatut;
  protected total = totalReparation;
  private mobile = inject(MobileService);
  protected imprimer = (titre?: string) => this.mobile.imprimer(titre);

  protected vue = signal<'tableau' | 'liste'>('tableau');
  protected q = signal('');
  protected edit = signal<Reparation | null>(null);
  protected doc = signal<{ r: Reparation; type: 'depot' | 'facture' } | null>(null);
  protected erreur = signal('');

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('nouveau')) {
      this.ouvrir();
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  protected filtrees = computed(() => this.store.reparations().filter(r =>
    filtreTexte(this.q(), r.numero, r.marque, r.modele, r.numeroSerie, r.panne, this.store.client(r.clientId)?.nom, this.store.client(r.clientId)?.telephone)));
  protected actives = computed(() => this.store.reparations().filter(r => !['Livré', 'Annulé'].includes(r.statut)));
  protected pretes = computed(() => this.actives().filter(r => r.statut === 'Prêt').length);
  protected piecesDispo = computed(() => this.store.produits().filter(p => p.stock > 0)
    .sort((a, b) => (a.categorie === 'Pièce détachée' ? -1 : 1) - (b.categorie === 'Pièce détachée' ? -1 : 1)));

  parStatut(s: StatutReparation) { return this.filtrees().filter(r => r.statut === s); }
  enRetard(r: Reparation) { return !!r.datePrevue && r.datePrevue.slice(0, 10) < new Date().toISOString().slice(0, 10); }

  ouvrir(r?: Reparation) {
    this.erreur.set('');
    this.edit.set(r ? { ...r, pieces: r.pieces.map(p => ({ ...p })) } : vide());
  }
  ajouterPiece(r: Reparation, id: string) {
    const p = this.store.produit(id);
    if (!p) return;
    const ex = r.pieces.find(x => x.produitId === id);
    if (ex) ex.quantite++;
    else r.pieces.push({ produitId: p.id, designation: p.nom, quantite: 1, prixUnitaire: p.prixVente } as PieceUtilisee);
    this.edit.set({ ...r });
  }
  enregistrer(r: Reparation) {
    if (!r.clientId || !r.marque.trim() || !r.modele.trim() || !r.panne.trim()) {
      this.erreur.set('Veuillez renseigner le client, la marque, le modèle et la panne.');
      return;
    }
    // Vérifier le stock disponible pour les pièces (en tenant compte des pièces déjà réservées)
    const ancienne = this.store.reparations().find(x => x.id === r.id);
    for (const p of r.pieces) {
      const dispo = (this.store.produit(p.produitId)?.stock ?? 0) + (ancienne?.pieces.find(x => x.produitId === p.produitId)?.quantite ?? 0);
      if (p.quantite > dispo) { this.erreur.set(`Stock insuffisant pour « ${p.designation} » (disponible : ${dispo}).`); return; }
    }
    if (r.statut === 'Livré' && !r.dateLivraison) r.dateLivraison = new Date().toISOString();
    if (r.datePrevue && r.datePrevue.length === 10) r.datePrevue = new Date(r.datePrevue + 'T12:00:00').toISOString();
    const nouvelle = !r.id;
    const saved = this.store.enregistrerReparation({ ...r, pieces: r.pieces.map(p => ({ ...p, quantite: +p.quantite, prixUnitaire: +p.prixUnitaire })) });
    this.edit.set(null);
    if (nouvelle) this.doc.set({ r: saved, type: 'depot' });
  }
  changerStatut(r: Reparation, s: StatutReparation) {
    this.store.changerStatut(r.id, s);
    if (s === 'Livré') {
      const maj = this.store.reparations().find(x => x.id === r.id);
      if (maj) this.doc.set({ r: maj, type: 'facture' });
    }
  }
  supprimer(r: Reparation) {
    if (confirm(`Supprimer la réparation ${r.numero} ? Les pièces seront remises en stock.`)) {
      this.store.supprimerReparation(r.id);
      this.edit.set(null);
    }
  }
}
