import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.getCurrentUser();

    // 1️⃣ Non connecté
  
    if (!this.authService.isAuthenticated() || !user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // 2️⃣ Rôle requis ?
    const expectedRole = route.data['role'];

    if (expectedRole && user.role !== expectedRole) {
      // Accès refusé → page par défaut
      this.router.navigate(['/products']);
      return false;
    }

    // 3️⃣ OK
    return true;
  }
}
