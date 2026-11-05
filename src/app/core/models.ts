export type Categorie = 'Téléphone' | 'Ordinateur' | 'Tablette' | 'Accessoire' | 'Pièce détachée' | 'Autre';
export type Etat = 'Neuf' | 'Occasion' | 'Reconditionné';
export type ModePaiement = 'Espèces' | 'Carte' | 'Virement' | 'Chèque';

export const CATEGORIES: Categorie[] = ['Téléphone', 'Ordinateur', 'Tablette', 'Accessoire', 'Pièce détachée', 'Autre'];
export const ETATS: Etat[] = ['Neuf', 'Occasion', 'Reconditionné'];
export const MODES_PAIEMENT: ModePaiement[] = ['Espèces', 'Carte', 'Virement', 'Chèque'];

export interface Produit {
  id: string;
  reference: string;
  nom: string;
  categorie: Categorie;
  marque: string;
  etat: Etat;
  numeroSerie?: string; // IMEI / N° de série
  prixAchat: number;
  prixVente: number;
  stock: number;
  seuilAlerte: number;
  garantieMois: number;
  creeLe: string;
}

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  cin?: string;
  notes?: string;
  creeLe: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  contact?: string;
  telephone: string;
  email?: string;
  adresse?: string;
  notes?: string;
  creeLe: string;
}

export interface LigneVente {
  produitId: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  prixAchat: number;
}

export interface Vente {
  id: string;
  numero: string;
  date: string;
  clientId?: string;
  lignes: LigneVente[];
  remise: number;
  modePaiement: ModePaiement;
  total: number;
  notes?: string;
}

export type TypeAchat = 'Fournisseur' | 'Rachat client';

export interface LigneAchat {
  produitId: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Achat {
  id: string;
  numero: string;
  date: string;
  type: TypeAchat;
  fournisseurId?: string;
  clientId?: string;
  lignes: LigneAchat[];
  modePaiement: ModePaiement;
  total: number;
  notes?: string;
}

export type StatutReparation = 'Reçu' | 'Diagnostic' | 'En attente pièce' | 'En réparation' | 'Prêt' | 'Livré' | 'Annulé';
export const STATUTS_REPARATION: StatutReparation[] = ['Reçu', 'Diagnostic', 'En attente pièce', 'En réparation', 'Prêt', 'Livré', 'Annulé'];

export interface PieceUtilisee {
  produitId: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Reparation {
  id: string;
  numero: string;
  dateDepot: string;
  datePrevue?: string;
  dateLivraison?: string;
  clientId: string;
  typeAppareil: Categorie;
  marque: string;
  modele: string;
  numeroSerie?: string;
  codeDeverrouillage?: string;
  accessoires?: string;
  panne: string;
  diagnostic?: string;
  technicien?: string;
  statut: StatutReparation;
  pieces: PieceUtilisee[];
  mainOeuvre: number;
  devis: number;
  acompte: number;
  garantieJours: number;
  notes?: string;
}

export type StatutAAcheter = 'À acheter' | 'Acheté';

/** Produit noté sur la liste d'achats : n'a aucun effet sur le stock */
export interface ProduitAAcheter {
  id: string;
  nom: string;
  quantite: number;
  produitId?: string;
  fournisseurId?: string;
  prixEstime?: number;
  notes?: string;
  statut: StatutAAcheter;
  creeLe: string;
}

export interface Parametres {
  nomMagasin: string;
  adresse: string;
  telephone: string;
  email: string;
  ice: string;
  devise: string;
  techniciens: string[];
  piedFacture: string;
}

export interface Donnees {
  produits: Produit[];
  clients: Client[];
  fournisseurs: Fournisseur[];
  ventes: Vente[];
  achats: Achat[];
  reparations: Reparation[];
  aAcheter: ProduitAAcheter[];
  parametres: Parametres;
}

export function totalReparation(r: Reparation): number {
  return r.mainOeuvre + r.pieces.reduce((s, p) => s + p.quantite * p.prixUnitaire, 0);
}
