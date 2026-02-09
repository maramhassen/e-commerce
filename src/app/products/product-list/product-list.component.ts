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
  
  // Filtres
  selectedCategoryId: number | null = null;
  searchKeyword = '';
  minPrice?: number;
  maxPrice?: number;
  inStockOnly = false;
  
  // Pagination
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
    
    // S'abonner aux changements d'authentification
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

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products];
        this.totalItems = products.length;
        
        // Debug: Afficher les produits avec leurs catégories
        console.log('=== PRODUITS CHARGÉS ===');
        products.forEach((product, index) => {
          console.log(`Produit ${index + 1}:`, {
            id: product.id,
            nom: product.nom,
            category: product.category,
            categoryId: product.category?.id,
            categoryNom: product.category?.nom
          });
        });
        
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('=== CATÉGORIES CHARGÉES ===');
        categories.forEach((cat, index) => {
          console.log(`Catégorie ${index + 1}:`, {
            id: cat.id,
            nom: cat.nom,
            description: cat.description
          });
        });
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
      }
    });
  }

  applyFilters(): void {
    console.log('=== APPLICATION DES FILTRES ===');
    console.log('Catégorie sélectionnée:', this.selectedCategoryId);
    console.log('Recherche:', this.searchKeyword);
    console.log('Prix min:', this.minPrice);
    console.log('Prix max:', this.maxPrice);
    console.log('En stock seulement:', this.inStockOnly);

    let filtered = this.products;

    // Filtre par catégorie - CORRECTION IMPORTANTE
    if (this.selectedCategoryId !== null && this.selectedCategoryId !== undefined) {
      const selectedId = Number(this.selectedCategoryId);
      console.log(`Filtrage par catégorie ID: ${selectedId}`);
      
      filtered = filtered.filter(product => {
        const productCategoryId = product.category?.id;
        
        // Vérifier si le produit a une catégorie avec un ID
        if (productCategoryId !== undefined && productCategoryId !== null) {
          const matches = Number(productCategoryId) === selectedId;
          
          if (matches) {
            console.log(`✓ Produit "${product.nom}" correspond à la catégorie ${selectedId}`);
          }
          
          return matches;
        }
        
        // Si le produit n'a pas de catégorie
        console.log(`✗ Produit "${product.nom}" n'a pas de catégorie`);
        return false;
      });
      
      console.log(`${filtered.length} produits après filtre catégorie`);
    }

    // Filtre par recherche
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      const beforeSearchCount = filtered.length;
      
      filtered = filtered.filter(product =>
        product.nom.toLowerCase().includes(keyword) ||
        (product.description && product.description.toLowerCase().includes(keyword))
      );
      
      console.log(`${beforeSearchCount} → ${filtered.length} produits après recherche "${keyword}"`);
    }

    // Filtre par prix
    if (this.minPrice !== undefined && this.minPrice !== null) {
      const beforePriceFilter = filtered.length;
      filtered = filtered.filter(product => product.prix >= this.minPrice!);
      console.log(`${beforePriceFilter} → ${filtered.length} produits après prix min (${this.minPrice} €)`);
    }
    
    if (this.maxPrice !== undefined && this.maxPrice !== null) {
      const beforePriceFilter = filtered.length;
      filtered = filtered.filter(product => product.prix <= this.maxPrice!);
      console.log(`${beforePriceFilter} → ${filtered.length} produits après prix max (${this.maxPrice} €)`);
    }

    // Filtre par stock
    if (this.inStockOnly) {
      const beforeStockFilter = filtered.length;
      filtered = filtered.filter(product => product.stock > 0);
      console.log(`${beforeStockFilter} → ${filtered.length} produits après filtre "en stock seulement"`);
    }

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
    
    console.log('=== FILTRES APPLIQUÉS ===');
    console.log(`${this.totalItems} produits filtrés sur ${this.products.length} au total`);
  }

  clearFilters(): void {
    console.log('Réinitialisation des filtres');
    this.selectedCategoryId = null;
    this.searchKeyword = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.inStockOnly = false;
    this.applyFilters();
  }

  // Vérifie si un produit est disponible (stock > 0 et actif)
  isProductAvailable(product: Product): boolean {
    return product.stock > 0 && product.actif !== false;
  }

  // Vérifie si l'utilisateur peut voir le bouton "Ajouter au panier"
  canShowAddToCartButton(): boolean {
    // Seuls les clients (non-admins) peuvent voir ce bouton
    return this.isAuthenticated && !this.isAdmin;
  }

  // Dans product-list.component.ts, modifiez la méthode d'ajout :
addToCart(product: Product): void {
  this.cartService.addProductToCartSimple(product.id!, 1).subscribe({
    next: (cartItem) => {
      console.log('✅ Produit ajouté:', cartItem);
      alert(`${product.nom} ajouté au panier !`);
    },
    error: (err) => {
      console.error('❌ Erreur:', err);
      if (err.message === 'Utilisateur non connecté') {
        alert('Veuillez vous connecter pour ajouter au panier');
      } else {
        alert('Erreur lors de l\'ajout au panier');
      }
    }
  });
}
   
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private showNotification(message: string, type: 'success' | 'danger' | 'warning' = 'success'): void {
    // Créer un élément de notification
    const notification = document.createElement('div');
    
    // Styles CSS
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
    
    // Couleur selon le type
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
    
    // Appliquer les styles
    Object.keys(styles).forEach(key => {
      (notification.style as any)[key] = styles[key];
    });
    
    // Icône selon le type
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
    
    // Contenu
    notification.innerHTML = `
      <span style="font-weight: bold; font-size: 1.2em;">${icon}</span>
      <span>${message}</span>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
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

  // Méthode de débogage
  debugFilters(): void {
    console.log('=== DÉBOGAGE DES FILTRES ===');
    console.log('Catégories disponibles:', this.categories);
    console.log('Produits:', this.products.length);
    console.log('Filtres actuels:', {
      selectedCategoryId: this.selectedCategoryId,
      searchKeyword: this.searchKeyword,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      inStockOnly: this.inStockOnly
    });
    this.applyFilters();
  }
  // Ajoutez cette méthode dans la classe ProductListComponent
getCategoryName(categoryId: number | null): string {
  if (!categoryId) return 'Aucune';
  
  const category = this.categories.find(c => c.id === categoryId);
  return category ? category.nom : 'Catégorie inconnue';
}
}