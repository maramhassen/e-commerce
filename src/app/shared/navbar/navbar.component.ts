import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
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

  private authSubscription!: Subscription;
  private routerSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Charger les catégories
    this.loadCategories();

    // S'abonner aux changements d'état d'authentification
    this.authSubscription = this.authService.authState$.subscribe(
      (isAuthenticated: boolean) => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.currentUser = this.authService.getCurrentUser();
          this.isAdmin = this.authService.isAdmin();
        } else {
          this.currentUser = null;
          this.isAdmin = false;
        }
      }
    );

    // 🔧 Suivi de la page courante pour savoir si on est sur la home
    this.routerSubscription = this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.isHomePage = event.urlAfterRedirects === '/';
      });
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

  logout(): void {
    this.authService.logout();
  }

  get userInitials(): string {
    if (!this.currentUser) return '';
    return (this.currentUser.prenom?.charAt(0) + this.currentUser.nom?.charAt(0)).toUpperCase();
  }

  get userName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  ngOnDestroy(): void {
    // Nettoyer les abonnements pour éviter les fuites mémoire
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
