import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';  
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { Product } from 'src/app/models/product';
import { Category } from 'src/app/models/category';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

let mockProductService: any;
let mockCategoryService: any;
let mockCartService: any;
let mockAuthService: any;

const mockProducts: Product[] = [
  { id: 1, nom: 'Produit 1', description: 'Description 1', prix: 99.99, stock: 10, imageUrl: 'image1.jpg', actif: true, categoryId: 1, category: { id: 1, nom: 'Électronique' } },
  { id: 2, nom: 'Produit 2', description: 'Description 2', prix: 149.99, stock: 5, imageUrl: 'image2.jpg', actif: true, categoryId: 2, category: { id: 2, nom: 'Vêtements' } },
  { id: 3, nom: 'Produit 3', description: 'Description 3', prix: 49.99, stock: 0, imageUrl: 'image3.jpg', actif: true, categoryId: 1, category: { id: 1, nom: 'Électronique' } }
];

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;

  beforeEach(() => {
    mockProductService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([])),
      delete: jasmine.createSpy('delete').and.returnValue(of({})),
      getImageUrl: jasmine.createSpy('getImageUrl').and.returnValue('image.jpg')
    };

    mockCategoryService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([]))
    };

    mockCartService = {
      addProductToCartSimple: jasmine.createSpy('addProductToCartSimple').and.returnValue(of({}))
    };

    mockAuthService = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true),
      onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue(of(null))
    };

    TestBed.configureTestingModule({
      declarations: [ProductListComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: CartService, useValue: mockCartService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    component.isAdmin = true;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', fakeAsync(() => {
    mockProductService.getAll.and.returnValue(of(mockProducts));
    mockCategoryService.getAll.and.returnValue(of([{ id: 1, nom: 'Électronique' }]));
    
    component.ngOnInit();
    tick();
    flush();
    
    expect(mockProductService.getAll).toHaveBeenCalled();
    expect(component.products.length).toBe(3);
  }));

  it('should filter by category', () => {
    component.products = [...mockProducts];
    component.selectedCategoryId = 1;
    component.applyFilters();
    expect(component.filteredProducts.length).toBe(2);
  });

  it('should filter by search keyword', () => {
    component.products = [...mockProducts];
    component.searchKeyword = 'Produit 1';
    component.applyFilters();
    expect(component.filteredProducts.length).toBe(1);
  });

  it('should add product to cart', fakeAsync(() => {
    component.products = [...mockProducts];
    mockCartService.addProductToCartSimple.and.returnValue(of({}));
    
    component.addToCart(mockProducts[0]);
    tick();
    flush();
    
    expect(mockCartService.addProductToCartSimple).toHaveBeenCalledWith(1, 1);
  }));

  it('should handle error when adding to cart', fakeAsync(() => {
    component.products = [...mockProducts];
    mockCartService.addProductToCartSimple.and.returnValue(throwError(() => new Error('Cart error')));
    spyOn(console, 'error');
    
    component.addToCart(mockProducts[0]);
    tick();
    flush();
    
    expect(console.error).toHaveBeenCalled();
  }));

  it('should delete product with confirmation', fakeAsync(() => {
    component.products = [...mockProducts];
    spyOn(window, 'confirm').and.returnValue(true);
    mockProductService.delete.and.returnValue(of({}));
    
    component.deleteProduct(1);
    tick();
    flush();
    
    expect(mockProductService.delete).toHaveBeenCalledWith(1);
  }));

  it('should not delete without confirmation', fakeAsync(() => {
    component.products = [...mockProducts];
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteProduct(1);
    tick();
    flush();
    
    expect(mockProductService.delete).not.toHaveBeenCalled();
  }));

  it('should handle delete error', fakeAsync(() => {
    component.products = [...mockProducts];
    spyOn(window, 'confirm').and.returnValue(true);
    mockProductService.delete.and.returnValue(throwError(() => new Error('Delete failed')));
    
    component.deleteProduct(1);
    tick();
    flush();
    
    expect(mockProductService.delete).toHaveBeenCalledWith(1);
  }));

  it('should get paginated products', () => {
    component.products = [...mockProducts];
    component.filteredProducts = [...mockProducts];
    component.currentPage = 1;
    component.itemsPerPage = 2;
    
    const paginated = component.getPaginatedProducts();
    expect(paginated.length).toBe(2);
  });
});