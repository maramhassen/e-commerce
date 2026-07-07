// src/test.ts
import 'zone.js';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

declare const process: any;

// ═══════════════════════════════════════════════════════════════
// ⭐ MOCK GLOBAL DE confirm() POUR LES TESTS HEADLESS
// ═══════════════════════════════════════════════════════════════

// Détecter si on est en environnement headless (CI)
const isHeadless = typeof (process as any) !== 'undefined' && (
                   (process as any).env.CI === 'true' || 
                   (process as any).env.AZURE_PIPELINE === 'true' ||
                   (process as any).env.CHROME_BIN !== undefined
                 );

/**
 * Mock de la fonction confirm() pour les tests
 * En environnement headless, retourne true par défaut
 * En environnement normal, utilise la fonction native
 */
const confirmMock = (message?: string): boolean => {
  // En mode CI, logger le message pour le débogage
  if (isHeadless) {
    console.log(`[Mock confirm] Message: ${message || 'Pas de message'}`);
    // ⭐ Retourne true par défaut (simule "OK")
    return true;
  }
  // En mode normal, utiliser la fonction native
  return window.confirm(message || '');
};

// ⭐ Appliquer le mock de confirm sur window
Object.defineProperty(window, 'confirm', {
  value: confirmMock,
  writable: true,
  configurable: true
});

// ⭐ Mock de alert() aussi (optionnel)
const alertMock = (message?: string): void => {
  if (isHeadless) {
    console.log(`[Mock alert] Message: ${message || 'Pas de message'}`);
  } else {
    window.alert(message || '');
  }
};

Object.defineProperty(window, 'alert', {
  value: alertMock,
  writable: true,
  configurable: true
});

// ═══════════════════════════════════════════════════════════════
// ⭐ MOCK DE prompt() (optionnel - si vous l'utilisez)
// ═══════════════════════════════════════════════════════════════
/*
const promptMock = (message?: string, defaultValue?: string): string | null => {
  if (isHeadless) {
    console.log(`[Mock prompt] Message: ${message}, Default: ${defaultValue}`);
    return defaultValue || null;
  }
  return window.prompt(message || '', defaultValue || '');
};

Object.defineProperty(window, 'prompt', {
  value: promptMock,
  writable: true,
  configurable: true
});
*/

// ═══════════════════════════════════════════════════════════════
// ⭐ INITIALISATION DE L'ENVIRONNEMENT DE TEST
// ═══════════════════════════════════════════════════════════════

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// ═══════════════════════════════════════════════════════════════
// ⭐ CHARGEMENT DE TOUS LES FICHIERS DE TEST
// ═══════════════════════════════════════════════════════════════

// Afficher un message de démarrage
console.log(`🧪 Test environment initialized (Headless mode: ${isHeadless ? 'ON' : 'OFF'})`);
console.log(`📁 Loading test files...`);

// Charger tous les fichiers .spec.ts
const context = require.context('./', true, /\.spec\.ts$/);
const testFiles = context.keys();

console.log(`📊 Found ${testFiles.length} test file(s)`);

testFiles.forEach((file) => {
  console.log(`  - ${file}`);
  context(file);
});

// ═══════════════════════════════════════════════════════════════
// ⭐ OPTIONNEL : Fonction de nettoyage après tous les tests
// ═══════════════════════════════════════════════════════════════

// Si vous voulez exécuter du code après tous les tests
// (à décommenter si nécessaire)
/*
afterAll(() => {
  console.log('🧹 All tests completed');
});
*/

// ═══════════════════════════════════════════════════════════════
// ⭐ EXPORTER POUR LES TESTS INDIVIDUELS
// ═══════════════════════════════════════════════════════════════

// Exporter des utilitaires pour les tests si nécessaire
export const testUtils = {
  // Permet de modifier le comportement de confirm dans les tests
  setConfirmReturnValue: (value: boolean) => {
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(value);
    return confirmSpy;
  },
  // Permet de vérifier si confirm a été appelé
  getConfirmSpy: () => {
    return spyOn(window, 'confirm');
  }
};