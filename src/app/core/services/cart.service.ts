import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { Product } from '../../models/product';

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
  // OPTION 1: Avec Product complet
  addToCart(product: Product, quantity: number, cartId: number): Observable<CartItem> {
    // Créer un CartItem complet pour l'envoi
    const cartItem: CartItem = {
      quantite: quantity,
      prixUnitaire: product.prix,
      product: product  // Produit complet
      // Note: Le champ 'cart' sera ajouté par le backend
    };

    // Option A: Utiliser l'endpoint cart-items (si votre backend l'accepte)
    return this.http.post<CartItem>(this.cartItemUrl, cartItem);
    
    // OU Option B: Si vous avez créé l'endpoint dans CartController
    // return this.http.post<CartItem>(`${this.cartUrl}/${cartId}/add-item`, cartItem);
  }

  // OPTION 2: Avec seulement les IDs (plus simple)
  addToCartSimple(productId: number, quantity: number, cartId: number): Observable<CartItem> {
    const cartItem = {
      quantite: quantity,
      prixUnitaire: 0,  // Le backend le mettra à jour
      product: {
        id: productId
        // Pas besoin des autres champs
      }
    };
    
    return this.http.post<CartItem>(this.cartItemUrl, cartItem);
  }

  // OPTION 3: Si vous avez l'endpoint addProductToCart dans le backend
  addProductToCart(cartId: number, productId: number, quantity: number): Observable<CartItem> {
    const request = {
      productId: productId,
      quantity: quantity
    };
    
    return this.http.post<CartItem>(`${this.cartUrl}/${cartId}/add-item`, request);
  }
}