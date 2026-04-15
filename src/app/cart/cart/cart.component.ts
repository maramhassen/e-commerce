// src/app/components/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

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
  
  private isLoadingCart = false;
  private cartSubscription!: Subscription;
  
  // FLAG POUR ÉVITER LE RECHARGEMENT INUTILE
  private skipNextReload = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('🛒 CartComponent initialisé');
  }

  ngOnInit(): void {
    console.log('🔄 CartComponent ngOnInit');
    this.checkAuthAndLoadCart();
    
    this.cartSubscription = this.cartService.cartUpdated$
      .pipe(debounceTime(300))
      .subscribe(() => {
        // Ne pas recharger si on a demandé de skipper
        if (this.skipNextReload) {
          console.log('⏭️ Rechargement ignoré (modification locale)');
          this.skipNextReload = false;
          return;
        }
        console.log('🔔 Notification reçue: rechargement du panier');
        this.loadCartByUser();
      });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  // =============================
  // Authentification et chargement
  // =============================
  private checkAuthAndLoadCart(): void {
    console.log('🔍 Vérification authentification...');
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (!isAuthenticated) {
      console.log('❌ Utilisateur non connecté');
      this.errorMessage = 'Veuillez vous connecter pour voir votre panier';
      this.loading = false;
      return;
    }

    const user = this.authService.getCurrentUser();
    console.log('✅ Utilisateur connecté:', user);
    this.userId = user?.id || null;

    if (!this.userId) {
      console.error('❌ ID utilisateur manquant');
      this.errorMessage = 'Utilisateur non identifié';
      this.loading = false;
      return;
    }

    this.loadCartByUser();
  }

  private loadCartByUser(): void {
    if (this.isLoadingCart) {
      console.log('⏳ Chargement déjà en cours, ignoré');
      return;
    }
    
    console.log('🔄 Chargement panier pour userId:', this.userId);
    this.loading = true;
    this.errorMessage = '';
    this.isLoadingCart = true;
    
    this.cartService.getOrCreateCart().subscribe({
      next: (data: Cart) => {
        console.log('✅ Panier chargé avec succès:', data);
        console.log('📊 Nombre d\'articles:', data.items?.length);
        
        this.cart = data;
        
        // Recalculer le total localement pour être sûr
        if (this.cart.items) {
          this.cart.total = this.cart.items.reduce(
            (sum, item) => sum + (item.quantite * item.prixUnitaire), 
            0
          );
        }
        
        this.loading = false;
        this.isLoadingCart = false;
        console.log('📦 Panier final:', this.cart);
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement panier:', err);
        
        if (err.status === 404) {
          console.log('📦 Panier non trouvé, création panier vide');
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
  // Gestion des articles - VERSION CORRIGÉE
  // =============================
  removeItem(item: CartItem): void {
    if (!item.id) {
      console.error('❌ Item ID manquant pour suppression');
      return;
    }

    if (!confirm(`Supprimer "${this.getProductName(item)}" du panier ?`)) return;

    console.log('🗑️ Suppression item ID:', item.id);
    
    // Sauvegarder l'état avant suppression (pour restauration si erreur)
    const originalItems = [...this.cart.items];
    const originalTotal = this.cart.total;
    
    // Mise à jour OPTIMISTE (immédiate)
    this.cart.items = this.cart.items.filter(i => i.id !== item.id);
    this.cart.total = this.cart.items.reduce(
      (sum, i) => sum + (i.quantite * i.prixUnitaire), 
      0
    );
    
    // Dire de ne PAS recharger après cette opération
    this.skipNextReload = true;
    
    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        console.log('✅ Item supprimé avec succès (confirmé par serveur)');
        // Notifier les autres composants (navbar) sans recharger la page
        this.cartService.notifyCartUpdate();
        alert('✅ Article supprimé du panier');
      },
      error: (err: any) => {
        console.error('❌ Erreur suppression, restauration...', err);
        
        // Restaurer l'état précédent
        this.cart.items = originalItems;
        this.cart.total = originalTotal;
        
        // Réactiver le rechargement
        this.skipNextReload = false;
        
        alert('❌ Erreur lors de la suppression: ' + err.message);
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
      console.log('📝 Quantité invalide, suppression item');
      this.removeItem(item);
      return;
    }
    
    const productStock = item.product?.stock;
    if (productStock !== undefined && quantity > productStock) {
      alert(`⚠️ Stock insuffisant. Maximum disponible: ${productStock}`);
      quantity = productStock;
    }
    
    // Sauvegarder l'ancienne quantité pour restauration
    const oldQuantity = item.quantite;
    
    // Mise à jour optimiste
    item.quantite = quantity;
    this.cart.total = this.cart.items.reduce(
      (sum, i) => sum + (i.quantite * i.prixUnitaire), 
      0
    );
    
    // Dire de ne PAS recharger
    this.skipNextReload = true;
    
    const updatedItem: CartItem = { ...item, quantite: quantity };
    
    this.cartService.updateItem(updatedItem.id!, updatedItem).subscribe({
      next: (updatedCartItem: CartItem) => {
        console.log('✅ Quantité mise à jour (confirmé)');
        const index = this.cart.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.cart.items[index] = updatedCartItem;
        }
        this.cart.total = this.cart.items.reduce(
          (sum, i) => sum + (i.quantite * i.prixUnitaire), 
          0
        );
        this.cartService.notifyCartUpdate();
      },
      error: (err: any) => {
        console.error('❌ Erreur mise à jour, restauration...', err);
        
        // Restaurer l'ancienne quantité
        item.quantite = oldQuantity;
        this.cart.total = this.cart.items.reduce(
          (sum, i) => sum + (i.quantite * i.prixUnitaire), 
          0
        );
        this.skipNextReload = false;
        
        alert('Erreur lors de la mise à jour: ' + err.message);
      }
    });
  }

  // =============================
  // VIDER LE PANIER - VERSION CORRIGÉE
  // =============================
  clearCart(): void {
    if (this.isCartEmpty) {
      alert('Votre panier est déjà vide');
      return;
    }
    
    if (!confirm('Voulez-vous vider tout votre panier ?')) return;

    console.log('🧹 Vidage du panier...');
    
    // Sauvegarder l'état
    const oldItems = [...this.cart.items];
    const oldTotal = this.cart.total;
    
    // Mise à jour optimiste
    this.cart.items = [];
    this.cart.total = 0;
    this.loading = true;
    this.skipNextReload = true;
    
    // Supprimer chaque item un par un
    const deletePromises = oldItems.map(item => {
      if (item.id) {
        return this.cartService.removeItem(item.id).toPromise();
      }
      return Promise.resolve();
    });
    
    Promise.all(deletePromises)
      .then(() => {
        console.log('✅ Panier vidé avec succès');
        this.cartService.notifyCartUpdate();
        alert('Panier vidé avec succès');
        this.loading = false;
      })
      .catch((err: any) => {
        console.error('❌ Erreur vidage, restauration...', err);
        
        // Restaurer
        this.cart.items = oldItems;
        this.cart.total = oldTotal;
        this.skipNextReload = false;
        this.loading = false;
        
        alert('Erreur lors du vidage: ' + err.message);
      });
  }

  // =============================
  // CHECKOUT - Création de commande
  // =============================
  checkout(): void {
    console.log('🛒 Passage à la commande...');
    
    if (!this.userId || this.isCartEmpty) {
      alert('Impossible de passer commande');
      return;
    }

    if (!confirm(`Confirmer la commande de ${this.formatPrice(this.cart.total)} ?`)) {
      return;
    }

    this.loading = true;
    
    this.orderService.createOrderFromCart(this.userId).subscribe({
      next: (order) => {
        alert(`✅ Commande #${order.id} créée !`);
        this.loading = false;
        this.cartService.notifyCartUpdate();
        this.router.navigate(['/orders', order.id]);
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        alert('❌ Erreur lors de la création');
        this.loading = false;
      }
    });
  }

  // =============================
  // Calculs et utilitaires
  // =============================
  getProductName(item: CartItem): string {
    return item.product?.nom || 'Produit inconnu';
  }

  getProductImage(item: CartItem): string {
    if (!item.product?.imageUrl) {
      return 'assets/images/default-product.jpg';
    }

    const imageUrl = item.product.imageUrl;
    const baseUrl = environment.apiUrl.replace('/api', '');
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return `${baseUrl}/api/products/images/${imageUrl}`;
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return '0,00 DT';
    return price.toFixed(2).replace('.', ',') + ' DT';
  }

  // =============================
  // Getters
  // =============================
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isCartEmpty(): boolean {
    return !this.cart.items || this.cart.items.length === 0;
  }

  getTotalItems(): number {
    return this.cart.items.reduce((sum, item) => sum + item.quantite, 0);
  }

  trackByItemId(index: number, item: CartItem): number {
    return item.id || index;
  }

  // =============================
  // Navigation
  // =============================
  continueShopping(): void {
    console.log('🛍️ Continuer les achats');
    this.router.navigate(['/products']);
  }

  reloadCart(): void {
    console.log('🔄 Rechargement manuel panier...');
    if (this.userId) {
      this.loadCartByUser();
    }
  }

  // =============================
  // Débogage
  // =============================
  debugCart(): void {
    console.log('\n=== DEBUG PANIER ===');
    console.log('État du panier:', {
      cartId: this.cart.id,
      total: this.cart.total,
      itemsCount: this.cart.items.length,
      items: this.cart.items.map(i => ({
        id: i.id,
        product: i.product?.nom,
        quantite: i.quantite,
        prix: i.prixUnitaire,
        total: i.quantite * i.prixUnitaire,
        image: i.product?.imageUrl
      })),
      userId: this.userId,
      isAuthenticated: this.isAuthenticated,
      skipNextReload: this.skipNextReload
    });
    console.log('=== FIN DEBUG ===\n');
  }
}