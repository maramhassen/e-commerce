import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap, shareReplay } from 'rxjs/operators';
import { Product } from '../../models/product';
import { Category } from '../../models/category';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';
  private categoryApiUrl = 'http://localhost:8080/api/categories';
  
  // Cache pour éviter de recharger les catégories
  private categoriesCache$: Observable<Category[]> | null = null;

  constructor(private http: HttpClient) {}

  // ==================== MÉTHODES PRINCIPALES ====================

  /**
   * Récupère TOUS les produits AVEC leurs catégories
   * SOLUTION: Charge les catégories séparément et les associe
   */
  getAll(): Observable<Product[]> {
    console.log('🔄 ProductService - Chargement de tous les produits');
    
    // Charge produits et catégories en parallèle
    return forkJoin({
      products: this.http.get<Product[]>(this.apiUrl),
      categories: this.getCategories()
    }).pipe(
      map(({ products, categories }) => {
        console.log(`📊 ${products.length} produits, ${categories.length} catégories`);
        
        // Associe chaque produit avec sa catégorie
        const enrichedProducts = products.map(product => 
          this.enrichProductWithCategory(product, categories)
        );
        
        return enrichedProducts;
      }),
      tap(products => {
        this.logProductsWithCategories(products);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère un produit par ID AVEC sa catégorie
   */
  getById(id: number): Observable<Product> {
    console.log(`🔄 ProductService - Récupération produit ${id}`);
    
    return forkJoin({
      product: this.http.get<Product>(`${this.apiUrl}/${id}`),
      categories: this.getCategories()
    }).pipe(
      map(({ product, categories }) => {
        return this.enrichProductWithCategory(product, categories);
      }),
      tap(product => {
        console.log(`✅ Produit ${id} chargé:`, {
          nom: product.nom,
          category: product.category,
          categoryId: product.categoryId
        });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crée un nouveau produit
   * SOLUTION: Après création, récupère le produit complet pour avoir la catégorie
   */
  create(productData: any): Observable<Product> {
    console.log('🚀 ProductService - Création nouveau produit');
    
    // Préparer les données
    const payload = this.preparePayload(productData);
    console.log('📦 Données envoyées:', payload);
    
    return this.http.post<Product>(this.apiUrl, payload).pipe(
      // APRÈS CRÉATION, RÉCUPÈRE LE PRODUIT COMPLET
      switchMap(createdProduct => {
        console.log('📥 Produit créé (réponse partielle):', createdProduct);
        
        if (createdProduct.id) {
          console.log('🔄 Récupération du produit complet...');
          return this.getById(createdProduct.id);
        }
        
        return of(createdProduct);
      }),
      tap(finalProduct => {
        console.log('✅ Produit final après création:', {
          id: finalProduct.id,
          nom: finalProduct.nom,
          category: finalProduct.category,
          hasCategory: !!finalProduct.category
        });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour un produit existant
   * SOLUTION: Après mise à jour, récupère le produit complet
   */
  update(id: number, productData: any): Observable<Product> {
    console.log(`✏️ ProductService - Mise à jour produit ${id}`);
    
    const payload = this.preparePayload(productData);
    console.log('📦 Données de mise à jour:', payload);
    
    return this.http.put<Product>(`${this.apiUrl}/${id}`, payload).pipe(
      // APRÈS MISE À JOUR, RÉCUPÈRE LE PRODUIT COMPLET
      switchMap(() => {
        console.log('🔄 Récupération du produit mis à jour...');
        return this.getById(id);
      }),
      tap(finalProduct => {
        console.log(`✅ Produit ${id} mis à jour:`, finalProduct);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un produit
   */
  delete(id: number): Observable<void> {
    console.log(`🗑️ ProductService - Suppression produit ${id}`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log(`✅ Produit ${id} supprimé`);
      }),
      catchError(this.handleError)
    );
  }

  // ==================== MÉTHODES PRIVÉES ====================

  /**
   * Charge les catégories (avec cache)
   */
  private getCategories(): Observable<Category[]> {
    if (!this.categoriesCache$) {
      console.log('📚 ProductService - Chargement des catégories...');
      this.categoriesCache$ = this.http.get<Category[]>(this.categoryApiUrl).pipe(
        tap(categories => {
          console.log(`✅ ${categories.length} catégories chargées`);
        }),
        shareReplay(1) // Cache les résultats
      );
    }
    return this.categoriesCache$;
  }

  /**
   * Associe un produit avec sa catégorie
   */
  private enrichProductWithCategory(product: Product, categories: Category[]): Product {
    // Si le produit a déjà un objet category, on le garde
    if (product.category && product.category.id) {
      return product;
    }
    
    // Cherche la catégorie par categoryId
    if (product.categoryId) {
      const category = categories.find(c => c.id === product.categoryId);
      if (category) {
        return { ...product, category };
      }
    }
    
    // Si le backend envoie category_id au lieu de categoryId
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

  /**
   * Prépare les données pour l'envoi au backend
   */
  private preparePayload(productData: any): any {
    const payload: any = {
      nom: String(productData.nom || '').trim(),
      description: String(productData.description || '').trim(),
      prix: Number(productData.prix) || 0,
      stock: Number(productData.stock) || 0,
      actif: Boolean(productData.actif !== false)
    };
    
    // Image URL (optionnel)
    if (productData.imageUrl && productData.imageUrl.trim()) {
      payload.imageUrl = productData.imageUrl.trim();
    }
    
    // CATÉGORIE - Convertir en nombre
    if (productData.categoryId) {
      payload.categoryId = Number(productData.categoryId);
      console.log(`✅ categoryId envoyé: ${payload.categoryId} (type: ${typeof payload.categoryId})`);
    }
    
    return payload;
  }

  /**
   * Log les produits avec leurs catégories
   */
  private logProductsWithCategories(products: Product[]): void {
    console.log('=== PRODUITS AVEC CATÉGORIES ===');
    products.forEach((product, i) => {
      const categoryInfo = product.category 
        ? `${product.category.nom} (ID: ${product.category.id})` 
        : product.categoryId 
          ? `ID: ${product.categoryId} (objet manquant)`
          : 'Non catégorisé';
      
      console.log(`${i+1}. "${product.nom}" - ${categoryInfo}`);
    });
    console.log('===============================');
  }

  /**
   * Gestion d'erreur
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ ProductService Error:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 400) {
        errorMessage = 'Données invalides';
      } else if (error.status === 404) {
        errorMessage = 'Non trouvé';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Obtient le nom de la catégorie d'un produit
   */
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