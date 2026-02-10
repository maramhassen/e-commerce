import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  product: Product | null = null;
  loading = true;
  errorMessage = '';
  quantity = 1;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadProduct();
  }

  private checkAuthStatus(): void {
    this.isAdmin = this.authService.isAdmin();
    console.log('Admin status:', this.isAdmin);
  }

  // ========== CHARGEMENT DU PRODUIT ==========
  private loadProduct(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Produit non trouvé';
      this.loading = false;
      return;
    }

    console.log('Chargement du produit ID:', id);

    this.productService.getById(+id).subscribe({
      next: (product) => {
        console.log('Produit chargé:', {
          nom: product.nom,
          imageUrl: product.imageUrl
        });
        
        this.product = product;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement:', error);
        this.errorMessage = 'Erreur lors du chargement du produit';
        this.loading = false;
      }
    });
  }

  // ========== GESTION ERREUR IMAGE ==========
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-product.jpg';
  }

  // ========== GETTER POUR L'IMAGE ==========
  get productImage(): string {
    if (!this.product || !this.product.imageUrl) {
      return 'assets/images/default-product.jpg';
    }
    
    // Si c'est déjà une URL complète
    if (this.product.imageUrl.startsWith('http') || this.product.imageUrl.startsWith('data:')) {
      return this.product.imageUrl;
    }
    
    // Construire l'URL via le service
    return this.productService.getImageUrl(this.product.imageUrl);
  }

  // ========== MÉTHODE PRINCIPALE DE SUPPRESSION ==========
  deleteProduct(): void {
    if (!this.product?.id) {
      alert('❌ Produit invalide');
      return;
    }

    const productName = this.product.nom || 'ce produit';
    
    const confirmation = confirm(
      `TRAITEMENT DU PRODUIT\n\n` +
      `Nom: "${productName}"\n` +
      `Prix: ${this.product.prix} €\n\n` +
      `QUE VOULEZ-VOUS FAIRE ?\n\n` +
      `• Si le produit N'EST PAS utilisé dans des commandes :\n` +
      `  → Il sera SUPPRIMÉ définitivement\n\n` +
      `• Si le produit EST utilisé dans des commandes :\n` +
      `  → Il sera DÉSACTIVÉ (masqué du catalogue)\n` +
      `  → Il reste dans la base de données\n\n` +
      `Confirmez-vous cette action ?`
    );

    if (!confirmation) {
      console.log('Suppression annulée par l\'utilisateur');
      return;
    }

    console.log(`🚀 Début du traitement du produit ID: ${this.product.id}`);

    this.productService.delete(this.product.id).subscribe({
      next: () => {
        this.handleDeleteSuccess();
      },
      error: (error: Error) => {
        this.handleDeleteError(error);
      }
    });
  }

  // ========== MÉTHODE ALTERNATIVE AVEC CHOIX ==========
  deleteProductWithOptions(): void {
    if (!this.product?.id) return;

    const productName = this.product.nom;
    
    const choice = prompt(
      `OPTIONS POUR "${productName}"\n\n` +
      `1 - Supprimer (tenter suppression complète)\n` +
      `2 - Désactiver seulement (recommandé)\n` +
      `3 - Annuler\n\n` +
      `Entrez 1, 2 ou 3 :`
    );

    switch (choice) {
      case '1':
        this.tryHardDelete();
        break;
      case '2':
        this.deactivateOnly();
        break;
      case '3':
        console.log('Action annulée');
        break;
      default:
        alert('❌ Choix invalide');
    }
  }

  // ========== MÉTHODE POUR DÉSACTIVER SEULEMENT ==========
  deactivateOnly(): void {
    if (!this.product?.id) return;

    const productName = this.product.nom || 'ce produit';
    
    const confirmDeactivate = confirm(
      `DÉSACTIVER LE PRODUIT\n\n` +
      `Nom: "${productName}"\n\n` +
      `Cette action va :\n` +
      `• Masquer le produit du catalogue\n` +
      `• Le garder dans la base de données\n` +
      `• Permettre sa réactivation ultérieure\n\n` +
      `Confirmez-vous la désactivation ?`
    );

    if (!confirmDeactivate) return;

    console.log(`🔧 Désactivation du produit ID: ${this.product.id}`);

    const updatedProduct: Product = {
      ...this.product,
      actif: false
    };

    this.productService.update(this.product.id, updatedProduct).subscribe({
      next: (updated) => {
        this.product = updated;
        
        alert(`✅ SUCCÈS\n\n` +
              `"${productName}" a été DÉSACTIVÉ.\n\n` +
              `• Statut: Masqué du catalogue\n` +
              `• Peut être réactivé ultérieurement\n` +
              `• Redirection dans 3 secondes...`);
        
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 3000);
      },
      error: (error: Error) => {
        console.error('Erreur désactivation:', error);
        
        alert(`❌ ÉCHEC DE LA DÉSACTIVATION\n\n` +
              `Impossible de désactiver "${productName}".\n\n` +
              `Erreur: ${error.message || 'Problème de connexion'}`);
      }
    });
  }

  // ========== MÉTHODES AUXILIAIRES ==========
  private tryHardDelete(): void {
    if (!this.product?.id) return;

    console.log('Tentative de suppression complète...');
    
    this.productService.delete(this.product.id).subscribe({
      next: () => {
        this.handleDeleteSuccess();
      },
      error: (error: Error) => {
        alert(`❌ Suppression échouée\n\n` +
              `Message: ${error.message}\n\n` +
              `Essayez la désactivation à la place.`);
        
        const tryDeactivate = confirm('Voulez-vous désactiver le produit à la place ?');
        if (tryDeactivate) {
          this.deactivateOnly();
        }
      }
    });
  }

  private handleDeleteSuccess(): void {
    const productName = this.product?.nom || 'Le produit';
    
    alert(`✅ ACTION RÉUSSIE\n\n` +
          `"${productName}" a été traité avec succès.\n\n` +
          `Deux possibilités :\n` +
          `1. Il a été SUPPRIMÉ définitivement\n` +
          `2. Il a été DÉSACTIVÉ (s'il était utilisé)\n\n` +
          `Redirection vers la liste des produits...`);
    
    this.router.navigate(['/products']);
  }

  private handleDeleteError(error: Error): void {
    const productName = this.product?.nom || 'Le produit';
    
    console.error('Erreur suppression:', error);
    
    alert(`❌ ERREUR CRITIQUE\n\n` +
          `Traitement de "${productName}" échoué.\n\n` +
          `Détails : ${error.message}\n\n` +
          `Contactez l'administrateur si le problème persiste.`);
  }

  // ========== MÉTHODE DE TEST (DEBUG) ==========
  testDirectDelete(): void {
    if (!this.product?.id) return;

    const url = `http://localhost:8080/api/products/${this.product.id}`;
    console.log('🔍 Test DELETE direct vers:', url);
    
    fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    .then(async response => {
      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        body: await response.text()
      };
      
      console.log('📊 Réponse brute du backend:', result);
      
      if (response.ok) {
        alert(`✅ BACKEND RÉPONSE 200\n\n` +
              `Le produit a été supprimé avec succès.\n\n` +
              `Redirection...`);
        this.router.navigate(['/products']);
      } else if (response.status === 500) {
        alert(`⚠️ BACKEND RÉPONSE 500\n\n` +
              `Le backend a retourné une erreur 500.\n` +
              `En production, cela signifie généralement que le produit\n` +
              `a été désactivé (soft delete) car il est utilisé.\n\n` +
              `Redirection...`);
        this.router.navigate(['/products']);
      } else {
        alert(`❌ BACKEND RÉPONSE ${response.status}\n\n` +
              `Status: ${response.status} ${response.statusText}\n` +
              `Body: ${result.body}`);
      }
    })
    .catch(networkError => {
      console.error('Erreur réseau:', networkError);
      alert(`🌐 ERREUR RÉSEAU\n\n` +
            `Impossible de contacter le serveur.\n` +
            `Vérifiez que le backend est démarré.`);
    });
  }

  // ========== AUTRES MÉTHODES EXISTANTES ==========
  addToCart(): void {
    if (!this.isAdmin && this.product) {
      this.cartService.addProductToCartSimple(this.product.id!, this.quantity).subscribe({
        next: () => {
          alert(`${this.quantity} × ${this.product?.nom} ajouté au panier ✅`);
        },
        error: (err: any) => {
          console.error('Erreur panier:', err);
          alert('Erreur lors de l\'ajout au panier');
        }
      });
    }
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  editProduct(): void {
    if (this.product?.id) {
      this.router.navigate(['/products/edit', this.product.id]);
    }
  }

  // ========== GETTERS POUR LE TEMPLATE ==========
  get isInStock(): boolean {
    return (this.product?.stock || 0) > 0;
  }

  get stockStatus(): string {
    if (!this.product) return '';
    
    if (this.product.stock === 0) return 'Rupture de stock';
    if (this.product.stock <= 5) return `Seulement ${this.product.stock} restant(s)`;
    return `En stock (${this.product.stock})`;
  }

  get stockStatusColor(): string {
    if (!this.product) return 'secondary';
    
    if (this.product.stock === 0) return 'danger';
    if (this.product.stock <= 5) return 'warning';
    return 'success';
  }

  get canAddToCart(): boolean {
    return this.isInStock && !this.isAdmin;
  }
}