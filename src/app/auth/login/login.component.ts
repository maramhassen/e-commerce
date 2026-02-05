import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  email = '';
  motDePasse = '';
  errorMessage = '';
  loading = false;
  debugInfo = '';
  usersList: any[] = [];
  
  // Nouvelle propriété pour la redirection
  private returnUrl: string = '';
  showExpiredMessage = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute // Ajouté pour récupérer les queryParams
  ) {}

  ngOnInit(): void {
    // Vérifie si la session a expiré
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '';
      this.showExpiredMessage = params['sessionExpired'] === 'true';
      
      if (this.showExpiredMessage) {
        this.errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
      }
    });

    // Auto-remplissage pour le développement
    this.autoFillForDevelopment();
  }

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
        this.loading = false;

        // Redirection après login réussi
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          // Utilisez la méthode du service pour la redirection
          this.authService.redirectBasedOnRole();
        }
      },
      error: (err) => {
        console.error('Erreur lors du login:', err);
        this.loading = false;
        
        // Gestion des erreurs spécifiques
        if (err.message === 'Identifiants incorrects') {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur localhost:8080';
        } else if (err.status === 404) {
          this.errorMessage = 'Endpoint non trouvé. Vérifiez l\'URL du backend.';
          this.debugInfo = `URL utilisée: http://localhost:8080/api/users`;
        } else if (err.status === 401) {
          this.errorMessage = 'Identifiants invalides';
        } else {
          this.errorMessage = err.message || 'Erreur lors de la connexion';
        }
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

  // Méthode d'auto-remplissage pour le développement
  private autoFillForDevelopment(): void {
    // Auto-remplissage en mode développement
    if (!environment.production) {
      // Vous pouvez activer/désactiver cette fonctionnalité
      const autoFillEnabled = true;
      
      if (autoFillEnabled) {
        this.email = 'admin@example.com';
        this.motDePasse = 'admin123';
        // this.email = 'client@example.com';
        // this.motDePasse = 'client123';
      }
    }
  }

  // Navigation vers l'inscription
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  // Réinitialiser le formulaire
  resetForm(): void {
    this.email = '';
    this.motDePasse = '';
    this.errorMessage = '';
    this.debugInfo = '';
  }
}