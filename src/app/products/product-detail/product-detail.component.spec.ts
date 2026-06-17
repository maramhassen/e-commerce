import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Product } from 'src/app/models/product';
import { RouterTestingModule } from '@angular/router/testing';

let mockProductService: any;
let mockCartService: any;
let mockAuthService: any;
let mockRouter: any;
let mockActivatedRoute: any;

const mockProduct: Product = {
  id: 1,
  nom: 'Produit Test',
  description: 'Description du produit',
  prix: 99.99,
  stock: 10,
  imageUrl: 'test.jpg',
  actif: true,
  categoryId: 1,
  category: { id: 1, nom: 'Électronique' }
};

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  beforeEach(() => {
    mockProductService = {
      getById: jasmine.createSpy('getById').and.returnValue(of(mockProduct)),
      delete: jasmine.createSpy('delete').and.returnValue(of({})),
      getImageUrl: jasmine.createSpy('getImageUrl').and.returnValue('image.jpg')
    };

    mockCartService = {
      addProductToCartSimple: jasmine.createSpy('addProductToCartSimple').and.returnValue(of({}))
    };

    mockAuthService = {
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true)
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
      declarations: [ProductDetailComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: CartService, useValue: mockCartService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', fakeAsync(() => {
    mockProductService.getById.and.returnValue(of(mockProduct));
    component.ngOnInit();
    tick();
    flush();
    expect(mockProductService.getById).toHaveBeenCalledWith(1);
    expect(component.product).toEqual(mockProduct);
  }));

  it('should handle error when loading product', fakeAsync(() => {
    mockProductService.getById.and.returnValue(throwError(() => new Error('Load failed')));
    spyOn(console, 'error');
    component.ngOnInit();
    tick();
    flush();
    expect(console.error).toHaveBeenCalled();
  }));

  it('should add product to cart', fakeAsync(() => {
    component.product = { ...mockProduct };
    mockCartService.addProductToCartSimple.and.returnValue(of({}));
    component.addToCart();
    tick();
    flush();
    expect(mockCartService.addProductToCartSimple).toHaveBeenCalledWith(1, 1);
  }));

  it('should handle error when adding to cart', fakeAsync(() => {
    component.product = { ...mockProduct };
    mockCartService.addProductToCartSimple.and.returnValue(throwError(() => new Error('Cart error')));
    spyOn(console, 'error');
    component.addToCart();
    tick();
    flush();
    expect(console.error).toHaveBeenCalled();
  }));

  it('should delete product with confirmation', fakeAsync(() => {
    component.product = { ...mockProduct };
    spyOn(window, 'confirm').and.returnValue(true);
    mockProductService.delete.and.returnValue(of({}));
    component.deleteProduct();
    tick();
    flush();
    expect(mockProductService.delete).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  }));

  it('should not delete without confirmation', fakeAsync(() => {
    component.product = { ...mockProduct };
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteProduct();
    tick();
    flush();
    expect(mockProductService.delete).not.toHaveBeenCalled();
  }));

  it('should go back', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });
});