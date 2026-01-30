import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from 'src/app/models/order';
import { Statut } from 'src/app/models/statut';
@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private apiUrl = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) {}

  createFromCart(userId: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/create/${userId}`, {});
  }

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getByUser(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/user/${userId}`);
  }

  updateStatus(orderId: number, statut: Statut): Observable<Order> {
    return this.http.put<Order>(
      `${this.apiUrl}/${orderId}/status?statut=${statut}`, {}
    );
  }
}
