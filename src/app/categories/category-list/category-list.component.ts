import { Component, OnInit } from '@angular/core';
import { CategoryService } from 'src/app/core/services/category.service';
import { Category } from 'src/app/models/category';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit {

  categories: Category[] = [];
  errorMessage = '';

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des catégories';
      }
    });
  }

  deleteCategory(id?: number) {
    if (!id) return;

    if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      this.categoryService.delete(id).subscribe({
        next: () => {
          this.loadCategories(); // Recharger la liste après suppression
        },
        error: () => {
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  goToAdd() {
    this.router.navigate(['/categories/new']);
  }

  goToEdit(id?: number) {
    if (!id) return;
    this.router.navigate(['/categories/edit', id]);
  }
  getDescription(description?: string): string {
  return description || '-';
}
}