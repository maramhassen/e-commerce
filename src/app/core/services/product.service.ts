import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap, shareReplay } from 'rxjs/operators';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
import { environment } from 'src/environments/environment';

export interface UploadResponse {
  fileName: string;
  message: string;
  fileType: string;
  size: string;
  originalName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  //private apiUrl = 'http://localhost:8080/api/products';
  //private categoryApiUrl = 'http://localhost:8080/api/categories';
  private apiUrl = `${environment.apiUrl}/products`;  
  private categoryApiUrl = `${environment.apiUrl}/categories`
  
  private categoriesCache$: Observable<Category[]> | null = null;

  constructor(private http: HttpClient) {
    console.log('🌐 ProductService API URL:', this.apiUrl);
    console.log('🌐 CategoryService API URL:', this.categoryApiUrl);
  }
  
  // ==================== MÉTHODE POUR OBTENIR L'URL DE L'IMAGE ====================
// Dans product.service.ts
getImageUrl(imageUrl?: string | null): string {
  console.log('🖼️ getImageUrl appelé avec:', imageUrl);
  
  if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
    return 'assets/images/default-product.jpg';
  }
  
  // Si c'est déjà une URL complète
  if (imageUrl.includes('http') || imageUrl.includes('blob:') || imageUrl.includes('data:')) {
    return imageUrl;
  }
  
  // Si c'est une URL d'assets
  if (imageUrl.startsWith('assets/')) {
    return imageUrl;
  }
  
  // IMPORTANT: Utiliser le nouvel endpoint
  // Si c'est un nom de fichier UUID (ex: "abc123.jpg")
  if (!imageUrl.includes('/') && imageUrl.includes('.') && imageUrl.length > 20) {
    const fullUrl = `${environment.apiUrl}/products/images/${imageUrl}`;
    console.log('🔗 URL construite:', fullUrl);
    return fullUrl;
  }
  
  // Retourner tel quel (au cas où)
  return imageUrl;
}
  // ==================== CRÉATION AVEC IMAGE ====================
  
  createWithImage(productData: any, imageFile?: File): Observable<Product> {
    console.log('🚀 Création produit avec image', productData);
    
    if (imageFile) {
      console.log('📤 Utilisation endpoint /upload avec FormData');
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('product', JSON.stringify({
        ...productData,
        imageUrl: null
      }));
      
      return this.http.post<Product>(`${this.apiUrl}/upload`, formData).pipe(
        // IMPORTANT: Recharger le produit pour avoir toutes les données
        switchMap(createdProduct => {
          console.log('📦 Produit créé (brut):', createdProduct);
          
          if (createdProduct.id) {
            return this.getById(createdProduct.id).pipe(
              tap(fullProduct => {
                console.log('🔄 Produit rechargé complet:', {
                  id: fullProduct.id,
                  nom: fullProduct.nom,
                  imageUrl: fullProduct.imageUrl,
                  category: fullProduct.category,
                  categoryId: fullProduct.categoryId
                });
              })
            );
          }
          
          return of(this.enrichProductData(createdProduct, productData));
        }),
        catchError(this.handleError)
      );
    } else {
      return this.create(productData);
    }
  }
  
  // ==================== MISE À JOUR AVEC IMAGE ====================
  
  updateWithImage(id: number, productData: any, imageFile?: File): Observable<Product> {
    console.log(`✏️ Mise à jour produit ${id} avec image`);
    
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('product', JSON.stringify({
        ...productData,
        imageUrl: null
      }));
      
      return this.http.put<Product>(`${this.apiUrl}/${id}/upload`, formData).pipe(
        switchMap(updatedProduct => {
          console.log('📦 Produit mis à jour (brut):', updatedProduct);
          
          if (updatedProduct.id) {
            return this.getById(updatedProduct.id);
          }
          
          return of(this.enrichProductData(updatedProduct, productData));
        }),
        catchError(this.handleError)
      );
    } else {
      return this.update(id, productData);
    }
  }
  
  // ==================== ENRICHISSEMENT DES DONNÉES ====================
  
  private enrichProductData(product: Product, originalData: any): Product {
    const enriched: Product = {
      ...product,
      imageUrl: product.imageUrl ? this.getImageUrl(product.imageUrl) : 'assets/images/default-product.jpg'
    };
    
    return enriched;
  }
  
  // ==================== EXTRACTION DU NOM DE FICHIER ====================
  
  extractFileName(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) {
      return null;
    }
    
    if (imageUrl.includes('/images/')) {
      const parts = imageUrl.split('/');
      return parts[parts.length - 1];
    }
    
    if (!imageUrl.includes('/') && !imageUrl.startsWith('http') && !imageUrl.startsWith('assets/')) {
      return imageUrl;
    }
    
    return null;
  }
  
  // ==================== CRUD OPERATIONS ====================
  
  getAll(): Observable<Product[]> {
  return this.http.get<Product[]>(this.apiUrl);
}

  getById(id: number): Observable<Product> {
    console.log(`🔄 ProductService - Récupération produit ${id}`);
    
    return forkJoin({
      product: this.http.get<Product>(`${this.apiUrl}/${id}`),
      categories: this.getCategories()
    }).pipe(
      map(({ product, categories }) => {
        const enrichedProduct = this.enrichProductWithCategory(product, categories);
        
        if (enrichedProduct.imageUrl) {
          enrichedProduct.imageUrl = this.getImageUrl(enrichedProduct.imageUrl);
        }
        
        return enrichedProduct;
      }),
      catchError(this.handleError)
    );
  }
  
  create(productData: any): Observable<Product> {
    const payload = this.preparePayload(productData);
    
    console.log('📤 Création produit:', payload);
    
    return this.http.post<Product>(this.apiUrl, payload).pipe(
      switchMap(createdProduct => {
        if (createdProduct.id) {
          return this.getById(createdProduct.id);
        }
        return of(createdProduct);
      }),
      catchError(this.handleError)
    );
  }
  
  update(id: number, productData: any): Observable<Product> {
    const payload = this.preparePayload(productData);
    
    console.log(`📤 Mise à jour produit ${id}:`, payload);
    
    return this.http.put<Product>(`${this.apiUrl}/${id}`, payload).pipe(
      switchMap(() => this.getById(id)),
      catchError(this.handleError)
    );
  }
  
  delete(id: number): Observable<void> {
    console.log(`🗑️ Suppression produit ${id}`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`✅ Produit ${id} supprimé`)),
      catchError(this.handleError)
    );
  }
  
  // ==================== MÉTHODES PRIVÉES ====================
  
  private getCategories(): Observable<Category[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http.get<Category[]>(this.categoryApiUrl).pipe(
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }
  
  private enrichProductWithCategory(product: Product, categories: Category[]): Product {
    // Si le produit a déjà une catégorie complète
    if (product.category && product.category.id) {
      return product;
    }
    
    // Si le produit a seulement un categoryId
    if (product.categoryId) {
      const category = categories.find(c => c.id === product.categoryId);
      if (category) {
        return { ...product, category };
      }
    }
    
    // Si le backend a envoyé category_id (format différent)
    if ((product as any).category_id) {
      const categoryId = (product as any).category_id;
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        return { 
          ...product, 
          category,
          categoryId: categoryId 
        };
      }
    }
    
    return product;
  }
  
  private preparePayload(productData: any): any {
    const payload: any = {
      nom: String(productData.nom || '').trim(),
      description: String(productData.description || '').trim(),
      prix: Number(productData.prix) || 0,
      stock: Number(productData.stock) || 0,
      actif: Boolean(productData.actif !== false)
    };
    
    // Image URL
    if (productData.imageUrl && productData.imageUrl.trim()) {
      const imageUrl = productData.imageUrl.trim();
      
      if (!imageUrl.startsWith('assets/') && 
          !imageUrl.startsWith('data:') && 
          !imageUrl.startsWith('blob:') &&
          !imageUrl.includes('http://') &&
          !imageUrl.includes('https://') &&
          !imageUrl.includes('/images/')) {
        payload.imageUrl = imageUrl;
      }
    }
    
    // Catégorie
    if (productData.categoryId) {
      payload.categoryId = Number(productData.categoryId);
    }
    
    console.log('📦 Payload préparé:', payload);
    return payload;
  }
  
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
      if (error.error && error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 400) {
        errorMessage = 'Données invalides';
      } else if (error.status === 404) {
        errorMessage = `Endpoint non trouvé: ${error.url}`;
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer.';
      } else if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
  
  // ==================== MÉTHODES UTILITAIRES ====================
  
  getCategoryName(product: Product): string {
    if (product.category && product.category.nom) {
      return product.category.nom;
    }
    
    if (product.categoryId) {
      return `ID: ${product.categoryId}`;
    }
    
    return 'Non catégorisé';
  }
}