import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  motDePasse = '';
  errorMessage = '';
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login() {
    if (!this.email || !this.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.motDePasse).subscribe({
      next: (response: any) => {
        console.log('Login réussi:', response);
        
        // Stocker le token
        if (response.token) {
          this.authService.setToken(response.token);
        }
        
        // Stocker l'utilisateur
        if (response.user) {
          this.authService.setCurrentUser(response.user);
        }
        
        // Redirection
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Erreur lors du login:', err);
        
        if (err.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur';
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la connexion';
        }
        
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Méthodes de test (optionnel)
  testAdminLogin() {
    this.email = 'admin@example.com';
    this.motDePasse = 'admin123';
    this.login();
  }

  testClientLogin() {
    this.email = 'client@example.com';
    this.motDePasse = 'client123';
    this.login();
  }
}