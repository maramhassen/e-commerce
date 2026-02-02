import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/core/services/product.service';
import { CategoryService } from 'src/app/core/services/category.service';
import { Product } from 'src/app/models/product';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  categories: Category[] = [];
  
  isEditMode = false;
  productId?: number;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.checkEditMode();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      prix: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      imageUrl: [''],
      categoryId: ['', Validators.required],
      actif: [true]
    });
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
        this.errorMessage = 'Erreur lors du chargement des catégories';
        this.loading = false;
      }
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = +id;
      this.loadProduct();
    }
  }

  private loadProduct(): void {
    if (!this.productId) return;
    
    this.loading = true;
    this.errorMessage = '';
    
    this.productService.getById(this.productId).subscribe({
      next: (product) => {
        console.log('Produit chargé:', product);
        
        this.productForm.patchValue({
          nom: product.nom,
          description: product.description,
          prix: product.prix,
          stock: product.stock,
          imageUrl: product.imageUrl || '',
          actif: product.actif !== false
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement du produit';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const productData: Product = this.productForm.value;
    console.log('Données envoyées:', productData);

    if (this.isEditMode && this.productId) {
      // Modification
      this.productService.update(this.productId, productData).subscribe({
        next: (response) => {
          console.log('Produit modifié:', response);
          this.successMessage = 'Produit modifié avec succès !';
          this.loading = false;
          
          // Redirection après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 2000);
        },
        error: (err) => {
          console.error('Erreur modification:', err);
          this.errorMessage = err.error?.message || 'Erreur lors de la modification';
          this.loading = false;
        }
      });
    } else {
      // Création
      this.productService.create(productData).subscribe({
        next: (response) => {
          console.log('Produit créé:', response);
          this.successMessage = 'Produit créé avec succès !';
          this.productForm.reset();
          this.loading = false;
          
          // Redirection après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 2000);
        },
        error: (err) => {
          console.error('Erreur création:', err);
          this.errorMessage = err.error?.message || 'Erreur lors de la création';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  private markAllAsTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters pour les contrôles
  get nom() { return this.productForm.get('nom'); }
  get description() { return this.productForm.get('description'); }
  get prix() { return this.productForm.get('prix'); }
  get stock() { return this.productForm.get('stock'); }
  get categoryId() { return this.productForm.get('categoryId'); }
  get imageUrl() { return this.productForm.get('imageUrl'); }
}