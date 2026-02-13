// src/app/components/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { Product } from '../../models/product';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';  // ← AJOUTER CET IMPORT

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {

  cart: Cart = {
    id: 0,
    total: 0,
    items: [],
    dateCreation: new Date()
  };
  
  loading = true;
  errorMessage = '';
  userId: number | null = null;
  
  // AJOUT: Flag pour éviter les chargements multiples
  private isLoadingCart = false;
  private cartSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService
  ) {
    console.log('CartComponent initialisé');
  }

  ngOnInit(): void {
    console.log('CartComponent ngOnInit');
    this.checkAuthAndLoadCart();
    
    // SOLUTION: AJOUT DE debounceTime POUR ÉVITER LES DOUBLES CHARGEMENTS
    this.cartSubscription = this.cartService.cartUpdated$
      .pipe(debounceTime(300)) // Attend 300ms avant de recharger
      .subscribe(() => {
        console.log('🔔 Notification reçue: panier mis à jour (après debounce)');
        this.loadCartByUser();
      });
  }

  // =============================
  // Authentification et chargement
  // =============================
  private checkAuthAndLoadCart(): void {
    console.log('Vérification authentification...');
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (!isAuthenticated) {
      console.log('Utilisateur non connecté');
      this.errorMessage = 'Veuillez vous connecter pour voir votre panier';
      this.loading = false;
      return;
    }

    const user = this.authService.getCurrentUser();
    console.log('Utilisateur connecté:', user);
    this.userId = user?.id || null;

    if (!this.userId) {
      console.error('ID utilisateur manquant');
      this.errorMessage = 'Utilisateur non identifié';
      this.loading = false;
      return;
    }

    this.loadCartByUser();
  }

  private loadCartByUser(): void {
    // AJOUT: ÉVITER LES CHARGEMENTS MULTIPLES SIMULTANÉS
    if (this.isLoadingCart) {
      console.log('⏳ Chargement déjà en cours, ignoré');
      return;
    }
    
    console.log('🔄 Chargement panier pour userId:', this.userId);
    this.loading = true;
    this.errorMessage = '';
    this.isLoadingCart = true;
    
    this.cartService.getOrCreateCart().subscribe({
      next: (data: Cart) => {  // AJOUT DU TYPE
        console.log('✅ Panier chargé avec succès:', data);
        console.log('📊 NOMBRE D\'ITEMS:', data.items?.length);
        
        // VÉRIFICATION DES DOUBLONS
        if (data.items) {
          const uniqueIds = new Set(data.items.map(item => item.id));
          if (uniqueIds.size !== data.items.length) {
            console.warn('⚠️ DOUBLONS DÉTECTÉS!', data.items);
          }
        }
        
        this.cart = data;
        
        if (!this.cart.total || this.cart.total === 0) {
          this.cart.total = this.cartService.calculateTotal(this.cart.items);
        }
        
        this.loading = false;
        this.isLoadingCart = false;
        console.log('Panier final:', this.cart);
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement panier:', err);
        
        if (err.status === 404) {
          console.log('Panier non trouvé, création panier vide');
          this.cart = {
            id: 0,
            total: 0,
            items: [],
            dateCreation: new Date()
          };
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Erreur lors du chargement du panier: ' + err.message;
        }
        
        this.loading = false;
        this.isLoadingCart = false;
      }
    });
  }

  // =============================
  // Gestion des articles
  // =============================
  removeItem(item: CartItem): void {
    if (!item.id) {
      console.error('Item ID manquant pour suppression');
      return;
    }

    if (!confirm(`Supprimer "${this.getProductName(item)}" du panier ?`)) return;

    console.log('🗑️ Suppression item ID:', item.id);
    
    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        console.log('✅ Item supprimé avec succès');
        this.cart.items = this.cart.items.filter(i => i.id !== item.id);
        this.updateCartTotal();
        this.cartService.notifyCartUpdate();
        alert('Article supprimé du panier');
      },
      error: (err: any) => {
        console.error('❌ Erreur suppression:', err);
        alert('Erreur lors de la suppression de l\'article: ' + err.message);
      }
    });
  }

  updateQuantity(item: CartItem, qty: string | number): void {
    let quantity: number;
    
    if (typeof qty === 'string') {
      quantity = parseInt(qty, 10);
    } else {
      quantity = qty;
    }
    
    console.log('📝 Mise à jour quantité - Item:', item.id, 'Nouvelle quantité:', quantity);
    
    if (isNaN(quantity) || quantity < 1) {
      console.log('Quantité invalide, suppression item');
      this.removeItem(item);
      return;
    }
    
    const productStock = item.product?.stock;
    if (productStock !== undefined && quantity > productStock) {
      alert(`Stock insuffisant. Maximum disponible: ${productStock}`);
      quantity = productStock;
    }
    
    const updatedItem: CartItem = { 
      ...item, 
      quantite: quantity 
    };
    
    if (!updatedItem.id) {
      console.error('Item ID manquant pour mise à jour');
      return;
    }
    
    this.cartService.updateItem(updatedItem.id, updatedItem).subscribe({
      next: (updatedCartItem: CartItem) => {  // AJOUT DU TYPE
        console.log('✅ Quantité mise à jour:', updatedCartItem);
        const index = this.cart.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.cart.items[index] = updatedCartItem;
        }
        this.updateCartTotal();
        this.cartService.notifyCartUpdate();
      },
      error: (err: any) => {
        console.error('❌ Erreur mise à jour quantité:', err);
        alert('Erreur lors de la mise à jour de la quantité: ' + err.message);
      }
    });
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

    console.log('🧹 Vidage du panier...');
    this.loading = true;
    
    const deletePromises = this.cart.items.map(item => {
      if (item.id) {
        return this.cartService.removeItem(item.id).toPromise();
      }
      return Promise.resolve();
    });
    
    Promise.all(deletePromises)
      .then(() => {
        console.log('✅ Panier vidé avec succès');
        this.cart.items = [];
        this.updateCartTotal();
        this.cartService.notifyCartUpdate();
        alert('Panier vidé avec succès');
      })
      .catch((err: any) => {
        console.error('❌ Erreur lors du vidage du panier:', err);
        alert('Erreur lors du vidage du panier: ' + err.message);
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

    console.log('Passage à la commande...');
    alert('Redirection vers la page de paiement...');
  }

  // =============================
  // Calculs et utilitaires
  // =============================
  private updateCartTotal(): void {
    this.cart.total = this.cartService.calculateTotal(this.cart.items);
    console.log('💰 Total panier mis à jour:', this.cart.total);
  }

  getProductName(item: CartItem): string {
    return item.product?.nom || 'Produit inconnu';
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0.00 DT';
    return price.toFixed(2).replace('.', ',') + ' DT';
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

  getTotalItems(): number {
    return this.cartService.calculateTotalItems(this.cart.items);
  }

  // AJOUT: trackBy pour optimiser le rendu
  trackByItemId(index: number, item: CartItem): number {
    return item.id || index;
  }

  // =============================
  // Navigation et autres
  // =============================
  continueShopping(): void {
    console.log('Continuer les achats');
    alert('Continuer les achats - Redirection vers la boutique');
  }

  reloadCart(): void {
    console.log('🔄 Rechargement manuel panier...');
    if (this.userId) {
      this.loadCartByUser();
    }
  }

  // =============================
  // Méthodes pour le développement
  // =============================
  debugCart(): void {
    console.log('=== DEBUG PANIER ===');
    console.log('État du panier:', {
      cartId: this.cart.id,
      total: this.cart.total,
      itemsCount: this.cart.items.length,
      items: this.cart.items,
      userId: this.userId
    });
    console.log('Utilisateur actuel:', this.authService.getCurrentUser());
    console.log('Authentifié:', this.authService.isAuthenticated());
    console.log('=== FIN DEBUG ===');
  }

  testAddProduct(): void {
    const testProduct: Product = {
      id: 1,
      nom: 'Produit test',
      description: 'Description test',
      prix: 100,
      stock: 10,
      actif: true
    };
    
    this.cartService.addProductToCart(testProduct, 2).subscribe({
      next: (item: CartItem) => {  // AJOUT DU TYPE
        console.log('Test réussi:', item);
        alert('Produit test ajouté!');
      },
      error: (error: any) => {  // AJOUT DU TYPE
        console.error('Test échoué:', error);
        alert('Erreur test: ' + error.message);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}