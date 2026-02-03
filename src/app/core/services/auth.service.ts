import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, catchError, throwError } from 'rxjs';
import { User } from '../../models/user';

// Interface pour l'utilisateur stocké (sans motDePasse)
interface StoredUser {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/users';
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('AuthService initialisé avec URL:', this.apiUrl);
  }

  // ================ MÉTHODES D'AUTHENTIFICATION ================

  login(email: string, motDePasse: string): Observable<any> {
    console.log(`Tentative de login pour: ${email}`);
    
    return this.http.get<User[]>(this.apiUrl).pipe(
      map(users => {
        console.log(`Nombre d'utilisateurs récupérés: ${users.length}`);
        
        const user = users.find(u => 
          u.email.toLowerCase() === email.toLowerCase() && 
          u.motDePasse === motDePasse
        );
        
        if (!user) {
          throw new Error('Identifiants incorrects');
        }
        
        // Créer un objet utilisateur sans motDePasse pour le stockage
        const userWithoutPassword: StoredUser = {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role
        };
        
        return {
          token: this.generateMockToken(user),
          user: userWithoutPassword
        };
      }),
      catchError(error => {
        console.error('Erreur lors du login:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  register(userData: User): Observable<any> {
    console.log('Inscription de nouvel utilisateur:', userData);
    
    const newUser: User = {
      ...userData,
      role: userData.role || 'CLIENT'
    };
    
    return this.http.post<User>(this.apiUrl, newUser).pipe(
      map((user: User) => {
        console.log('Utilisateur créé avec succès:', user);
        
        // Créer un objet utilisateur sans motDePasse
        const userWithoutPassword: StoredUser = {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role
        };
        
        return {
          token: this.generateMockToken(user),
          user: userWithoutPassword
        };
      }),
      catchError(error => {
        console.error('Erreur lors de l\'inscription:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ================ GÉNÉRATION DE TOKEN ================

  private generateMockToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role || 'CLIENT',
      exp: Date.now() + 86400000
    }));
    const signature = btoa('mock-signature-secret-key');
    
    return `${header}.${payload}.${signature}`;
  }

  // ================ GESTION DE SESSION ================

  logout(): void {
    console.log('Déconnexion de l\'utilisateur');
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    console.log('Token stocké');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setCurrentUser(user: User | StoredUser): void {
    // S'assurer qu'on ne stocke pas le motDePasse
    const userToStore: StoredUser = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    console.log('Utilisateur stocké:', userToStore);
  }

  getCurrentUser(): StoredUser | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as StoredUser;
    } catch (e) {
      console.error('Erreur parsing user:', e);
      return null;
    }
  }

  // ================ VÉRIFICATIONS ================

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!token && !!user;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  isClient(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'CLIENT';
  }

  // ================ UTILITAIRES ================

  redirectBasedOnRole(): void {
    const user = this.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/products']);
      return;
    }
    
    if (user.role === 'ADMIN') {
      this.router.navigate(['/categories']);
    } else {
      this.router.navigate(['/products']);
    }
  }

  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    console.log('Données d\'authentification effacées');
  }

  // ================ MÉTHODES DE DIAGNOSTIC ================

  testBackendConnection(): Observable<any> {
    console.log('Test de connexion au backend...');
    return this.http.get(this.apiUrl).pipe(
      map(() => ({ 
        status: 'success', 
        message: 'Backend accessible et répond correctement' 
      })),
      catchError(error => {
        console.error('Backend inaccessible:', error);
        return throwError(() => ({ 
          status: 'error', 
          message: `Backend inaccessible (${error.status || 'no connection'})` 
        }));
      })
    );
  }

  getAllUsersForDebug(): Observable<User[]> {
    console.log('Récupération de tous les utilisateurs pour débogage');
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Erreur:', error);
        return throwError(() => error);
      })
    );
  }

  getAuthStatus(): string {
    const user = this.getCurrentUser();
    return JSON.stringify({
      authenticated: this.isAuthenticated(),
      hasToken: !!this.getToken(),
      user: user,
      isAdmin: this.isAdmin(),
      isClient: this.isClient()
    }, null, 2);
  }

  // ================ GESTION DES ERREURS ================

  private handleError(error: any): any {
    console.error('Erreur détaillée:', error);
    
    if (error.status === 0) {
      return {
        status: 0,
        message: 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur localhost:8080'
      };
    } else if (error.status === 404) {
      return {
        status: 404,
        message: 'Endpoint non trouvé. URL probablement incorrecte.'
      };
    } else if (error.status === 401) {
      return {
        status: 401,
        message: 'Non autorisé'
      };
    }
    
    return error;
  }
}