import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Printer } from '@capgo/capacitor-printer';
import { PersistanceService } from './persistance.service';
import { StoreService } from './store.service';

/** Intégrations natives Android : bouton retour, impression, partage de fichiers… */
@Injectable({ providedIn: 'root' })
export class MobileService {
  private persistance = inject(PersistanceService);
  private store = inject(StoreService);
  private router = inject(Router);
  readonly natif = this.persistance.natif;

  /** Fenêtres ouvertes (la dernière est fermée par le bouton retour / Échap) */
  private fenetres: (() => void)[] = [];

  init() {
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.fermerFenetre(); });
    if (!this.natif) return;

    App.addListener('backButton', ({ canGoBack }) => {
      if (this.fermerFenetre()) return;
      if (canGoBack && this.router.url !== '/') history.back();
      else App.exitApp();
    });
    // Sauvegarde immédiate quand l'app passe en arrière-plan
    App.addListener('pause', () => { this.store.sauvegarderMaintenant(); });
  }

  ouvrirFenetre(fermer: () => void) { this.fenetres.push(fermer); }
  oublierFenetre(fermer: () => void) { this.fenetres = this.fenetres.filter(f => f !== fermer); }
  private fermerFenetre(): boolean {
    const f = this.fenetres.at(-1);
    f?.();
    return !!f;
  }

  /** Imprime la zone .print-area visible (navigateur : boîte d'impression ; Android : service d'impression / PDF) */
  async imprimer(titre = 'Document') {
    const zone = document.querySelector<HTMLElement>('.print-area');
    if (!this.natif || !zone) {
      document.body.classList.add('printing');
      setTimeout(() => { window.print(); document.body.classList.remove('printing'); }, 50);
      return;
    }
    const css = Array.from(document.styleSheets).map(s => {
      try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; }
    }).join('\n');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}
      body{background:#fff;padding:24px;font-family:system-ui,sans-serif}</style></head>
      <body>${zone.outerHTML}</body></html>`;
    await Printer.printHtml({ name: titre, html });
  }

  /** Enregistre un fichier texte et ouvre le menu de partage (WhatsApp, Drive, e-mail…) */
  async partagerFichier(nom: string, contenu: string, type = 'application/json') {
    if (!this.natif) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([contenu], { type }));
      a.download = nom;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    const f = await Filesystem.writeFile({ path: nom, data: contenu, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: nom, url: f.uri, dialogTitle: 'Enregistrer la sauvegarde' });
  }
}
