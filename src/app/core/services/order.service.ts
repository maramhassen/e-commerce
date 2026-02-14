import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Order } from '../../models/order';
import { Statut } from '../../models/statut';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    console.log('🔧 OrderService initialisé avec URL:', this.apiUrl);
  }

  /**
   * Créer une commande depuis le panier de l'utilisateur
   */
  createOrderFromCart(userId: number): Observable<Order> {
    console.log('\n========== ORDER SERVICE ==========');
    console.log('🔵 FRONTEND: createOrderFromCart() appelé');
    console.log('🔵 Paramètres:');
    console.log('   - userId:', userId);
    console.log('   - URL complète:', `${this.apiUrl}/create/${userId}`);
    console.log('   - Timestamp:', new Date().toISOString());

    // Validation
    if (!userId) {
      console.error('🔴 ERREUR: userId est null ou undefined');
      return throwError(() => new Error('ID utilisateur manquant'));
    }

    if (userId <= 0) {
      console.error('🔴 ERREUR: userId invalide:', userId);
      return throwError(() => new Error('ID utilisateur invalide'));
    }

    // Appel HTTP
    return this.http.post<Order>(
      `${this.apiUrl}/create/${userId}`, 
      {}, 
      this.httpOptions
    ).pipe(
      tap({
        next: (order) => {
          console.log('🟢 SUCCÈS - Réception de la commande:', order);
          console.log('   - ID Commande:', order.id);
          console.log('   - Total:', order.total, 'DT');
          console.log('   - Statut:', order.statut);
          console.log('   - Date:', order.dateCommande);
          console.log('   - Nombre articles:', order.items?.length || 0);
          if (order.items && order.items.length > 0) {
            console.log('   - Articles:');
            order.items.forEach((item, index) => {
              console.log(`       ${index + 1}. ${item.product?.nom} x${item.quantite} = ${item.prix * item.quantite} DT`);
            });
          }
          console.log('=====================================\n');
        },
        error: (error) => {
          console.error('🔴 ERREUR - Échec de la création:', error);
        }
      }),
      map((order: Order) => {
        // Enrichir la commande avec des propriétés calculées si nécessaire
        if (order.items) {
          order.items.forEach(item => {
            if (item.product) {
              // S'assurer que le produit a un nom
              console.log(`   Produit dans commande: ${item.product.nom} x${item.quantite}`);
            }
          });
        }
        return order;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer une commande par son ID
   */
  getOrderById(id: number): Observable<Order> {
    console.log(`🔵 Récupération commande ID: ${id}`);
    
    return this.http.get<Order>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      tap(order => console.log('🟢 Commande récupérée:', order)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer toutes les commandes d'un utilisateur
   */
  getOrdersByUser(userId: number): Observable<Order[]> {
    console.log(`🔵 Récupération des commandes pour utilisateur: ${userId}`);
    
    return this.http.get<Order[]>(`${this.apiUrl}/user/${userId}`, this.httpOptions).pipe(
      tap(orders => {
        console.log(`🟢 ${orders.length} commandes récupérées`);
        if (orders.length > 0) {
          console.log('   Détail des commandes:');
          orders.forEach(order => {
            console.log(`   - #${order.id}: ${order.total} DT, ${order.statut}, ${order.items?.length || 0} article(s)`);
          });
        } else {
          console.log('   Aucune commande trouvée');
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer toutes les commandes (admin)
   */
  getAllOrders(): Observable<Order[]> {
    console.log('🔵 Récupération de toutes les commandes');
    
    return this.http.get<Order[]>(this.apiUrl, this.httpOptions).pipe(
      tap(orders => console.log(`🟢 ${orders.length} commandes récupérées`)),
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  updateOrderStatus(orderId: number, status: Statut): Observable<Order> {
    console.log(`🔵 Mise à jour statut commande ${orderId} -> ${status}`);
    
    const url = `${this.apiUrl}/${orderId}/status?statut=${status}`;
    
    return this.http.put<Order>(url, {}, this.httpOptions).pipe(
      tap(order => console.log('🟢 Statut mis à jour:', order)),
      catchError(this.handleError)
    );
  }

  /**
   * Supprimer une commande
   */
  deleteOrder(id: number): Observable<any> {
    console.log(`🔵 Suppression commande ID: ${id}`);
    
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      ...this.httpOptions, 
      responseType: 'text' 
    }).pipe(
      tap(response => console.log('🟢 Réponse suppression:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer une commande par ID de panier
   */
  getOrderByCartId(cartId: number): Observable<Order> {
    console.log(`🔵 Récupération commande pour panier ID: ${cartId}`);
    
    return this.http.get<Order>(`${this.apiUrl}/cart/${cartId}`, this.httpOptions).pipe(
      tap(order => console.log('🟢 Commande trouvée:', order)),
      catchError(this.handleError)
    );
  }

  /**
   * Méthode de test pour vérifier la connexion
   */
  testCreateOrder(userId: number): Observable<string> {
    console.log(`🧪 TEST: Création commande test pour userId: ${userId}`);
    
    return this.http.get(`${this.apiUrl}/test/${userId}`, { 
      ...this.httpOptions, 
      responseType: 'text' 
    }).pipe(
      tap(response => console.log('🟢 Réponse test:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse) {
    console.error('\n🔴 ERREUR HTTP DÉTAILLÉE:');
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      console.error('   Type: Erreur client');
      console.error('   Message:', error.error.message);
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      console.error('   Type: Erreur serveur');
      console.error('   Status:', error.status);
      console.error('   StatusText:', error.statusText);
      console.error('   URL:', error.url);
      console.error('   Réponse:', error.error);
      
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';
          break;
        case 400:
          errorMessage = typeof error.error === 'string' ? error.error : 'Requête invalide';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('   Message utilisateur:', errorMessage);
    console.error('=====================================\n');
    
    return throwError(() => new Error(errorMessage));
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Obtenir le texte du statut en français
   */
  getStatusText(statut: Statut | string): string {
    const statusMap: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'EXPEDIEE': 'Expédiée',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée'
    };
    return statusMap[statut as string] || statut as string;
  }

  /**
   * Obtenir la couleur Bootstrap pour le statut
   */
  getStatusColor(statut: Statut | string): string {
    const colorMap: { [key: string]: string } = {
      'EN_ATTENTE': 'warning',
      'CONFIRMEE': 'info',
      'EXPEDIEE': 'primary',
      'LIVREE': 'success',
      'ANNULEE': 'danger'
    };
    return colorMap[statut as string] || 'secondary';
  }

  /**
   * Formater une date
   */
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calculer le nombre total d'articles dans une commande
   */
  getTotalItems(order: Order): number {
    if (!order || !order.items) return 0;
    return order.items.reduce((sum, item) => sum + (item.quantite || 0), 0);
  }
}