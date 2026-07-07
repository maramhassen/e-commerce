import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { CategoryFormComponent } from './category-form.component';
import { CategoryService } from '../../core/services/category.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Category } from 'src/app/models/category';

let mockCategoryService: any;
let mockRouter: any;
let mockActivatedRoute: any;

const mockCategory: Category = {
  id: 1,
  nom: 'Électronique',
  description: 'Produits électroniques'
};

describe('CategoryFormComponent', () => {
  let component: CategoryFormComponent;
  let fixture: ComponentFixture<CategoryFormComponent>;

  beforeEach(() => {
    mockCategoryService = {
      create: jasmine.createSpy('create').and.returnValue(of({})),
      update: jasmine.createSpy('update').and.returnValue(of({})),
      getById: jasmine.createSpy('getById').and.returnValue(of(mockCategory))
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
      declarations: [CategoryFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFormComponent);
    component = fixture.componentInstance;
  });

  // ============================================
  // TESTS D'INITIALISATION
  // ============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values in create mode', fakeAsync(() => {
    component.ngOnInit();
    tick();
    flush();

    expect(component.isEditMode).toBeFalse();
    expect(component.categoryId).toBeUndefined();
    expect(component.categoryForm.get('nom')?.value).toBe('');
    expect(component.categoryForm.get('description')?.value).toBe('');
    expect(component.categoryForm.valid).toBeFalse();
  }));

  it('should load category in edit mode', fakeAsync(() => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('1');
    
    component.ngOnInit();
    tick();
    flush();

    expect(component.isEditMode).toBeTrue();
    expect(component.categoryId).toBe(1);
    expect(mockCategoryService.getById).toHaveBeenCalledWith(1);
    expect(component.categoryForm.get('nom')?.value).toBe('Électronique');
    expect(component.categoryForm.get('description')?.value).toBe('Produits électroniques');
  }));

  it('should handle error when loading category in edit mode', fakeAsync(() => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('1');
    mockCategoryService.getById.and.returnValue(throwError(() => new Error('Load failed')));

    component.ngOnInit();
    tick();
    flush();

    expect(component.errorMessage).toBe('Erreur lors du chargement de la catégorie');
    expect(component.loading).toBeFalse();
  }));

  // ============================================
  // TESTS DE VALIDATION
  // ============================================

  it('should validate required fields', () => {
    component.ngOnInit();
    const form = component.categoryForm;
    
    expect(form.valid).toBeFalse();
    
    form.patchValue({
      nom: 'Test',
      description: 'Description'
    });
    
    expect(form.valid).toBeTrue();
  });

  it('should validate min length for nom', () => {
    component.ngOnInit();
    const nomControl = component.categoryForm.get('nom');
    
    nomControl?.setValue('A');
    expect(nomControl?.valid).toBeFalse();
    
    nomControl?.setValue('AB');
    expect(nomControl?.valid).toBeTrue();
  });

  it('should have getters for form controls', () => {
    component.ngOnInit();
    
    expect(component.nom).toBe(component.categoryForm.get('nom'));
    expect(component.description).toBe(component.categoryForm.get('description'));
  });

  // ============================================
  // TESTS DE CRÉATION
  // ============================================

  it('should create a new category', fakeAsync(() => {
    component.ngOnInit();
    component.isEditMode = false;
    component.categoryForm.patchValue({
      nom: 'Nouvelle Catégorie',
      description: 'Description de la nouvelle catégorie'
    });

    mockCategoryService.create.and.returnValue(of({ id: 4, ...component.categoryForm.value }));

    component.onSubmit();
    tick();
    flush();

    expect(mockCategoryService.create).toHaveBeenCalledWith(component.categoryForm.value);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
  }));

  it('should handle error when create fails', fakeAsync(() => {
    component.ngOnInit();
    component.isEditMode = false;
    component.categoryForm.patchValue({
      nom: 'Nouvelle Catégorie',
      description: 'Description'
    });

    mockCategoryService.create.and.returnValue(throwError(() => new Error('Create failed')));

    component.onSubmit();
    tick();
    flush();

    expect(component.errorMessage).toBe('Erreur lors de la création');
    expect(component.loading).toBeFalse();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  // ============================================
  // TESTS DE MISE À JOUR
  // ============================================

  it('should update an existing category', fakeAsync(() => {
    component.ngOnInit();
    component.isEditMode = true;
    component.categoryId = 1;
    component.categoryForm.patchValue({
      nom: 'Catégorie Modifiée',
      description: 'Description modifiée'
    });

    mockCategoryService.update.and.returnValue(of({}));

    component.onSubmit();
    tick();
    flush();

    expect(mockCategoryService.update).toHaveBeenCalledWith(1, component.categoryForm.value);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
  }));

  it('should handle error when update fails', fakeAsync(() => {
    component.ngOnInit();
    component.isEditMode = true;
    component.categoryId = 1;
    component.categoryForm.patchValue({
      nom: 'Catégorie Modifiée',
      description: 'Description modifiée'
    });

    mockCategoryService.update.and.returnValue(throwError(() => new Error('Update failed')));

    component.onSubmit();
    tick();
    flush();

    expect(component.errorMessage).toBe('Erreur lors de la modification');
    expect(component.loading).toBeFalse();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  // ============================================
  // TESTS D'ANNULATION
  // ============================================

  it('should navigate back on cancel', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
  });

  // ============================================
  // TESTS DE FORMULAIRE INVALIDE
  // ============================================

  it('should not submit if form is invalid', () => {
    component.ngOnInit();
    component.categoryForm.patchValue({
      nom: '',
      description: ''
    });

    component.onSubmit();

    expect(mockCategoryService.create).not.toHaveBeenCalled();
    expect(mockCategoryService.update).not.toHaveBeenCalled();
  });
});