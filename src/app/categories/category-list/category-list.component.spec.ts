import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { CategoryListComponent } from './category-list.component';
import { CategoryService } from '../../core/services/category.service';
import { of, throwError } from 'rxjs';
import { Category } from 'src/app/models/category';
import { Router } from '@angular/router';

let mockCategoryService: any;
let mockRouter: any;

const mockCategories: Category[] = [
  { id: 1, nom: 'Électronique', description: 'Produits électroniques' },
  { id: 2, nom: 'Vêtements', description: 'Vêtements et accessoires' },
  { id: 3, nom: 'Maison', description: 'Articles pour la maison' }
];

describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;

  beforeEach(() => {
    mockCategoryService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of(mockCategories)),
      delete: jasmine.createSpy('delete').and.returnValue(of({}))
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      declarations: [CategoryListComponent],
      // NE PAS importer RouterTestingModule
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
  });

  // ============================================
  // TESTS D'INITIALISATION
  // ============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flush();
    expect(mockCategoryService.getAll).toHaveBeenCalled();
    expect(component.categories.length).toBe(3);
    expect(component.categories).toEqual(mockCategories);
  }));

  it('should handle error when loading categories fails', fakeAsync(() => {
    mockCategoryService.getAll.and.returnValue(throwError(() => new Error('Load failed')));
    
    component.loadCategories();
    tick();
    flush();
    
    expect(component.errorMessage).toBe('Erreur lors du chargement des catégories');
    expect(component.categories.length).toBe(0);
  }));

  // ============================================
  // TESTS DE SUPPRESSION
  // ============================================

  it('should delete category with confirmation', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockCategoryService.delete.and.returnValue(of({}));
    spyOn(component, 'loadCategories');

    component.deleteCategory(1);
    tick();
    flush();

    expect(window.confirm).toHaveBeenCalledWith('Voulez-vous vraiment supprimer cette catégorie ?');
    expect(mockCategoryService.delete).toHaveBeenCalledWith(1);
    expect(component.loadCategories).toHaveBeenCalled();
  }));

  it('should not delete category without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteCategory(1);

    expect(mockCategoryService.delete).not.toHaveBeenCalled();
  });

  it('should not delete category with invalid id', () => {
    spyOn(window, 'confirm');

    component.deleteCategory(undefined);
    component.deleteCategory(null as any);

    expect(window.confirm).not.toHaveBeenCalled();
    expect(mockCategoryService.delete).not.toHaveBeenCalled();
  });

  it('should handle error when delete fails', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    mockCategoryService.delete.and.returnValue(throwError(() => new Error('Delete failed')));

    component.deleteCategory(1);
    tick();
    flush();

    expect(window.alert).toHaveBeenCalledWith('Erreur lors de la suppression');
  }));

  // ============================================
  // TESTS DE NAVIGATION
  // ============================================

  it('should navigate to add category page', () => {
    component.goToAdd();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories/new']);
  });

  it('should navigate to edit category page', () => {
    component.goToEdit(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories/edit', 1]);
  });

  it('should not navigate to edit with invalid id', () => {
    component.goToEdit(undefined);
    component.goToEdit(null as any);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ============================================
  // TESTS DES MÉTHODES UTILITAIRES
  // ============================================

  it('should return description or dash if empty', () => {
    expect(component.getDescription('Description test')).toBe('Description test');
    expect(component.getDescription('')).toBe('-');
    expect(component.getDescription(undefined)).toBe('-');
  });
});