// src/app/shared/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
import { CartItem } from '../../models/cart-item'; // AJOUTER CET IMPORT

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
    this.isAuthenticated = this.authService.isAuthenticated()
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

  // ========== MÉTHODE ADD TO CART CORRIGÉE ==========
  addToCart(product: Product): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (!product.id) {
      console.error('Produit sans ID');
      return;
    }

    // CORRECTION : Utilisez la méthode SIMPLIFIÉE qui prend seulement productId et quantity
    this.cartService.addProductToCartSimple(product.id, 1).subscribe({
      next: (cartItem: CartItem) => {
        console.log('✅ Produit ajouté au panier:', product.nom, cartItem);
        
        // Notifier la mise à jour du panier (déjà fait dans addProductToCartSimple)
        // this.cartService.notifyCartUpdate(); // ← PLUS BESOIN, déjà fait
        
        // Afficher une notification
        alert(`${product.nom} a été ajouté au panier!`);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de l\'ajout au panier:', error);
        
        // Gestion d'erreur améliorée
        if (error.message === 'Utilisateur non connecté') {
          alert('Veuillez vous reconnecter');
          this.router.navigate(['/auth/login']);
        } else {
          alert('Erreur lors de l\'ajout au panier');
        }
      }
    });
  }

  // ========== MÉTHODE ALTERNATIVE POUR AJOUTER AVEC LE PRODUIT COMPLET ==========
  addProductToCart(product: Product): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    // Utilisation de la méthode avec produit complet
    this.cartService.addProductToCart(product, 1).subscribe({
      next: (cartItem: CartItem) => {
        console.log('✅ Produit ajouté:', cartItem);
        alert(`${product.nom} ajouté au panier !`);
      },
      error: (err: any) => {
        console.error('❌ Erreur:', err);
        alert('Erreur lors de l\'ajout au panier');
      }
    });
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0.00 €';
    return price.toFixed(2) + ' €';
  }

  // ========== MÉTHODE POUR AFFICHER L'IMAGE PAR DÉFAUT ==========
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-product.jpg';
  }

  // ========== MÉTHODE POUR FILTRER LES PRODUITS EN VEDETTE ==========
  getProductImage(product: Product): string {
    return product.imageUrl || 'assets/images/default-product.jpg';
  }

  // ========== MÉTHODE POUR TRACKER LES PRODUITS DANS NG FOR ==========
  trackByProductId(index: number, product: Product): number {
    return product.id || index;
  }

  // ========== MÉTHODE POUR DÉTERMINER SI UN PRODUIT EST EN PROMOTION ==========
  isOnSale(product: Product): boolean {
    // Logique de promotion simple (exemple : produits avec prix > 200)
    return (product.prix || 0) > 200;
  }

  // ========== MÉTHODE POUR FORMER LE NOM COMPLET DU PRODUIT ==========
  getProductFullName(product: Product): string {
    const categoryName = product.category?.nom ? ` - ${product.category.nom}` : '';
    return `${product.nom}${categoryName}`;
  }

  // ========== MÉTHODE POUR NAVIGUER VERS LES CATÉGORIES ==========
  goToCategory(categoryId: number | undefined): void {
    if (categoryId) {
      this.router.navigate(['/products/category', categoryId]);
    }
  }

  // ========== MÉTHODE POUR NAVIGUER VERS TOUS LES PRODUITS ==========
  goToAllProducts(): void {
    this.router.navigate(['/products']);
  }
}