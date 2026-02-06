import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from '../../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  // GET all products
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // GET single product by ID
  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // POST create new product
  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      catchError(this.handleError)
    );
  }

  // PUT update existing product
  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE product - CORRIGÉE
  delete(id: number): Observable<void> {
    console.log(`DELETE ${this.apiUrl}/${id}`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { 
      observe: 'response' // Important pour voir toute la réponse
    }).pipe(
      catchError(this.handleDeleteError),
      map(response => {
        console.log('DELETE response:', response);
        return; // Retourne void comme attendu
      })
    );
  }

  // GET products by category
  getByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoryId}`).pipe(
      catchError(this.handleError)
    );
  }

  // SEARCH products
  search(keyword: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?keyword=${keyword}`).pipe(
      catchError(this.handleError)
    );
  }

  // Gestion d'erreur générale
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ProductService Error:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Gestion d'erreur spécifique pour DELETE
  private handleDeleteError(error: HttpErrorResponse): Observable<never> {
    console.error('DELETE Error Details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      headers: error.headers
    });
    
    let errorMessage = 'Erreur lors de la suppression';
    
    if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    } else if (error.status === 404) {
      errorMessage = 'Produit non trouvé';
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit';
    } else if (error.status === 500) {
      // Analyse l'erreur du backend
      const serverError = error.error;
      
      if (serverError && typeof serverError === 'string') {
        errorMessage = serverError;
      } else if (serverError && serverError.message) {
        errorMessage = serverError.message;
      } else if (serverError && serverError.error) {
        errorMessage = serverError.error;
      } else {
        errorMessage = 'Erreur interne du serveur (500)';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}