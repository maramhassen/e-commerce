import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { CartComponent } from './cart.component';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Cart } from 'src/app/models/cart';
import { CartItem } from 'src/app/models/cart-item';
import { User } from 'src/app/models/user';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

let mockCartService: any;
let mockOrderService: any;
let mockAuthService: any;
let mockRouter: any;

const mockUser: User = {
  id: 1,
  nom: 'Doe',
  prenom: 'John',
  email: 'john@example.com',
  motDePasse: 'password',
  role: 'CLIENT'
};

const mockCartItem: CartItem = {
  id: 1,
  quantite: 2,
  prixUnitaire: 49.99,
  product: { id: 1, nom: 'Produit Test', prix: 49.99, stock: 10, imageUrl: 'test.jpg' } as any
};

const mockCart: Cart = {
  id: 1,
  total: 99.98,
  items: [mockCartItem],
  dateCreation: new Date(),
  user: mockUser
};

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(() => {
    mockCartService = {
      getOrCreateCart: jasmine.createSpy('getOrCreateCart').and.returnValue(of(mockCart)),
      removeItem: jasmine.createSpy('removeItem').and.returnValue(of({})),
      updateItem: jasmine.createSpy('updateItem').and.returnValue(of({ ...mockCartItem, quantite: 3 })),
      notifyCartUpdate: jasmine.createSpy('notifyCartUpdate'),
      cartUpdated$: of(null)
    };

    mockOrderService = {
      createOrderFromCart: jasmine.createSpy('createOrderFromCart').and.returnValue(of({ id: 1 }))
    };

    mockAuthService = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(mockUser)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      declarations: [CartComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: CartService, useValue: mockCartService },
        { provide: OrderService, useValue: mockOrderService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
  });

  // ============================================
  // TESTS D'INITIALISATION
  // ============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load cart on init when authenticated', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flush();
    expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    expect(mockCartService.getOrCreateCart).toHaveBeenCalled();
    expect(component.cart).toEqual(mockCart);
    expect(component.loading).toBeFalse();
  }));

  it('should show error when not authenticated', fakeAsync(() => {
    mockAuthService.isAuthenticated.and.returnValue(false);

    component.ngOnInit();
    tick();
    flush();

    expect(component.errorMessage).toBe('Veuillez vous connecter pour voir votre panier');
    expect(component.loading).toBeFalse();
  }));

  it('should handle error when loading cart fails', fakeAsync(() => {
    mockCartService.getOrCreateCart.and.returnValue(throwError(() => new Error('Load failed')));

    component.ngOnInit();
    tick();
    flush();

    expect(component.errorMessage).toContain('Erreur lors du chargement du panier');
    expect(component.loading).toBeFalse();
  }));

  // ============================================
  // TESTS DE SUPPRESSION D'ARTICLE
  // ============================================

  it('should remove item with confirmation', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockCartService.removeItem.and.returnValue(of({}));

    component.cart = { ...mockCart };
    const initialLength = component.cart.items.length;

    component.removeItem(mockCartItem);
    tick();
    flush();

    expect(window.confirm).toHaveBeenCalled();
    expect(mockCartService.removeItem).toHaveBeenCalledWith(mockCartItem.id);
    expect(component.cart.items.length).toBe(initialLength - 1);
  }));

  it('should not remove item without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.cart = { ...mockCart };
    component.removeItem(mockCartItem);

    expect(mockCartService.removeItem).not.toHaveBeenCalled();
  });

  it('should handle error when removing item fails', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockCartService.removeItem.and.returnValue(throwError(() => new Error('Remove failed')));
    spyOn(window, 'alert');

    component.cart = { ...mockCart };
    component.removeItem(mockCartItem);
    tick();
    flush();

    expect(window.alert).toHaveBeenCalled();
  }));

  // ============================================
  // TESTS DE MISE À JOUR DE QUANTITÉ
  // ============================================

  it('should update item quantity', fakeAsync(() => {
    mockCartService.updateItem.and.returnValue(of({ ...mockCartItem, quantite: 3 }));

    component.cart = { ...mockCart };
    component.updateQuantity(mockCartItem, 3);
    tick();
    flush();

    expect(mockCartService.updateItem).toHaveBeenCalled();
    expect(component.cart.total).toBe(149.97); // 3 * 49.99
  }));

  it('should remove item when quantity is 0', () => {
    spyOn(component, 'removeItem');

    component.cart = { ...mockCart };
    component.updateQuantity(mockCartItem, 0);

    expect(component.removeItem).toHaveBeenCalledWith(mockCartItem);
  });

  it('should handle error when updating quantity fails', fakeAsync(() => {
    mockCartService.updateItem.and.returnValue(throwError(() => new Error('Update failed')));
    spyOn(window, 'alert');

    component.cart = { ...mockCart };
    component.updateQuantity(mockCartItem, 3);
    tick();
    flush();

    expect(window.alert).toHaveBeenCalled();
  }));

  // ============================================
  // TESTS DE VIDAGE DU PANIER
  // ============================================

  it('should clear cart with confirmation', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockCartService.removeItem.and.returnValue(of({}));

    component.cart = { ...mockCart };
    component.clearCart();
    tick();
    flush();

    expect(window.confirm).toHaveBeenCalled();
    expect(mockCartService.removeItem).toHaveBeenCalled();
    expect(component.cart.items.length).toBe(0);
  }));

  it('should not clear empty cart', () => {
    spyOn(window, 'confirm');
    spyOn(window, 'alert');

    component.cart = { ...mockCart, items: [] };
    component.clearCart();

    expect(window.alert).toHaveBeenCalledWith('Votre panier est déjà vide');
    expect(window.confirm).not.toHaveBeenCalled();
  });

  // ============================================
  // TESTS DE CHECKOUT
  // ============================================

  it('should create order from cart', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockOrderService.createOrderFromCart.and.returnValue(of({ id: 1 }));

    component.userId = 1;
    component.cart = { ...mockCart };
    component.checkout();
    tick();
    flush();

    expect(mockOrderService.createOrderFromCart).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders', 1]);
  }));

  it('should not checkout if cart is empty', () => {
    spyOn(window, 'alert');

    component.cart = { ...mockCart, items: [] };
    component.checkout();

    expect(window.alert).toHaveBeenCalled();
    expect(mockOrderService.createOrderFromCart).not.toHaveBeenCalled();
  });

  // ============================================
  // TESTS DE NAVIGATION
  // ============================================

  it('should navigate to products', () => {
    component.continueShopping();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  // ============================================
  // TESTS DES GETTERS
  // ============================================

  it('should check if cart is empty', () => {
    component.cart = { ...mockCart };
    expect(component.isCartEmpty).toBeFalse();

    component.cart = { ...mockCart, items: [] };
    expect(component.isCartEmpty).toBeTrue();
  });

  it('should get total items count', () => {
    component.cart = { ...mockCart };
    expect(component.getTotalItems()).toBe(2);
  });

  it('should check if user is authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    expect(component.isAuthenticated).toBeTrue();

    mockAuthService.isAuthenticated.and.returnValue(false);
    expect(component.isAuthenticated).toBeFalse();
  });

  // ============================================
  // TESTS DES MÉTHODES UTILITAIRES
  // ============================================

  it('should format price', () => {
    expect(component.formatPrice(99.99)).toBe('99,99 DT');
    expect(component.formatPrice(0)).toBe('0,00 DT');
    expect(component.formatPrice(undefined)).toBe('0,00 DT');
  });

  it('should get product name', () => {
    expect(component.getProductName(mockCartItem)).toBe('Produit Test');
    
    const itemWithoutProduct: CartItem = { ...mockCartItem, product: undefined as any };
    expect(component.getProductName(itemWithoutProduct)).toBe('Produit inconnu');
  });

  it('should get product image', () => {
    expect(component.getProductImage(mockCartItem)).toBe('http://localhost:8080/api/products/images/test.jpg');
    
    const itemWithoutImage = { ...mockCartItem, product: { ...mockCartItem.product, imageUrl: undefined } };
    expect(component.getProductImage(itemWithoutImage)).toBe('assets/images/default-product.jpg');
  });

  it('should reload cart', () => {
    spyOn<any>(component, 'loadCartByUser');
    component.userId = 1;
    component.reloadCart();
    expect((component as any).loadCartByUser).toHaveBeenCalled();
  });

  // ============================================
  // TEST DE TRACKING
  // ============================================

  it('should track by item id', () => {
    expect(component.trackByItemId(0, mockCartItem)).toBe(1);
    expect(component.trackByItemId(0, { ...mockCartItem, id: undefined })).toBe(0);
  });
});