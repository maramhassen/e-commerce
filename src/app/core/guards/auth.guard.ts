import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getCurrentUser();

    if (!this.authService.isAuthenticated() || !user) {
      // Non connecté -> redirige vers login
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Vérifie si la route nécessite un rôle spécifique
    const expectedRole = route.data['role'];
    if (expectedRole && user.role !== expectedRole) {
      // Si le rôle ne correspond pas, redirige selon le rôle de l'utilisateur
      if (user.role === 'CLIENT') {
        this.router.navigate(['/products']);
      } else if (user.role === 'ADMIN') {
        this.router.navigate(['/categories']);
      } else {
        this.router.navigate(['/']);
      }
      return false;
    }

    return true;
  }
}
