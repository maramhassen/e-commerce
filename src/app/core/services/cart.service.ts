// src/app/core/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { Product } from '../../models/product';
import { User } from '../../models/user'; // AJOUTEZ CET IMPORT
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartUrl = `${environment.apiUrl}/carts`;
  private cartItemUrl = `${environment.apiUrl}/cart-items`;
  
  private cartUpdatedSource = new BehaviorSubject<void>(undefined);
  cartUpdated$ = this.cartUpdatedSource.asObservable();

  private currentCartId: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('CartService initialisé avec URL:', this.cartUrl);
  }

  // ================= OBTENIR OU CRÉER UN PANIER =================
  getOrCreateCart(): Observable<Cart> {
    console.log('getOrCreateCart appelé');
    
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.id) {
      console.log('Utilisateur non connecté, retour panier vide');
      return of({ 
        id: 0,
        total: 0, 
        items: [], 
        dateCreation: new Date() // ← RETOUR À Date, PAS string
      } as Cart);
    }

    console.log('Récupération panier pour utilisateur ID:', user.id);
    
    return this.getCartByUser(user.id).pipe(
      tap(cart => {
        console.log('Panier existant trouvé:', cart);
      }),
      catchError((error) => {
        console.log('Erreur récupération panier:', error);
        
        if (error.status === 404) {
          console.log('Création nouveau panier pour utilisateur:', user.id);
          
          // Créer un user partiel pour le panier
          const partialUser: Partial<User> = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role
          };
          
          const newCart: Cart = {
            total: 0,
            items: [],
            dateCreation: new Date(), // ← Date, PAS string
            user: partialUser as User
          };
          
          return this.createCart(newCart).pipe(
            tap(cart => {
              console.log('Nouveau panier créé:', cart);
            })
          );
        }
        
        console.error('Erreur autre que 404:', error);
        return throwError(() => error);
      }),
      map((cart: Cart) => {
        if (cart.id) {
          this.currentCartId = cart.id;
          console.log('CartId stocké:', this.currentCartId);
        }
        return cart;
      })
    );
  }

  // ================= MÉTHODE ADD TO CART =================
addToCart(productId: number, quantity: number, userId: number): Observable<CartItem> {
  console.log(`addToCart - Produit: ${productId}, Quantité: ${quantity}, User: ${userId}`);
  
  return this.getCartByUser(userId).pipe(
    switchMap((cart: Cart) => {
      console.log('Panier trouvé:', cart);
      
      // CHANGEMENT ICI : Format simplifié
      const requestBody = {
        productId: productId,
        quantite: quantity
      };
      
      console.log('Envoi requête simplifiée à API:', requestBody);
      
      // CHANGEMENT ICI : Utiliser la nouvelle endpoint
      return this.http.post<CartItem>(
        `${this.cartUrl}/${cart.id}/add-item-simple`, 
        requestBody
      );
    }),
    catchError(error => {
      console.log('Erreur récupération panier:', error);
      
      if (error.status === 404) {
        console.log('Création nouveau panier pour user:', userId);
        
        return this.findOrCreateCartForUser(userId).pipe(
          switchMap((cart: Cart) => {
            const requestBody = {
              productId: productId,
              quantite: quantity
            };
            
            return this.http.post<CartItem>(
              `${this.cartUrl}/${cart.id}/add-item-simple`, 
              requestBody
            );
          })
        );
      }
      return throwError(() => error);
    })
  );
}

// ET AJOUTEZ CETTE MÉTHODE (si elle n'existe pas) :
findOrCreateCartForUser(userId: number): Observable<Cart> {
  console.log('findOrCreateCartForUser - UserId:', userId);
  return this.http.get<Cart>(`${this.cartUrl}/user/${userId}/find-or-create`);
}

  // ================= MÉTHODE SIMPLIFIÉE =================
  addProductToCartSimple(productId: number, quantity: number = 1): Observable<CartItem> {
    console.log(`addProductToCartSimple - Produit: ${productId}, Quantité: ${quantity}`);
    
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.id) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    
    if (!productId) {
      return throwError(() => new Error('ID produit invalide'));
    }
    
    return this.addToCart(productId, quantity, user.id).pipe(
      tap((cartItem: CartItem) => {
        console.log('✅ Produit ajouté avec succès:', cartItem);
        this.notifyCartUpdate();
      })
    );
  }

  // ================= MÉTHODE POUR AJOUTER UN PRODUIT COMPLET =================
  addProductToCart(product: Product, quantity: number = 1): Observable<CartItem> {
    console.log('addProductToCart appelé - Produit:', product.nom);
    
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.id) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    
    // CORRECTION : NE PAS appeler addToCart avec 3 arguments
    // Utiliser plutôt la méthode simplifiée
    return this.addProductToCartSimple(product.id!, quantity);
  }

  // ================= MÉTHODE GET CART BY USER =================
  getCartByUser(userId: number): Observable<Cart> {
    console.log('getCartByUser appelé - UserId:', userId);
    
    return this.http.get<Cart>(`${this.cartUrl}/user/${userId}`).pipe(
      map((cart: Cart) => {
        console.log('Panier récupéré pour user:', cart);
        
        if (cart.id) {
          this.currentCartId = cart.id;
          console.log('CartId stocké:', this.currentCartId);
        }
        return cart;
      }),
      catchError((error) => {
        console.error('Erreur récupération panier user:', error);
        return throwError(() => error);
      })
    );
  }

  // ================= AUTRES MÉTHODES =================
  getCart(cartId: number): Observable<Cart> {
    console.log('getCart appelé - CartId:', cartId);
    return this.http.get<Cart>(`${this.cartUrl}/${cartId}`);
  }

  createCart(cart: Cart): Observable<Cart> {
    console.log('createCart appelé:', cart);
    return this.http.post<Cart>(this.cartUrl, cart);
  }

  updateCart(cartId: number, cart: Cart): Observable<Cart> {
    console.log('updateCart appelé - CartId:', cartId);
    return this.http.put<Cart>(`${this.cartUrl}/${cartId}`, cart);
  }

  deleteCart(cartId: number): Observable<void> {
    console.log('deleteCart appelé - CartId:', cartId);
    return this.http.delete<void>(`${this.cartUrl}/${cartId}`);
  }

  addItem(item: CartItem): Observable<CartItem> {
    console.log('addItem appelé:', item);
    return this.http.post<CartItem>(this.cartItemUrl, item);
  }

  updateItem(itemId: number, item: CartItem): Observable<CartItem> {
    console.log('updateItem appelé - ItemId:', itemId);
    return this.http.put<CartItem>(`${this.cartItemUrl}/${itemId}`, item);
  }

  removeItem(itemId: number): Observable<void> {
    console.log('removeItem appelé - ItemId:', itemId);
    return this.http.delete<void>(`${this.cartItemUrl}/${itemId}`);
  }

  // Notifier que le panier a été mis à jour
  notifyCartUpdate(): void {
    console.log('Notification mise à jour panier');
    this.cartUpdatedSource.next();
  }

  // Méthode pour calculer le total des items
  calculateTotal(items: CartItem[]): number {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      return total + (item.quantite * item.prixUnitaire);
    }, 0);
  }

  calculateTotalItems(items: CartItem[]): number {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => total + item.quantite, 0);
  }

  getCurrentCartId(): number | null {
    return this.currentCartId;
  }

  getCartCount(): Observable<number> {
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.id) {
      return of(0);
    }
    
    return this.getCartByUser(user.id).pipe(
      map((cart: Cart) => {
        const count = this.calculateTotalItems(cart.items || []);
        console.log('Cart count calculé:', count);
        return count;
      }),
      catchError((error) => {
        console.error('Erreur calcul cart count:', error);
        return of(0);
      })
    );
  }
}