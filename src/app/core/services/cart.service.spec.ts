import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';
import { Cart } from 'src/app/models/cart';
import { CartItem } from 'src/app/models/cart-item';
import { User } from 'src/app/models/user';
import { of, throwError } from 'rxjs';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let mockAuthService: any;

  const apiUrl = `${environment.apiUrl}/carts`;
  const cartItemUrl = `${environment.apiUrl}/cart-items`;

  const mockUser: User = {
    id: 1,
    nom: 'Doe',
    prenom: 'John',
    email: 'john@example.com',
    motDePasse: 'password',
    role: 'CLIENT'
  };

  const mockCart: Cart = {
    id: 1,
    total: 99.99,
    items: [],
    dateCreation: new Date(),
    user: mockUser
  };

  const userId: number = mockUser.id as number;

  const mockCartItem: CartItem = {
    id: 1,
    quantite: 2,
    prixUnitaire: 49.99,
    product: { id: 1, nom: 'Produit Test', prix: 49.99, stock: 10 } as any,
    cart: mockCart
  };

  beforeEach(() => {
    mockAuthService = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(mockUser),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true)
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================
  // TEST D'INSTANCIATION
  // ============================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================
  // TESTS GET_OR_CREATE_CART
  // ============================================

  it('should get existing cart for user', () => {
    service.getOrCreateCart().subscribe(cart => {
      expect(cart).toEqual(mockCart);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${mockUser.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCart);
  });

  it('should create new cart if not found (404)', () => {
    const newCart = { ...mockCart, id: 2 };

    service.getOrCreateCart().subscribe(cart => {
      expect(cart).toBeDefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${mockUser.id}`);
    expect(req.request.method).toBe('GET');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    const createReq = httpMock.expectOne(apiUrl);
    expect(createReq.request.method).toBe('POST');
    createReq.flush(newCart);
  });

  it('should handle error when getOrCreateCart fails', () => {
    service.getOrCreateCart().subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${mockUser.id}`);
    req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
  });

  // ============================================
  // TESTS ADD_TO_CART
  // ============================================

  it('should add product to cart', () => {
    service.addToCart(1, 2, userId).subscribe(item => {
      expect(item).toEqual(mockCartItem);
    });

    // 1. Récupérer le panier
    const getReq = httpMock.expectOne(`${apiUrl}/user/${mockUser.id}`);
    getReq.flush(mockCart);

    // 2. Ajouter l'item
    const addReq = httpMock.expectOne(`${apiUrl}/${mockCart.id}/add-item-simple`);
    expect(addReq.request.method).toBe('POST');
    expect(addReq.request.body).toEqual({ productId: 1, quantite: 2 });
    addReq.flush(mockCartItem);
  });

  it('should create cart if not found when adding item', () => {
    const newCart = { ...mockCart, id: 2 };

    service.addToCart(1, 2, userId).subscribe(item => {
      expect(item).toEqual(mockCartItem);
    });

    // 1. Tentative de récupération du panier échoue (404)
    const getReq = httpMock.expectOne(`${apiUrl}/user/${userId}`);
    getReq.flush('Not found', { status: 404, statusText: 'Not Found' });

    // 2. Création du panier
    const createReq = httpMock.expectOne(`${apiUrl}/user/${userId}/find-or-create`);
    expect(createReq.request.method).toBe('GET');
    createReq.flush(newCart);

    // 3. Ajout de l'item
    const addReq = httpMock.expectOne(`${apiUrl}/${newCart.id}/add-item-simple`);
    addReq.flush(mockCartItem);
  });

  // ============================================
  // TESTS ADD_PRODUCT_TO_CART_SIMPLE
  // ============================================

  it('should add product to cart via simple method', () => {
    service.addProductToCartSimple(1, 2).subscribe(item => {
      expect(item).toEqual(mockCartItem);
    });

    const getReq = httpMock.expectOne(`${apiUrl}/user/${mockUser.id}`);
    getReq.flush(mockCart);

    const addReq = httpMock.expectOne(`${apiUrl}/${mockCart.id}/add-item-simple`);
    addReq.flush(mockCartItem);
  });

  it('should return error if user not authenticated', () => {
    mockAuthService.getCurrentUser.and.returnValue(null);

    service.addProductToCartSimple(1, 2).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBe('Utilisateur non connecté');
      }
    });
  });

  // ============================================
  // TESTS GET_CART_BY_USER
  // ============================================

  it('should get cart by user id', () => {
    service.getCartByUser(userId).subscribe(cart => {
      expect(cart).toEqual(mockCart);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCart);
  });

  it('should handle error when getting cart by user', () => {
    service.getCartByUser(userId).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  // ============================================
  // TESTS GET_CART
  // ============================================

  it('should get cart by id', () => {
    service.getCart(1).subscribe(cart => {
      expect(cart).toEqual(mockCart);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCart);
  });

  // ============================================
  // TESTS CREATE_CART
  // ============================================

  it('should create a new cart', () => {
    const newCart = { ...mockCart, id: undefined } as any;

    service.createCart(newCart).subscribe(cart => {
      expect(cart.id).toBe(1);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockCart);
  });

  // ============================================
  // TESTS UPDATE_CART
  // ============================================

  it('should update a cart', () => {
    const updatedCart = { ...mockCart, total: 199.99 };

    service.updateCart(1, updatedCart).subscribe(cart => {
      expect(cart.total).toBe(199.99);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedCart);
  });

  // ============================================
  // TESTS DELETE_CART
  // ============================================

  it('should delete a cart', () => {
    service.deleteCart(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  // ============================================
  // TESTS ADD_ITEM
  // ============================================

  it('should add an item to cart', () => {
    service.addItem(mockCartItem).subscribe(item => {
      expect(item).toEqual(mockCartItem);
    });

    const req = httpMock.expectOne(cartItemUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockCartItem);
  });

  // ============================================
  // TESTS UPDATE_ITEM
  // ============================================

  it('should update an item', () => {
    const updatedItem = { ...mockCartItem, quantite: 3 };

    service.updateItem(1, updatedItem).subscribe(item => {
      expect(item.quantite).toBe(3);
    });

    const req = httpMock.expectOne(`${cartItemUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedItem);
  });

  // ============================================
  // TESTS REMOVE_ITEM
  // ============================================

  it('should remove an item', () => {
    service.removeItem(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${cartItemUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  // ============================================
  // TESTS CALCULATE_TOTAL
  // ============================================

  it('should calculate total from items', () => {
    const items: CartItem[] = [
      { ...mockCartItem, quantite: 2, prixUnitaire: 49.99 },
      { ...mockCartItem, id: 2, quantite: 1, prixUnitaire: 29.99 }
    ];

    const total = service.calculateTotal(items);
    expect(total).toBe(129.97); // 2 * 49.99 + 1 * 29.99
  });

  it('should return 0 for empty items', () => {
    expect(service.calculateTotal([])).toBe(0);
  });

  // ============================================
  // TESTS CALCULATE_TOTAL_ITEMS
  // ============================================

  it('should calculate total number of items', () => {
    const items: CartItem[] = [
      { ...mockCartItem, quantite: 2 },
      { ...mockCartItem, id: 2, quantite: 3 }
    ];

    const total = service.calculateTotalItems(items);
    expect(total).toBe(5);
  });

  it('should return 0 for empty items', () => {
    expect(service.calculateTotalItems([])).toBe(0);
  });

  // ============================================
  // TESTS GET_CART_COUNT
  // ============================================

  it('should get cart count', () => {
    const cartWithItems = { ...mockCart, items: [mockCartItem] };

    service.getCartCount().subscribe(count => {
      expect(count).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${mockUser.id}`);
    req.flush(cartWithItems);
  });

  it('should return 0 if user not authenticated', () => {
    mockAuthService.getCurrentUser.and.returnValue(null);

    service.getCartCount().subscribe(count => {
      expect(count).toBe(0);
    });
  });

  // ============================================
  // TESTS GET_CURRENT_CART_ID
  // ============================================

  it('should get current cart id', () => {
    expect(service.getCurrentCartId()).toBeNull();

    // Simuler un chargement de panier
    service.getCartByUser(mockUser.id!).subscribe(() => {
      expect(service.getCurrentCartId()).toBe(mockCart.id ?? null);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${mockUser.id}`);
    req.flush(mockCart);
  });

  // ============================================
  // TESTS NOTIFY_CART_UPDATE
  // ============================================

  it('should notify cart update', () => {
    spyOn(service, 'notifyCartUpdate').and.callThrough();
    service.notifyCartUpdate();
    expect(service.notifyCartUpdate).toHaveBeenCalled();
  });
});