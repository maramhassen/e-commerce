// src/app/app.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule],
    declarations: [AppComponent]
  }));

  // ═══════════════════════════════════════════════════════════
  // TESTS EXISTANTS
  // ═══════════════════════════════════════════════════════════

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'site-e-commerce'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('site-e-commerce');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.content span')?.textContent).toContain('site-e-commerce app is running!');
  });

  // ═══════════════════════════════════════════════════════════
  // ⭐ NOUVEAUX TESTS POUR VÉRIFIER LE MOCK DE confirm() ET alert()
  // ═══════════════════════════════════════════════════════════

  /**
   * Test pour vérifier que confirm() est correctement mocké
   * En environnement headless, confirm() doit retourner true
   */
  it('should have confirm mocked globally', () => {
    // Tester que confirm existe et retourne true (simule "OK")
    const result = confirm('Test mock confirm');
    expect(result).toBeTrue();
    console.log('✅ Confirm mock works!');
  });

  /**
   * Test pour vérifier que alert() est correctement mocké
   * En environnement headless, alert() ne doit pas bloquer
   */
  it('should have alert mocked globally', () => {
    // Tester que alert ne lève pas d'erreur
    expect(() => alert('Test mock alert')).not.toThrow();
    console.log('✅ Alert mock works!');
  });

  /**
   * Test pour vérifier que window.confirm est bien une fonction
   */
  it('should have window.confirm defined as a function', () => {
    expect(window.confirm).toBeDefined();
    expect(typeof window.confirm).toBe('function');
  });

  /**
   * Test pour vérifier que window.alert est bien une fonction
   */
  it('should have window.alert defined as a function', () => {
    expect(window.alert).toBeDefined();
    expect(typeof window.alert).toBe('function');
  });

  /**
   * Test pour vérifier qu'on peut spy sur confirm()
   * Utile pour tester les cas où l'utilisateur annule
   */
  it('should allow spying on confirm', () => {
    // Créer un spy sur confirm qui retourne false (simule "Annuler")
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    
    // Appeler confirm
    const result = confirm('Test with spy');
    
    // Vérifier que le spy a été appelé avec le bon message
    expect(confirmSpy).toHaveBeenCalledWith('Test with spy');
    
    // Vérifier que la valeur de retour est celle du spy (false)
    expect(result).toBeFalse();
    console.log('✅ Confirm spy works!');
  });

  /**
   * Test pour vérifier qu'on peut changer le comportement de confirm()
   * Utile pour tester différents scénarios
   */
  it('should allow changing confirm return value', () => {
    // Cas 1: confirm retourne true
    let confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
    expect(confirm('Test true')).toBeTrue();
    
    // Cas 2: confirm retourne false
    confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    expect(confirm('Test false')).toBeFalse();
    
    console.log('✅ Confirm value change works!');
  });

  /**
   * Test pour vérifier que confirm peut être appelé avec différents messages
   */
  it('should handle different confirm messages', () => {
    const messages = [
      'Voulez-vous vraiment supprimer ?',
      'Êtes-vous sûr ?',
      'Confirmer la suppression',
      'Voulez-vous annuler ?'
    ];
    
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
    
    messages.forEach(message => {
      confirm(message);
      expect(confirmSpy).toHaveBeenCalledWith(message);
    });
    
    expect(confirmSpy.calls.count()).toBe(messages.length);
    console.log('✅ Multiple confirm messages work!');
  });

  /**
   * Test pour vérifier que alert peut être appelée avec différents messages
   */
  it('should handle different alert messages', () => {
    const messages = [
      'Erreur: produit non trouvé',
      'Succès: produit créé',
      'Attention: stock faible',
      'Information: mise à jour disponible'
    ];
    
    expect(() => {
      messages.forEach(message => {
        alert(message);
      });
    }).not.toThrow();
    
    console.log('✅ Multiple alert messages work!');
  });
});