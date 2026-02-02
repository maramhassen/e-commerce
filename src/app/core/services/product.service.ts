import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  // GET all products
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  // GET single product by ID
  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // POST create new product
  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  // PUT update existing product
  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  // DELETE product
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // GET products by category
  getByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  // SEARCH products
  search(keyword: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?keyword=${keyword}`);
  }
}