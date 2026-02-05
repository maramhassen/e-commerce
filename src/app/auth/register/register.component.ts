import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/models/user';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  nom = '';
  prenom = '';
  email = '';
  motDePasse = '';
  confirmPassword = '';
  
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Nouvelle propriété pour la redirection
  private returnUrl: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute // Ajouté pour récupérer les queryParams
  ) {}

  ngOnInit(): void {
    // Récupère l'URL de redirection
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '';
    });

    // Auto-remplissage pour le développement
    this.autoFillForDevelopment();
  }

  register() {
    // Validation
    if (!this.nom || !this.prenom || !this.email || !this.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.motDePasse !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.motDePasse.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Format d\'email invalide';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Création de l'objet User conforme à l'interface
    const userData: User = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      motDePasse: this.motDePasse,
      role: 'CLIENT' // Par défaut
    };

    console.log('Données d\'inscription envoyées:', userData);

    this.authService.register(userData).subscribe({
      next: (response: any) => {
        console.log('Inscription réussie:', response);
        this.loading = false;
        
        // Redirection après inscription
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          // Auto-redirection après inscription réussie
          this.successMessage = 'Inscription réussie ! Redirection...';
          
          setTimeout(() => {
            this.authService.redirectBasedOnRole();
          }, 1500);
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'inscription:', err);
        this.loading = false;
        
        if (err.status === 400 || err.status === 409) {
          this.errorMessage = 'Email déjà utilisé';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
        } else if (err.status === 404) {
          this.errorMessage = 'Endpoint non trouvé. URL backend incorrecte.';
        } else if (err.status === 422) {
          this.errorMessage = 'Données invalides. Vérifiez les informations saisies.';
        } else if (err.status === 500) {
          this.errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        } else {
          this.errorMessage = err.error?.message || err.message || 'Erreur lors de l\'inscription';
        }
      }
    });
  }

  // Test de connexion au backend
  testBackend() {
    this.errorMessage = '';
    this.authService.testBackendConnection().subscribe({
      next: (result) => {
        console.log('Test backend réussi:', result);
        this.successMessage = '✓ Backend accessible';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Test backend échoué:', error);
        this.errorMessage = '✗ Backend inaccessible: ' + error.message;
      }
    });
  }

  resetForm() {
    this.nom = '';
    this.prenom = '';
    this.email = '';
    this.motDePasse = '';
    this.confirmPassword = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Remplir avec des données de test
  fillTestData() {
    this.nom = 'Dupont';
    this.prenom = 'Jean';
    this.email = 'jean.dupont@example.com';
    this.motDePasse = 'password123';
    this.confirmPassword = 'password123';
  }

  // Méthode d'auto-remplissage pour le développement
  private autoFillForDevelopment(): void {
    // Auto-remplissage en mode développement
    if (!environment.production) {
      // Vous pouvez activer/désactiver cette fonctionnalité
      const autoFillEnabled = true;
      
      if (autoFillEnabled) {
        this.nom = 'Dupont';
        this.prenom = 'Jean';
        this.email = 'jean.dupont@example.com';
        this.motDePasse = 'password123';
        this.confirmPassword = 'password123';
      }
    }
  }

  // Retour à la page de login
  goToLogin() {
    // Préserver l'URL de retour si elle existe
    const queryParams = this.returnUrl ? { returnUrl: this.returnUrl } : {};
    this.router.navigate(['/auth/login'], { queryParams });
  }
}