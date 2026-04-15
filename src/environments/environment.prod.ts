// src/environments/environment.prod.ts

// Configuration pour l'environnement de production
export const environment = {
  // Indicateur d'environnement de production
  production: true,
  
  // URL de votre API backend 
  apiUrl: '/api',
  
  // Nom de l'application
  appName: 'MaBoutique',
  
  // Version de l'application
  version: '1.0.0',
  
  // Mode debug désactivé en production
  debug: false,
  
  // Configuration pour le logging (réduit en production)
  logging: {
    level: 'error', // Seulement les erreurs en production
    enableConsoleLog: false, // Pas de console.log en production
    enableApiLog: false
  },
  
  // Configuration d'authentification (pour production)
  auth: {
    mockToken: false, // Utiliser des vrais tokens JWT
    tokenExpiration: 3600000, // 1 heure en millisecondes
    autoLoginEnabled: false // Pas d'auto-login en production
  },
  
  // Configuration des fonctionnalités (désactivées en production)
  features: {
    enableDebugTools: false,
    enableTestUsers: false,
    enableMockData: false
  },
  
  // URL des différentes ressources
  endpoints: {
    users: 'users',
    products: 'products',
    categories: 'categories',
    orders: 'orders',
    cart: 'cart'
  },
  
  // Configuration UI/UX
  ui: {
    theme: 'light',
    language: 'fr',
    animationsEnabled: true // Garder les animations pour UX
  },
  
  // Pas d'utilisateurs de test en production
  testUsers: {
    admin: null,
    client: null
  }
};

// Fonctions utilitaires pour l'environnement de production
export const prodConfig = {
  /**
   * Retourne l'URL complète d'une ressource
   */
  getFullUrl: (resource: string): string => {
    return `${environment.apiUrl}/${resource}`;
  },
  
  /**
   * Vérifie si une fonctionnalité est activée
   */
  isFeatureEnabled: (feature: string): boolean => {
    return false; // Par défaut, désactiver toutes les fonctionnalités de debug
  },
  
  /**
   * Retourne les informations de logging
   */
  getLoggingConfig: () => {
    return environment.logging;
  }
};

// Export par défaut pour compatibilité
export default environment;