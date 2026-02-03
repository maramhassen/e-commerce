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
  debugInfo = '';
  usersList: any[] = []; // Pour afficher les utilisateurs disponibles

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // Test de connexion au backend
  testBackendConnection() {
    this.debugInfo = 'Test de connexion au backend...';
    this.authService.testBackendConnection().subscribe({
      next: (result) => {
        this.debugInfo = `✓ ${result.message}`;
        console.log('Backend test:', result);
      },
      error: (error) => {
        this.debugInfo = `✗ ${error.message}`;
        console.error('Backend test error:', error);
      }
    });
  }

  // Lister tous les utilisateurs (pour débogage)
  listAllUsers() {
    this.debugInfo = 'Récupération des utilisateurs...';
    this.authService.getAllUsersForDebug().subscribe({
      next: (users) => {
        this.usersList = users;
        this.debugInfo = `✓ ${users.length} utilisateur(s) trouvé(s):`;
        console.log('Utilisateurs:', users);
      },
      error: (error) => {
        this.debugInfo = `✗ Erreur: ${error.message}`;
        console.error('Erreur récupération users:', error);
      }
    });
  }

  login() {
    if (!this.email || !this.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.debugInfo = '';

    console.log(`Tentative de login pour: ${this.email}`);

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

          // Redirection selon le rôle
          if (response.user.role === 'CLIENT') {
            this.router.navigate(['/products']);
          } else {
            this.router.navigate(['/categories']);
          }
        }
      },
      error: (err) => {
        console.error('Erreur lors du login:', err);
        
        // Gestion des erreurs spécifiques
        if (err.message === 'Identifiants incorrects') {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur localhost:8080';
        } else if (err.status === 404) {
          this.errorMessage = 'Endpoint non trouvé. Vérifiez l\'URL du backend.';
          this.debugInfo = `URL utilisée: http://localhost:8080/api/users`;
        } else {
          this.errorMessage = err.message || 'Erreur lors de la connexion';
        }
        
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Méthodes de test avec des utilisateurs par défaut
  testAdminLogin() {
    // Essayez différents emails admin possibles
    const adminEmails = [
      'admin@example.com',
      'admin@gmail.com',
      'administrateur@example.com'
    ];
    
    // Utilisez le premier ou demandez à l'utilisateur
    this.email = adminEmails[0];
    this.motDePasse = 'admin123';
    this.login();
  }

  testClientLogin() {
    // Essayez différents emails client possibles
    const clientEmails = [
      'client@example.com',
      'user@gmail.com',
      'client@gmail.com'
    ];
    
    this.email = clientEmails[0];
    this.motDePasse = 'client123';
    this.login();
  }

  // Utiliser un utilisateur de la liste
  useUserFromList(user: any) {
    this.email = user.email;
    this.motDePasse = user.motDePasse;
    this.login();
  }
}