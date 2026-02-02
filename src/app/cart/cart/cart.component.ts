import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';

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
      error: (err) => console.error(err)
    });
  }

  removeItem(item: CartItem) {
    if (!item.id) return;

    this.cartService.removeItem(item.id).subscribe(() => {
      this.cart.items = this.cart.items.filter(i => i.id !== item.id);
      this.calculateTotal();
    });
  }

  updateQuantity(item: CartItem, qty: number) {
    if (qty < 1) return;
    item.quantite = qty;

    if (!item.id) return;
    this.cartService.updateItem(item.id, item).subscribe(() => {
      this.calculateTotal();
    });
  }

  calculateTotal() {
    this.cart.total = this.cart.items.reduce(
      (sum, item) => sum + item.quantite * item.prixUnitaire,
      0
    );
  }
}
