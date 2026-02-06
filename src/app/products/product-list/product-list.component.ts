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
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
      }
    });
  }

  applyFilters(): void {
    let filtered = this.products;

    // Filtre par catégorie
    if (this.selectedCategoryId) {
      filtered = filtered.filter(product => 
        product.category?.id === this.selectedCategoryId
      );
    }

    // Filtre par recherche
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(product =>
        product.nom.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword)
      );
    }

    // Filtre par prix
    if (this.minPrice) {
      filtered = filtered.filter(product => product.prix >= this.minPrice!);
    }
    if (this.maxPrice) {
      filtered = filtered.filter(product => product.prix <= this.maxPrice!);
    }

    // Filtre par stock
    if (this.inStockOnly) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.selectedCategoryId = null;
    this.searchKeyword = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.inStockOnly = false;
    this.applyFilters();
  }

  addToCart(product: Product): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (product.stock > 0) {
      // Implémentez votre logique d'ajout au panier ici
      console.log('Ajouter au panier:', product);
      alert(`${product.nom} ajouté au panier!`);
    } else {
      alert('Produit en rupture de stock');
    }
  }

  deleteProduct(id: number): void {
    if (!this.isAdmin) {
      alert('Vous n\'avez pas les permissions nécessaires');
      return;
    }

    if (confirm('Supprimer ce produit ?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== id);
          this.filteredProducts = this.filteredProducts.filter(p => p.id !== id);
          this.totalItems--;
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          alert('Erreur lors de la suppression');
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
    }
  }

  getPageNumbers(): number[] {
    const maxVisiblePages = 5;
    const pages = [];
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Navigation
  goToProductDetail(id: number): void {
    this.router.navigate(['/products', id]);
  }

  goToEditProduct(id: number): void {
  if (!this.isAdmin) {
    alert('Accès réservé aux administrateurs');
    return;
  }
  
  // Navigation vers l'édition
  this.router.navigate(['/admin/products/edit', id]);
}

  // Méthode pour naviguer vers le formulaire d'ajout
goToAddProduct(): void {
  if (!this.isAdmin) {
    alert('Accès réservé aux administrateurs');
    return;
  }
  
  // Option 1: Utilisez routerLink dans le template
  this.router.navigate(['/admin/products/new']);
  
  // Option 2: Si vous voulez ajouter des paramètres
  // this.router.navigate(['/admin/products/new'], {
  //   queryParams: { mode: 'create' }
  // });
}

// Si vous avez un bouton d'édition, assurez-vous qu'il fonctionne aussi :

}