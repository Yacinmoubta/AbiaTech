import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  Achat, Client, Donnees, Fournisseur, Parametres, PieceUtilisee, Produit, ProduitAAcheter, Reparation, StatutReparation, Vente,
} from './models';
import { creerDonneesDemo } from './demo-data';
import { PersistanceService } from './persistance.service';
import { COLLECTIONS } from './schema';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly produits = signal<Produit[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly fournisseurs = signal<Fournisseur[]>([]);
  readonly ventes = signal<Vente[]>([]);
  readonly achats = signal<Achat[]>([]);
  readonly reparations = signal<Reparation[]>([]);
  readonly aAcheter = signal<ProduitAAcheter[]>([]);
  readonly parametres = signal<Parametres>(creerDonneesDemo().parametres);

  readonly stockFaible = computed(() => this.produits().filter(p => p.stock <= p.seuilAlerte));
  readonly resteAAcheter = computed(() => this.aAcheter().filter(a => a.statut === 'À acheter'));
  readonly valeurStock = computed(() => this.produits().reduce((s, p) => s + p.stock * p.prixAchat, 0));

  private persistance = inject(PersistanceService);
  private pret = false;

  constructor() {
    if (this.persistance.natif) {
      // Mobile : chaque collection est écrite dans sa table SQLite quand elle change
      for (const nom of COLLECTIONS) {
        effect(() => {
          const items = this[nom]();
          if (this.pret) this.persistance.planifier(nom, items);
        });
      }
      effect(() => {
        const p = this.parametres();
        if (this.pret) this.persistance.planifierParametres(p);
      });
    } else {
      effect(() => {
        const d = this.exporter();
        if (this.pret) this.persistance.sauverWeb(d);
      });
    }
  }

  // ---------- Persistance ----------
  /** Appelé au démarrage de l'application (avant l'affichage) */
  async init() {
    let d: Donnees | null = null;
    try { d = await this.persistance.charger(); } catch (e) { console.error('Chargement impossible', e); }
    this.appliquer(d ?? creerDonneesDemo());
    this.pret = true;
  }

  /** Force l'écriture immédiate (ex. quand l'app passe en arrière-plan) */
  sauvegarderMaintenant() { return this.persistance.natif ? this.persistance.vider() : Promise.resolve(); }

  appliquer(d: Donnees) {
    this.produits.set(d.produits ?? []);
    this.clients.set(d.clients ?? []);
    this.fournisseurs.set(d.fournisseurs ?? []);
    this.ventes.set(d.ventes ?? []);
    this.achats.set(d.achats ?? []);
    this.reparations.set(d.reparations ?? []);
    this.aAcheter.set(d.aAcheter ?? []);
    this.parametres.set({ ...creerDonneesDemo().parametres, ...(d.parametres ?? {}) });
  }

  exporter(): Donnees {
    return {
      produits: this.produits(), clients: this.clients(), fournisseurs: this.fournisseurs(),
      ventes: this.ventes(), achats: this.achats(), reparations: this.reparations(), aAcheter: this.aAcheter(), parametres: this.parametres(),
    };
  }

  reinitialiserDemo() { this.appliquer(creerDonneesDemo()); }
  toutEffacer() {
    const p = this.parametres();
    this.appliquer({ produits: [], clients: [], fournisseurs: [], ventes: [], achats: [], reparations: [], aAcheter: [], parametres: p });
  }

  // ---------- Recherche ----------
  produit(id?: string) { return this.produits().find(p => p.id === id); }
  client(id?: string) { return this.clients().find(c => c.id === id); }
  fournisseur(id?: string) { return this.fournisseurs().find(f => f.id === id); }

  private prochainNumero(prefixe: string, liste: { numero: string }[]) {
    const max = liste.reduce((m, x) => Math.max(m, parseInt(x.numero.split('-').pop() || '0', 10) || 0), 0);
    return `${prefixe}-${String(max + 1).padStart(5, '0')}`;
  }

  private ajusterStock(produitId: string, delta: number) {
    this.produits.update(ps => ps.map(p => p.id === produitId ? { ...p, stock: p.stock + delta } : p));
  }

  // ---------- Produits ----------
  enregistrerProduit(p: Produit) {
    if (!p.id) {
      p = { ...p, id: uid(), creeLe: new Date().toISOString() };
      if (!p.reference) p.reference = 'P' + String(this.produits().length + 1).padStart(4, '0');
      this.produits.update(ps => [p, ...ps]);
    } else {
      this.produits.update(ps => ps.map(x => x.id === p.id ? p : x));
    }
    return p;
  }
  supprimerProduit(id: string) { this.produits.update(ps => ps.filter(p => p.id !== id)); }

  // ---------- Clients ----------
  enregistrerClient(c: Client) {
    if (!c.id) {
      c = { ...c, id: uid(), creeLe: new Date().toISOString() };
      this.clients.update(cs => [c, ...cs]);
    } else {
      this.clients.update(cs => cs.map(x => x.id === c.id ? c : x));
    }
    return c;
  }
  supprimerClient(id: string) { this.clients.update(cs => cs.filter(c => c.id !== id)); }

  // ---------- Fournisseurs ----------
  enregistrerFournisseur(f: Fournisseur) {
    if (!f.id) {
      f = { ...f, id: uid(), creeLe: new Date().toISOString() };
      this.fournisseurs.update(fs => [f, ...fs]);
    } else {
      this.fournisseurs.update(fs => fs.map(x => x.id === f.id ? f : x));
    }
    return f;
  }
  supprimerFournisseur(id: string) { this.fournisseurs.update(fs => fs.filter(f => f.id !== id)); }

  // ---------- Ventes ----------
  creerVente(v: Omit<Vente, 'id' | 'numero' | 'total'>): Vente {
    const sousTotal = v.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
    const vente: Vente = {
      ...v, id: uid(), numero: this.prochainNumero('V', this.ventes()),
      total: Math.max(0, sousTotal - (v.remise || 0)),
    };
    v.lignes.forEach(l => this.ajusterStock(l.produitId, -l.quantite));
    this.ventes.update(vs => [vente, ...vs]);
    return vente;
  }
  annulerVente(id: string) {
    const v = this.ventes().find(x => x.id === id);
    if (!v) return;
    v.lignes.forEach(l => this.ajusterStock(l.produitId, l.quantite));
    this.ventes.update(vs => vs.filter(x => x.id !== id));
  }

  // ---------- Achats ----------
  creerAchat(a: Omit<Achat, 'id' | 'numero' | 'total'>): Achat {
    const achat: Achat = {
      ...a, id: uid(), numero: this.prochainNumero('A', this.achats()),
      total: a.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0),
    };
    achat.lignes.forEach(l => {
      this.produits.update(ps => ps.map(p => p.id === l.produitId ? { ...p, stock: p.stock + l.quantite, prixAchat: l.prixUnitaire } : p));
    });
    this.achats.update(as => [achat, ...as]);
    return achat;
  }
  annulerAchat(id: string) {
    const a = this.achats().find(x => x.id === id);
    if (!a) return;
    a.lignes.forEach(l => this.ajusterStock(l.produitId, -l.quantite));
    this.achats.update(as => as.filter(x => x.id !== id));
  }

  // ---------- Liste des produits à acheter ----------
  enregistrerAAcheter(a: ProduitAAcheter) {
    if (!a.id) {
      a = { ...a, id: uid(), creeLe: new Date().toISOString() };
      this.aAcheter.update(as => [a, ...as]);
    } else {
      this.aAcheter.update(as => as.map(x => x.id === a.id ? a : x));
    }
    return a;
  }
  basculerAAcheter(id: string) {
    this.aAcheter.update(as => as.map(a => a.id === id
      ? { ...a, statut: a.statut === 'Acheté' ? 'À acheter' as const : 'Acheté' as const }
      : a));
  }
  supprimerAAcheter(id: string) { this.aAcheter.update(as => as.filter(a => a.id !== id)); }
  retirerAAcheterAchetes() { this.aAcheter.update(as => as.filter(a => a.statut !== 'Acheté')); }

  // ---------- Réparations ----------
  enregistrerReparation(r: Reparation) {
    const ancienne = this.reparations().find(x => x.id === r.id);
    // Remettre en stock les pièces de l'ancienne version, puis retirer les nouvelles
    ancienne?.pieces.forEach(p => this.ajusterStock(p.produitId, p.quantite));
    r.pieces.forEach(p => this.ajusterStock(p.produitId, -p.quantite));
    if (!ancienne) {
      r = { ...r, id: uid(), numero: this.prochainNumero('R', this.reparations()) };
      this.reparations.update(rs => [r, ...rs]);
    } else {
      this.reparations.update(rs => rs.map(x => x.id === r.id ? r : x));
    }
    return r;
  }
  changerStatut(id: string, statut: StatutReparation) {
    this.reparations.update(rs => rs.map(r => r.id === id
      ? { ...r, statut, dateLivraison: statut === 'Livré' ? new Date().toISOString() : r.dateLivraison }
      : r));
  }
  supprimerReparation(id: string) {
    const r = this.reparations().find(x => x.id === id);
    r?.pieces.forEach((p: PieceUtilisee) => this.ajusterStock(p.produitId, p.quantite));
    this.reparations.update(rs => rs.filter(x => x.id !== id));
  }

  enregistrerParametres(p: Parametres) { this.parametres.set(p); }
}
