/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { environment } from 'src/environments/environment';
import { Category } from 'src/app/models/category';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/categories`;

  const mockCategories: Category[] = [
    { id: 1, nom: 'Électronique' },
    { id: 2, nom: 'Vêtements' },
    { id: 3, nom: 'Maison' }
  ];

  const mockCategory: Category = { id: 1, nom: 'Électronique' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService]
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifie qu'aucune requête non traitée
  });

  // ============================================
  // TEST D'INSTANCIATION
  // ============================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================
  // TESTS GET ALL
  // ============================================

  it('should fetch all categories via getAll()', () => {
    service.getAll().subscribe(categories => {
      expect(categories.length).toBe(3);
      expect(categories).toEqual(mockCategories);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('should handle error when getAll() fails', () => {
    service.getAll().subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(err.statusText).toBe('Internal Server Error');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush('Erreur', { status: 500, statusText: 'Internal Server Error' });
  });

  // ============================================
  // TESTS GET BY ID
  // ============================================

  it('should fetch a category by id via getById()', () => {
    service.getById(1).subscribe(category => {
      expect(category).toEqual(mockCategory);
      expect(category.id).toBe(1);
      expect(category.nom).toBe('Électronique');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategory);
  });

  it('should handle 404 error when category not found', () => {
    service.getById(999).subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => {
        expect(err.status).toBe(404);
        expect(err.statusText).toBe('Not Found');
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/999`);
    expect(req.request.method).toBe('GET');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  // ============================================
  // TESTS CREATE
  // ============================================

  it('should create a new category via create()', () => {
    const newCategory: Category = { nom: 'Nouvelle Catégorie' };
    const createdCategory: Category = { id: 4, nom: 'Nouvelle Catégorie' };

    service.create(newCategory).subscribe(category => {
      expect(category).toEqual(createdCategory);
      expect(category.id).toBe(4);
      expect(category.nom).toBe('Nouvelle Catégorie');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCategory);
    req.flush(createdCategory);
  });

  it('should handle error when create() fails', () => {
    const newCategory: Category = { nom: 'Nouvelle Catégorie' };

    service.create(newCategory).subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.statusText).toBe('Bad Request');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
  });

  // ============================================
  // TESTS UPDATE
  // ============================================

  it('should update a category via update()', () => {
    const updatedCategory: Category = { id: 1, nom: 'Électronique Modifié' };

    service.update(1, updatedCategory).subscribe(category => {
      expect(category).toEqual(updatedCategory);
      expect(category.nom).toBe('Électronique Modifié');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedCategory);
    req.flush(updatedCategory);
  });

  it('should handle error when update() fails', () => {
    const updatedCategory: Category = { id: 1, nom: 'Électronique Modifié' };

    service.update(1, updatedCategory).subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => {
        expect(err.status).toBe(404);
        expect(err.statusText).toBe('Not Found');
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  // ============================================
  // TESTS DELETE
  // ============================================

  it('should delete a category via delete()', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should handle error when delete() fails', () => {
    service.delete(1).subscribe({
      next: () => fail('devrait échouer'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(err.statusText).toBe('Internal Server Error');
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush('Erreur', { status: 500, statusText: 'Internal Server Error' });
  });

  // ============================================
  // TESTS D'INTÉGRATION (appels multiples)
  // ============================================

  it('should handle multiple requests in sequence', () => {
    // 1. Récupérer toutes les catégories
    service.getAll().subscribe(categories => {
      expect(categories.length).toBe(3);
    });

    let req = httpMock.expectOne(apiUrl);
    req.flush(mockCategories);

    // 2. Récupérer une catégorie spécifique
    service.getById(1).subscribe(category => {
      expect(category).toEqual(mockCategory);
    });

    req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(mockCategory);

    // 3. Créer une nouvelle catégorie
    const newCategory: Category = { nom: 'Nouvelle' };
    service.create(newCategory).subscribe(category => {
      expect(category.id).toBe(4);
    });

    req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 4, nom: 'Nouvelle' });
  });
});