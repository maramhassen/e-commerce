import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

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

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      motDePasse: this.motDePasse,
      role: 'CLIENT' // Par défaut
    };

    this.authService.register(userData).subscribe({
      next: (response: any) => {
        console.log('Inscription réussie:', response);
        
        // Auto-login après inscription
        if (response.token && response.user) {
          this.authService.setToken(response.token);
          this.authService.setCurrentUser(response.user);
          this.successMessage = 'Inscription réussie ! Redirection...';
          
          // Redirection après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else {
          // Si pas d'auto-login, rediriger vers login
          this.successMessage = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'inscription:', err);
        
        if (err.status === 400) {
          this.errorMessage = 'Email déjà utilisé';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur';
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription';
        }
        
        this.loading = false;
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
}