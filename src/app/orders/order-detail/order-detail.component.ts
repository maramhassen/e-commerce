import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../models/order';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {

  orderId!: number;
  order: Order | null = null;
  loading = false;
  errorMessage = '';
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage = 'ID commande invalide';
      return;
    }

    this.orderId = Number(idParam);
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;

    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger la commande';
        this.loading = false;
      }
    });
  }

  /* ===== Helpers ===== */

  getStatutText(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'EXPEDIEE': return 'Expédiée';
      case 'LIVREE': return 'Livrée';
      case 'ANNULEE': return 'Annulée';
      default: return statut;
    }
  }

  getStatutClass(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'en_attente': return 'badge bg-warning';
      case 'confirmee': return 'badge bg-info';
      case 'expediee': return 'badge bg-primary';
      case 'livree': return 'badge bg-success';
      case 'annulee': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('fr-FR');
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
