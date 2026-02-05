import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  product: Product | null = null;
  loading = true;
  errorMessage = '';

  // Quantité
  quantity = 1;
  maxQuantity = 10;

  // Auth
  isAuthenticated = false;
  isAdmin = false;
  userId: number | null = null;
  cartId: number = 1;

  // Suggestions
  suggestedProducts: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadProduct();
  }

  // =============================
  // Chargement produit
  // =============================
  private loadProduct(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Produit non trouvé';
      this.loading = false;
      return;
    }

    this.productService.getById(+id).subscribe({
      next: (product) => {
        this.product = product;
        this.maxQuantity = Math.min(product.stock, 10);
        
        // Charger les suggestions basées sur la catégorie
        if (product.category?.id) {
          this.loadSuggestedProducts(product.category.id);
        }
        
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement du produit';
        this.loading = false;
      }
    });
  }

  // =============================
  // Auth
  // =============================
  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isAdmin = this.authService.isAdmin();
    
    if (this.isAuthenticated) {
      const user = this.authService.getCurrentUser();
      this.userId = user?.id || null;
      
      // Pour l'exemple, utilisons l'ID utilisateur comme cartId
      this.cartId = this.userId || 1;
    }
  }

  // =============================
  // Suggestions
  // =============================
  private loadSuggestedProducts(categoryId: number): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.suggestedProducts = products
          .filter(p => 
            p.id !== this.product?.id && 
            p.category?.id === categoryId
          )
          .slice(0, 4);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des suggestions:', err);
      }
    });
  }

  // =============================
  // Utilitaires d'image
  // =============================
  getProductImage(product: Product | null): string {
    if (!product) return 'assets/images/default-product.jpg';
    
    // Utiliser imageUrl si disponible
    if (product.imageUrl) return product.imageUrl;
    
    return 'assets/images/default-product.jpg';
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-product.jpg';
  }

  // =============================
  // Quantité
  // =============================
  increaseQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  updateQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (value && !isNaN(value)) {
      if (value < 1) {
        this.quantity = 1;
      } else if (value > this.maxQuantity) {
        this.quantity = this.maxQuantity;
      } else {
        this.quantity = value;
      }
    }
  }

  // =============================
  // Ajout au panier
  // =============================
  addToCart(): void {
    // Vérification d'authentification
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    // Vérifications produit
    if (!this.product) {
      console.error('Product is null');
      return;
    }

    if (!this.product.id) {
      alert('Produit invalide');
      return;
    }

    if (this.product.stock === 0) {
      alert('Produit en rupture de stock');
      return;
    }

    if (this.quantity > this.product.stock) {
      alert(`Stock insuffisant (max ${this.product.stock})`);
      this.quantity = this.product.stock;
      return;
    }

    // Ajout au panier
    this.addProductToCart();
  }

  private addProductToCart(): void {
    if (!this.product || !this.product.id) return;

    // Appel au service avec les bons paramètres
    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: () => {
        this.handleAddToCartSuccess();
      },
      error: (err: any) => {
        this.handleCartError(err);
      }
    });
  }

  private handleAddToCartSuccess(): void {
    alert(`${this.quantity} × ${this.product?.nom} ajouté au panier ✅`);
    
    // Mise à jour locale du stock
    if (this.product) {
      this.product.stock -= this.quantity;
      this.maxQuantity = Math.min(this.product.stock, 10);
      if (this.quantity > this.maxQuantity) {
        this.quantity = this.maxQuantity;
      }
    }
    
    // Notifier la mise à jour du panier
    this.cartService.notifyCartUpdate();
  }

  // =============================
  // Gestion des erreurs du panier
  // =============================
  private handleCartError(err: any): void {
    console.error('Erreur détaillée:', err);
    
    if (err.status === 401) {
      alert('Session expirée, veuillez vous reconnecter');
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    } else if (err.status === 400) {
      alert('Erreur de données, vérifiez la disponibilité du produit');
    } else if (err.status === 404) {
      alert('Produit introuvable');
    } else {
      alert('Erreur lors de l\'ajout au panier ❌');
    }
  }

  // =============================
  // Actions admin
  // =============================
  editProduct(): void {
    if (!this.product?.id) return;
    this.router.navigate(['/products/edit', this.product.id]);
  }

  deleteProduct(): void {
    if (!this.product?.id) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    this.productService.delete(this.product.id).subscribe({
      next: () => {
        alert('Produit supprimé avec succès');
        this.router.navigate(['/products']);
      },
      error: (err: any) => {
        console.error(err);
        alert('Erreur lors de la suppression du produit');
      }
    });
  }

  // =============================
  // Navigation suggestions
  // =============================
  viewProduct(productId: number | undefined): void {
    if (productId) {
      this.router.navigate(['/products', productId]);
    }
  }

  // =============================
  // Utilitaires
  // =============================
  getStockStatus(): { text: string; color: string } {
    if (!this.product) return { text: '', color: '' };

    if (this.product.stock === 0) {
      return { text: 'Rupture de stock', color: 'danger' };
    }

    if (this.product.stock <= 5) {
      return { text: `Seulement ${this.product.stock} restant(s)`, color: 'warning' };
    }

    return { text: `En stock (${this.product.stock})`, color: 'success' };
  }

  getSubtotal(): number {
    if (!this.product) return 0;
    return this.product.prix * this.quantity;
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0.00 €';
    return price.toFixed(2) + ' €';
  }

  getCategoryName(): string {
    return this.product?.category?.nom || 'Non catégorisé';
  }

  getRating(): number {
    if (!this.product) return 0;
    // À remplacer par la vraie logique de notation si disponible
    return 4.5;
  }

  getRatingStars(): number[] {
    const rating = this.getRating();
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    const stars = Array(fullStars).fill(1);
    if (hasHalfStar) stars.push(0.5);
    
    while (stars.length < 5) {
      stars.push(0);
    }
    
    return stars;
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  // =============================
  // Getters pour le template
  // =============================
  get productImage(): string {
    return this.getProductImage(this.product);
  }

  get isProductActive(): boolean {
    return this.product?.actif === true;
  }

  get productAddedDate(): string {
    if (!this.product?.dateAjout) return 'Date non disponible';
    
    const date = new Date(this.product.dateAjout);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  get isOutOfStock(): boolean {
    return this.product?.stock === 0;
  }

  get isLowStock(): boolean {
    return (this.product?.stock || 0) > 0 && (this.product?.stock || 0) <= 5;
  }
}