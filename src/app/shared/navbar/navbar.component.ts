import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { Subscription } from 'rxjs';
import { Category } from '../../models/category';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isAdmin = false;
  currentUser: any = null;
  categories: Category[] = [];
  
  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
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
    // Nettoyer l'abonnement pour éviter les fuites mémoire
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}