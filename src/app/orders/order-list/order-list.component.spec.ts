import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { OrderListComponent } from './order-list.component';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Order } from 'src/app/models/order';
import { Statut } from 'src/app/models/statut';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

let mockOrderService: any;
let mockAuthService: any;
let mockRouter: any;

const mockOrders: Order[] = [
  {
    id: 1,
    total: 199.98,
    statut: 'EN_ATTENTE' as Statut,
    dateCommande: new Date(),
    items: [{ id: 1, quantite: 2, prix: 99.99 }] as any,
    user: { id: 1, nom: 'Doe', prenom: 'John', email: 'john@example.com', role: 'CLIENT', motDePasse: '' }
  },
  {
    id: 2,
    total: 49.99,
    statut: 'LIVREE' as Statut,
    dateCommande: new Date(),
    items: [{ id: 2, quantite: 1, prix: 49.99 }] as any,
    user: { id: 1, nom: 'Doe', prenom: 'John', email: 'john@example.com', role: 'CLIENT', motDePasse: '' }
  }
];

const mockUser = {
  id: 1,
  nom: 'Doe',
  prenom: 'John',
  email: 'john@example.com',
  role: 'CLIENT' as const
};

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;

  beforeEach(() => {
    mockOrderService = {
      getOrdersByUser: jasmine.createSpy('getOrdersByUser').and.returnValue(of(mockOrders)),
      getAllOrders: jasmine.createSpy('getAllOrders').and.returnValue(of(mockOrders)),
      createOrderFromCart: jasmine.createSpy('createOrderFromCart').and.returnValue(of({ id: 3 })),
      updateOrderStatus: jasmine.createSpy('updateOrderStatus').and.returnValue(of({ ...mockOrders[0], statut: 'CONFIRMEE' })),
      deleteOrder: jasmine.createSpy('deleteOrder').and.returnValue(of({}))
    };

    mockAuthService = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(mockUser),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      declarations: [OrderListComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: OrderService, useValue: mockOrderService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
  });

  // ============================================
  // TESTS D'INITIALISATION
  // ============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init for user', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flush();
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(mockOrderService.getOrdersByUser).toHaveBeenCalledWith(1);
    expect(component.orders.length).toBe(2);
    expect(component.loading).toBeFalse();
  }));

  it('should load all orders for admin', fakeAsync(() => {
    mockAuthService.getCurrentUser.and.returnValue({ ...mockUser, role: 'ADMIN' });
    component.isAdmin = true;

    component.ngOnInit();
    tick();
    flush();

    expect(mockOrderService.getAllOrders).toHaveBeenCalled();
    expect(component.orders.length).toBe(2);
  }));

  it('should redirect to login if no user', fakeAsync(() => {
    mockAuthService.getCurrentUser.and.returnValue(null);

    component.ngOnInit();
    tick();
    flush();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(component.errorMessage).toBe('Veuillez vous connecter pour voir vos commandes');
  }));

  it('should handle error when loading orders', fakeAsync(() => {
    mockOrderService.getOrdersByUser.and.returnValue(throwError(() => new Error('Load failed')));

    component.ngOnInit();
    tick();
    flush();

    expect(component.errorMessage).toBeTruthy();
    expect(component.loading).toBeFalse();
  }));

  // ============================================
  // TESTS DES STATISTIQUES
  // ============================================

  it('should calculate stats correctly', () => {
    component.orders = mockOrders;
    (component as any).calculateStats();

    expect(component.totalOrders).toBe(2);
    expect(component.totalRevenue).toBe(249.97);
    expect(component.statsByStatus['EN_ATTENTE']).toBe(1);
    expect(component.statsByStatus['LIVREE']).toBe(1);
  });

  // ============================================
  // TESTS DE FILTRAGE
  // ============================================

  it('should filter by status', () => {
    component.orders = mockOrders;
    component.filterStatut = 'EN_ATTENTE';
    component.applyFilter();

    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0]?.statut).toBe('EN_ATTENTE');
  });

  it('should filter by search term (admin only)', () => {
    component.orders = mockOrders;
    component.isAdmin = true;
    component.searchTerm = 'john';
    component.applyFilter();

    expect(component.filteredOrders.length).toBe(2);
  });

  it('should clear filters', () => {
    component.orders = mockOrders;
    component.filterStatut = 'EN_ATTENTE';
    component.searchTerm = 'test';

    component.clearFilter();

    expect(component.filterStatut).toBe('');
    expect(component.searchTerm).toBe('');
    expect(component.filteredOrders.length).toBe(2);
  });

  // ============================================
  // TESTS DE CRÉATION DE COMMANDE
  // ============================================

  it('should create order from cart', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.userId = 1;
    component.currentUser = mockUser;

    component.createOrderFromCart();
    tick();
    flush();

    expect(mockOrderService.createOrderFromCart).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders', 3]);
  }));

  it('should not create order without user', () => {
    component.userId = null;
    spyOn(window, 'confirm');

    component.createOrderFromCart();

    expect(window.confirm).not.toHaveBeenCalled();
    expect(mockOrderService.createOrderFromCart).not.toHaveBeenCalled();
  });

  it('should update status with confirmation', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.orders = mockOrders;

    component.updateOrderStatut(1, 'CONFIRMEE');
    tick();
    flush();

    expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(1, 'CONFIRMEE');
    expect(component.orders[0].statut).toBe('CONFIRMEE');
  }));

  it('should not update status without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.updateOrderStatut(1, 'CONFIRMEE');

    expect(mockOrderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  // ============================================
  // TESTS DE SUPPRESSION
  // ============================================

  it('should delete order', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.orders = mockOrders;

    component.deleteOrder(1);
    tick();
    flush();

    expect(mockOrderService.deleteOrder).toHaveBeenCalledWith(1);
    expect(component.orders.length).toBe(1);
  }));

  it('should not delete order without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteOrder(1);

    expect(mockOrderService.deleteOrder).not.toHaveBeenCalled();
  });

  // ============================================
  // TESTS DES MÉTHODES UTILITAIRES
  // ============================================

  it('should get status text', () => {
    expect(component.getStatutText('EN_ATTENTE')).toBe('En attente');
    expect(component.getStatutText('CONFIRMEE')).toBe('Confirmée');
    expect(component.getStatutText('INCONNU')).toBe('INCONNU');
  });

  it('should get status class', () => {
    expect(component.getStatutClass('EN_ATTENTE')).toBe('statut-en_attente');
    expect(component.getStatutClass('LIVREE')).toBe('statut-livree');
  });

  it('should get status color', () => {
    expect(component.getStatutColor('EN_ATTENTE')).toBe('warning');
    expect(component.getStatutColor('LIVREE')).toBe('success');
  });

  it('should format date', () => {
    const date = new Date('2024-01-15T10:30:00');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('15');
    expect(formatted).toContain('01');
  });

  it('should format price', () => {
    expect(component.formatPrice(99.99)).toBe('99,99 DT');
    expect(component.formatPrice(0)).toBe('0,00 DT');
  });

  it('should get total items in order', () => {
    const order = { items: [{ quantite: 2 }, { quantite: 3 }] } as any;
    expect(component.getTotalItems(order)).toBe(5);
    expect(component.getTotalItems({} as Order)).toBe(0);
  });

  // ============================================
  // TESTS DE NAVIGATION
  // ============================================

  it('should navigate to order details', () => {
    component.viewOrderDetails(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders', 1]);
  });

  // ============================================
  // TESTS DE RECHARGEMENT
  // ============================================

  it('should reload orders', () => {
    spyOn(component, 'loadOrders');
    component.reloadOrders();
    expect(component.loadOrders).toHaveBeenCalled();
  });
});