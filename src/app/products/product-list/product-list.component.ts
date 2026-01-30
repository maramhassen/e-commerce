import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { Product } from 'src/app/models/product';

@Component({
  selector: 'app-product-list',
  template: `
    <h2>Products</h2>
    <div *ngFor="let p of products">
      {{ p.name }} - {{ p.price }} DT
      <button (click)="delete(p.id!)">Delete</button>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.productService.getAll().subscribe(data => this.products = data);
  }

  delete(id: number) {
    this.productService.delete(id).subscribe(() =>
      this.products = this.products.filter(p => p.id !== id)
    );
  }
}
