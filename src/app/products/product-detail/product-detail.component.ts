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

  // =============================
  // Ajout au panier (COMPATIBLE SERVICE)
  // =============================
  addToCart(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (!this.product) return;

    if (this.product.stock === 0) {
      alert('Produit en rupture de stock');
      return;
    }

    if (this.quantity > this.product.stock) {
      alert(`Stock insuffisant (max ${this.product.stock})`);
      this.quantity = this.product.stock;
      return;
    }

    this.cartService.addToCart(this.product!.id!, this.quantity)
  .subscribe({
    next: (res) => {
      // Si ton service retourne l'objet ajouté, tu peux considérer que c'est un succès
      alert(`${this.quantity} × ${this.product!.nom} ajouté au panier ✅`);
    },
    error: (err) => {
      console.error(err);
      alert('Erreur lors de l’ajout au panier ❌');
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

    if (!confirm('Voulez-vous supprimer ce produit ?')) return;

    this.productService.delete(this.product.id).subscribe({
      next: () => {
        alert('Produit supprimé');
        this.router.navigate(['/products']);
      },
      error: () => alert('Erreur suppression')
    });
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

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
