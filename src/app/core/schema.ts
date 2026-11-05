/**
 * Schéma de la base SQLite locale (sur le téléphone).
 * Chaque collection = une table ; les lignes (ventes, achats, pièces) sont dans des tables enfants.
 */

export const VERSION_SCHEMA = 1;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  cle TEXT PRIMARY KEY NOT NULL,
  valeur TEXT
);

CREATE TABLE IF NOT EXISTS produits (
  id TEXT PRIMARY KEY NOT NULL,
  reference TEXT, nom TEXT NOT NULL, categorie TEXT, marque TEXT, etat TEXT, numeroSerie TEXT,
  prixAchat REAL DEFAULT 0, prixVente REAL DEFAULT 0, stock INTEGER DEFAULT 0, seuilAlerte INTEGER DEFAULT 0,
  garantieMois INTEGER DEFAULT 0, creeLe TEXT
);
CREATE INDEX IF NOT EXISTS idx_produits_serie ON produits(numeroSerie);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY NOT NULL,
  nom TEXT NOT NULL, telephone TEXT, email TEXT, adresse TEXT, cin TEXT, notes TEXT, creeLe TEXT
);

CREATE TABLE IF NOT EXISTS fournisseurs (
  id TEXT PRIMARY KEY NOT NULL,
  nom TEXT NOT NULL, contact TEXT, telephone TEXT, email TEXT, adresse TEXT, notes TEXT, creeLe TEXT
);

CREATE TABLE IF NOT EXISTS ventes (
  id TEXT PRIMARY KEY NOT NULL,
  numero TEXT, date TEXT, clientId TEXT, remise REAL DEFAULT 0, modePaiement TEXT, total REAL DEFAULT 0, notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_ventes_date ON ventes(date);
CREATE TABLE IF NOT EXISTS vente_lignes (
  venteId TEXT NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  produitId TEXT, designation TEXT, quantite INTEGER, prixUnitaire REAL, prixAchat REAL,
  PRIMARY KEY (venteId, ordre)
);

CREATE TABLE IF NOT EXISTS achats (
  id TEXT PRIMARY KEY NOT NULL,
  numero TEXT, date TEXT, type TEXT, fournisseurId TEXT, clientId TEXT, modePaiement TEXT, total REAL DEFAULT 0, notes TEXT
);
CREATE TABLE IF NOT EXISTS achat_lignes (
  achatId TEXT NOT NULL REFERENCES achats(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  produitId TEXT, designation TEXT, quantite INTEGER, prixUnitaire REAL,
  PRIMARY KEY (achatId, ordre)
);

CREATE TABLE IF NOT EXISTS reparations (
  id TEXT PRIMARY KEY NOT NULL,
  numero TEXT, dateDepot TEXT, datePrevue TEXT, dateLivraison TEXT, clientId TEXT,
  typeAppareil TEXT, marque TEXT, modele TEXT, numeroSerie TEXT, codeDeverrouillage TEXT, accessoires TEXT,
  panne TEXT, diagnostic TEXT, technicien TEXT, statut TEXT,
  mainOeuvre REAL DEFAULT 0, devis REAL DEFAULT 0, acompte REAL DEFAULT 0, garantieJours INTEGER DEFAULT 0, notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_reparations_statut ON reparations(statut);
CREATE TABLE IF NOT EXISTS reparation_pieces (
  reparationId TEXT NOT NULL REFERENCES reparations(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  produitId TEXT, designation TEXT, quantite INTEGER, prixUnitaire REAL,
  PRIMARY KEY (reparationId, ordre)
);
`;

export interface DefTable {
  table: string;
  colonnes: string[];
  enfants?: { table: string; fk: string; champ: string; colonnes: string[] };
}

export type NomCollection = 'produits' | 'clients' | 'fournisseurs' | 'ventes' | 'achats' | 'reparations';

export const TABLES: Record<NomCollection, DefTable> = {
  produits: {
    table: 'produits',
    colonnes: ['id', 'reference', 'nom', 'categorie', 'marque', 'etat', 'numeroSerie', 'prixAchat', 'prixVente', 'stock', 'seuilAlerte', 'garantieMois', 'creeLe'],
  },
  clients: { table: 'clients', colonnes: ['id', 'nom', 'telephone', 'email', 'adresse', 'cin', 'notes', 'creeLe'] },
  fournisseurs: { table: 'fournisseurs', colonnes: ['id', 'nom', 'contact', 'telephone', 'email', 'adresse', 'notes', 'creeLe'] },
  ventes: {
    table: 'ventes',
    colonnes: ['id', 'numero', 'date', 'clientId', 'remise', 'modePaiement', 'total', 'notes'],
    enfants: { table: 'vente_lignes', fk: 'venteId', champ: 'lignes', colonnes: ['produitId', 'designation', 'quantite', 'prixUnitaire', 'prixAchat'] },
  },
  achats: {
    table: 'achats',
    colonnes: ['id', 'numero', 'date', 'type', 'fournisseurId', 'clientId', 'modePaiement', 'total', 'notes'],
    enfants: { table: 'achat_lignes', fk: 'achatId', champ: 'lignes', colonnes: ['produitId', 'designation', 'quantite', 'prixUnitaire'] },
  },
  reparations: {
    table: 'reparations',
    colonnes: ['id', 'numero', 'dateDepot', 'datePrevue', 'dateLivraison', 'clientId', 'typeAppareil', 'marque', 'modele', 'numeroSerie',
      'codeDeverrouillage', 'accessoires', 'panne', 'diagnostic', 'technicien', 'statut', 'mainOeuvre', 'devis', 'acompte', 'garantieJours', 'notes'],
    enfants: { table: 'reparation_pieces', fk: 'reparationId', champ: 'pieces', colonnes: ['produitId', 'designation', 'quantite', 'prixUnitaire'] },
  },
};

export const COLLECTIONS = Object.keys(TABLES) as NomCollection[];
