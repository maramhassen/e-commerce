import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { Product } from '../../models/product';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  cart!: Cart;
  cartId = 1; // à remplacer par l'id réel de l'utilisateur connecté

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart(this.cartId).subscribe({
      next: (data) => {
        this.cart = data;
        this.calculateTotal();
      },
      error: (err) => console.error('Erreur chargement panier:', err)
    });
  }

  removeItem(item: CartItem) {
    if (!item.id) return;

    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        this.cart.items = this.cart.items.filter(i => i.id !== item.id);
        this.calculateTotal();
      },
      error: (err) => console.error('Erreur suppression:', err)
    });
  }

  updateQuantity(item: CartItem, qty: number) {
    if (qty < 1) return;
    
    const updatedItem = { ...item, quantite: qty };
    
    if (!updatedItem.id) return;
    
    this.cartService.updateItem(updatedItem.id, updatedItem).subscribe({
      next: () => {
        item.quantite = qty; // Mettre à jour localement
        this.calculateTotal();
      },
      error: (err) => console.error('Erreur mise à jour quantité:', err)
    });
  }

  // Méthode pour incrémenter la quantité
  incrementQuantity(item: CartItem) {
    this.updateQuantity(item, item.quantite + 1);
  }

  // Méthode pour décrémenter la quantité
  decrementQuantity(item: CartItem) {
    if (item.quantite > 1) {
      this.updateQuantity(item, item.quantite - 1);
    }
  }

  calculateTotal() {
    this.cart.total = this.cart.items.reduce(
      (sum, item) => sum + (item.quantite * (item.prixUnitaire || 0)),
      0
    );
  }

  // CORRECTION: Cette méthode doit correspondre à votre service
  addProductToCart(product: Product, quantity: number) {
    this.cartService.addToCart(product, quantity, this.cartId)
      .subscribe({
        next: (newItem) => {
          // Vérifier si le produit est déjà dans le panier
          const existingItem = this.cart.items.find(item => 
            item.product.id === product.id
          );
          
          if (existingItem) {
            // Mettre à jour la quantité
            existingItem.quantite += quantity;
            this.updateQuantity(existingItem, existingItem.quantite);
          } else {
            // Ajouter le nouvel item
            this.cart.items.push(newItem);
          }
          
          this.calculateTotal();
        },
        error: (err) => console.error('Erreur ajout au panier:', err)
      });
  }

  // Version simplifiée avec seulement les IDs
  addProductById(productId: number, quantity: number) {
    this.cartService.addToCartSimple(productId, quantity, this.cartId)
      .subscribe({
        next: (newItem) => {
          // Recharger le panier complet pour avoir les données à jour
          this.loadCart();
        },
        error: (err) => console.error('Erreur ajout au panier:', err)
      });
  }

  // Vider tout le panier
  clearCart() {
    if (confirm('Voulez-vous vider tout votre panier ?')) {
      this.cart.items.forEach(item => {
        if (item.id) {
          this.cartService.removeItem(item.id).subscribe();
        }
      });
      
      this.cart.items = [];
      this.calculateTotal();
    }
  }

  // Passer commande
  checkout() {
    if (this.cart.items.length === 0) {
      alert('Votre panier est vide !');
      return;
    }

    // Ici, vous pouvez rediriger vers la page de commande
    // ou appeler un service pour créer une commande
    alert('Fonctionnalité de commande à implémenter');
  }

  // Obtenir le nombre total d'articles dans le panier
  getTotalItems(): number {
    return this.cart.items.reduce((total, item) => total + item.quantite, 0);
  }
}