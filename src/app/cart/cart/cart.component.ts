import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Cart } from 'src/app/models/cart';

@Component({
  selector: 'app-cart',
  template: `
    <h2>Cart</h2>
    <div *ngFor="let item of cart?.items">
      {{ item.product.name }} x {{ item.quantity }}
    </div>
    <strong>Total: {{ cart?.totalPrice}} DT</strong>
  `
})
export class CartComponent implements OnInit {
  cart!: Cart;

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.cartService.getById(1).subscribe(data => this.cart = data);
  }
}
