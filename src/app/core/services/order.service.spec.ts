import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { environment } from 'src/environments/environment';
import { Order } from 'src/app/models/order';
import { Statut } from 'src/app/models/statut';
import { Product } from 'src/app/models/product';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/orders`;

  const mockProduct: Product = {
    id: 1,
    nom: 'Produit Test',
    description: 'Description',
    prix: 99.99,
    stock: 10,
    imageUrl: 'test.jpg',
    actif: true,
    categoryId: 1
  };

  const mockOrder: Order = {
    id: 1,
    total: 199.98,
    statut: 'EN_ATTENTE' as Statut,
    dateCommande: new Date(),
    items: [
      { id: 1, quantite: 2, prix: 99.99, product: mockProduct }
    ],
    user: { id: 1, nom: 'Doe', prenom: 'John', email: 'john@example.com', role: 'CLIENT', motDePasse: '' }
  };

  const mockOrders: Order[] = [mockOrder];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });
    service = TestBed.inject(OrderService);
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
  // TESTS CREATE_ORDER_FROM_CART
  // ============================================

  it('should create order from cart', () => {
    service.createOrderFromCart(1).subscribe(order => {
      expect(order).toEqual(mockOrder);
      expect(order.id).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/create/1`);
    expect(req.request.method).toBe('POST');
    req.flush(mockOrder);
  });

  it('should handle error when userId is invalid (0)', () => {
    service.createOrderFromCart(0).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBe('ID utilisateur manquant');
      }
    });
  });

  it('should handle error when userId is negative', () => {
    service.createOrderFromCart(-1).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBe('ID utilisateur invalide');
      }
    });
  });

  it('should handle 500 error from createOrder', () => {
    service.createOrderFromCart(1).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/create/1`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  // ============================================
  // TESTS GET_ORDER_BY_ID
  // ============================================

  it('should get order by id', () => {
    service.getOrderById(1).subscribe(order => {
      expect(order).toEqual(mockOrder);
      expect(order.id).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });

  it('should handle 404 from getOrderById', () => {
    service.getOrderById(999).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/999`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  // ============================================
  // TESTS GET_ORDERS_BY_USER
  // ============================================

  it('should get orders by user', () => {
    service.getOrdersByUser(1).subscribe(orders => {
      expect(orders.length).toBe(1);
      expect(orders[0]).toEqual(mockOrder);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrders);
  });

  it('should handle empty orders', () => {
    service.getOrdersByUser(1).subscribe(orders => {
      expect(orders.length).toBe(0);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/1`);
    req.flush([]);
  });

  // ============================================
  // TESTS GET_ALL_ORDERS
  // ============================================

  it('should get all orders (admin)', () => {
    service.getAllOrders().subscribe(orders => {
      expect(orders.length).toBe(1);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrders);
  });

  // ============================================
  // TESTS UPDATE_ORDER_STATUS
  // ============================================

  it('should update order status', () => {
    const updatedOrder = { ...mockOrder, statut: 'CONFIRMEE' as Statut };

    service.updateOrderStatus(1, 'CONFIRMEE' as Statut).subscribe(order => {
      expect(order.statut).toBe('CONFIRMEE');
    });

    const req = httpMock.expectOne(`${apiUrl}/1/status?statut=CONFIRMEE`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedOrder);
  });

  it('should handle error when updating status', () => {
    service.updateOrderStatus(1, 'CONFIRMEE' as Statut).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/1/status?statut=CONFIRMEE`);
    req.flush('Error', { status: 400, statusText: 'Bad Request' });
  });

  // ============================================
  // TESTS DELETE_ORDER
  // ============================================

  it('should delete order', () => {
    service.deleteOrder(1).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush('Order deleted');
  });

  it('should handle error when deleting order', () => {
    service.deleteOrder(1).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.message).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush('Error', { status: 404, statusText: 'Not Found' });
  });

  // ============================================
  // TESTS GET_ORDER_BY_CART_ID
  // ============================================

  it('should get order by cart id', () => {
    service.getOrderByCartId(1).subscribe(order => {
      expect(order).toEqual(mockOrder);
    });

    const req = httpMock.expectOne(`${apiUrl}/cart/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });

  // ============================================
  // TESTS TEST_CREATE_ORDER
  // ============================================

  it('should test create order', () => {
    service.testCreateOrder(1).subscribe(response => {
      expect(response).toBe('Test OK');
    });

    const req = httpMock.expectOne(`${apiUrl}/test/1`);
    expect(req.request.method).toBe('GET');
    req.flush('Test OK');
  });

  // ============================================
  // TESTS DES MÉTHODES UTILITAIRES
  // ============================================

  it('should get status text', () => {
    expect(service.getStatusText('EN_ATTENTE')).toBe('En attente');
    expect(service.getStatusText('CONFIRMEE')).toBe('Confirmée');
    expect(service.getStatusText('EXPEDIEE')).toBe('Expédiée');
    expect(service.getStatusText('LIVREE')).toBe('Livrée');
    expect(service.getStatusText('ANNULEE')).toBe('Annulée');
    expect(service.getStatusText('INCONNU')).toBe('INCONNU');
  });

  it('should get status color', () => {
    expect(service.getStatusColor('EN_ATTENTE')).toBe('warning');
    expect(service.getStatusColor('CONFIRMEE')).toBe('info');
    expect(service.getStatusColor('EXPEDIEE')).toBe('primary');
    expect(service.getStatusColor('LIVREE')).toBe('success');
    expect(service.getStatusColor('ANNULEE')).toBe('danger');
    expect(service.getStatusColor('INCONNU')).toBe('secondary');
  });

  it('should format date', () => {
    const date = new Date('2024-01-15T10:30:00');
    const formatted = service.formatDate(date);
    expect(formatted).toContain('15');
    expect(formatted).toContain('01');
    expect(formatted).toContain('2024');
  });

  it('should return N/A for invalid date', () => {
    expect(service.formatDate(null as any)).toBe('N/A');
    expect(service.formatDate('')).toBe('N/A');
  });

  it('should get total items in order', () => {
    expect(service.getTotalItems(mockOrder)).toBe(2);
    expect(service.getTotalItems({} as Order)).toBe(0);
    expect(service.getTotalItems({ items: [] } as unknown as Order)).toBe(0);
  });
});