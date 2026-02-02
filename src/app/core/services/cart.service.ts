import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartUrl = 'http://localhost:8080/api/carts';
  private cartItemUrl = 'http://localhost:8080/api/cart-items';

  constructor(private http: HttpClient) {}

  // ================= CART =================

  getCart(cartId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.cartUrl}/${cartId}`);
  }

  createCart(cart: Cart): Observable<Cart> {
    return this.http.post<Cart>(this.cartUrl, cart);
  }

  updateCart(cartId: number, cart: Cart): Observable<Cart> {
    return this.http.put<Cart>(`${this.cartUrl}/${cartId}`, cart);
  }

  deleteCart(cartId: number): Observable<void> {
    return this.http.delete<void>(`${this.cartUrl}/${cartId}`);
  }

  // ================= CART ITEMS =================

  addItem(item: CartItem): Observable<CartItem> {
    return this.http.post<CartItem>(this.cartItemUrl, item);
  }

  updateItem(itemId: number, item: CartItem): Observable<CartItem> {
    return this.http.put<CartItem>(`${this.cartItemUrl}/${itemId}`, item);
  }

  removeItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.cartItemUrl}/${itemId}`);
  }

  
  // ================= AJOUTER PRODUIT AU PANIER =================
  addToCart(productId: number, quantity: number): Observable<Cart> {
    // ✅ Utilise cartUrl au lieu de baseUrl
    return this.http.post<Cart>(`${this.cartUrl}/add`, { productId, quantity });
  }
}
