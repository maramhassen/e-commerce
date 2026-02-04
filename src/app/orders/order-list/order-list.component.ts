import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../models/order';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

// Interface locale pour l'utilisateur stocké (identique à celle dans AuthService)
interface StoredUser {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
}

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  errorMessage = '';
  currentUser: StoredUser | null = null; // CHANGEZ ICI: User -> StoredUser
  isAdmin = false;
  filterStatus: string = '';
  userId: number | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    try {
      // Récupérer l'utilisateur (retourne StoredUser)
      const user = this.authService.getCurrentUser();
      
      console.log('User from authService:', user);
      
      if (!user) {
        console.log('No user found in auth service');
        this.errorMessage = 'Veuillez vous connecter pour voir vos commandes';
        this.router.navigate(['/auth/login']);
        return;
      }
      
      // Valider la structure
      if (!user.email || !user.role) {
        console.error('Invalid user structure:', user);
        this.errorMessage = 'Données utilisateur invalides';
        this.authService.logout();
        return;
      }
      
      // Assigner les valeurs
      this.currentUser = user;
      this.isAdmin = user.role === 'ADMIN';
      this.userId = user.id ? user.id : null;
      
      console.log('User loaded:', {
        id: this.userId,
        email: user.email,
        role: user.role,
        isAdmin: this.isAdmin
      });
      
      // Charger les commandes
      this.loadOrders();
      
    } catch (error) {
      console.error('Error loading current user:', error);
      this.errorMessage = 'Erreur lors du chargement des informations utilisateur';
      this.authService.logout();
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    if (this.isAdmin) {
      // Admin: voir toutes les commandes
      this.loadAllOrders();
    } else if (this.userId) {
      // Client: voir ses propres commandes
      this.loadUserOrders();
    } else {
      this.errorMessage = 'Impossible de charger les commandes : utilisateur non identifié';
      this.loading = false;
    }
  }

  private loadAllOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        console.log(`Admin: ${orders.length} commandes chargées`);
      },
      error: (error) => {
        console.error('Erreur chargement toutes commandes:', error);
        this.errorMessage = this.getErrorMessage(error);
        this.loading = false;
      }
    });
  }

  private loadUserOrders(): void {
    if (!this.userId) {
      this.errorMessage = 'ID utilisateur manquant';
      this.loading = false;
      return;
    }

    this.orderService.getOrdersByUser(this.userId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        console.log(`User ${this.userId}: ${orders.length} commandes chargées`);
      },
      error: (error) => {
        console.error('Erreur chargement commandes utilisateur:', error);
        this.errorMessage = this.getErrorMessage(error);
        this.loading = false;
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Impossible de se connecter au serveur';
    } else if (error.status === 401) {
      return 'Non autorisé';
    } else if (error.status === 404) {
      return 'Aucune commande trouvée';
    } else {
      return error.message || 'Erreur lors du chargement des commandes';
    }
  }

  createOrderFromCart(): void {
    if (!this.userId) {
      this.errorMessage = 'ID utilisateur manquant. Veuillez vous reconnecter.';
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'Utilisateur non connecté';
      return;
    }

    if (confirm('Confirmer la création de la commande depuis votre panier ?')) {
      this.loading = true;
      this.orderService.createOrderFromCart(this.userId).subscribe({
        next: (order) => {
          alert('Commande créée avec succès !');
          this.loadOrders(); // Recharger la liste
          if (order.id) {
            this.router.navigate(['/orders', order.id]);
          }
        },
        error: (error) => {
          console.error('Erreur création commande:', error);
          this.errorMessage = 'Erreur lors de la création de la commande';
          this.loading = false;
        }
      });
    }
  }

  viewOrderDetails(orderId: number | undefined): void {
    if (orderId) {
      this.router.navigate(['/orders', orderId]);
    } else {
      this.errorMessage = 'ID commande invalide';
    }
  }
  // Ajoutez ces méthodes à votre classe

// 1. Méthodes pour les statuts
getStatusList(): string[] {
  return ['EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
}

getStatusText(status: string): string {
  switch(status) {
    case 'EN_ATTENTE': return 'En attente';
    case 'CONFIRMEE': return 'Confirmée';
    case 'EXPEDIEE': return 'Expédiée';
    case 'LIVREE': return 'Livrée';
    case 'ANNULEE': return 'Annulée';
    default: return status;
  }
}

getStatusClass(status: string): string {
  switch(status.toLowerCase()) {
    case 'en_attente': return 'status-en-attente';
    case 'confirmee': return 'status-confirmee';
    case 'expediee': return 'status-expediee';
    case 'livree': return 'status-livree';
    case 'annulee': return 'status-annulee';
    default: return 'status-default';
  }
}

getStatusIconClass(status: string): string {
  switch(status.toLowerCase()) {
    case 'en_attente': return 'text-warning';
    case 'confirmee': return 'text-info';
    case 'expediee': return 'text-primary';
    case 'livree': return 'text-success';
    case 'annulee': return 'text-danger';
    default: return 'text-secondary';
  }
}

// 2. Méthode pour formater la date
formatDate(date: Date | string): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date invalide';
  }
}

// 3. Méthode pour calculer le total
getTotalAmount(): string {
  const total = this.orders.reduce((sum, order) => sum + (order.total || 0), 0);
  return total.toFixed(2);
}

// 4. Méthodes pour les actions
updateOrderStatus(orderId: number | undefined, status: string): void {
  if (!orderId) {
    console.error('Order ID is undefined');
    return;
  }
  
  if (confirm(`Voulez-vous vraiment changer le statut de la commande #${orderId} en "${this.getStatusText(status)}" ?`)) {
    console.log(`Mise à jour statut commande ${orderId} -> ${status}`);
    // À implémenter: this.orderService.updateOrderStatus(orderId, status).subscribe(...)
  }
}

deleteOrder(orderId: number | undefined): void {
  if (!orderId) {
    console.error('Order ID is undefined');
    return;
  }
  
  if (confirm(`Voulez-vous vraiment supprimer la commande #${orderId} ? Cette action est irréversible.`)) {
    console.log(`Suppression commande ${orderId}`);
    // À implémenter: this.orderService.deleteOrder(orderId).subscribe(...)
  }
}

}