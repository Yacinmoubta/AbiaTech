# AbiaTech — Téléphones, Ordinateurs & Électronique

Application Angular 22 + Tailwind CSS 4 pour gérer un magasin de **vente**, **achat/rachat** et **réparation** d'appareils.

## Démarrer

```bash
npm install
npm start          # http://localhost:4200
npm run build      # version de production dans dist/
```

## Modules

| Module | Fonctions |
|---|---|
| **Tableau de bord** | CA du jour / du mois, marge, réparations en cours, valeur du stock, graphique 7 jours, alertes stock |
| **Ventes** | Caisse (recherche produit, panier, remise, mode de paiement, client), facture imprimable, annulation avec remise en stock |
| **Réparations** | Tableau Kanban par statut + vue liste, fiche complète (appareil, IMEI, code, accessoires, panne, diagnostic, technicien, devis, acompte, pièces déduites du stock, main d'œuvre, garantie), bon de dépôt et facture imprimables |
| **Produits & stock** | Catalogue par catégorie/état (neuf, occasion, reconditionné), IMEI/N° série, prix achat/vente, marge, seuil d'alerte, ajustement rapide du stock |
| **Achats** | Achat fournisseur (multi-lignes, met à jour stock et prix d'achat) et rachat d'appareil à un client (crée le produit d'occasion + bon de rachat signable) |
| **Clients** | Fiche client avec historique des achats et réparations, total dépensé |
| **Fournisseurs** | Coordonnées et total acheté |
| **Paramètres** | Infos du magasin (en-tête des documents), techniciens, devise, export/import JSON, données de démo |

## Application Android (base SQLite locale)

L'application est empaquetée avec **Capacitor 8**. Sur le téléphone, les données sont enregistrées
dans une **base SQLite locale** (`magasin.db`, plugin `@capacitor-community/sqlite`) : tout fonctionne
**hors connexion**. Dans un navigateur, elle utilise le localStorage (pratique pour développer).

Tables : `produits`, `clients`, `fournisseurs`, `ventes` + `vente_lignes`, `achats` + `achat_lignes`,
`reparations` + `reparation_pieces`, `meta` (paramètres). Voir `src/app/core/schema.ts`.

### Obtenir l'APK sans Android Studio (recommandé)
1. Créer un dépôt GitHub (privé) et y pousser ce dossier.
2. Onglet **Actions** → **Build APK Android** → **Run workflow** (il se lance aussi à chaque push sur `main`).
3. Après ~5 min, télécharger l'artefact **gestion-magasin-apk**, le dézipper et installer `app-debug.apk`
   sur le téléphone (autoriser « Installer des applications inconnues »).

### Avec Android Studio
```bash
npm install
npm run build
npx cap sync android
npx cap open android      # puis Build > Build APK(s), ou ▶ sur un téléphone branché
```
Après chaque modification du code Angular : `npm run build && npx cap sync android`.

### Spécificités mobile
- **Impression** : factures, bons de dépôt et bons de rachat passent par le service d'impression Android
  (imprimante Wi-Fi/Bluetooth compatible, ou « Enregistrer en PDF » pour l'envoyer par WhatsApp).
- **Sauvegarde** : Paramètres → Exporter ouvre le menu de partage (Drive, WhatsApp, e-mail…).
  ⚠️ Désinstaller l'application supprime la base : exportez régulièrement.
- **Bouton retour** : ferme la fenêtre ouverte, sinon revient à la page précédente.
- Identifiant de l'app : `ma.magasin.gestion` (dans `capacitor.config.ts`, à changer **avant** une publication sur le Play Store).

## Structure

```
android/     projet Android natif (généré par Capacitor)
.github/     compilation automatique de l'APK
src/app/
  core/      models.ts, store.service.ts, demo-data.ts,
             schema.ts (SQL), persistance.service.ts (SQLite / localStorage), mobile.service.ts
  shared/    ui.ts (icônes, modal, pipes), client-select.ts, doc.ts (en-tête des documents)
  pages/     dashboard, ventes, reparations, produits, achats, clients, fournisseurs, parametres
```
