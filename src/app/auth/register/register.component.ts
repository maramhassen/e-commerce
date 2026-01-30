import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {

  nom = '';
  prenom = '';
  email = '';
  motDePasse = '';

  constructor(private router: Router, private userService: UserService) {}

  register() {
    if (this.nom && this.prenom && this.email && this.motDePasse) {
      const newUser: User = {
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
        motDePasse: this.motDePasse,
        role: 'CLIENT'
      };

      this.userService.create(newUser).subscribe({
        next: (res) => {
          console.log('Utilisateur enregistré:', res);
          this.router.navigate(['/auth/login']); // redirection vers login
        },
        error: (err) => {
          console.error('Erreur lors de l\'enregistrement:', err);
        }
      });
    }
  }
}
