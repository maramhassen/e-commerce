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
        // Log pour déboguer les catégories
        products.forEach(product => {
          console.log(`Product ${product.id}: ${product.nom} - Category:`, product.category);
        });
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
          id: product.id,
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
    
    return this.http.put<Product>(url, payload).pipe(
      tap(response => {
        console.log('✅ Réponse modification:', response);
      }),
      catchError(this.handleError)
    );
  }

  // DELETE product
  delete(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`🗑️ DELETE produit ${id}`);
    
    return this.http.delete<void>(url).pipe(
      tap(() => {
        console.log(`✅ Produit ${id} supprimé`);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 500) {
          console.warn(`⚠️ Impossible de supprimer ${id}, tentative de désactivation`);
          return this.deactivateProduct(id);
        }
        return this.handleError(error);
      })
    );
  }

  // Méthode pour désactiver un produit
  deactivateProduct(id: number): Observable<void> {
    console.log(`🔧 Désactivation du produit ${id}`);
    
    return this.getById(id).pipe(
      switchMap(product => {
        const updatedProduct = {
          ...product,
          actif: false
        };
        
        return this.update(id, updatedProduct).pipe(
          map(() => {
            console.log(`✅ Produit ${id} désactivé`);
            return undefined;
          })
        );
      }),
      catchError(this.handleError)
    );
  }

  // GET products by category
  getByCategory(categoryId: number): Observable<Product[]> {
    const url = `${this.apiUrl}/category/${categoryId}`;
    console.log(`🔄 GET produits par catégorie ${categoryId}`);
    
    return this.http.get<Product[]>(url).pipe(
      tap(products => {
        console.log(`✅ ${products.length} produits pour la catégorie ${categoryId}`);
      }),
      catchError(this.handleError)
    );
  }

  // SEARCH products
  search(keyword: string): Observable<Product[]> {
    const url = `${this.apiUrl}/search?keyword=${encodeURIComponent(keyword)}`;
    console.log(`🔍 Recherche produits: "${keyword}"`);
    
    return this.http.get<Product[]>(url).pipe(
      tap(products => {
        console.log(`✅ ${products.length} produits trouvés pour "${keyword}"`);
      }),
      catchError(this.handleError)
    );
  }

  // Préparer le payload pour le backend
  private preparePayload(product: any): any {
    console.log('🔧 Préparation du payload...');
    console.log('📋 Données reçues:', product);
    
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
    
    // Gérer la catégorie
    if (product.categoryId) {
      payload.categoryId = Number(product.categoryId);
      console.log('✅ categoryId ajouté au payload:', payload.categoryId);
    } else if (product.category && product.category.id) {
      payload.categoryId = Number(product.category.id);
      console.log('✅ category.id ajouté au payload:', payload.categoryId);
    } else {
      console.warn('⚠️ Pas de categoryId dans les données');
    }
    
    console.log('📦 Payload final:', payload);
    return payload;
  }

  // Gestion d'erreur améliorée
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ ProductService Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error
    });
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.status === 404) {
        errorMessage = 'Produit non trouvé';
      } else if (error.status === 400) {
        errorMessage = 'Données invalides';
      } else if (error.status === 401) {
        errorMessage = 'Non autorisé';
      } else if (error.status === 403) {
        errorMessage = 'Accès interdit';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}