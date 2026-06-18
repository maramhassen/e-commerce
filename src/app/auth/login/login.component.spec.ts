import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

let mockAuthService: any;
let mockRouter: any;
let mockActivatedRoute: any;

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(() => {
    mockAuthService = {
      login: jasmine.createSpy('login').and.returnValue(of({ token: 'mock-token', user: { role: 'CLIENT' } })),
      redirectBasedOnRole: jasmine.createSpy('redirectBasedOnRole'),
      testBackendConnection: jasmine.createSpy('testBackendConnection').and.returnValue(of({ status: 'success', message: 'OK' })),
      getAllUsersForDebug: jasmine.createSpy('getAllUsersForDebug').and.returnValue(of([])),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    mockActivatedRoute = {
      queryParams: of({})
    };

    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  // ============================================
  // TESTS D'INITIALISATION
  // ============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty fields', () => {
    expect(component.email).toBe('');
    expect(component.motDePasse).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.loading).toBeFalse();
  });

  it('should check for session expired message', fakeAsync(() => {
    mockActivatedRoute.queryParams = of({ sessionExpired: 'true' });
    
    component.ngOnInit();
    tick();
    flush();

    expect(component.showExpiredMessage).toBeTrue();
    expect(component.errorMessage).toBe('Votre session a expiré. Veuillez vous reconnecter.');
  }));

  // ============================================
  // TESTS DE LOGIN
  // ============================================

  it('should login successfully', fakeAsync(() => {
    component.email = 'john@example.com';
    component.motDePasse = 'password123';

    mockAuthService.login.and.returnValue(of({ token: 'mock-token', user: { role: 'CLIENT' } }));

    component.login();
    tick();
    flush();

    expect(mockAuthService.login).toHaveBeenCalledWith('john@example.com', 'password123');
    expect(mockAuthService.redirectBasedOnRole).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  }));

  it('should login with return URL', fakeAsync(() => {
    component.email = 'john@example.com';
    component.motDePasse = 'password123';
    component['returnUrl'] = '/dashboard';

    mockAuthService.login.and.returnValue(of({ token: 'mock-token', user: { role: 'CLIENT' } }));

    component.login();
    tick();
    flush();

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  }));

  it('should show error when fields are empty', () => {
    component.email = '';
    component.motDePasse = '';

    component.login();

    expect(component.errorMessage).toBe('Veuillez remplir tous les champs');
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should handle login error - invalid credentials', fakeAsync(() => {
    component.email = 'wrong@example.com';
    component.motDePasse = 'wrong';

    mockAuthService.login.and.returnValue(throwError(() => new Error('Identifiants incorrects')));

    component.login();
    tick();
    flush();

    expect(component.errorMessage).toBe('Email ou mot de passe incorrect');
    expect(component.loading).toBeFalse();
  }));

  it('should handle login error - server error', fakeAsync(() => {
    component.email = 'john@example.com';
    component.motDePasse = 'password123';

    mockAuthService.login.and.returnValue(throwError(() => ({ status: 500 })));

    component.login();
    tick();
    flush();

    expect(component.errorMessage).toBeTruthy();
    expect(component.loading).toBeFalse();
  }));

  it('should handle login error - 404', fakeAsync(() => {
    component.email = 'john@example.com';
    component.motDePasse = 'password123';

    mockAuthService.login.and.returnValue(throwError(() => ({ status: 404 })));

    component.login();
    tick();
    flush();

    expect(component.errorMessage).toContain('Endpoint non trouvé');
  }));

  // ============================================
  // TESTS DE TEST BACKEND
  // ============================================

  it('should test backend connection', fakeAsync(() => {
    component.testBackendConnection();
    tick();
    flush();

    expect(mockAuthService.testBackendConnection).toHaveBeenCalled();
    expect(component.debugInfo).toContain('✓');
  }));

  it('should handle backend test error', fakeAsync(() => {
    mockAuthService.testBackendConnection.and.returnValue(throwError(() => ({ message: 'Connection failed' })));

    component.testBackendConnection();
    tick();
    flush();

    expect(component.debugInfo).toContain('✗');
  }));

  // ============================================
  // TESTS DE LISTE DES UTILISATEURS
  // ============================================

  it('should list all users', fakeAsync(() => {
    const mockUsers = [{ id: 1, email: 'test@example.com' }];
    mockAuthService.getAllUsersForDebug.and.returnValue(of(mockUsers));

    component.listAllUsers();
    tick();
    flush();

    expect(mockAuthService.getAllUsersForDebug).toHaveBeenCalled();
    expect(component.usersList).toEqual(mockUsers);
    expect(component.debugInfo).toContain('1');
  }));

  // ============================================
  // TESTS DES TESTS RAPIDES
  // ============================================

  it('should test admin login', () => {
    spyOn(component, 'login');

    component.testAdminLogin();

    expect(component.email).toBe('admin@example.com');
    expect(component.motDePasse).toBe('admin123');
    expect(component.login).toHaveBeenCalled();
  });

  it('should test client login', () => {
    spyOn(component, 'login');

    component.testClientLogin();

    expect(component.email).toBe('client@example.com');
    expect(component.motDePasse).toBe('client123');
    expect(component.login).toHaveBeenCalled();
  });

  // ============================================
  // TESTS DE NAVIGATION
  // ============================================

  it('should navigate to register', () => {
    component.goToRegister();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/register']);
  });

  // ============================================
  // TESTS DE RÉINITIALISATION
  // ============================================

  it('should reset form', () => {
    component.email = 'test@example.com';
    component.motDePasse = 'password';
    component.errorMessage = 'Error';

    component.resetForm();

    expect(component.email).toBe('');
    expect(component.motDePasse).toBe('');
    expect(component.errorMessage).toBe('');
  });
});