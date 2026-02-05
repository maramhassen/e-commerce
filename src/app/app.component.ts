import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'MaBoutique';
  isLoading = true;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeApp();
    this.setupRouterEvents();
    this.setupAuthListener();
  }

  /**
   * Initialise l'application
   */
  private initializeApp(): void {
    // Simulation d'un chargement initial
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Configure les événements du router
   */
  private setupRouterEvents(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Remonter en haut de la page à chaque navigation
        window.scrollTo(0, 0);
        
        // Mettre à jour le titre de la page
        this.updatePageTitle(event.url);
      }
    });
  }

  /**
   * Configure l'écouteur d'authentification
   */
  private setupAuthListener(): void {
    // Écouter les changements d'état d'authentification
    this.authService.authState$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        console.log('Utilisateur connecté');
      } else {
        console.log('Utilisateur déconnecté');
      }
    });
  }

  /**
   * Met à jour le titre de la page en fonction de l'URL
   */
  private updatePageTitle(url: string): void {
    let pageTitle = 'MaBoutique';
    
    if (url.includes('/products')) {
      pageTitle = 'Produits - MaBoutique';
    } else if (url.includes('/cart')) {
      pageTitle = 'Panier - MaBoutique';
    } else if (url.includes('/orders')) {
      pageTitle = 'Commandes - MaBoutique';
    } else if (url.includes('/login')) {
      pageTitle = 'Connexion - MaBoutique';
    } else if (url.includes('/register')) {
      pageTitle = 'Inscription - MaBoutique';
    }
    
    document.title = pageTitle;
  }

  /**
   * Vérifie si la page de chargement doit être affichée
   */
  showLoading(): boolean {
    return this.isLoading && this.router.url === '/';
  }
}
