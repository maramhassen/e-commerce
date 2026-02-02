import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'src/app/core/services/category.service';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html'
})
export class CategoryFormComponent implements OnInit {
  categoryForm!: FormGroup;
  isEditMode = false;
  categoryId?: number;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.categoryId = +id;
      this.loadCategory();
    }
  }

  private loadCategory(): void {
    if (!this.categoryId) return;
    
    this.loading = true;
    this.categoryService.getById(this.categoryId).subscribe({
      next: (category) => {
        this.categoryForm.patchValue({
          nom: category.nom,
          description: category.description
        });
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement de la catégorie';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const categoryData: Category = this.categoryForm.value;

    if (this.isEditMode && this.categoryId) {
      // Modification
      this.categoryService.update(this.categoryId, categoryData).subscribe({
        next: () => {
          this.router.navigate(['/categories']);
        },
        error: () => {
          this.errorMessage = 'Erreur lors de la modification';
          this.loading = false;
        }
      });
    } else {
      // Création
      this.categoryService.create(categoryData).subscribe({
        next: () => {
          this.router.navigate(['/categories']);
        },
        error: () => {
          this.errorMessage = 'Erreur lors de la création';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/categories']);
  }

  // Getters pour faciliter l'accès aux contrôles
  get nom() {
    return this.categoryForm.get('nom');
  }

  get description() {
    return this.categoryForm.get('description');
  }
}