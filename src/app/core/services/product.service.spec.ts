/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { environment } from 'src/environments/environment';
import { Product } from 'src/app/models/product';
import { Category } from 'src/app/models/category';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/products`;
  const categoryApiUrl = `${environment.apiUrl}/categories`;

  const mockCategories: Category[] = [
    { id: 1, nom: 'Électronique' },
    { id: 2, nom: 'Vêtements' }
  ];

  const mockProduct: Product = {
    id: 1, nom: 'Produit Test', description: 'Description',
    prix: 99.99, stock: 10, imageUrl: 'test.jpg', actif: true, categoryId: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all products via getAll()', () => {
    service.getAll().subscribe(products => {
      expect(products.length).toBe(1);
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([mockProduct]);
  });

  it('should fetch a product by id and enrich it with its category', () => {
    service.getById(1).subscribe(product => {
      expect(product.id).toBe(1);
      expect(product.category).toEqual(mockCategories[0]);
    });

    const productReq = httpMock.expectOne(`${apiUrl}/1`);
    expect(productReq.request.method).toBe('GET');
    productReq.flush({ ...mockProduct, category: undefined });

    const categoryReq = httpMock.expectOne(categoryApiUrl);
    categoryReq.flush(mockCategories);
  });

  it('should propagate a 404 error from getById through handleError', () => {
    service.getById(1).subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => expect(err.message).toContain('Endpoint non trouvé')
    });

    const productReq = httpMock.expectOne(`${apiUrl}/1`);
    productReq.flush('Not found', { status: 404, statusText: 'Not Found' });

    const categoryReq = httpMock.expectOne(categoryApiUrl);
    categoryReq.flush(mockCategories);
  });

  it('should create a product then reload it via getById', () => {
    service.create({ nom: 'Nouveau', description: 'D', prix: 10, stock: 5, categoryId: 1, actif: true })
      .subscribe(product => expect(product.id).toBe(1));

    const createReq = httpMock.expectOne(apiUrl);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body.nom).toBe('Nouveau');
    createReq.flush({ id: 1 });

    const getReq = httpMock.expectOne(`${apiUrl}/1`);
    getReq.flush({ ...mockProduct, category: undefined });

    const categoryReq = httpMock.expectOne(categoryApiUrl);
    categoryReq.flush(mockCategories);
  });

  it('should handle create error', () => {
    service.create({ nom: 'Nouveau', prix: 10, stock: 5 }).subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => expect(err.message).toBeTruthy()
    });

    const createReq = httpMock.expectOne(apiUrl);
    createReq.flush('Erreur', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should update a product then reload it via getById', () => {
    service.update(1, { nom: 'Modifié', prix: 20, stock: 3, categoryId: 2, actif: true })
      .subscribe(product => expect(product.id).toBe(1));

    const updateReq = httpMock.expectOne(`${apiUrl}/1`);
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush({});

    const getReq = httpMock.expectOne(`${apiUrl}/1`);
    getReq.flush({ ...mockProduct, category: undefined });

    const categoryReq = httpMock.expectOne(categoryApiUrl);
    categoryReq.flush(mockCategories);
  });

  it('should delete a product', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should handle delete error', () => {
    service.delete(1).subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => expect(err.message).toContain('serveur')
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush('Erreur', { status: 500, statusText: 'Internal Server Error' });
  });

  describe('getImageUrl', () => {
    it('returns default image when empty/null/undefined', () => {
      expect(service.getImageUrl(null)).toBe('assets/images/default-product.jpg');
      expect(service.getImageUrl('undefined')).toBe('assets/images/default-product.jpg');
    });

    it('returns full URLs as-is', () => {
      expect(service.getImageUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
      expect(service.getImageUrl('blob:abc123')).toBe('blob:abc123');
    });

    it('returns assets path as-is', () => {
      expect(service.getImageUrl('assets/images/foo.jpg')).toBe('assets/images/foo.jpg');
    });

    it('builds full URL for UUID-like filenames', () => {
      const filename = 'a1b2c3d4-e5f6-7890.jpg';
      expect(service.getImageUrl(filename)).toBe(`${environment.apiUrl}/products/images/${filename}`);
    });
  });

  describe('getCategoryName', () => {
    it('returns category name when present', () => {
      const product = { ...mockProduct, category: { id: 1, nom: 'Électronique' } };
      expect(service.getCategoryName(product)).toBe('Électronique');
    });

    it('returns "Non catégorisé" when nothing is available', () => {
      const product = { ...mockProduct, category: undefined, categoryId: undefined };
      expect(service.getCategoryName(product)).toBe('Non catégorisé');
    });
  });
});