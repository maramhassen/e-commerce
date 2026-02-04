import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../../models/order';
import { Statut } from '../../models/statut';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) {}

  // Créer une commande depuis le panier
  createOrderFromCart(userId: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/create/${userId}`, {});
  }

  // Récupérer une commande par ID
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  // Récupérer les commandes d'un utilisateur
  getOrdersByUser(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Récupérer toutes les commandes (admin)
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  // Mettre à jour le statut d'une commande
  updateOrderStatus(orderId: number, status: Statut): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${orderId}/status?statut=${status}`, {});
  }

  // Supprimer une commande
  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Méthode pour formater la date
  formatDate(date: Date | string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Méthode pour obtenir la couleur du statut
  getStatusColor(status: Statut): string {
    switch(status) {
      case Statut.EN_ATTENTE: return 'warning';
      case Statut.CONFIRMEE: return 'info';
      case Statut.EXPEDIEE: return 'primary';
      case Statut.LIVREE: return 'success';
      case Statut.ANNULEE: return 'danger';
      default: return 'secondary';
    }
  }

  // Méthode pour obtenir le texte du statut
  getStatusText(status: Statut): string {
    switch(status) {
      case Statut.EN_ATTENTE: return 'En attente';
      case Statut.CONFIRMEE: return 'Confirmée';
      case Statut.EXPEDIEE: return 'Expédiée';
      case Statut.LIVREE: return 'Livrée';
      case Statut.ANNULEE: return 'Annulée';
      default: return status;
    }
  }
}