import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'app-category-list',
  template: `
    <h2>Categories</h2>
    <ul>
      <li *ngFor="let c of categories">
        {{ c.name }}
      </li>
    </ul>
  `
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe(data => this.categories = data);
  }
}
