import { Component, OnInit } from '@angular/core';
import { Product } from 'src/app/models/product';
import { Category } from 'src/app/models/category';
import { ProductService } from 'src/app/core/services/product.service';
import { CategoryService } from 'src/app/core/services/category.service';
import { Router } from '@angular/router';
import { CartService } from 'src/app/core/services/cart.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  filteredProducts: Product[] = [];
  
  selectedCategoryId: number | null = null;
  searchKeyword = '';
  minPrice?: number;
  maxPrice?: number;
  inStockOnly = false;
  
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  
  loading = true;
  errorMessage = '';
  isAdmin = false;
  isAuthenticated = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.checkAuthStatus();
    
    if (this.authService.onAuthStateChange) {
      this.authService.onAuthStateChange().subscribe(() => {
        this.checkAuthStatus();
      });
    }
  }

  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isAdmin = this.authService.isAdmin();
  }

  // ========== CHARGEMENT DES PRODUITS ==========
  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.productService.getAll().subscribe({
      next: (products) => {
        // S'assurer que toutes les URLs d'images sont formatées
        this.products = products.map(product => {
          // Debug: Afficher l'état du produit
          console.log(`📊 Produit "${product.nom}":`, {
            id: product.id,
            imageUrl: product.imageUrl,
            categoryId: product.categoryId,
            category: product.category,
            hasCategory: !!product.category
          });
          
          // S'assurer que l'image a une URL complète
          if (product.imageUrl) {
            product.imageUrl = this.getProductImageUrl(product);
          }
          
          return product;
        });
        
        this.filteredProducts = [...this.products];
        this.totalItems = products.length;
        
        console.log('✅ PRODUITS CHARGÉS:', {
          total: this.products.length,
          avecImages: this.products.filter(p => p.imageUrl && p.imageUrl !== 'assets/images/default-product.jpg').length,
          avecCatégories: this.products.filter(p => p.category).length
        });
        
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement produits:', err);
        this.errorMessage = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  // ========== MÉTHODE POUR OBTENIR L'URL DE L'IMAGE ==========
  getProductImageUrl(product: Product): string {
    return this.productService.getImageUrl(product.imageUrl);
  }

  // ========== GESTION ERREUR IMAGE ==========
  onImageError(event: Event, product: Product): void {
    const img = event.target as HTMLImageElement;
    console.warn(`❌ Image non chargée pour "${product.nom}":`, img.src);
    img.src = 'assets/images/default-product.jpg';
    product.imageUrl = 'assets/images/default-product.jpg';
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('✅ CATÉGORIES CHARGÉES:', categories.length);
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
      }
    });
  }

  applyFilters(): void {
    console.log('🔍 Application des filtres');
    
    let filtered = this.products;

    // Filtre par catégorie
    if (this.selectedCategoryId !== null && this.selectedCategoryId !== undefined) {
      const selectedId = Number(this.selectedCategoryId);
      filtered = filtered.filter(product => {
        const productCategoryId = product.category?.id || product.categoryId;
        return productCategoryId !== undefined && Number(productCategoryId) === selectedId;
      });
    }

    // Filtre par recherche
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(product =>
        product.nom.toLowerCase().includes(keyword) ||
        (product.description && product.description.toLowerCase().includes(keyword))
      );
    }

    // Filtre par prix
    if (this.minPrice !== undefined && this.minPrice !== null) {
      filtered = filtered.filter(product => product.prix >= this.minPrice!);
    }
    
    if (this.maxPrice !== undefined && this.maxPrice !== null) {
      filtered = filtered.filter(product => product.prix <= this.maxPrice!);
    }

    // Filtre par stock
    if (this.inStockOnly) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
    
    console.log('✅ FILTRES APPLIQUÉS:', {
      totalFiltrés: this.totalItems,
      totalOriginal: this.products.length
    });
  }

  clearFilters(): void {
    console.log('🔄 Réinitialisation des filtres');
    this.selectedCategoryId = null;
    this.searchKeyword = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.inStockOnly = false;
    this.applyFilters();
  }

  isProductAvailable(product: Product): boolean {
    return product.stock > 0 && product.actif !== false;
  }

  canShowAddToCartButton(): boolean {
    return this.isAuthenticated && !this.isAdmin;
  }

  addToCart(product: Product): void {
    this.cartService.addProductToCartSimple(product.id!, 1).subscribe({
      next: (cartItem) => {
        console.log('✅ Produit ajouté:', cartItem);
        this.showNotification(`${product.nom} ajouté au panier !`, 'success');
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        if (err.message === 'Utilisateur non connecté') {
          this.showNotification('Veuillez vous connecter pour ajouter au panier', 'warning');
        } else {
          this.showNotification('Erreur lors de l\'ajout au panier', 'danger');
        }
      }
    });
  }
   
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private showNotification(message: string, type: 'success' | 'danger' | 'warning' = 'success'): void {
    const notification = document.createElement('div');
    
    const styles: any = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '5px',
      color: 'white',
      zIndex: '9999',
      animation: 'slideIn 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    };
    
    switch (type) {
      case 'success':
        styles.backgroundColor = '#28a745';
        break;
      case 'danger':
        styles.backgroundColor = '#dc3545';
        break;
      case 'warning':
        styles.backgroundColor = '#ffc107';
        styles.color = '#212529';
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
      case 'danger':
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

  deleteProduct(id: number): void {
    if (!this.isAdmin) {
      this.showNotification('Vous n\'avez pas les permissions nécessaires', 'warning');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== id);
          this.filteredProducts = this.filteredProducts.filter(p => p.id !== id);
          this.totalItems = this.filteredProducts.length;
          this.showNotification('Produit supprimé avec succès', 'success');
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.showNotification('Erreur lors de la suppression du produit', 'danger');
        }
      });
    }
  }

  getPaginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const maxVisiblePages = 5;
    const pages: number[] = [];
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  goToProductDetail(id: number): void {
    this.router.navigate(['/products', id]);
  }

  goToEditProduct(id: number): void {
    if (!this.isAdmin) {
      this.showNotification('Accès réservé aux administrateurs', 'warning');
      return;
    }
    
    this.router.navigate(['/admin/products/edit', id]);
  }

  goToAddProduct(): void {
    if (!this.isAdmin) {
      this.showNotification('Accès réservé aux administrateurs', 'warning');
      return;
    }
    
    this.router.navigate(['/admin/products/new']);
  }

  getStockStatus(product: Product): { text: string, color: string } {
    if (product.stock <= 0) {
      return { text: 'Rupture de stock', color: '#dc3545' };
    } else if (product.stock <= 5) {
      return { text: `Plus que ${product.stock} en stock`, color: '#ffc107' };
    } else {
      return { text: `${product.stock} en stock`, color: '#28a745' };
    }
  }

  // ========== RAFFRAÎCHISSEMENT DES PRODUITS ==========
  refreshProducts(): void {
    console.log('🔄 Rafraîchissement manuel des produits');
    this.loadProducts();
  }

  // ========== RETOUR DU FORMULAIRE ==========
  handleFormReturn(): void {
    this.router.navigate(['/products']).then(() => {
      setTimeout(() => {
        this.refreshProducts();
      }, 300);
    });
  }

  getCategoryName(categoryId: number | null): string {
    if (!categoryId) return 'Aucune';
    
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.nom : 'Catégorie inconnue';
  }

  // ========== FORCER LE RECHARGEMENT ==========
  forceReload(): void {
    console.log('🔄 Forcer le rechargement complet');
    this.products = [];
    this.filteredProducts = [];
    this.loadProducts();
  }
}