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
      categoryId: ['', Validators.required], // NOTE: On utilise categoryId au lieu de category
      actif: [true]
    });
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        console.log('✅ Catégories chargées:', categories);
        this.categories = categories;
        
        // Vérification
        if (categories.length > 0) {
          console.log('📋 Liste des catégories:');
          categories.forEach(cat => {
            console.log(`   ID: ${cat.id} - Nom: ${cat.nom}`);
          });
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement catégories:', err);
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
        console.log('📦 Produit chargé:', product);
        
        // Récupère l'ID de la catégorie
        let categoryIdValue = '';
        
        if (product.category && product.category.id) {
          categoryIdValue = product.category.id.toString();
          console.log(`🎯 Catégorie trouvée: ID=${categoryIdValue}, Nom=${product.category.nom}`);
        } else if (product.categoryId) {
          categoryIdValue = product.categoryId.toString();
          console.log(`🎯 CategoryId trouvé: ${categoryIdValue}`);
        } else {
          console.warn('⚠️ Le produit n\'a pas de catégorie associée');
        }
        
        // Patch du formulaire
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

  onSubmit(): void {
    if (this.productForm.invalid) {
      console.log('❌ Formulaire invalide');
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Récupère les valeurs du formulaire
    const formValues = this.productForm.value;
    console.log('📋 Valeurs du formulaire:', formValues);

    // Construit l'objet product AVEC categoryId
    const productData: any = {
      nom: formValues.nom,
      description: formValues.description,
      prix: formValues.prix,
      stock: formValues.stock,
      imageUrl: formValues.imageUrl || null,
      actif: formValues.actif,
      categoryId: Number(formValues.categoryId) // CONVERTIR EN NUMBER
    };

    console.log('🚀 === DONNÉES À ENVOYER ===');
    console.log('📦 ProductData:', productData);
    console.log('📡 JSON à envoyer:', JSON.stringify(productData, null, 2));
    console.log('============================');

    if (this.isEditMode && this.productId) {
      // MODIFICATION
      console.log(`✏️ Modification produit ID: ${this.productId}`);
      
      this.productService.update(this.productId, productData).subscribe({
        next: (response) => {
          console.log('✅ Réponse du serveur:', response);
          
          // Vérifiez la réponse
          if (response.category || response.categoryId) {
            console.log('🎉 Catégorie dans la réponse:', response.category || response.categoryId);
            this.successMessage = 'Produit modifié avec succès !';
          } else {
            console.warn('⚠️ La réponse ne contient pas de catégorie');
            this.successMessage = 'Produit modifié - Vérifiez la catégorie';
          }
          
          this.loading = false;
          
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 2000);
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          console.error('❌ Message:', err.message);
          this.errorMessage = err.message || 'Erreur lors de la modification';
          this.loading = false;
        }
      });
    } else {
      // CRÉATION
      console.log('🆕 Création d\'un nouveau produit');
      
      this.productService.create(productData).subscribe({
        next: (response) => {
          console.log('✅ Réponse création:', response);
          this.successMessage = 'Produit créé avec succès !';
          this.productForm.reset();
          this.loading = false;
          
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 2000);
        },
        error: (err) => {
          console.error('❌ Erreur création:', err);
          this.errorMessage = err.message || 'Erreur lors de la création';
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

  // Méthode pour obtenir le nom de la catégorie sélectionnée
  getSelectedCategoryName(): string {
    const categoryId = this.productForm.get('categoryId')?.value;
    
    if (!categoryId) return 'Non sélectionnée';
    
    const categoryIdNumber = Number(categoryId);
    const category = this.categories.find(cat => cat.id === categoryIdNumber);
    
    return category ? category.nom : 'Catégorie non trouvée';
  }
}