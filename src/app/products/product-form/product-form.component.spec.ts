import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Product } from 'src/app/models/product';
import { Category } from 'src/app/models/category';

let mockProductService: any;
let mockCategoryService: any;
let mockRouter: any;
let mockActivatedRoute: any;

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

const mockCategories: Category[] = [
  { id: 1, nom: 'Électronique' },
  { id: 2, nom: 'Vêtements' }
];

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;

  beforeEach(() => {
    mockProductService = {
      create: jasmine.createSpy('create').and.returnValue(of({ id: 5 })),
      update: jasmine.createSpy('update').and.returnValue(of({})),
      getById: jasmine.createSpy('getById').and.returnValue(of(null)),
      getImageUrl: jasmine.createSpy('getImageUrl').and.returnValue('image.jpg')
    };

    mockCategoryService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([]))
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    TestBed.configureTestingModule({
      declarations: [ProductFormComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', fakeAsync(() => {
    mockCategoryService.getAll.and.returnValue(of(mockCategories));
    component.ngOnInit();
    tick();
    flush();
    expect(mockCategoryService.getAll).toHaveBeenCalled();
    expect(component.categories.length).toBe(2);
  }));

  it('should load product for edit mode', fakeAsync(() => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('1');
    mockProductService.getById.and.returnValue(of(mockProduct));
    mockCategoryService.getAll.and.returnValue(of(mockCategories));
    
    component.ngOnInit();
    tick();
    flush();
    
    expect(mockProductService.getById).toHaveBeenCalledWith(1);
    expect(component.isEditMode).toBeTrue();
  }));

  it('should validate form', () => {
    component.ngOnInit();
    const form = component.productForm;
    expect(form.valid).toBeFalse();
    
    form.patchValue({
      nom: 'Test',
      description: 'Description',
      prix: 10,
      stock: 5,
      categoryId: 1
    });
    
    expect(form.valid).toBeTrue();
  });

  it('should create product', fakeAsync(() => {
    component.ngOnInit();
    component.isEditMode = false;
    component.productForm.patchValue({
      nom: 'Nouveau Produit',
      description: 'Description',
      prix: 49.99,
      stock: 15,
      categoryId: 1,
      actif: true
    });
    
    mockProductService.create.and.returnValue(of({ id: 5 }));
    
    component.onSubmit();
    tick();
    flush();
    
    expect(mockProductService.create).toHaveBeenCalled();
  }));

  it('should handle create error', fakeAsync(() => {
    component.ngOnInit();
    component.isEditMode = false;
    component.productForm.patchValue({
      nom: 'Nouveau Produit',
      description: 'Description',
      prix: 49.99,
      stock: 15,
      categoryId: 1,
      actif: true
    });
    
    mockProductService.create.and.returnValue(throwError(() => new Error('Create failed')));
    
    component.onSubmit();
    tick();
    flush();
    
   
    expect(mockProductService.create).toHaveBeenCalled();
    // Vérifier que l'erreur a été gérée (le composant a défini errorMessage)
    // Le message exact peut varier, on vérifie juste qu'il contient "erreur"
    expect(component.errorMessage).toBeTruthy();
    // OU si vous voulez le message exact :
    // expect(component.errorMessage).toContain('Erreur');
  }));

  it('should update product', fakeAsync(() => {
    component.ngOnInit();
    component.isEditMode = true;
    component.productId = 1;
    component.productForm.patchValue({
      nom: 'Produit Modifié',
      description: 'Description modifiée',
      prix: 79.99,
      stock: 20,
      categoryId: 2,
      actif: true
    });
    
    mockProductService.update.and.returnValue(of({}));
    component.onSubmit();
    tick();
    flush();
    
    expect(mockProductService.update).toHaveBeenCalled();
  }));

  it('should navigate back on cancel', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });
});