import { Component, OnInit, AfterViewInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit, AfterViewInit {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  isAdmin = false;
  currentUser: any = null;
  now = new Date();

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('=== UserListComponent initialisé ===');
    console.log('URL API UserService:', this.userService['apiUrl']);
    
    // Récupérer l'utilisateur connecté
    this.currentUser = this.authService.getCurrentUser();
    console.log('Utilisateur connecté:', this.currentUser);
    
    // Vérifier les permissions
    this.isAdmin = this.authService.isAdmin();
    console.log('Est admin?', this.isAdmin);
    console.log('Est authentifié?', this.authService.isAuthenticated());
    
    // Vérifications d'accès
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = '⚠️ Veuillez vous connecter pour accéder à cette page';
      console.error('Utilisateur non authentifié');
      return;
    }
    
    if (!this.isAdmin) {
      this.errorMessage = '🚫 Accès refusé. Seuls les administrateurs peuvent voir la liste des utilisateurs.';
      console.error('Utilisateur n\'est pas administrateur. Rôle:', this.currentUser?.role);
      return;
    }
    
    // Si tout est OK, charger les utilisateurs
    this.loadUsers();
  }

  ngAfterViewInit() {
    console.log('=== ÉTAT COMPLET DU COMPOSANT ===');
    console.log('Is Authenticated:', this.authService.isAuthenticated());
    console.log('Is Admin:', this.authService.isAdmin());
    console.log('Current User:', this.currentUser);
    console.log('Token exists:', !!this.authService.getToken());
    console.log('====================');
    
    // Tester l'API directement avec fetch pour debug
    this.testDirectApiCall();
  }

  testDirectApiCall() {
    console.log('=== TEST API DIRECT AVEC FETCH ===');
    fetch('http://localhost:8080/api/users')
      .then(response => {
        console.log('Fetch Response Status:', response.status, response.statusText);
        console.log('Fetch Response Headers:', response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log('Fetch Data reçu:', data);
        console.log('Type de données:', typeof data);
        console.log('Est un tableau?', Array.isArray(data));
        console.log('Nombre d\'éléments:', Array.isArray(data) ? data.length : 'N/A');
      })
      .catch(error => {
        console.error('Fetch Error:', error);
        console.error('Message d\'erreur:', error.message);
      });
  }

  loadUsers() {
    this.loading = true;
    this.errorMessage = '';
    
    console.log('=== DÉBUT CHARGEMENT UTILISATEURS ===');
    console.log('URL utilisée:', 'http://localhost:8080/api/users');
    
    // D'abord tester la connexion au backend
    this.authService.testBackendConnection().subscribe({
      next: (testResult) => {
        console.log('✅ Backend accessible:', testResult);
        
        // Maintenant charger les utilisateurs
        this.userService.getAll().subscribe({
          next: (data) => {
            console.log('✅ Données API reçues:', data);
            console.log('Type:', typeof data);
            console.log('Is Array:', Array.isArray(data));
            
            if (data && Array.isArray(data)) {
              this.users = data;
              console.log(`📊 ${data.length} utilisateur(s) chargé(s) avec succès`);
              
              if (data.length === 0) {
                console.warn('⚠️ Tableau d\'utilisateurs vide');
                this.errorMessage = 'La base de données ne contient aucun utilisateur.';
              }
            } else {
              console.error('❌ Format de données incorrect:', data);
              this.errorMessage = 'Le serveur a retourné un format de données inattendu.';
              this.users = [];
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement des utilisateurs:', error);
            this.handleError(error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Problème de connexion au backend:', error);
        this.errorMessage = this.getBackendErrorHtml(error);
        this.loading = false;
        
        // Charger des données mockées pour le développement
        console.log('Chargement de données mockées en mode développement...');
        this.loadMockData();
      }
    });
  }

  loadMockData() {
    console.log('Chargement de données mockées...');
    
    this.users = [
      {
        id: 1,
        nom: 'Administrateur',
        prenom: 'Système',
        email: 'admin@maboutique.com',
        motDePasse: '',
        role: 'ADMIN'
      },
      {
        id: 2,
        nom: 'Client',
        prenom: 'Premium',
        email: 'client.premium@test.com',
        motDePasse: '',
        role: 'CLIENT'
      },
      {
        id: 3,
        nom: this.currentUser?.nom || 'Dupont',
        prenom: this.currentUser?.prenom || 'Jean',
        email: this.currentUser?.email || 'jean.dupont@test.com',
        motDePasse: '',
        role: this.currentUser?.role || 'ADMIN'
      },
      {
        id: 4,
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'sophie.martin@example.com',
        motDePasse: '',
        role: 'CLIENT'
      },
      {
        id: 5,
        nom: 'Leroy',
        prenom: 'Thomas',
        email: 'thomas.leroy@example.com',
        motDePasse: '',
        role: 'CLIENT'
      }
    ];
    
    console.log(`✅ ${this.users.length} utilisateurs mockés chargés`);
    console.log('Données:', this.users);
  }

  getBackendErrorHtml(error: any): string {
    let html = '<div class="backend-error">';
    html += '<h5><i class="fas fa-server me-2"></i>Problème de connexion au serveur</h5>';
    html += '<p>Impossible de se connecter au backend. Vérifiez que:</p>';
    html += '<ul>';
    html += '<li>Le serveur Spring Boot est démarré</li>';
    html += '<li>Il écoute sur le port 8080</li>';
    html += '<li>L\'URL <code>http://localhost:8080</code> est accessible</li>';
    html += '<li>Le CORS est configuré pour autoriser localhost:4200</li>';
    html += '</ul>';
    html += '<p class="mb-0"><strong>Message d\'erreur:</strong> ' + (error.message || 'Inconnu') + '</p>';
    html += '</div>';
    return html;
  }

  handleError(error: any) {
    console.error('=== ERREUR DÉTAILLÉE ===');
    console.error('Status:', error.status);
    console.error('Status Text:', error.statusText);
    console.error('Message:', error.message);
    console.error('URL:', error.url);
    console.error('Error Object:', error.error);
    
    if (error.status === 0) {
      this.errorMessage = this.getBackendErrorHtml(error);
    } else if (error.status === 401) {
      this.errorMessage = '🔒 Session expirée. Veuillez vous reconnecter.';
      setTimeout(() => {
        this.authService.logout();
      }, 3000);
    } else if (error.status === 403) {
      this.errorMessage = '🚫 Accès interdit. Vous n\'avez pas les permissions d\'administrateur.';
    } else if (error.status === 404) {
      this.errorMessage = `🔍 Endpoint non trouvé: <code>${error.url}</code><br>
                          Vérifiez que l'API <code>/api/users</code> existe dans le backend.`;
    } else {
      this.errorMessage = `⚠️ Erreur ${error.status || 'inconnue'}: ${error.message || 'Problème de communication avec le serveur'}`;
    }
  }

  deleteUser(id: number) {
    if (!id) {
      console.error('ID utilisateur invalide');
      alert('ID utilisateur invalide');
      return;
    }
    
    const userToDelete = this.users.find(u => u.id === id);
    if (!userToDelete) {
      alert('Utilisateur non trouvé');
      return;
    }
    
    if (id === this.currentUser?.id) {
      alert('⛔ Vous ne pouvez pas supprimer votre propre compte!');
      return;
    }
    
    if (userToDelete.role === 'ADMIN') {
      const adminCount = this.users.filter(u => u.role === 'ADMIN').length;
      if (adminCount <= 1) {
        alert('⚠️ Impossible de supprimer le dernier administrateur!');
        return;
      }
    }
    
    const confirmation = confirm(`Voulez-vous vraiment supprimer l'utilisateur "${userToDelete.prenom} ${userToDelete.nom}" ?\n\nCette action est irréversible.`);
    
    if (confirmation) {
      this.userService.delete(id).subscribe({
        next: () => {
          console.log(`✅ Utilisateur ${id} supprimé avec succès`);
          this.users = this.users.filter(u => u.id !== id);
          alert(`✅ Utilisateur "${userToDelete.prenom} ${userToDelete.nom}" supprimé avec succès`);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression:', error);
          alert(`❌ Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
        }
      });
    }
  }

  refresh() {
    console.log('🔄 Rafraîchissement de la liste...');
    this.now = new Date();
    this.loadUsers();
  }

  showDebugInfo() {
    console.log('=== INFOS DE DÉBOGAGE ===');
    console.log('État AuthService:');
    console.log('- Authentifié:', this.authService.isAuthenticated());
    console.log('- Admin:', this.authService.isAdmin());
    console.log('- Token:', this.authService.getToken());
    console.log('- Current User:', this.currentUser);
    
    console.log('\nÉtat UserListComponent:');
    console.log('- Users length:', this.users.length);
    console.log('- Users:', this.users);
    console.log('- Loading:', this.loading);
    console.log('- Error:', this.errorMessage);
    
    console.log('\nTest localStorage:');
    console.log('- token:', localStorage.getItem('token'));
    console.log('- currentUser:', localStorage.getItem('currentUser'));
    
    console.log('\n=== TEST BACKEND ===');
    this.authService.testBackendConnection().subscribe({
      next: (result) => console.log('✅ Backend test success:', result),
      error: (error) => console.error('❌ Backend test error:', error)
    });
    
    // Afficher une alerte avec les infos
    const debugInfo = `
=== DÉBOGAGE ===
Authentifié: ${this.authService.isAuthenticated()}
Admin: ${this.authService.isAdmin()}
Utilisateur: ${this.currentUser?.prenom} ${this.currentUser?.nom}
Email: ${this.currentUser?.email}
Rôle: ${this.currentUser?.role}
Nombre d'utilisateurs: ${this.users.length}
URL API: http://localhost:8080/api/users
Token présent: ${!!this.authService.getToken()}
================
    `;
    
    console.log(debugInfo);
    alert(debugInfo);
  }

  createTestUser() {
    console.log('Création d\'un utilisateur test...');
    
    const testUser: User = {
      nom: 'Test' + Math.floor(Math.random() * 100),
      prenom: 'User',
      email: `test.user.${Date.now()}@maboutique.com`,
      motDePasse: 'password123',
      role: 'CLIENT'
    };
    
    this.userService.create(testUser).subscribe({
      next: (createdUser) => {
        console.log('✅ Utilisateur test créé:', createdUser);
        this.users.push(createdUser);
        alert(`✅ Utilisateur test créé avec succès!\n\nNom: ${createdUser.prenom} ${createdUser.nom}\nEmail: ${createdUser.email}\nRôle: ${createdUser.role}`);
      },
      error: (error) => {
        console.error('❌ Erreur création test user:', error);
        alert(`❌ Erreur lors de la création: ${error.message || 'Erreur inconnue'}\n\nCréation d\'un utilisateur mocké à la place.`);
        
        // Créer un utilisateur mocké localement
        const mockUser: User = {
          id: Math.max(...this.users.map(u => u.id || 0)) + 1,
          ...testUser
        };
        this.users.push(mockUser);
        console.log('Utilisateur mocké ajouté localement:', mockUser);
      }
    });
  }

  getUserRoleClass(role: string): string {
    return role === 'ADMIN' ? 'badge bg-danger' : 'badge bg-success';
  }

  getUserRoleIcon(role: string): string {
    return role === 'ADMIN' ? 'fas fa-user-shield' : 'fas fa-user';
  }

  getRoleText(role: string): string {
    return role === 'ADMIN' ? 'Administrateur' : 'Client';
  }
}