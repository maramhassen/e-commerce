import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/core/services/product.service';
import { CartService } from 'src/app/core/services/cart.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Product } from 'src/app/models/product';

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
  cartId: number | null = null;

  // Suggestions
  suggestedProducts: Product[] = [];

  // Image
  productImage = '';

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
        this.productImage = product.imageUrl || 'https://placehold.co/600x400?text=Produit';
        this.maxQuantity = Math.min(product.stock, 10);
        this.loadSuggestedProducts(product.category?.id);
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
      // Récupérer l'ID utilisateur
      const user = this.authService.getCurrentUser();
      this.userId = user?.id || null;
      
      // Pour l'exemple, on suppose que l'ID du panier = ID utilisateur
      // À adapter selon votre logique métier
      this.cartId = this.userId || 1;
    }
  }

  // =============================
  // Suggestions
  // =============================
  private loadSuggestedProducts(categoryId?: number): void {
    if (!categoryId) return;

    this.productService.getByCategory(categoryId).subscribe({
      next: (products) => {
        this.suggestedProducts = products
          .filter(p => p.id !== this.product?.id && p.actif !== false)
          .slice(0, 4);
      }
    });
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
// Ajout au panier - CORRIGÉ
// =============================
addToCart(): void {
  // Vérification d'authentification
  if (!this.isAuthenticated) {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
    return;
  }

  // Vérifications produit - PLUS DÉTAILLÉES
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

  if (this.product.actif === false) {
    alert('Ce produit est désactivé');
    return;
  }

  if (this.quantity > this.product.stock) {
    alert(`Stock insuffisant (max ${this.product.stock})`);
    this.quantity = this.product.stock;
    return;
  }

  // Vérification cartId
  if (!this.cartId) {
    // Si pas de panier, en créer un
    this.createCartAndAddProduct();
    return;
  }

  // CORRECTION : On sait que product n'est pas null grâce aux vérifications ci-dessus
  const productToAdd = this.product;

  // Ajout au panier
  this.cartService.addToCart(productToAdd, this.quantity, this.cartId)
    .subscribe({
      next: (cartItem) => {
        alert(`${this.quantity} × ${productToAdd.nom} ajouté au panier ✅`);
        
        // Mise à jour locale du stock
        productToAdd.stock -= this.quantity;
        this.maxQuantity = Math.min(productToAdd.stock, 10);
        if (this.quantity > this.maxQuantity) {
          this.quantity = this.maxQuantity;
        }
      },
      error: (err) => {
        console.error('Erreur détaillée:', err);
        
        if (err.status === 401) {
          alert('Session expirée, veuillez vous reconnecter');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (err.status === 400) {
          alert('Erreur de données, vérifiez la disponibilité du produit');
        } else if (err.status === 404) {
          alert('Produit ou panier introuvable');
        } else {
          alert('Erreur lors de l\'ajout au panier ❌');
        }
      }
    });
}

  // =============================
  // Création de panier si nécessaire
  // =============================
  private createCartAndAddProduct(): void {
  // Vérifier que product existe
  if (!this.product) {
    alert('Produit non disponible');
    return;
  }

  const productToAdd = this.product;

  this.cartService.createCart({ total: 0, items: [] }).subscribe({
    next: (newCart) => {
      this.cartId = newCart.id!;
      
      // CORRECTION : Utiliser productToAdd au lieu de this.product!
      this.cartService.addToCart(productToAdd, this.quantity, this.cartId)
        .subscribe({
          next: () => {
            alert(`${this.quantity} × ${productToAdd.nom} ajouté au nouveau panier ✅`);
            
            // Mise à jour locale du stock
            productToAdd.stock -= this.quantity;
            this.maxQuantity = Math.min(productToAdd.stock, 10);
          },
          error: (err) => {
            console.error(err);
            alert('Erreur lors de l\'ajout au panier');
          }
        });
    },
    error: (err) => {
      console.error(err);
      alert('Erreur lors de la création du panier');
    }
  });
}

  // =============================
  // Actions admin
  // =============================
  editProduct(): void {
    if (!this.product?.id) return;
    this.router.navigate(['/admin/products/edit', this.product.id]);
  }

  deleteProduct(): void {
    if (!this.product?.id) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    this.productService.delete(this.product.id).subscribe({
      next: () => {
        alert('Produit supprimé avec succès');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la suppression du produit');
      }
    });
  }

  // =============================
  // Navigation suggestions
  // =============================
  viewProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  // =============================
  // Utilitaires
  // =============================
  getStockStatus() {
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

  getRating(): number {
    // Simuler une évaluation pour l'exemple
    if (!this.product) return 0;
    return 4.5; // À remplacer par une vraie évaluation si disponible
  }

  getRatingStars(): number[] {
    const rating = this.getRating();
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    const stars = Array(fullStars).fill(1);
    if (hasHalfStar) stars.push(0.5);
    
    return stars;
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}