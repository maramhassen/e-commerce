import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/user';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: any;

  const apiUrl = `${environment.apiUrl}/users`;

  const mockUser: User = {
    id: 1,
    nom: 'Doe',
    prenom: 'John',
    email: 'john@example.com',
    motDePasse: 'password123',
    role: 'CLIENT'
  };

  const mockAdminUser: User = {
    id: 2,
    nom: 'Admin',
    prenom: 'System',
    email: 'admin@example.com',
    motDePasse: 'admin123',
    role: 'ADMIN'
  };

  const mockUsers: User[] = [mockUser, mockAdminUser];

  beforeEach(() => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ============================================
  // TEST D'INSTANCIATION
  // ============================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================
  // TESTS LOGIN
  // ============================================

  it('should login successfully with valid credentials', () => {
    service.login('john@example.com', 'password123').subscribe(response => {
      expect(response.token).toBeTruthy();
      expect(response.user).toBeTruthy();
      expect(response.user.email).toBe('john@example.com');
      expect(response.user.role).toBe('CLIENT');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should login as admin successfully', () => {
    service.login('admin@example.com', 'admin123').subscribe(response => {
      expect(response.token).toBeTruthy();
      expect(response.user.role).toBe('ADMIN');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should fail login with invalid credentials', () => {
    service.login('wrong@example.com', 'wrongpass').subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBe('Identifiants incorrects');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush(mockUsers);
  });

  it('should handle error when login fails', () => {
    service.login('john@example.com', 'password123').subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  // ============================================
  // TESTS REGISTER
  // ============================================

  it('should register successfully', () => {
    const newUser: User = {
      nom: 'New',
      prenom: 'User',
      email: 'new@example.com',
      motDePasse: 'password123',
      role: 'CLIENT'
    };

    const createdUser = { ...newUser, id: 3 };

    service.register(newUser).subscribe(response => {
      expect(response.token).toBeTruthy();
      expect(response.user.email).toBe('new@example.com');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.nom).toBe('New');
    req.flush(createdUser);
  });

  it('should handle error when register fails', () => {
    const newUser: User = {
      nom: 'New',
      prenom: 'User',
      email: 'new@example.com',
      motDePasse: 'password123',
      role: 'CLIENT'
    };

    service.register(newUser).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.status).toBe(400);
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
  });

  // ============================================
  // TESTS DE SESSION
  // ============================================

  it('should store auth data after login', () => {
    service.login('john@example.com', 'password123').subscribe();

    const req = httpMock.expectOne(apiUrl);
    req.flush(mockUsers);

    expect(localStorage.getItem('token')).toBeTruthy();
    expect(localStorage.getItem('currentUser')).toBeTruthy();
  });

  it('should clear auth data on logout', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  // ============================================
  // TESTS DES MÉTHODES DE VÉRIFICATION
  // ============================================

  it('should check if user is authenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();

    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should check if user is admin', () => {
    expect(service.isAdmin()).toBeFalse();

    localStorage.setItem('currentUser', JSON.stringify(mockAdminUser));

    expect(service.isAdmin()).toBeTrue();
  });

  it('should check if user is client', () => {
    expect(service.isClient()).toBeFalse();

    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    expect(service.isClient()).toBeTrue();
  });

  // ============================================
  // TESTS DES GETTERS
  // ============================================

  it('should get current user', () => {
    expect(service.getCurrentUser()).toBeNull();

    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    expect(service.getCurrentUser()).toEqual(mockUser);
  });

  it('should get token', () => {
    expect(service.getToken()).toBeNull();

    localStorage.setItem('token', 'mock-token');

    expect(service.getToken()).toBe('mock-token');
  });

  // ============================================
  // TESTS DE REDIRECTION
  // ============================================

  it('should redirect admin to categories', () => {
    localStorage.setItem('currentUser', JSON.stringify(mockAdminUser));
    
    service.redirectBasedOnRole();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('should redirect client to products', () => {
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    
    service.redirectBasedOnRole();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should redirect to products if no user', () => {
    service.redirectBasedOnRole();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  // ============================================
  // TESTS DE CONNEXION BACKEND
  // ============================================

  it('should test backend connection', () => {
    service.testBackendConnection().subscribe(result => {
      expect(result.status).toBe('success');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should handle backend connection error', () => {
    service.testBackendConnection().subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.status).toBe('error');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
  });

  // ============================================
  // TESTS DE DIAGNOSTIC
  // ============================================

  it('should get all users for debug', () => {
    service.getAllUsersForDebug().subscribe(users => {
      expect(users.length).toBe(2);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should get auth status', () => {
    const status = service.getAuthStatus();
    expect(status).toBeTruthy();
    expect(JSON.parse(status)).toBeTruthy();
  });

  // ============================================
  // TESTS D'ÉTAT D'AUTHENTIFICATION
  // ============================================

  it('should update auth state', () => {
    spyOn(service['authState'], 'next');
    
    service.updateAuthState();
    
    expect(service['authState'].next).toHaveBeenCalled();
  });

  it('should notify auth state change', () => {
    spyOn(service['authStateChange'], 'next');
    
    service.notifyAuthStateChange();
    
    expect(service['authStateChange'].next).toHaveBeenCalled();
  });

  it('should get auth state observable', () => {
    const observable = service.onAuthStateChange();
    expect(observable).toBeTruthy();
  });

  // ============================================
  // TESTS DE CLEAR AUTH DATA
  // ============================================

  it('should clear auth data', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    service.clearAuthData();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });
});