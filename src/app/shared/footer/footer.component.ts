// footer.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})

export class FooterComponent implements OnInit {
  // Année en cours
  currentYear = new Date().getFullYear();
  
  // Informations de contact
  contactInfo = {
    email: 'contact@maboutique.fr',
    phone: '+33 1 23 45 67 89',
    address: '123 Rue du Commerce, 75000 Paris',
    hours: 'Lun-Ven: 9h-18h, Sam: 10h-16h'
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  /**
   * Navigue vers une page
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Ouvre une URL externe
   */
  openExternalUrl(url: string): void {
    window.open(url, '_blank');
  }

  /**
   * Copie l'email dans le presse-papier
   */
  copyEmail(): void {
    navigator.clipboard.writeText(this.contactInfo.email)
      .then(() => {
        console.log('Email copié:', this.contactInfo.email);
        // Afficher un toast de confirmation
      })
      .catch(err => {
        console.error('Erreur lors de la copie:', err);
      });
  }

  /**
   * Formate le numéro de téléphone
   */
  formatPhoneNumber(phone: string): string {
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
}