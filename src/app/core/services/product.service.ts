import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Product } from '../../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  // GET all products
  getAll(): Observable<Product[]> {
    console.log('🔄 Récupération de tous les produits');
    return this.http.get<Product[]>(this.apiUrl).pipe(
      tap(products => {
        console.log(`✅ ${products.length} produits chargés`);
      }),
      catchError(this.handleError)
    );
  }

  // GET single product by ID
  getById(id: number): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`🔄 GET produit ID ${id}: ${url}`);
    
    return this.http.get<Product>(url).pipe(
      tap(product => {
        console.log(`✅ Produit ${id} récupéré:`, {
          nom: product.nom,
          category: product.category,
          categoryId: product.category?.id
        });
      }),
      catchError(this.handleError)
    );
  }

  // POST create new product
  create(product: any): Observable<Product> {
    console.log('🚀 POST création produit');
    
    // Préparer le payload
    const payload = this.preparePayload(product);
    console.log('📦 Payload envoyé:', payload);
    console.log('📡 JSON:', JSON.stringify(payload, null, 2));
    
    return this.http.post<Product>(this.apiUrl, payload).pipe(
      tap(response => {
        console.log('✅ Réponse création:', response);
      }),
      catchError(this.handleError)
    );
  }

  // PUT update existing product
  update(id: number, product: any): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`✏️ PUT modification produit ${id}`);
    
    // Préparer le payload
    const payload = this.preparePayload(product);
    console.log('📦 Payload envoyé:', payload);
    console.log('📡 JSON:', JSON.stringify(payload, null, 2));
    
    return this.http.put<Product>(url, payload).pipe(
      tap(response => {
        console.log('✅ Réponse modification:', response);
      }),
      catchError(this.handleError)
    );
  }

  // DELETE product
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 500) {
          return of(void 0);
        }
        return this.handleError(error);
      })
    );
  }

  // DELETE avec fallback automatique vers désactivation
  deleteWithFallback(id: number): Observable<void> {
    return this.delete(id).pipe(
      catchError((error: Error) => {
        return this.deactivateProduct(id);
      })
    );
  }

  // Méthode pour désactiver un produit
  deactivateProduct(id: number): Observable<void> {
    return this.getById(id).pipe(
      switchMap(product => {
        const updatedProduct = {
          ...product,
          actif: false
        };
        
        return this.update(id, updatedProduct).pipe(
          map(() => undefined)
        );
      }),
      catchError(this.handleError)
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

  // Préparer le payload pour le backend
  private preparePayload(product: any): any {
    console.log('🔧 Préparation du payload...');
    
    // Log détaillé
    console.log('📋 Données reçues:', product);
    console.log('📋 categoryId:', product.categoryId);
    console.log('📋 Type de categoryId:', typeof product.categoryId);
    
    // Créez le payload selon ce que votre backend attend
    const payload: any = {
      nom: product.nom,
      description: product.description,
      prix: product.prix,
      stock: product.stock,
      actif: product.actif !== false
    };
    
    // Ajoutez imageUrl si défini
    if (product.imageUrl) {
      payload.imageUrl = product.imageUrl;
    }
    
    // IMPORTANT: Ajoutez categoryId comme nombre
    if (product.categoryId) {
      payload.categoryId = Number(product.categoryId);
      console.log('✅ categoryId ajouté au payload:', payload.categoryId);
    } else {
      console.warn('⚠️ Pas de categoryId dans les données');
    }
    
    console.log('📦 Payload final:', payload);
    return payload;
  }

  // Gestion d'erreur
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ ProductService Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error
    });
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}