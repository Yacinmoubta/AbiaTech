import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard').then(m => m.DashboardPage), title: 'Tableau de bord' },
  { path: 'produits', loadComponent: () => import('./pages/produits').then(m => m.ProduitsPage), title: 'Produits & stock' },
  { path: 'ventes', loadComponent: () => import('./pages/ventes').then(m => m.VentesPage), title: 'Ventes' },
  { path: 'achats', loadComponent: () => import('./pages/achats').then(m => m.AchatsPage), title: 'Achats' },
  { path: 'a-acheter', loadComponent: () => import('./pages/a-acheter').then(m => m.AAcheterPage), title: 'À acheter' },
  { path: 'reparations', loadComponent: () => import('./pages/reparations').then(m => m.ReparationsPage), title: 'Réparations' },
  { path: 'clients', loadComponent: () => import('./pages/clients').then(m => m.ClientsPage), title: 'Clients' },
  { path: 'fournisseurs', loadComponent: () => import('./pages/fournisseurs').then(m => m.FournisseursPage), title: 'Fournisseurs' },
  { path: 'parametres', loadComponent: () => import('./pages/parametres').then(m => m.ParametresPage), title: 'Paramètres' },
  { path: '**', redirectTo: '' },
];
