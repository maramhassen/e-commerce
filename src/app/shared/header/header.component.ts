// src/app/shared/header/header.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isAuthenticated = false;
  isAdmin = false;
  userName = '';
  cartCount = 0;
  wishlistCount = 0;
  
  showMobileSearch = false;
  searchQuery = '';

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.subscribeToAuthChanges();
    this.subscribeToCartChanges();
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    this.isAuthenticated = !!user;
    
    if (user) {
      this.userName = `${user.prenom} ${user.nom}`;
      this.isAdmin = user.role === 'ADMIN';
      
      // Charger le panier si l'utilisateur est connecté
      this.loadCartCount(user.id!);
    }
  }

  private loadCartCount(userId: number): void {
    this.cartService.getCartByUser(userId).subscribe({
      next: (cart) => {
        this.cartCount = this.cartService.calculateTotalItems(cart.items || []);
      },
      error: () => {
        this.cartCount = 0;
      }
    });
  }

  private subscribeToAuthChanges(): void {
    this.authService.authState$.subscribe(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
      
      if (isAuthenticated) {
        const user = this.authService.getCurrentUser();
        if (user) {
          this.userName = `${user.prenom} ${user.nom}`;
          this.isAdmin = user.role === 'ADMIN';
          this.loadCartCount(user.id!);
        }
      } else {
        this.userName = '';
        this.isAdmin = false;
        this.cartCount = 0;
      }
    });
  }

  private subscribeToCartChanges(): void {
    this.cartService.cartUpdated$.subscribe(() => {
      const user = this.authService.getCurrentUser();
      if (user?.id) {
        this.loadCartCount(user.id);
      }
    });
  }

  search(): void {
    if (this.searchQuery && this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      this.showMobileSearch = false;
      this.searchQuery = '';
    }
  }

  toggleMobileSearch(): void {
    this.showMobileSearch = !this.showMobileSearch;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToCart(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/cart']);
    } else {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/cart' }
      });
    }
  }
}