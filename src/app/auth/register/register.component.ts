import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  nom = '';
  prenom = '';
  email = '';
  motDePasse = '';
  confirmPassword = '';
  
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

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
        
        // Auto-login après inscription
        if (response.token && response.user) {
          this.authService.setToken(response.token);
          this.authService.setCurrentUser(response.user);
          this.successMessage = 'Inscription réussie ! Redirection...';
          
          // Redirection selon le rôle
          setTimeout(() => {
            if (response.user.role === 'ADMIN') {
              this.router.navigate(['/categories']);
            } else {
              this.router.navigate(['/products']);
            }
          }, 2000);
        } else {
          // Si pas d'auto-login, rediriger vers login
          this.successMessage = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'inscription:', err);
        
        if (err.status === 400 || err.status === 409) {
          this.errorMessage = 'Email déjà utilisé';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
        } else if (err.status === 404) {
          this.errorMessage = 'Endpoint non trouvé. URL backend incorrecte.';
        } else if (err.status === 422) {
          this.errorMessage = 'Données invalides. Vérifiez les informations saisies.';
        } else {
          this.errorMessage = err.error?.message || err.message || 'Erreur lors de l\'inscription';
        }
        
        this.loading = false;
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

  // Retour à la page de login
  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}