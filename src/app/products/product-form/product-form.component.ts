import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/core/services/product.service';
import { CategoryService } from 'src/app/core/services/category.service';
import { Product } from 'src/app/models/product';
import { Category } from 'src/app/models/category';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  productForm: FormGroup;
  categories: Category[] = [];
  
  isEditMode = false;
  productId?: number;
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Variables pour l'image
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  currentImageUrl: string = 'assets/images/default-product.jpg';
  hasExistingImage = false;
  existingImageName: string | null = null;

  private apiUrl = 'http://localhost:8080/api/products';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.productForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      prix: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      categoryId: ['', Validators.required],
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.checkEditMode();
  }

  // ==================== GESTION DES IMAGES ====================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File): void {
    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.';
      return;
    }
    
    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.errorMessage = `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(2)} MB). Taille max: 10MB`;
      return;
    }
    
    this.selectedFile = file;
    this.errorMessage = '';
    
    // Créer une prévisualisation
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
    
    console.log('📸 Fichier sélectionné:', file.name, `(${(file.size / 1024).toFixed(1)} KB)`);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    
    // Réinitialiser l'input file
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    
    console.log('🗑️ Image sélectionnée supprimée');
  }

  removeExistingImage(): void {
    this.currentImageUrl = 'assets/images/default-product.jpg';
    this.hasExistingImage = false;
    this.existingImageName = null;
    this.imagePreview = null;
    
    console.log('🗑️ Image existante supprimée');
  }

  // ==================== UTILITAIRES IMAGE ====================

  isLocalImageUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith('assets/') || 
           url.startsWith('data:') || 
           url.startsWith('blob:');
  }

  getDisplayImageUrl(): string {
    if (this.imagePreview) {
      return this.imagePreview.toString();
    }
    
    if (this.hasExistingImage && this.currentImageUrl) {
      return this.productService.getImageUrl(this.currentImageUrl);
    }
    
    return 'assets/images/default-product.jpg';
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

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

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && !isNaN(+id)) {
      this.isEditMode = true;
      this.productId = +id;
      this.loadProduct();
    } else {
      this.loading = false;
    }
  }

  private loadProduct(): void {
    if (!this.productId) return;
    
    this.loading = true;
    
    this.productService.getById(this.productId).subscribe({
      next: (product) => {
        console.log('📦 Produit chargé:', product);
        
        // Gérer l'image existante
        if (product.imageUrl && product.imageUrl !== 'assets/images/default-product.jpg') {
          this.currentImageUrl = product.imageUrl;
          this.hasExistingImage = true;
          this.existingImageName = this.productService.extractFileName(product.imageUrl);
          
          // Créer une prévisualisation avec l'URL complète
          this.imagePreview = this.productService.getImageUrl(product.imageUrl);
          
          console.log('📷 Image existante:', this.existingImageName);
        }
        
        // Remplir le formulaire
        this.productForm.patchValue({
          nom: product.nom,
          description: product.description,
          prix: product.prix,
          stock: product.stock,
          categoryId: product.categoryId?.toString() || product.category?.id?.toString() || '',
          actif: product.actif !== false
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

  // ==================== SOUMISSION DU FORMULAIRE ====================

  onSubmit(): void {
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
      categoryId: Number(formValues.categoryId),
      actif: formValues.actif,
      imageUrl: this.existingImageName
    };
    
    console.log('🚀 Données à envoyer:', productData);
    console.log('📸 Fichier sélectionné:', this.selectedFile?.name || 'Aucun');
    console.log('🖼️ Image existante:', this.existingImageName);
    
    // Test direct (décommentez pour tester)
    // this.testDirectUpload();
    // return;
    
    if (this.isEditMode && this.productId) {
      // ============ MODIFICATION ============
      if (this.selectedFile) {
        // Nouvelle image à uploader - Méthode directe
        this.updateProductWithImage(this.productId, productData);
      } else if (!this.hasExistingImage && !this.selectedFile) {
        // Aucune image - supprimer l'image existante
        productData.imageUrl = null;
        this.updateProduct(this.productId, productData);
      } else {
        // Garder l'image existante
        this.updateProduct(this.productId, productData);
      }
    } else {
      // ============ CRÉATION ============
      if (this.selectedFile) {
        // Création avec image - Méthode directe
        this.createProductWithImage(productData);
      } else {
        // Création sans image
        productData.imageUrl = null;
        this.createProduct(productData);
      }
    }
  }

  // ==================== MÉTHODES D'UPLOAD DIRECT ====================

  private createProductWithImage(productData: any): void {
    console.log('🚀 Création produit avec image (méthode directe)');
    
    const formData = new FormData();
    
    // Ajouter l'image
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    
    // Préparer les données du produit (imageUrl = null pour que le backend génère)
    const formValue = this.productForm.value;

const productForUpload = {
  nom: formValue.nom,
  description: formValue.description,
  prix: formValue.prix,
  stock: formValue.stock,
  actif: formValue.actif,
  imageUrl: null,
  category: {
    id: formValue.categoryId
  }
};

    
    formData.append('product', JSON.stringify(productForUpload));
    
    console.log('📤 FormData créé:', {
      hasImage: !!this.selectedFile,
      productData: productForUpload
    });
    
    // Appel direct à l'API
    this.http.post<Product>(`${this.apiUrl}/upload`, formData).subscribe({
      next: (createdProduct) => {
        console.log('✅ Produit créé avec image:', createdProduct);
        this.handleSuccess('Produit créé avec succès !');
      },
      error: (err) => {
        console.error('❌ Erreur création avec image:', err);
        this.handleError('Erreur lors de la création du produit', err);
      }
    });
  }

  private updateProductWithImage(id: number, productData: any): void {
    console.log(`✏️ Mise à jour produit ${id} avec image (méthode directe)`);
    
    const formData = new FormData();
    
    // Ajouter l'image
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    
    // Préparer les données du produit
    const formValue = this.productForm.value;

const productForUpload = {
  nom: formValue.nom,
  description: formValue.description,
  prix: formValue.prix,
  stock: formValue.stock,
  actif: formValue.actif,
  imageUrl: null,
  category: {
    id: formValue.categoryId
  }
};

    
    formData.append('product', JSON.stringify(productForUpload));
    
    console.log('📤 FormData pour mise à jour:', {
      productId: id,
      hasImage: !!this.selectedFile,
      productData: productForUpload
    });
    
    // Appel direct à l'API
    this.http.put<Product>(`${this.apiUrl}/${id}/upload`, formData).subscribe({
      next: (updatedProduct) => {
        console.log('✅ Produit mis à jour avec image:', updatedProduct);
        this.handleSuccess('Produit modifié avec succès !');
      },
      error: (err) => {
        console.error('❌ Erreur mise à jour avec image:', err);
        this.handleError('Erreur lors de la modification du produit', err);
      }
    });
  }

  private createProduct(productData: any): void {
    console.log('📝 Création produit sans image');
    
    this.productService.create(productData).subscribe({
      next: (response) => {
        this.handleSuccess('Produit créé avec succès !');
      },
      error: (err) => {
        this.handleError('Erreur lors de la création', err);
      }
    });
  }

  private updateProduct(id: number, productData: any): void {
    console.log(`📝 Mise à jour produit ${id} sans nouvelle image`);
    
    this.productService.update(id, productData).subscribe({
      next: (response) => {
        this.handleSuccess('Produit modifié avec succès !');
      },
      error: (err) => {
        this.handleError('Erreur lors de la modification', err);
      }
    });
  }

  // ==================== MÉTHODE DE TEST DIRECT ====================

  testDirectUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = '❌ Aucun fichier sélectionné pour le test';
      return;
    }
    
    console.log('🧪 Test direct d\'upload');
    
    // Données de test
    const testProductData = {
      nom: 'Test Upload - ' + new Date().toLocaleTimeString(),
      description: 'Ceci est un test d\'upload direct depuis Angular',
      prix: 99.99,
      stock: 5,
      categoryId: 1,
      actif: true,
      imageUrl: null
    };
    
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('product', JSON.stringify(testProductData));
    
    console.log('🧪 Données de test envoyées:', {
      fileName: this.selectedFile.name,
      fileSize: this.selectedFile.size,
      fileType: this.selectedFile.type,
      productData: testProductData
    });
    
    this.http.post<Product>(`${this.apiUrl}/upload`, formData).subscribe({
      next: (response) => {
        console.log('✅ Test réussi:', response);
        
        // Afficher les détails
        alert(`🎉 TEST RÉUSSI !\n\n` +
              `Produit créé: ${response.nom}\n` +
              `ID: ${response.id}\n` +
              `Image: ${response.imageUrl}\n\n` +
              `Vérifiez dans la liste des produits.`);
        
        this.successMessage = 'Test d\'upload réussi !';
      },
      error: (error) => {
        console.error('❌ Test échoué:', error);
        
        let errorMessage = 'Erreur inconnue';
        
        if (error.status === 404) {
          errorMessage = `Endpoint non trouvé. Vérifiez:\n\n` +
                        `URL: ${error.url}\n` +
                        `1. Le backend est-il démarré ?\n` +
                        `2. L'endpoint existe-t-il ?\n` +
                        `3. CORS est-il configuré ?`;
        } else if (error.status === 415) {
          errorMessage = 'Type de contenu non supporté';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur: ' + (error.error?.error || error.message);
        } else if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Détails erreur:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: error.error
        });
        
        this.errorMessage = errorMessage;
        alert('❌ ERREUR TEST: ' + errorMessage);
      }
    });
  }

  // ==================== GESTION DES RÉSULTATS ====================

  private handleSuccess(message: string): void {
    this.successMessage = message;
    this.loading = false;
    
    console.log('✅ Success:', message);
    
    // Redirection après 2 secondes
    setTimeout(() => {
      this.router.navigate(['/products']);
    }, 2000);
  }

  private handleError(context: string, error: any): void {
    console.error(`❌ ${context}:`, error);
    
    let errorMsg = context;
    
    if (error instanceof Error) {
      if (error.message.includes('trop volumineux')) {
        errorMsg = 'L\'image est trop volumineuse (max 10MB)';
      } else if (error.message.includes('images sont autorisées')) {
        errorMsg = 'Seules les images sont acceptées (JPG, PNG, GIF)';
      } else if (error.message.includes('404')) {
        errorMsg = `Endpoint non trouvé. Vérifiez que le backend est démarré.`;
      } else if (error.message.includes('Network Error') || error.message.includes('0 Unknown Error')) {
        errorMsg = 'Impossible de se connecter au serveur. Vérifiez:\n' +
                  '1. Le backend Spring Boot est démarré\n' +
                  '2. L\'URL est correcte: http://localhost:8080\n' +
                  '3. CORS est configuré';
      } else {
        errorMsg = error.message;
      }
    } else if (error.error && error.error.error) {
      errorMsg = error.error.error;
    } else if (error.status === 404) {
      errorMsg = `L'endpoint ${error.url} n'existe pas`;
    } else if (error.status === 500) {
      errorMsg = 'Erreur serveur interne';
    }
    
    this.errorMessage = errorMsg;
    this.loading = false;
    
    console.error('Erreur détaillée:', {
      context,
      error,
      message: errorMsg
    });
  }

  // ==================== UTILITAIRES ====================

  onCancel(): void {
    if (confirm('Voulez-vous vraiment annuler ? Les modifications non sauvegardées seront perdues.')) {
      this.router.navigate(['/products']);
    }
  }

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

  get selectedCategoryName(): string {
    const categoryId = this.categoryId?.value;
    
    if (!categoryId) return 'Non sélectionnée';
    
    const category = this.categories.find(c => c.id === Number(categoryId));
    return category ? `${category.nom} (ID: ${category.id})` : 'Catégorie inconnue';
  }

  get characterCount(): number {
    return this.description?.value?.length || 0;
  }

  get maxCharacters(): number {
    return 500;
  }

  getValidationMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    
    if (!control || !control.errors || !control.touched) return '';
    
    if (control.errors['required']) return 'Ce champ est obligatoire';
    if (control.errors['minlength']) return 'Trop court (min 2 caractères)';
    if (control.errors['maxlength']) return 'Trop long';
    if (control.errors['min']) return 'Valeur trop basse';
    
    return 'Valeur invalide';
  }

  get canSubmit(): boolean {
    return this.productForm.valid && !this.loading;
  }

  // ==================== BOUTON TEST OPTIONNEL ====================
  
  // Ajoutez cette méthode si vous voulez un bouton de test dans le template
  onTestUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Veuillez d\'abord sélectionner une image';
      return;
    }
    
    this.testDirectUpload();
  }
}