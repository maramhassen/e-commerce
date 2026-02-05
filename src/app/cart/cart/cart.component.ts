import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { Product } from '../../models/product';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  cart: Cart = {
    id: 0,
    total: 0,
    items: [],
    dateCreation: new Date()
  };
  
  loading = true;
  errorMessage = '';
  userId: number | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAuthAndLoadCart();
  }

  // =============================
  // Authentification et chargement
  // =============================
  private checkAuthAndLoadCart(): void {
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (!isAuthenticated) {
      this.errorMessage = 'Veuillez vous connecter pour voir votre panier';
      this.loading = false;
      return;
    }

    const user = this.authService.getCurrentUser();
    this.userId = user?.id || null;

    if (!this.userId) {
      this.errorMessage = 'Utilisateur non identifié';
      this.loading = false;
      return;
    }

    this.loadCartByUser();
  }

  private loadCartByUser(): void {
    this.loading = true;
    this.cartService.getCartByUser(this.userId!).subscribe({
      next: (data) => {
        this.cart = data;
        // S'assurer que le total est bien calculé
        if (!this.cart.total || this.cart.total === 0) {
          this.cart.total = this.cartService.calculateTotal(this.cart.items);
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement panier:', err);
        
        if (err.status === 404) {
          // Si le panier n'existe pas, créer un panier vide
          this.cart = {
            id: 0,
            total: 0,
            items: [],
            dateCreation: new Date()
          };
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Erreur lors du chargement du panier';
        }
        
        this.loading = false;
      }
    });
  }

  // =============================
  // Gestion des articles
  // =============================
  removeItem(item: CartItem): void {
    if (!item.id) return;

    if (!confirm(`Supprimer "${this.getProductName(item)}" du panier ?`)) return;

    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        this.cart.items = this.cart.items.filter(i => i.id !== item.id);
        this.updateCartTotal();
        this.cartService.notifyCartUpdate();
        alert('Article supprimé du panier');
      },
      error: (err: any) => {
        console.error('Erreur suppression:', err);
        alert('Erreur lors de la suppression de l\'article');
      }
    });
  }

  updateQuantity(item: CartItem, qty: number): void {
    if (qty < 1) {
      this.removeItem(item);
      return;
    }
    
    // Vérifier le stock disponible - CORRECTION ICI
    const productStock = item.product?.stock;
    if (productStock !== undefined && qty > productStock) {
      alert(`Stock insuffisant. Maximum disponible: ${productStock}`);
      qty = productStock;
    }
    
    const updatedItem: CartItem = { 
      ...item, 
      quantite: qty 
    };
    
    if (!updatedItem.id) return;
    
    this.cartService.updateItem(updatedItem.id, updatedItem).subscribe({
      next: (updatedCartItem) => {
        // Mettre à jour l'item avec la réponse du serveur
        const index = this.cart.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.cart.items[index] = updatedCartItem;
        }
        this.updateCartTotal();
        this.cartService.notifyCartUpdate();
      },
      error: (err: any) => {
        console.error('Erreur mise à jour quantité:', err);
        alert('Erreur lors de la mise à jour de la quantité');
      }
    });
  }

  // Méthode pour incrémenter la quantité
  incrementQuantity(item: CartItem): void {
    this.updateQuantity(item, item.quantite + 1);
  }

  // Méthode pour décrémenter la quantité
  decrementQuantity(item: CartItem): void {
    this.updateQuantity(item, item.quantite - 1);
  }

  // Mettre à jour la quantité via input
  updateQuantityInput(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (value && !isNaN(value)) {
      if (value < 1) {
        input.value = '1';
        this.updateQuantity(item, 1);
      } else {
        this.updateQuantity(item, value);
      }
    } else {
      // Si la valeur n'est pas un nombre, réinitialiser
      input.value = item.quantite.toString();
    }
  }

  // =============================
  // Ajout d'articles
  // =============================
  addProductToCart(product: Product, quantity: number): void {
    if (!product.id) return;
    
    this.cartService.addToCart(product.id, quantity)
      .subscribe({
        next: (newItem: CartItem) => {
          // Vérifier si le produit est déjà dans le panier
          const existingItemIndex = this.cart.items.findIndex(item => 
            item.product.id === product.id
          );
          
          if (existingItemIndex !== -1) {
            // Mettre à jour la quantité de l'article existant
            const updatedQuantity = this.cart.items[existingItemIndex].quantite + quantity;
            this.updateQuantity(this.cart.items[existingItemIndex], updatedQuantity);
          } else {
            // Ajouter le nouvel item
            this.cart.items.push(newItem);
            this.updateCartTotal();
            alert(`${quantity} × ${product.nom} ajouté au panier`);
          }
          
          this.cartService.notifyCartUpdate();
        },
        error: (err: any) => {
          console.error('Erreur ajout au panier:', err);
          this.handleCartError(err);
        }
      });
  }

  // =============================
  // Gestion des erreurs
  // =============================
  private handleCartError(err: any): void {
    if (err.status === 401) {
      alert('Session expirée, veuillez vous reconnecter');
    } else if (err.status === 400) {
      alert('Erreur de données, vérifiez la disponibilité du produit');
    } else if (err.status === 404) {
      alert('Produit introuvable');
    } else if (err.status === 409) {
      alert('Quantité non disponible en stock');
    } else {
      alert('Erreur lors de l\'opération sur le panier');
    }
  }

  // =============================
  // Actions sur le panier
  // =============================
  clearCart(): void {
    if (this.isCartEmpty) {
      alert('Votre panier est déjà vide');
      return;
    }
    
    if (!confirm('Voulez-vous vider tout votre panier ?')) return;

    this.loading = true;
    
    // Supprimer chaque item individuellement
    const deletePromises = this.cart.items.map(item => {
      if (item.id) {
        return this.cartService.removeItem(item.id).toPromise();
      }
      return Promise.resolve();
    });
    
    Promise.all(deletePromises)
      .then(() => {
        this.cart.items = [];
        this.updateCartTotal();
        this.cartService.notifyCartUpdate();
        alert('Panier vidé avec succès');
      })
      .catch((err: any) => {
        console.error('Erreur lors du vidage du panier:', err);
        alert('Erreur lors du vidage du panier');
      })
      .finally(() => {
        this.loading = false;
      });
  }

  checkout(): void {
    if (!this.isAuthenticated) {
      alert('Veuillez vous connecter pour passer commande');
      return;
    }

    if (this.isCartEmpty) {
      alert('Votre panier est vide !');
      return;
    }

    // Vérifier le stock avant de passer commande - CORRECTIONS ICI
    const outOfStockItems = this.cart.items.filter(item => 
      item.product?.stock === 0
    );
    
    if (outOfStockItems.length > 0) {
      const productNames = outOfStockItems.map(item => this.getProductName(item)).join(', ');
      alert(`Les produits suivants ne sont plus disponibles: ${productNames}. Veuillez les retirer de votre panier.`);
      return;
    }

    // Vérifier les stocks insuffisants - CORRECTIONS ICI
    const lowStockItems = this.cart.items.filter(item => {
      const productStock = item.product?.stock;
      return productStock !== undefined && productStock < item.quantite;
    });
    
    if (lowStockItems.length > 0) {
      const productNames = lowStockItems.map(item => 
        `${this.getProductName(item)} (stock: ${item.product?.stock}, demandé: ${item.quantite})`
      ).join('\n');
      alert(`Stocks insuffisants pour:\n${productNames}\nVeuillez ajuster les quantités.`);
      return;
    }

    // Ici, redirigez vers la page de commande
    alert('Redirection vers la page de paiement...');
    // Exemple: this.router.navigate(['/checkout']);
  }

  // =============================
  // Calculs et utilitaires
  // =============================
  private updateCartTotal(): void {
    this.cart.total = this.cartService.calculateTotal(this.cart.items);
  }

  getTotalItems(): number {
    return this.cartService.calculateTotalItems(this.cart.items);
  }

  getItemSubtotal(item: CartItem): number {
    return item.quantite * item.prixUnitaire;
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0.00 €';
    return price.toFixed(2).replace('.', ',') + ' €';
  }

  getProductImage(product: Product | null | undefined): string {
    if (!product) return 'assets/images/default-product.jpg';
    
    if (product.imageUrl) return product.imageUrl;
    
    return 'assets/images/default-product.jpg';
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-product.jpg';
  }

  getStockStatus(item: CartItem): { text: string; color: string } {
    const productStock = item.product?.stock;
    
    if (productStock === undefined) {
      return { text: 'Information indisponible', color: 'secondary' };
    }

    if (productStock === 0) {
      return { text: 'Rupture de stock', color: 'danger' };
    }

    if (item.quantite > productStock) {
      return { text: `Stock insuffisant (max: ${productStock})`, color: 'warning' };
    }

    if (productStock <= 5) {
      return { text: `Stock limité (${productStock})`, color: 'warning' };
    }

    return { text: 'En stock', color: 'success' };
  }

  getProductName(item: CartItem): string {
    return item.product?.nom || 'Produit inconnu';
  }

  getProductPrice(item: CartItem): number {
    return item.prixUnitaire || item.product?.prix || 0;
  }

  // Vérifier si un produit a une propriété stock
  hasStockInfo(item: CartItem): boolean {
    return item.product?.stock !== undefined;
  }

  // Obtenir le stock d'un produit (retourne undefined si non disponible)
  getProductStock(item: CartItem): number | undefined {
    return item.product?.stock;
  }

  // =============================
  // Getters pour le template
  // =============================
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isCartEmpty(): boolean {
    return this.cart.items.length === 0;
  }

  get hasOutOfStockItems(): boolean {
    return this.cart.items.some(item => 
      item.product?.stock === 0
    );
  }

  get hasLowStockItems(): boolean {
    return this.cart.items.some(item => {
      const productStock = item.product?.stock;
      return productStock !== undefined && item.quantite > productStock;
    });
  }

  get hasMissingStockInfo(): boolean {
    return this.cart.items.some(item => 
      item.product?.stock === undefined
    );
  }

  get canCheckout(): boolean {
    return this.isAuthenticated && 
           !this.isCartEmpty && 
           !this.hasOutOfStockItems && 
           !this.hasLowStockItems;
  }

  get cartSummary(): string {
    const totalItems = this.getTotalItems();
    if (totalItems === 0) return 'Panier vide';
    
    const itemWord = totalItems > 1 ? 'articles' : 'article';
    return `${totalItems} ${itemWord} - ${this.formatPrice(this.cart.total)}`;
  }

  get cartDate(): string {
    if (!this.cart.dateCreation) return '';
    
    const date = new Date(this.cart.dateCreation);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // =============================
  // Navigation et autres
  // =============================
  continueShopping(): void {
    // Rediriger vers la liste des produits
    // this.router.navigate(['/products']);
    alert('Continuer les achats - Redirection vers la boutique');
  }

  reloadCart(): void {
    if (this.userId) {
      this.loadCartByUser();
    }
  }

  createNewCart(): void {
    if (!this.userId) {
      alert('Vous devez être connecté pour créer un panier');
      return;
    }

    const newCart: Cart = {
      total: 0,
      items: [],
      dateCreation: new Date(),
      user: { id: this.userId } as any
    };

    this.cartService.createCart(newCart).subscribe({
      next: (cart) => {
        this.cart = cart;
        alert('Nouveau panier créé');
      },
      error: (err: any) => {
        console.error('Erreur création panier:', err);
        alert('Erreur lors de la création du panier');
      }
    });
  }

  saveCartForLater(): void {
    // Implémentez cette fonction si nécessaire
    alert('Fonctionnalité "Sauvegarder pour plus tard" à implémenter');
  }

  // =============================
  // Méthodes pour le développement
  // =============================
  debugCart(): void {
    console.log('État du panier:', {
      cartId: this.cart.id,
      total: this.cart.total,
      itemsCount: this.cart.items.length,
      items: this.cart.items,
      userId: this.userId
    });
  }
}