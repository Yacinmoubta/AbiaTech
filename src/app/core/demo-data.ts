import { Achat, Client, Donnees, Fournisseur, Produit, Reparation, Vente } from './models';

const jour = (n: number, h = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, (n * 17) % 60, 0, 0);
  return d.toISOString();
};

export function creerDonneesDemo(): Donnees {
  const produits: Produit[] = [
    { id: 'p1', reference: 'P0001', nom: 'iPhone 15 128 Go', categorie: 'Téléphone', marque: 'Apple', etat: 'Neuf', prixAchat: 8200, prixVente: 9490, stock: 4, seuilAlerte: 2, garantieMois: 12, creeLe: jour(60) },
    { id: 'p2', reference: 'P0002', nom: 'Galaxy A55 256 Go', categorie: 'Téléphone', marque: 'Samsung', etat: 'Neuf', prixAchat: 3600, prixVente: 4290, stock: 7, seuilAlerte: 3, garantieMois: 12, creeLe: jour(60) },
    { id: 'p3', reference: 'P0003', nom: 'Redmi Note 13', categorie: 'Téléphone', marque: 'Xiaomi', etat: 'Neuf', prixAchat: 1750, prixVente: 2190, stock: 2, seuilAlerte: 3, garantieMois: 12, creeLe: jour(55) },
    { id: 'p4', reference: 'P0004', nom: 'iPhone 12 64 Go', categorie: 'Téléphone', marque: 'Apple', etat: 'Occasion', numeroSerie: '356789104455120', prixAchat: 2600, prixVente: 3400, stock: 1, seuilAlerte: 0, garantieMois: 3, creeLe: jour(12) },
    { id: 'p5', reference: 'P0005', nom: 'ThinkPad T14 i5 16 Go', categorie: 'Ordinateur', marque: 'Lenovo', etat: 'Reconditionné', numeroSerie: 'PF3K9X2L', prixAchat: 4300, prixVente: 5600, stock: 3, seuilAlerte: 1, garantieMois: 6, creeLe: jour(40) },
    { id: 'p6', reference: 'P0006', nom: 'MacBook Air M2 256 Go', categorie: 'Ordinateur', marque: 'Apple', etat: 'Neuf', prixAchat: 10400, prixVente: 11990, stock: 2, seuilAlerte: 1, garantieMois: 12, creeLe: jour(40) },
    { id: 'p7', reference: 'P0007', nom: 'HP 250 G9 i3 8 Go', categorie: 'Ordinateur', marque: 'HP', etat: 'Neuf', prixAchat: 3900, prixVente: 4690, stock: 5, seuilAlerte: 2, garantieMois: 12, creeLe: jour(35) },
    { id: 'p8', reference: 'P0008', nom: 'Galaxy Tab A9+', categorie: 'Tablette', marque: 'Samsung', etat: 'Neuf', prixAchat: 1900, prixVente: 2390, stock: 3, seuilAlerte: 1, garantieMois: 12, creeLe: jour(30) },
    { id: 'p9', reference: 'P0009', nom: 'Chargeur USB-C 25W', categorie: 'Accessoire', marque: 'Samsung', etat: 'Neuf', prixAchat: 70, prixVente: 149, stock: 25, seuilAlerte: 8, garantieMois: 6, creeLe: jour(30) },
    { id: 'p10', reference: 'P0010', nom: 'Écouteurs Bluetooth', categorie: 'Accessoire', marque: 'JBL', etat: 'Neuf', prixAchat: 280, prixVente: 449, stock: 9, seuilAlerte: 4, garantieMois: 12, creeLe: jour(28) },
    { id: 'p11', reference: 'P0011', nom: 'Protection verre trempé', categorie: 'Accessoire', marque: 'Générique', etat: 'Neuf', prixAchat: 8, prixVente: 50, stock: 120, seuilAlerte: 30, garantieMois: 0, creeLe: jour(28) },
    { id: 'p12', reference: 'P0012', nom: 'Coque silicone iPhone', categorie: 'Accessoire', marque: 'Générique', etat: 'Neuf', prixAchat: 20, prixVente: 80, stock: 40, seuilAlerte: 10, garantieMois: 0, creeLe: jour(28) },
    { id: 'p13', reference: 'P0013', nom: 'Écran iPhone 11 (OLED)', categorie: 'Pièce détachée', marque: 'Apple', etat: 'Neuf', prixAchat: 420, prixVente: 750, stock: 3, seuilAlerte: 2, garantieMois: 3, creeLe: jour(25) },
    { id: 'p14', reference: 'P0014', nom: 'Batterie Galaxy A52', categorie: 'Pièce détachée', marque: 'Samsung', etat: 'Neuf', prixAchat: 120, prixVente: 250, stock: 1, seuilAlerte: 2, garantieMois: 3, creeLe: jour(25) },
    { id: 'p15', reference: 'P0015', nom: 'Connecteur de charge Type-C', categorie: 'Pièce détachée', marque: 'Générique', etat: 'Neuf', prixAchat: 25, prixVente: 80, stock: 15, seuilAlerte: 5, garantieMois: 3, creeLe: jour(25) },
    { id: 'p16', reference: 'P0016', nom: 'SSD 512 Go SATA', categorie: 'Pièce détachée', marque: 'Kingston', etat: 'Neuf', prixAchat: 330, prixVente: 520, stock: 6, seuilAlerte: 2, garantieMois: 24, creeLe: jour(20) },
  ];

  const clients: Client[] = [
    { id: 'c1', nom: 'Youssef El Amrani', telephone: '0661 23 45 67', email: 'youssef.amrani@mail.com', adresse: 'Maârif, Casablanca', creeLe: jour(50) },
    { id: 'c2', nom: 'Salma Benjelloun', telephone: '0662 98 76 54', creeLe: jour(45) },
    { id: 'c3', nom: 'Karim Idrissi', telephone: '0670 11 22 33', email: 'karim.idrissi@mail.com', creeLe: jour(30) },
    { id: 'c4', nom: 'Fatima Zahra Alaoui', telephone: '0655 44 33 22', adresse: 'Agdal, Rabat', creeLe: jour(20) },
    { id: 'c5', nom: 'Mehdi Tazi', telephone: '0699 87 65 43', creeLe: jour(8) },
  ];

  const fournisseurs: Fournisseur[] = [
    { id: 'f1', nom: 'Derb Ghallef Distribution', contact: 'Hassan', telephone: '0522 30 40 50', email: 'contact@dgdistrib.ma', adresse: 'Derb Ghallef, Casablanca', creeLe: jour(90) },
    { id: 'f2', nom: 'TechPièces Maroc', contact: 'Nadia', telephone: '0537 70 80 90', email: 'ventes@techpieces.ma', creeLe: jour(90) },
    { id: 'f3', nom: 'InfoPro Grossiste', contact: 'Rachid', telephone: '0524 44 55 66', creeLe: jour(70) },
  ];

  const ventes: Vente[] = [
    { id: 'v1', numero: 'V-00001', date: jour(6, 10), clientId: 'c1', lignes: [{ produitId: 'p2', designation: 'Galaxy A55 256 Go', quantite: 1, prixUnitaire: 4290, prixAchat: 3600 }, { produitId: 'p11', designation: 'Protection verre trempé', quantite: 1, prixUnitaire: 50, prixAchat: 8 }], remise: 40, modePaiement: 'Carte', total: 4300 },
    { id: 'v2', numero: 'V-00002', date: jour(5, 15), lignes: [{ produitId: 'p9', designation: 'Chargeur USB-C 25W', quantite: 2, prixUnitaire: 149, prixAchat: 70 }], remise: 0, modePaiement: 'Espèces', total: 298 },
    { id: 'v3', numero: 'V-00003', date: jour(4, 12), clientId: 'c3', lignes: [{ produitId: 'p7', designation: 'HP 250 G9 i3 8 Go', quantite: 1, prixUnitaire: 4690, prixAchat: 3900 }], remise: 90, modePaiement: 'Virement', total: 4600 },
    { id: 'v4', numero: 'V-00004', date: jour(3, 17), lignes: [{ produitId: 'p10', designation: 'Écouteurs Bluetooth', quantite: 1, prixUnitaire: 449, prixAchat: 280 }, { produitId: 'p12', designation: 'Coque silicone iPhone', quantite: 1, prixUnitaire: 80, prixAchat: 20 }], remise: 0, modePaiement: 'Espèces', total: 529 },
    { id: 'v5', numero: 'V-00005', date: jour(2, 11), clientId: 'c2', lignes: [{ produitId: 'p1', designation: 'iPhone 15 128 Go', quantite: 1, prixUnitaire: 9490, prixAchat: 8200 }], remise: 0, modePaiement: 'Carte', total: 9490 },
    { id: 'v6', numero: 'V-00006', date: jour(1, 16), lignes: [{ produitId: 'p3', designation: 'Redmi Note 13', quantite: 1, prixUnitaire: 2190, prixAchat: 1750 }, { produitId: 'p11', designation: 'Protection verre trempé', quantite: 2, prixUnitaire: 50, prixAchat: 8 }], remise: 0, modePaiement: 'Espèces', total: 2290 },
    { id: 'v7', numero: 'V-00007', date: jour(0, 10), lignes: [{ produitId: 'p9', designation: 'Chargeur USB-C 25W', quantite: 1, prixUnitaire: 149, prixAchat: 70 }], remise: 0, modePaiement: 'Espèces', total: 149 },
  ];

  const achats: Achat[] = [
    { id: 'a1', numero: 'A-00001', date: jour(25), type: 'Fournisseur', fournisseurId: 'f2', lignes: [{ produitId: 'p13', designation: 'Écran iPhone 11 (OLED)', quantite: 4, prixUnitaire: 420 }, { produitId: 'p14', designation: 'Batterie Galaxy A52', quantite: 3, prixUnitaire: 120 }], modePaiement: 'Virement', total: 2040 },
    { id: 'a2', numero: 'A-00002', date: jour(12), type: 'Rachat client', clientId: 'c4', lignes: [{ produitId: 'p4', designation: 'iPhone 12 64 Go', quantite: 1, prixUnitaire: 2600 }], modePaiement: 'Espèces', total: 2600, notes: 'Bon état, batterie 86 %' },
  ];

  const reparations: Reparation[] = [
    { id: 'r1', numero: 'R-00001', dateDepot: jour(9), datePrevue: jour(7), dateLivraison: jour(7), clientId: 'c2', typeAppareil: 'Téléphone', marque: 'Apple', modele: 'iPhone 11', panne: 'Écran cassé', diagnostic: 'Remplacement écran OLED', technicien: 'Anas', statut: 'Livré', pieces: [{ produitId: 'p13', designation: 'Écran iPhone 11 (OLED)', quantite: 1, prixUnitaire: 750 }], mainOeuvre: 150, devis: 900, acompte: 900, garantieJours: 90 },
    { id: 'r2', numero: 'R-00002', dateDepot: jour(3), datePrevue: jour(-1), clientId: 'c1', typeAppareil: 'Ordinateur', marque: 'Dell', modele: 'Latitude 5490', accessoires: 'Chargeur', panne: 'Très lent, démarre en 5 min', diagnostic: 'Disque dur fatigué → passage SSD + réinstallation', technicien: 'Omar', statut: 'En réparation', pieces: [{ produitId: 'p16', designation: 'SSD 512 Go SATA', quantite: 1, prixUnitaire: 520 }], mainOeuvre: 200, devis: 720, acompte: 300, garantieJours: 90 },
    { id: 'r3', numero: 'R-00003', dateDepot: jour(2), clientId: 'c5', typeAppareil: 'Téléphone', marque: 'Samsung', modele: 'Galaxy A52', panne: 'Batterie se décharge très vite', technicien: 'Anas', statut: 'En attente pièce', pieces: [], mainOeuvre: 100, devis: 350, acompte: 100, garantieJours: 90 },
    { id: 'r4', numero: 'R-00004', dateDepot: jour(1), datePrevue: jour(0), clientId: 'c3', typeAppareil: 'Téléphone', marque: 'Xiaomi', modele: 'Redmi Note 10', panne: 'Ne charge plus', diagnostic: 'Connecteur de charge oxydé', technicien: 'Omar', statut: 'Prêt', pieces: [{ produitId: 'p15', designation: 'Connecteur de charge Type-C', quantite: 1, prixUnitaire: 80 }], mainOeuvre: 120, devis: 200, acompte: 0, garantieJours: 90 },
    { id: 'r5', numero: 'R-00005', dateDepot: jour(0, 9), clientId: 'c4', typeAppareil: 'Tablette', marque: 'Apple', modele: 'iPad 9', accessoires: 'Housse', panne: 'Tactile ne répond plus en bas', statut: 'Reçu', pieces: [], mainOeuvre: 0, devis: 0, acompte: 0, garantieJours: 90 },
  ];

  return {
    produits, clients, fournisseurs, ventes, achats, reparations, aAcheter: [],
    parametres: {
      nomMagasin: 'AbiaTech',
      adresse: '12 Bd Zerktouni, Casablanca',
      telephone: '0522 00 11 22',
      email: 'contact@techfix.ma',
      ice: '',
      devise: 'DH',
      techniciens: ['Anas', 'Omar'],
      piedFacture: 'Merci pour votre confiance. Les appareils non récupérés après 90 jours ne sont plus sous notre responsabilité.',
    },
  };
}
