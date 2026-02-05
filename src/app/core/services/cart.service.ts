// src/app/core/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { Product } from '../../models/product';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartUrl = `${environment.apiUrl}/carts`;
  private cartItemUrl = `${environment.apiUrl}/cart-items`;
  
  // BehaviorSubject pour notifier les changements
  private cartUpdatedSource = new BehaviorSubject<void>(undefined);
  cartUpdated$ = this.cartUpdatedSource.asObservable();

  constructor(private http: HttpClient) {}

  // ================= CART =================
  getCart(cartId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.cartUrl}/${cartId}`);
  }

  // Nouvelle méthode pour obtenir le panier par utilisateur
  getCartByUser(userId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.cartUrl}/user/${userId}`);
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

  // ================= AJOUTER PRODUIT AU PANIER (MÉTHODE SIMPLIFIÉE) =================
  addToCart(productId: number, quantity: number): Observable<CartItem> {
    // Pour l'instant, on crée un panier temporaire
    // Dans une vraie app, vous auriez besoin de l'ID du panier utilisateur
    const cartItem: CartItem = {
      quantite: quantity,
      prixUnitaire: 0, // Le backend mettra à jour
      product: { id: productId } as Product
    };
    
    return this.http.post<CartItem>(this.cartItemUrl, cartItem);
  }

  // Méthode pour ajouter avec produit complet (optionnel)
  addProductToCart(product: Product, quantity: number): Observable<CartItem> {
    const cartItem: CartItem = {
      quantite: quantity,
      prixUnitaire: product.prix,
      product: product
    };

    return this.http.post<CartItem>(this.cartItemUrl, cartItem);
  }

  // Notifier que le panier a été mis à jour
  notifyCartUpdate(): void {
    this.cartUpdatedSource.next();
  }

  // Méthode pour calculer le total des items
  calculateTotal(items: CartItem[]): number {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      return total + (item.quantite * item.prixUnitaire);
    }, 0);
  }

  // Méthode pour calculer le nombre total d'articles
  calculateTotalItems(items: CartItem[]): number {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => total + item.quantite, 0);
  }
}