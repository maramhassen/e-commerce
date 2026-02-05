// src/app/shared/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../models/product';
import { Category } from '../../models/category';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  
  loading = true;
  isAuthenticated = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadCategories();
    this.checkAuthStatus();
  }

  private loadFeaturedProducts(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        // Filtrez et triez les produits (sans les propriétés problématiques)
        this.featuredProducts = products
          .filter(product => product.stock > 0)
          .slice(0, 8); // Prenez simplement les 8 premiers
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
        this.loading = false;
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories.slice(0, 4); // Prenez simplement les 4 premiers
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });
  }

  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  goToProductDetail(productId: number | undefined): void {
    if (productId) {
      this.router.navigate(['/products', productId]);
    }
  }

  addToCart(product: Product): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (product.id) {
      this.cartService.addToCart(product.id, 1).subscribe({
        next: () => {
          console.log('Produit ajouté au panier:', product.nom);
          // Notifier la mise à jour du panier
          this.cartService.notifyCartUpdate();
          // Afficher une notification (vous pouvez ajouter un toast)
          alert(`${product.nom} a été ajouté au panier!`);
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout au panier:', error);
        }
      });
    }
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0.00 €';
    return price.toFixed(2) + ' €';
  }
}