import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  email = '';
  motDePasse = '';
  errorMessage = '';

  constructor(private router: Router, private userService: UserService) {}

  login() {
    if (this.email && this.motDePasse) {
      this.userService.getAll().subscribe({
        next: (users: User[]) => {
          const user = users.find(u => u.email === this.email && u.motDePasse === this.motDePasse);
          if (user) {
            console.log('Login réussi:', user);
            this.router.navigate(['/']); // redirection vers la page principale
          } else {
            this.errorMessage = 'Email ou mot de passe incorrect';
          }
        },
        error: (err) => {
          console.error('Erreur lors du login:', err);
          this.errorMessage = 'Erreur serveur';
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs';
    }
  }
}
