// src/environments/environment.ts

// Configuration pour l'environnement de développement
export const environment = {
  // Indicateur d'environnement de production
  production: false,
  
  // URL de votre API backend
  apiUrl: 'http://localhost:8080/api',
  
  // Nom de l'application
  appName: 'MaBoutique - Développement',
  
  // Version de l'application
  version: '1.0.0',
  
  // Mode debug activé
  debug: true,
  
  // Configuration pour le logging
  logging: {
    level: 'debug', // 'debug', 'info', 'warn', 'error'
    enableConsoleLog: true,
    enableApiLog: true
  },
  
  // Configuration d'authentification (pour développement)
  auth: {
    mockToken: true, // Utiliser des tokens mockés en développement
    tokenExpiration: 86400000, // 24 heures en millisecondes
    autoLoginEnabled: true // Auto-login pour le développement
  },
  
  // Configuration des fonctionnalités
  features: {
    enableDebugTools: true,
    enableTestUsers: true,
    enableMockData: true
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
    animationsEnabled: true
  },
  
  // Utilisateurs de test pour le développement
  testUsers: {
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
      role: 'ADMIN'
    },
    client: {
      email: 'client@example.com',
      password: 'client123',
      role: 'CLIENT'
    }
  }
};

// Fonctions utilitaires pour l'environnement de développement
export const devConfig = {
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
    return environment.features[feature as keyof typeof environment.features] || false;
  },
  
  /**
   * Retourne les informations de logging
   */
  getLoggingConfig: () => {
    return environment.logging;
  },
  
  /**
   * Obtient un utilisateur de test
   */
  getTestUser: (type: 'admin' | 'client') => {
    return environment.testUsers[type];
  }
};

// Export par défaut pour compatibilité
export default environment;