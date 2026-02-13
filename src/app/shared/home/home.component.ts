// src/app/shared/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
import { CartItem } from '../../models/cart-item';

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
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  // ========== CHARGEMENT DES PRODUITS AVEC FORMATAGE DES IMAGES ==========
  private loadFeaturedProducts(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        // FORMATER LES URLs DES IMAGES COMME DANS PRODUCT-LIST
        this.featuredProducts = products
          .filter(product => product.stock > 0) // Garder seulement les produits en stock
          .map(product => {
            // Formater l'URL de l'image
            if (product.imageUrl) {
              product.imageUrl = this.productService.getImageUrl(product.imageUrl);
            } else {
              product.imageUrl = 'assets/images/default-product.jpg';
            }
            
            // Debug - à supprimer en production
            console.log(`📸 Produit "${product.nom}":`, {
              id: product.id,
              imageUrl: product.imageUrl,
              prix: product.prix,
              stock: product.stock
            });
            
            return product;
          })
          .slice(0, 8); // Prendre seulement les 8 premiers
        
        this.loading = false;
        console.log('✅ Produits vedettes chargés:', this.featuredProducts.length);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des produits:', error);
        this.loading = false;
      }
    });
  }

  // ========== CHARGEMENT DES CATÉGORIES ==========
  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories.slice(0, 4); // Prendre seulement les 4 premières
        console.log('✅ Catégories chargées:', this.categories.length);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des catégories:', error);
      }
    });
  }

  // ========== VÉRIFICATION DU STATUT D'AUTHENTIFICATION ==========
  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  // ========== NAVIGATION VERS LE DÉTAIL DU PRODUIT ==========
  goToProductDetail(productId: number | undefined): void {
    if (productId) {
      this.router.navigate(['/products', productId]);
    }
  }

  // ========== MÉTHODE ADD TO CART ==========
  addToCart(product: Product): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (!product.id) {
      console.error('❌ Produit sans ID');
      return;
    }

    this.cartService.addProductToCartSimple(product.id, 1).subscribe({
      next: (cartItem: CartItem) => {
        console.log('✅ Produit ajouté au panier:', product.nom, cartItem);
        this.showNotification(`${product.nom} a été ajouté au panier!`, 'success');
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de l\'ajout au panier:', error);
        
        if (error.message === 'Utilisateur non connecté') {
          this.showNotification('Veuillez vous reconnecter', 'warning');
          this.router.navigate(['/auth/login']);
        } else {
          this.showNotification('Erreur lors de l\'ajout au panier', 'error');
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

    this.cartService.addProductToCart(product, 1).subscribe({
      next: (cartItem: CartItem) => {
        console.log('✅ Produit ajouté:', cartItem);
        this.showNotification(`${product.nom} ajouté au panier !`, 'success');
      },
      error: (err: any) => {
        console.error('❌ Erreur:', err);
        this.showNotification('Erreur lors de l\'ajout au panier', 'error');
      }
    });
  }

  // ========== FORMATAGE DU PRIX ==========
  formatPrice(price: number | undefined): string {
    if (!price) return '0.00 €';
    return price.toFixed(2) + ' €';
  }

  // ========== GESTION D'ERREUR DE CHARGEMENT D'IMAGE ==========
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.warn(`❌ Erreur de chargement d'image:`, img.src);
    img.src = 'assets/images/default-product.jpg';
  }

  // ========== OBTENIR L'URL DE L'IMAGE AVEC FORMATAGE ==========
  getProductImage(product: Product): string {
    // Si l'image a déjà été formatée, on la retourne directement
    if (product.imageUrl) {
      // Vérifier si c'est déjà une URL complète
      if (product.imageUrl.startsWith('http') || product.imageUrl.startsWith('assets/')) {
        return product.imageUrl;
      }
      // Sinon, on la formate via le service
      return this.productService.getImageUrl(product.imageUrl);
    }
    // Image par défaut
    return 'assets/images/default-product.jpg';
  }

  // ========== MÉTHODE POUR TRACKER LES PRODUITS DANS NG FOR ==========
  trackByProductId(index: number, product: Product): number {
    return product.id || index;
  }

  // ========== MÉTHODE POUR DÉTERMINER SI UN PRODUIT EST EN PROMOTION ==========
  isOnSale(product: Product): boolean {
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

  // ========== MÉTHODE POUR AFFICHER DES NOTIFICATIONS ==========
  private showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const notification = document.createElement('div');
    
    const styles: any = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: 'white',
      zIndex: '9999',
      animation: 'slideIn 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'Inter, sans-serif'
    };
    
    switch (type) {
      case 'success':
        styles.backgroundColor = '#10b981';
        break;
      case 'error':
        styles.backgroundColor = '#dc2626';
        break;
      case 'warning':
        styles.backgroundColor = '#f59e0b';
        break;
    }
    
    Object.keys(styles).forEach(key => {
      (notification.style as any)[key] = styles[key];
    });
    
    let icon = '';
    switch (type) {
      case 'success':
        icon = '✓';
        break;
      case 'error':
        icon = '✗';
        break;
      case 'warning':
        icon = '⚠';
        break;
    }
    
    notification.innerHTML = `
      <span style="font-weight: bold; font-size: 1.2em;">${icon}</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }
}