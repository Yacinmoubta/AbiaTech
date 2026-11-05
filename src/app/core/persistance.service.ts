import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection, capSQLiteSet } from '@capacitor-community/sqlite';
import { Donnees, Parametres } from './models';
import { COLLECTIONS, NomCollection, SCHEMA_SQL, TABLES, VERSION_SCHEMA } from './schema';

const NOM_BASE = 'magasin';
const CLE_WEB = 'gestion-magasin:v1';

type Ligne = Record<string, unknown> & { id: string };

/**
 * Persistance des données :
 *  - sur Android/iOS : base SQLite locale (plugin @capacitor-community/sqlite)
 *  - dans un navigateur : localStorage (pratique pour développer)
 *
 * Les écritures SQLite sont différentielles : seules les lignes ajoutées, modifiées
 * (nouvel objet) ou supprimées depuis la dernière sauvegarde sont écrites.
 */
@Injectable({ providedIn: 'root' })
export class PersistanceService {
  readonly natif = Capacitor.isNativePlatform();

  private sqlite?: SQLiteConnection;
  private db?: SQLiteDBConnection;
  /** Dernier état écrit en base, par collection : id -> objet */
  private ecrits = new Map<NomCollection, Map<string, Ligne>>();
  private parametresEcrits?: Parametres;
  private enAttente = new Map<NomCollection, Ligne[]>();
  private parametresEnAttente?: Parametres;
  private minuteur?: ReturnType<typeof setTimeout>;
  private file: Promise<void> = Promise.resolve();

  // ---------------------------------------------------------------- Chargement
  async charger(): Promise<Donnees | null> {
    if (!this.natif) {
      try { const brut = localStorage.getItem(CLE_WEB); return brut ? JSON.parse(brut) : null; } catch { return null; }
    }

    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    const existe = (await this.sqlite.isConnection(NOM_BASE, false)).result;
    this.db = existe
      ? await this.sqlite.retrieveConnection(NOM_BASE, false)
      : await this.sqlite.createConnection(NOM_BASE, false, 'no-encryption', VERSION_SCHEMA, false);
    await this.db.open();
    await this.db.execute(SCHEMA_SQL, true);

    const init = await this.db.query(`SELECT valeur FROM meta WHERE cle = 'initialise'`);
    if (!init.values?.length) return null; // premier lancement

    const d: Partial<Donnees> = {};
    for (const nom of COLLECTIONS) {
      const def = TABLES[nom];
      const lignes = ((await this.db.query(`SELECT * FROM ${def.table}`)).values ?? []).map(nettoyer) as Ligne[];
      if (def.enfants) {
        const e = def.enfants;
        const enfants = ((await this.db.query(`SELECT * FROM ${e.table} ORDER BY ${e.fk}, ordre`)).values ?? []).map(nettoyer);
        const parParent = new Map<string, Record<string, unknown>[]>();
        for (const enf of enfants) {
          const cle = enf[e.fk] as string;
          const { [e.fk]: _fk, ordre: _o, ...reste } = enf;
          (parParent.get(cle) ?? parParent.set(cle, []).get(cle)!).push(reste);
        }
        lignes.forEach(l => (l[e.champ] = parParent.get(l.id) ?? []));
      }
      // Les plus récents d'abord, comme dans l'application
      lignes.sort((a, b) => String(b['creeLe'] ?? b['date'] ?? b['dateDepot'] ?? '').localeCompare(String(a['creeLe'] ?? a['date'] ?? a['dateDepot'] ?? '')));
      (d as Record<string, unknown>)[nom] = lignes;
      this.ecrits.set(nom, new Map(lignes.map(l => [l.id, l])));
    }
    const p = await this.db.query(`SELECT valeur FROM meta WHERE cle = 'parametres'`);
    d.parametres = p.values?.[0]?.valeur ? JSON.parse(p.values[0].valeur) : undefined;
    this.parametresEcrits = d.parametres;
    return d as Donnees;
  }

  // ---------------------------------------------------------------- Sauvegarde
  /** Navigateur : on enregistre tout d'un bloc */
  sauverWeb(d: Donnees) {
    try { localStorage.setItem(CLE_WEB, JSON.stringify(d)); } catch { /* stockage plein ou indisponible */ }
  }

  /** Mobile : planifie l'écriture d'une collection (regroupée toutes les 300 ms) */
  planifier(nom: NomCollection, items: unknown[]) {
    this.enAttente.set(nom, items as Ligne[]);
    this.programmer();
  }
  planifierParametres(p: Parametres) {
    this.parametresEnAttente = p;
    this.programmer();
  }

  private programmer() {
    clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => this.vider(), 300);
  }

  /** Écrit immédiatement tout ce qui est en attente (appelé aussi quand l'app passe en arrière-plan) */
  vider(): Promise<void> {
    clearTimeout(this.minuteur);
    const lot = new Map(this.enAttente);
    const params = this.parametresEnAttente;
    this.enAttente.clear();
    this.parametresEnAttente = undefined;
    this.file = this.file.then(() => this.ecrire(lot, params)).catch(err => console.error('Erreur SQLite', err));
    return this.file;
  }

  private async ecrire(lot: Map<NomCollection, Ligne[]>, params?: Parametres) {
    if (!this.db) return;
    const set: capSQLiteSet[] = [];
    const apres = new Map<NomCollection, Map<string, Ligne>>();

    for (const [nom, items] of lot) {
      const def = TABLES[nom];
      const avant = this.ecrits.get(nom) ?? new Map<string, Ligne>();
      const maintenant = new Map(items.map(i => [i.id, i]));

      for (const [id] of avant) {
        if (!maintenant.has(id)) {
          if (def.enfants) set.push({ statement: `DELETE FROM ${def.enfants.table} WHERE ${def.enfants.fk} = ?`, values: [id] });
          set.push({ statement: `DELETE FROM ${def.table} WHERE id = ?`, values: [id] });
        }
      }
      for (const item of items) {
        if (avant.get(item.id) === item) continue; // inchangé
        const cols = def.colonnes;
        set.push({
          statement: `INSERT OR REPLACE INTO ${def.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
          values: cols.map(c => valeur(item[c])),
        });
        if (def.enfants) {
          const e = def.enfants;
          set.push({ statement: `DELETE FROM ${e.table} WHERE ${e.fk} = ?`, values: [item.id] });
          ((item[e.champ] as Record<string, unknown>[]) ?? []).forEach((enf, i) => set.push({
            statement: `INSERT INTO ${e.table} (${e.fk},ordre,${e.colonnes.join(',')}) VALUES (?,?,${e.colonnes.map(() => '?').join(',')})`,
            values: [item.id, i, ...e.colonnes.map(c => valeur(enf[c]))],
          }));
        }
      }
      apres.set(nom, maintenant);
    }

    if (params && params !== this.parametresEcrits) {
      set.push({ statement: `INSERT OR REPLACE INTO meta (cle, valeur) VALUES ('parametres', ?)`, values: [JSON.stringify(params)] });
    }
    if (!set.length) return;
    set.push({ statement: `INSERT OR REPLACE INTO meta (cle, valeur) VALUES ('initialise', ?)`, values: [new Date().toISOString()] });

    await this.db.executeSet(set, true); // une seule transaction
    apres.forEach((m, nom) => this.ecrits.set(nom, m));
    if (params) this.parametresEcrits = params;
  }
}

const valeur = (v: unknown) => (v === undefined || v === '' ? null : v);
const nettoyer = (row: Record<string, unknown>) => {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (v !== null) o[k] = v;
  return o;
};
