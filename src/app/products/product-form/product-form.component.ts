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
  productForm: FormGroup;
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
  ) {
    // Initialiser le formulaire
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

  ngOnInit(): void {
    this.loadCategories();
    this.checkEditMode();
  }

  // Charger les catégories
  private loadCategories(): void {
    this.loading = true;
    
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log(`✅ ${categories.length} catégories chargées`);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur catégories:', err);
        this.errorMessage = 'Erreur lors du chargement des catégories';
        this.loading = false;
      }
    });
  }

  // Vérifier si on est en mode édition
  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && !isNaN(+id)) {
      this.isEditMode = true;
      this.productId = +id;
      this.loadProduct();
    }
  }

  // Charger le produit à modifier
  private loadProduct(): void {
    if (!this.productId) return;
    
    this.loading = true;
    
    this.productService.getById(this.productId).subscribe({
      next: (product) => {
        console.log('📦 Produit chargé:', {
          nom: product.nom,
          categoryId: product.categoryId,
          category: product.category
        });
        
        // Déterminer la valeur de categoryId
        let categoryIdValue = '';
        
        if (product.categoryId) {
          categoryIdValue = product.categoryId.toString();
          console.log(`🎯 Utilisation categoryId: ${categoryIdValue}`);
        } else if (product.category && product.category.id) {
          categoryIdValue = product.category.id.toString();
          console.log(`🎯 Utilisation category.id: ${categoryIdValue}`);
        }
        
        // Remplir le formulaire
        this.productForm.patchValue({
          nom: product.nom,
          description: product.description,
          prix: product.prix,
          stock: product.stock,
          imageUrl: product.imageUrl || '',
          actif: product.actif !== false,
          categoryId: categoryIdValue
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement du produit';
        this.loading = false;
      }
    });
  }

  // Soumettre le formulaire
  onSubmit(): void {
    // Vérifier la validité
    if (this.productForm.invalid) {
      this.markAllAsTouched();
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const formValues = this.productForm.value;
    console.log('📋 Valeurs du formulaire:', formValues);
    
    // Préparer les données
    const productData = {
      nom: formValues.nom,
      description: formValues.description,
      prix: formValues.prix,
      stock: formValues.stock,
      imageUrl: formValues.imageUrl || null,
      categoryId: Number(formValues.categoryId), // CONVERTIR EN NOMBRE
      actif: formValues.actif
    };
    
    console.log('🚀 Données à envoyer:', productData);
    
    if (this.isEditMode && this.productId) {
      // Modification
      this.productService.update(this.productId, productData).subscribe({
        next: (response) => {
          this.handleSuccess('Produit modifié avec succès !');
        },
        error: (err) => {
          this.handleError('Erreur lors de la modification', err);
        }
      });
    } else {
      // Création
      this.productService.create(productData).subscribe({
        next: (response) => {
          this.handleSuccess('Produit créé avec succès !');
        },
        error: (err) => {
          this.handleError('Erreur lors de la création', err);
        }
      });
    }
  }

  // Gérer le succès
  private handleSuccess(message: string): void {
    this.successMessage = message;
    this.loading = false;
    
    // Redirection après 2 secondes
    setTimeout(() => {
      this.router.navigate(['/products']);
    }, 2000);
  }

  // Gérer l'erreur
  private handleError(context: string, error: any): void {
    console.error(`❌ ${context}:`, error);
    this.errorMessage = error.message || context;
    this.loading = false;
  }

  // Annuler
  onCancel(): void {
    this.router.navigate(['/products']);
  }

  // Marquer tous les champs comme touchés (pour validation)
  private markAllAsTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  // ==================== GETTERS POUR LE TEMPLATE ====================

  get nom() { return this.productForm.get('nom'); }
  get description() { return this.productForm.get('description'); }
  get prix() { return this.productForm.get('prix'); }
  get stock() { return this.productForm.get('stock'); }
  get categoryId() { return this.productForm.get('categoryId'); }
  get imageUrl() { return this.productForm.get('imageUrl'); }

  // Nom de la catégorie sélectionnée
  get selectedCategoryName(): string {
    const categoryId = this.categoryId?.value;
    
    if (!categoryId) return 'Non sélectionnée';
    
    const category = this.categories.find(c => c.id === Number(categoryId));
    return category ? `${category.nom} (ID: ${category.id})` : 'Catégorie inconnue';
  }

  // Compteur de caractères pour la description
  get characterCount(): number {
    return this.description?.value?.length || 0;
  }

  get maxCharacters(): number {
    return 500;
  }

  // Messages d'erreur
  getValidationMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    
    if (!control || !control.errors || !control.touched) return '';
    
    if (control.errors['required']) return 'Ce champ est obligatoire';
    if (control.errors['minlength']) return 'Trop court';
    if (control.errors['maxlength']) return 'Trop long';
    if (control.errors['min']) return 'Valeur trop basse';
    
    return 'Valeur invalide';
  }
}