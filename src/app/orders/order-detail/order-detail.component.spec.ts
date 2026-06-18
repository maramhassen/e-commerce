import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { OrderDetailComponent } from './order-detail.component';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Order } from 'src/app/models/order';
import { Statut } from 'src/app/models/statut';
import { RouterTestingModule } from '@angular/router/testing';

let mockOrderService: any;
let mockAuthService: any;
let mockRouter: any;
let mockActivatedRoute: any;

const mockOrder: Order = {
  id: 1,
  total: 199.98,
  statut: 'EN_ATTENTE' as Statut,
  dateCommande: new Date(),
  items: [
    { id: 1, quantite: 2, prix: 99.99, product: { id: 1, nom: 'Produit Test', prix: 99.99 } }
  ] as any,
  user: { id: 1, nom: 'Doe', prenom: 'John', email: 'john@example.com', role: 'CLIENT', motDePasse: '' }
};

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: ComponentFixture<OrderDetailComponent>;

  beforeEach(() => {
    mockOrderService = {
      getOrderById: jasmine.createSpy('getOrderById').and.returnValue(of(mockOrder))
    };

    mockAuthService = {
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    TestBed.configureTestingModule({
      declarations: [OrderDetailComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: OrderService, useValue: mockOrderService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
  });

  // ============================================
  // TESTS D'INITIALISATION
  // ============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load order on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flush();

    expect(mockOrderService.getOrderById).toHaveBeenCalledWith(1);
    expect(component.order).toEqual(mockOrder);
    expect(component.loading).toBeFalse();
  }));

  it('should handle invalid order id', fakeAsync(() => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

    component.ngOnInit();
    tick();
    flush();

    expect(component.errorMessage).toBe('ID commande invalide');
    expect(component.order).toBeNull();
  }));

  it('should handle error when loading order fails', fakeAsync(() => {
    mockOrderService.getOrderById.and.returnValue(throwError(() => new Error('Load failed')));

    component.ngOnInit();
    tick();
    flush();

    expect(component.errorMessage).toBe('Impossible de charger la commande');
    expect(component.loading).toBeFalse();
  }));

  it('should check admin status on init', () => {
    component.ngOnInit();
    expect(mockAuthService.isAdmin).toHaveBeenCalled();
  });

  // ============================================
  // TESTS DES MÉTHODES UTILITAIRES
  // ============================================

  it('should get status text', () => {
    expect(component.getStatutText('EN_ATTENTE')).toBe('En attente');
    expect(component.getStatutText('CONFIRMEE')).toBe('Confirmée');
    expect(component.getStatutText('EXPEDIEE')).toBe('Expédiée');
    expect(component.getStatutText('LIVREE')).toBe('Livrée');
    expect(component.getStatutText('ANNULEE')).toBe('Annulée');
    expect(component.getStatutText('INCONNU')).toBe('INCONNU');
  });

  it('should get status class', () => {
    expect(component.getStatutClass('en_attente')).toBe('badge bg-warning');
    expect(component.getStatutClass('confirmee')).toBe('badge bg-info');
    expect(component.getStatutClass('expediee')).toBe('badge bg-primary');
    expect(component.getStatutClass('livree')).toBe('badge bg-success');
    expect(component.getStatutClass('annulee')).toBe('badge bg-danger');
    expect(component.getStatutClass('inconnu')).toBe('badge bg-secondary');
  });

  it('should format date', () => {
    const date = new Date('2024-01-15T10:30:00');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('15');
    expect(formatted).toContain('01');
    expect(formatted).toContain('2024');
  });

  it('should get total quantity from order', () => {
    const order = { items: [{ quantite: 2 }, { quantite: 3 }] } as any;
    expect(component.getTotalQuantity(order)).toBe(5);
    expect(component.getTotalQuantity({} as any)).toBe(0);
    expect(component.getTotalQuantity(null as any)).toBe(0);
  });

  // ============================================
  // TESTS DE NAVIGATION
  // ============================================

  it('should go back to orders', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders']);
  });

  // ============================================
  // TESTS DES ACTIONS SUPPLÉMENTAIRES
  // ============================================

  it('should generate invoice', () => {
    spyOn(console, 'log');
    component.generateInvoice(1);
    expect(console.log).toHaveBeenCalledWith('Générer facture pour commande #', 1);
  });

  it('should print order', () => {
    spyOn(window, 'print');
    component.printOrder();
    expect(window.print).toHaveBeenCalled();
  });

  it('should update order status', () => {
    spyOn(console, 'log');
    component.updateOrderStatut(1, 'CONFIRMEE');
    expect(console.log).toHaveBeenCalledWith('Mise à jour du statut', 1, 'CONFIRMEE');
  });

  it('should delete order with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(console, 'log');

    component.deleteOrder(1);

    expect(console.log).toHaveBeenCalledWith('Suppression commande #', 1);
  });

  it('should not delete order without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(console, 'log');

    component.deleteOrder(1);

    expect(console.log).not.toHaveBeenCalled();
  });
});