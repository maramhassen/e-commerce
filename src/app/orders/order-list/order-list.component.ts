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
  filteredOrders: Order[] = [];
  loading = false;
  errorMessage = '';
  currentUser: StoredUser | null = null;
  isAdmin = false;
  filterStatut: string = '';
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
      const user = this.authService.getCurrentUser();
      
      console.log('User from authService:', user);
      
      if (!user) {
        console.log('No user found in auth service');
        this.errorMessage = 'Veuillez vous connecter pour voir vos commandes';
        this.router.navigate(['/auth/login']);
        return;
      }
      
      if (!user.email || !user.role) {
        console.error('Invalid user structure:', user);
        this.errorMessage = 'Données utilisateur invalides';
        this.authService.logout();
        return;
      }
      
      this.currentUser = user;
      this.isAdmin = user.role === 'ADMIN';
      this.userId = user.id ? user.id : null;
      
      console.log('User loaded:', {
        id: this.userId,
        email: user.email,
        role: user.role,
        isAdmin: this.isAdmin
      });
      
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

    if (this.orders.length > 0) {
      this.applyFilter();
      this.loading = false;
      return;
    }

    if (this.isAdmin) {
      this.loadAllOrders();
    } else if (this.userId) {
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
        this.applyFilter();
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
        this.applyFilter();
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
    if (error.statut === 0) {
      return 'Impossible de se connecter au serveur';
    } else if (error.statut === 401) {
      return 'Non autorisé';
    } else if (error.statut === 404) {
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
          this.loadOrders();
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

  // 1. Méthodes pour les statuts
  getStatutList(): string[] {
    return ['EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
  }

  getStatutText(statut: string): string {
    switch(statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'EXPEDIEE': return 'Expédiée';
      case 'LIVREE': return 'Livrée';
      case 'ANNULEE': return 'Annulée';
      default: return statut;
    }
  }

  getStatutClass(statut?: string): string {
    if (!statut) {
      return 'statut-default';
    }

    switch (statut.toLowerCase()) {
      case 'en_attente': return 'statut-en-attente';
      case 'confirmee': return 'statut-confirmee';
      case 'expediee': return 'statut-expediee';
      case 'livree': return 'statut-livree';
      case 'annulee': return 'statut-annulee';
      default: return 'statut-default';
    }
  }

  getStatutIconClass(statut: string): string {
    switch(statut.toLowerCase()) {
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

  // 3. Méthode pour calculer le total (TOUTES les commandes)
  getTotalAmount(): string {
    if (!this.orders || this.orders.length === 0) {
      return '0.00';
    }
    const total = this.orders.reduce(
      (sum, order) => sum + (order.total || 0), 
      0
    );
    return total.toFixed(2);
  }

  // 4. Méthode pour calculer le total des commandes FILTRÉES
  getFilteredTotalAmount(): string {
    if (!this.filteredOrders || this.filteredOrders.length === 0) {
      return '0.00';
    }
    const total = this.filteredOrders.reduce(
      (sum, order) => sum + (order.total || 0), 
      0
    );
    return total.toFixed(2);
  }

  // 5. Méthode de fallback pour le total filtré
  getFilteredTotal(): string {
    try {
      return this.getFilteredTotalAmount();
    } catch (error) {
      console.error('Error in getFilteredTotalAmount:', error);
      return '0.00';
    }
  }

  // 6. Méthodes pour les actions
  updateOrderStatut(orderId: number | undefined, statut: string): void {
    if (!orderId) {
      console.error('Order ID is undefined');
      return;
    }
    
    if (confirm(`Voulez-vous vraiment changer le statut de la commande #${orderId} en "${this.getStatutText(statut)}" ?`)) {
      console.log(`Mise à jour statut commande ${orderId} -> ${statut}`);
      // À implémenter: this.orderService.updateOrderStatus(orderId, statut).subscribe(...)
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

  // 7. Méthodes pour le filtre
  applyFilter(): void {
    if (!this.filterStatut || this.filterStatut.trim() === '') {
      this.filteredOrders = [...this.orders];
    } else {
      const filterValue = this.filterStatut.trim().toUpperCase();
      this.filteredOrders = this.orders.filter(order => {
        const orderStatut = order.statut ? order.statut.toUpperCase() : '';
        return orderStatut === filterValue;
      });
    }
    console.log(`Filtre: "${this.filterStatut}" -> ${this.filteredOrders.length}/${this.orders.length} commandes`);
  }

  onFilterChange(): void {
    console.log('Filtre changé:', this.filterStatut);
    this.applyFilter();
  }

  // 8. Efface le filtre
  clearFilter(): void {
    this.filterStatut = '';
    this.onFilterChange();
  }

  // 9. Compte les commandes par statut (pour les badges)
  getOrderCountByStatut(statut: string): number {
    if (!this.orders || this.orders.length === 0) return 0;
    const statutUpper = statut.toUpperCase();
    return this.orders.filter(order => 
      order.statut && order.statut.toUpperCase() === statutUpper
    ).length;
  }
}