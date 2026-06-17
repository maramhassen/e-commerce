import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/user';

// ============================================
// MOCKS DES SERVICES
// ============================================

class MockUserService {
  apiUrl = 'http://localhost:8080/api';
  
  // Utiliser jasmine.createSpyObj pour créer des spies
  getAll = jasmine.createSpy('getAll').and.returnValue(of([]));
  delete = jasmine.createSpy('delete').and.returnValue(of({}));
  create = jasmine.createSpy('create').and.returnValue(of({}));
}

class MockAuthService {
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue({
    id: 1,
    nom: 'Admin',
    prenom: 'System',
    email: 'admin@maboutique.com',
    role: 'ADMIN'
  });
  
  isAdmin = jasmine.createSpy('isAdmin').and.returnValue(true);
  isAuthenticated = jasmine.createSpy('isAuthenticated').and.returnValue(true);
  getToken = jasmine.createSpy('getToken').and.returnValue('mock-token-123');
  logout = jasmine.createSpy('logout');
  testBackendConnection = jasmine.createSpy('testBackendConnection').and.returnValue(of({ success: true }));
}

// ============================================
// DONNÉES DE TEST
// ============================================

const mockUsers: User[] = [
  {
    id: 1,
    nom: 'Doe',
    prenom: 'John',
    email: 'john@example.com',
    motDePasse: '',
    role: 'ADMIN'
  },
  {
    id: 2,
    nom: 'Smith',
    prenom: 'Jane',
    email: 'jane@example.com',
    motDePasse: '',
    role: 'CLIENT'
  },
  {
    id: 3,
    nom: 'Johnson',
    prenom: 'Bob',
    email: 'bob@example.com',
    motDePasse: '',
    role: 'CLIENT'
  }
];

// ============================================
// DESCRIPTION DES TESTS
// ============================================

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUserService: MockUserService;
  let mockAuthService: MockAuthService;

  beforeEach(waitForAsync(() => {
    mockUserService = new MockUserService();
    mockAuthService = new MockAuthService();

    TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  // ============================================
  // TESTS D'INITIALISATION
  // ============================================

  describe('Initialisation du composant', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.users).toEqual([]);
      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.isAdmin).toBeFalse();
      expect(component.currentUser).toBeNull();
    });

    it('should load current user on init', () => {
      fixture.detectChanges();
      
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUser).toBeDefined();
      if (component.currentUser) {
        expect(component.currentUser.id).toBe(1);
      }
    });

    it('should check admin status on init', () => {
      fixture.detectChanges();
      
      expect(mockAuthService.isAdmin).toHaveBeenCalled();
    });

    it('should load users when authenticated and admin', fakeAsync(() => {
      mockUserService.getAll.and.returnValue(of(mockUsers));
      
      fixture.detectChanges();
      tick();
      
      expect(mockUserService.getAll).toHaveBeenCalled();
      expect(component.users).toEqual(mockUsers);
    }));

    it('should NOT load users when not authenticated', fakeAsync(() => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockUserService.getAll.calls.reset();
      
      fixture.detectChanges();
      tick();
      
      expect(mockUserService.getAll).not.toHaveBeenCalled();
      expect(component.errorMessage).toContain('Veuillez vous connecter');
    }));

    it('should NOT load users when not admin', fakeAsync(() => {
      mockAuthService.isAdmin.and.returnValue(false);
      mockUserService.getAll.calls.reset();
      
      fixture.detectChanges();
      tick();
      
      expect(mockUserService.getAll).not.toHaveBeenCalled();
      expect(component.errorMessage).toContain('Accès refusé');
    }));
  });

  // ============================================
  // TESTS DE CHARGEMENT DES UTILISATEURS
  // ============================================

  describe('Chargement des utilisateurs', () => {
    beforeEach(() => {
      mockUserService.getAll.calls.reset();
    });

    it('should load users successfully', fakeAsync(() => {
      mockUserService.getAll.and.returnValue(of(mockUsers));
      
      component.loadUsers();
      tick();
      
      expect(mockUserService.getAll).toHaveBeenCalled();
      expect(component.users).toEqual(mockUsers);
      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toBe('');
    }));

    it('should handle empty user list', fakeAsync(() => {
      mockUserService.getAll.and.returnValue(of([]));
      
      component.loadUsers();
      tick();
      
      expect(component.users).toEqual([]);
      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toContain('aucun utilisateur');
    }));

    it('should handle non-array data', fakeAsync(() => {
      mockUserService.getAll.and.returnValue(of({ data: 'invalid' } as any));
      
      component.loadUsers();
      tick();
      
      expect(component.users).toEqual([]);
      expect(component.errorMessage).toContain('format de données inattendu');
    }));

    it('should handle backend error', fakeAsync(() => {
      const error = { status: 500, message: 'Server error' };
      mockUserService.getAll.and.returnValue(throwError(() => error));
      
      component.loadUsers();
      tick();
      
      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toContain('Erreur 500');
    }));

    it('should handle connection error and load mock data', fakeAsync(() => {
      mockAuthService.testBackendConnection.and.returnValue(throwError(() => new Error('Connection failed')));
      spyOn(component, 'loadMockData');
      
      component.loadUsers();
      tick();
      
      expect(component.loadMockData).toHaveBeenCalled();
    }));
  });

  // ============================================
  // TESTS DE SUPPRESSION D'UTILISATEUR
  // ============================================

  describe('Suppression d\'utilisateur', () => {
    beforeEach(() => {
      component.users = [...mockUsers];
      component.currentUser = { 
        id: 1, 
        role: 'ADMIN', 
        nom: 'Admin', 
        prenom: 'System',
        email: 'admin@test.com',
        motDePasse: ''
      };
    });

    it('should not delete user with invalid id', () => {
      spyOn(window, 'alert');
      
      component.deleteUser(0);
      
      expect(window.alert).toHaveBeenCalledWith('ID utilisateur invalide');
      expect(mockUserService.delete).not.toHaveBeenCalled();
    });

    it('should not delete non-existent user', () => {
      spyOn(window, 'alert');
      
      component.deleteUser(999);
      
      expect(window.alert).toHaveBeenCalledWith('Utilisateur non trouvé');
      expect(mockUserService.delete).not.toHaveBeenCalled();
    });

    it('should not delete current user', () => {
      spyOn(window, 'alert');
      
      component.deleteUser(1);
      
      expect(window.alert).toHaveBeenCalledWith('⛔ Vous ne pouvez pas supprimer votre propre compte!');
      expect(mockUserService.delete).not.toHaveBeenCalled();
    });

    it('should not delete last admin', () => {
      spyOn(window, 'alert');
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.currentUser = { 
        id: 999, 
        role: 'ADMIN', 
        nom: 'Other', 
        prenom: 'Admin',
        email: 'other@test.com',
        motDePasse: ''
      };
      
      component.users = [
        { 
          id: 1, 
          nom: 'Doe', 
          prenom: 'John', 
          email: 'john@example.com', 
          motDePasse: '', 
          role: 'ADMIN' 
        },
        { 
          id: 2, 
          nom: 'Smith', 
          prenom: 'Jane', 
          email: 'jane@example.com', 
          motDePasse: '', 
          role: 'CLIENT' 
        }
      ];
      
      component.deleteUser(1);
      
      expect(window.alert).toHaveBeenCalledWith('⚠️ Impossible de supprimer le dernier administrateur!');
      expect(mockUserService.delete).not.toHaveBeenCalled();
    });

    it('should delete user with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockUserService.delete.and.returnValue(of({}));
      
      component.deleteUser(2);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockUserService.delete).toHaveBeenCalledWith(2);
      expect(component.users.length).toBe(2);
    });

    it('should not delete user without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.deleteUser(2);
      
      expect(mockUserService.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockUserService.delete.and.returnValue(throwError(() => new Error('Delete failed')));
      
      component.deleteUser(2);
      
      expect(window.alert).toHaveBeenCalled();
      expect(component.users.length).toBe(3);
    });
  });

  // ============================================
  // TESTS DE CRÉATION D'UTILISATEUR TEST
  // ============================================

  describe('Création d\'utilisateur test', () => {
    it('should create test user successfully', () => {
      spyOn(window, 'alert');
      const newUser = { 
        id: 4, 
        nom: 'Test42', 
        prenom: 'User', 
        email: 'test@example.com', 
        motDePasse: 'password', 
        role: 'CLIENT' 
      };
      mockUserService.create.and.returnValue(of(newUser));
      
      component.users = [...mockUsers];
      component.createTestUser();
      
      expect(mockUserService.create).toHaveBeenCalled();
      expect(component.users.length).toBe(4);
    });

    it('should handle create error and add mock user locally', () => {
      spyOn(window, 'alert');
      mockUserService.create.and.returnValue(throwError(() => new Error('Create failed')));
      
      component.users = [...mockUsers];
      const initialLength = component.users.length;
      
      component.createTestUser();
      
      expect(component.users.length).toBe(initialLength + 1);
    });
  });

  // ============================================
  // TESTS DES MÉTHODES UTILITAIRES
  // ============================================

  describe('Méthodes utilitaires', () => {
    it('should get correct role class for ADMIN', () => {
      expect(component.getUserRoleClass('ADMIN')).toBe('badge bg-danger');
    });

    it('should get correct role class for CLIENT', () => {
      expect(component.getUserRoleClass('CLIENT')).toBe('badge bg-success');
    });

    it('should get correct role icon for ADMIN', () => {
      expect(component.getUserRoleIcon('ADMIN')).toBe('fas fa-user-shield');
    });

    it('should get correct role icon for CLIENT', () => {
      expect(component.getUserRoleIcon('CLIENT')).toBe('fas fa-user');
    });

    it('should get correct role text for ADMIN', () => {
      expect(component.getRoleText('ADMIN')).toBe('Administrateur');
    });

    it('should get correct role text for CLIENT', () => {
      expect(component.getRoleText('CLIENT')).toBe('Client');
    });
  });

  // ============================================
  // TESTS DE RAFRAÎCHISSEMENT
  // ============================================

  describe('Rafraîchissement', () => {
    it('should refresh user list', () => {
      spyOn(component, 'loadUsers');
      const oldDate = component.now;
      
      component.refresh();
      
      expect(component.loadUsers).toHaveBeenCalled();
      expect(component.now).not.toBe(oldDate);
    });
  });

  // ============================================
  // TESTS DE CHARGEMENT DES DONNÉES MOCKÉES
  // ============================================

  describe('Données mockées', () => {
    it('should load mock data correctly', () => {
      component.currentUser = {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@example.com',
        role: 'ADMIN',
        motDePasse: ''
      };
      
      component.loadMockData();
      
      expect(component.users.length).toBe(5);
      expect(component.users[0].nom).toBe('Administrateur');
    });

    it('should handle missing current user in mock data', () => {
      component.currentUser = null;
      
      component.loadMockData();
      
      expect(component.users.length).toBe(5);
    });
  });

  // ============================================
  // TESTS DE GÉNÉRATION DE HTML D'ERREUR
  // ============================================

  describe('Génération HTML d\'erreur', () => {
    it('should generate backend error HTML', () => {
      const error = { message: 'Connection refused' };
      const html = component.getBackendErrorHtml(error);
      
      expect(html).toContain('Problème de connexion au serveur');
      expect(html).toContain('Connection refused');
      expect(html).toContain(environment.apiUrl);
    });

    it('should handle error without message', () => {
      const html = component.getBackendErrorHtml({});
      
      expect(html).toContain('Inconnu');
    });
  });

  // ============================================
  // TESTS DE GESTION D'ERREUR
  // ============================================

  describe('Gestion d\'erreur', () => {
    it('should handle status 0 error', () => {
      const error = { status: 0, message: 'Connection lost' };
      
      component.handleError(error);
      
      expect(component.errorMessage).toContain('Problème de connexion');
    });

    it('should handle status 401 error', fakeAsync(() => {
      const error = { status: 401, message: 'Unauthorized' };
      
      component.handleError(error);
      
      expect(component.errorMessage).toContain('Session expirée');
      tick(3000);
      expect(mockAuthService.logout).toHaveBeenCalled();
    }));

    it('should handle status 403 error', () => {
      const error = { status: 403, message: 'Forbidden' };
      
      component.handleError(error);
      
      expect(component.errorMessage).toContain('Accès interdit');
    });

    it('should handle status 404 error', () => {
      const error = { status: 404, message: 'Not Found', url: '/api/users' };
      
      component.handleError(error);
      
      expect(component.errorMessage).toContain('Endpoint non trouvé');
    });

    it('should handle unknown error', () => {
      const error = { status: 503, message: 'Service Unavailable' };
      
      component.handleError(error);
      
      expect(component.errorMessage).toContain('Erreur 503');
    });
  });

  // ============================================
  // TEST DE LA MÉTHODE NGAFTERVIEWINIT
  // ============================================

  describe('AfterViewInit', () => {
    it('should call testDirectApiCall', () => {
      spyOn(component, 'testDirectApiCall');
      
      component.ngAfterViewInit();
      
      expect(component.testDirectApiCall).toHaveBeenCalled();
    });
  });
});