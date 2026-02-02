import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) { }

  // Connexion
  login(email: string, motDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, motDePasse });
  }

  // Inscription
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  // Vérifie si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Vérifie si l'utilisateur est admin
  isAdmin(): boolean {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role === 'ADMIN';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // Récupère l'utilisateur courant
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Stocke l'utilisateur
  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Récupère le token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Stocke le token
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }
}