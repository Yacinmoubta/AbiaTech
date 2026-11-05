import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ma.magasin.gestion',
  appName: 'AbiaTech',
  webDir: 'dist/gestion-magasin/browser',
  plugins: {
    // Base SQLite locale, non chiffrée, stockée dans l'espace privé de l'application
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
    SystemBars: {
      insetsHandling: 'native',
    },
  },
};

export default config;
