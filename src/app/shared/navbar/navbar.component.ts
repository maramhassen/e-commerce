// src/app/shared/navbar/navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { Subscription } from 'rxjs';
import { Category } from '../../models/category';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isAdmin = false;
  currentUser: any = null;
  categories: Category[] = [];
  isHomePage = false;
  cartCount = 0;
  loadingCartCount = false;

  private authSubscription!: Subscription;
  private routerSubscription!: Subscription;
  private cartSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Charger les catégories
    this.loadCategories();

    // S'abonner aux changements d'état d'authentification
    this.authSubscription = this.authService.authState$.subscribe(
      (isAuthenticated: boolean) => {
        console.log('Navbar: État auth changé:', isAuthenticated);
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.currentUser = this.authService.getCurrentUser();
          this.isAdmin = this.authService.isAdmin();
          // Charger le compteur panier après un délai court
          setTimeout(() => this.loadCartCount(), 100);
        } else {
          this.currentUser = null;
          this.isAdmin = false;
          this.cartCount = 0;
        }
      }
    );

    // Suivi de la page courante
    this.routerSubscription = this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.isHomePage = event.urlAfterRedirects === '/';
      });

    // S'abonner aux mises à jour du panier
    this.cartSubscription = this.cartService.cartUpdated$.subscribe(() => {
      console.log('Navbar: Notification panier reçue');
      // Attendre un peu pour laisser le backend s'actualiser
      setTimeout(() => this.loadCartCount(), 300);
    });

    // Charger l'état initial
    const currentAuth = this.authService.isAuthenticated();
    if (currentAuth) {
      this.currentUser = this.authService.getCurrentUser();
      this.isAdmin = this.authService.isAdmin();
      // Charger le compteur après un délai initial
      setTimeout(() => this.loadCartCount(), 500);
    }
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories.slice(0, 8);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });
  }

  private loadCartCount(): void {
    if (!this.isAuthenticated || !this.currentUser?.id) {
      this.cartCount = 0;
      return;
    }

    if (this.loadingCartCount) return; // Éviter les appels multiples

    this.loadingCartCount = true;
    console.log('Navbar: Chargement compteur panier pour user:', this.currentUser.id);

    this.cartService.getCartByUser(this.currentUser.id).subscribe({
      next: (cart) => {
        if (cart && cart.items) {
          // Calculer le nombre total d'articles
          this.cartCount = cart.items.reduce((total, item) => {
            return total + (item.quantite || 0);
          }, 0);
          console.log('Navbar: Compteur panier chargé:', this.cartCount);
        } else {
          this.cartCount = 0;
          console.log('Navbar: Panier vide ou non trouvé');
        }
        this.loadingCartCount = false;
      },
      error: (error: any) => {
        console.error('Navbar: Erreur chargement compteur panier:', error);
        this.cartCount = 0;
        this.loadingCartCount = false;
        
        // En cas d'erreur 404 (panier non trouvé), c'est normal
        if (error.status !== 404) {
          console.warn('Navbar: Panier non trouvé pour user', this.currentUser.id);
        }
      }
    });
  }

  // Nouvelle méthode pour forcer le rechargement
  refreshCartCount(): void {
    console.log('Navbar: Forcer rechargement compteur');
    this.loadCartCount();
  }

  // Méthode pour accéder au panier
  goToCart(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/cart']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  logout(): void {
    console.log('Navbar: Déconnexion');
    this.authService.logout();
    this.cartCount = 0;
    this.router.navigate(['/']);
  }

  get userInitials(): string {
    if (!this.currentUser) return '';
    const first = this.currentUser.prenom?.charAt(0) || '';
    const last = this.currentUser.nom?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  get userName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim();
  }

  // Méthode pour déboguer
  debugCart(): void {
    console.log('=== DEBUG NAVBAR ===');
    console.log('Authentifié:', this.isAuthenticated);
    console.log('User ID:', this.currentUser?.id);
    console.log('Cart Count:', this.cartCount);
    console.log('Loading:', this.loadingCartCount);
  }

  ngOnDestroy(): void {
    // Nettoyer les abonnements
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}