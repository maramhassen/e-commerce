import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../models/order';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

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
  searchTerm: string = '';
  userId: number | null = null;
  
  // Statistiques
  totalOrders: number = 0;
  totalRevenue: number = 0;
  statsByStatus: any = {};

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
      
      if (!user) {
        this.errorMessage = 'Veuillez vous connecter pour voir vos commandes';
        this.router.navigate(['/auth/login']);
        return;
      }
      
      this.currentUser = user;
      this.isAdmin = user.role === 'ADMIN';
      this.userId = user.id ? user.id : null;
      
      this.loadOrders();
      
    } catch (error) {
      console.error('Error loading current user:', error);
      this.errorMessage = 'Erreur lors du chargement des informations utilisateur';
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

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
        this.calculateStats();
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
        this.calculateStats();
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

  private calculateStats(): void {
    this.totalOrders = this.orders.length;
    this.totalRevenue = this.orders.reduce((sum, order) => sum + order.total, 0);
    
    // Calculer les stats par statut
    this.statsByStatus = {};
    this.orders.forEach(order => {
      const statut = order.statut;
      this.statsByStatus[statut] = (this.statsByStatus[statut] || 0) + 1;
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

  // ========== GESTION DES STATUTS ==========
  
  getStatutList(): string[] {
    return ['EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
  }

  getStatutText(statut: string): string {
    const map: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'EXPEDIEE': 'Expédiée',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée'
    };
    return map[statut] || statut;
  }

  getStatutClass(statut?: string): string {
    if (!statut) return 'statut-default';
    return `statut-${statut.toLowerCase()}`;
  }

  getStatutIconClass(statut: string): string {
    const map: { [key: string]: string } = {
      'EN_ATTENTE': 'text-warning',
      'CONFIRMEE': 'text-info',
      'EXPEDIEE': 'text-primary',
      'LIVREE': 'text-success',
      'ANNULEE': 'text-danger'
    };
    return map[statut] || 'text-secondary';
  }

  getStatutColor(statut: string): string {
    const map: { [key: string]: string } = {
      'EN_ATTENTE': 'warning',
      'CONFIRMEE': 'info',
      'EXPEDIEE': 'primary',
      'LIVREE': 'success',
      'ANNULEE': 'danger'
    };
    return map[statut] || 'secondary';
  }

  // ========== CRÉATION DE COMMANDE (NOUVELLE MÉTHODE) ==========
  
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
          this.loadOrders(); // Recharger la liste des commandes
          if (order.id) {
            this.router.navigate(['/orders', order.id]);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur création commande:', error);
          this.errorMessage = 'Erreur lors de la création de la commande';
          this.loading = false;
        }
      });
    }
  }

  // ========== MISE À JOUR DU STATUT ==========
  
  updateOrderStatut(orderId: number, statut: string): void {
    if (!orderId || !statut) return;
    
    const statusText = this.getStatutText(statut);
    
    if (!confirm(`Voulez-vous vraiment changer le statut de la commande #${orderId} en "${statusText}" ?`)) {
      return;
    }

    this.loading = true;
    
    this.orderService.updateOrderStatus(orderId, statut as any).subscribe({
      next: (updatedOrder) => {
        console.log('✅ Statut mis à jour:', updatedOrder);
        
        // Mettre à jour la commande dans la liste
        const index = this.orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        
        // Recalculer les stats
        this.calculateStats();
        this.applyFilter();
        
        this.loading = false;
        alert(`✅ Statut de la commande #${orderId} mis à jour avec succès !`);
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour statut:', error);
        this.errorMessage = 'Erreur lors de la mise à jour du statut';
        this.loading = false;
        alert('❌ Erreur lors de la mise à jour du statut');
      }
    });
  }

  // ========== SUPPRESSION ==========
  
  deleteOrder(orderId: number): void {
    if (!orderId) return;
    
    if (!confirm(`⚠️ Voulez-vous vraiment supprimer la commande #${orderId} ? Cette action est irréversible.`)) {
      return;
    }

    this.loading = true;
    
    this.orderService.deleteOrder(orderId).subscribe({
      next: () => {
        console.log('✅ Commande supprimée');
        
        // Retirer la commande de la liste
        this.orders = this.orders.filter(o => o.id !== orderId);
        
        // Recalculer les stats
        this.calculateStats();
        this.applyFilter();
        
        this.loading = false;
        alert(`✅ Commande #${orderId} supprimée avec succès !`);
      },
      error: (error) => {
        console.error('❌ Erreur suppression:', error);
        this.errorMessage = 'Erreur lors de la suppression';
        this.loading = false;
        alert('❌ Erreur lors de la suppression');
      }
    });
  }

  // ========== FILTRES ET RECHERCHE ==========
  
  applyFilter(): void {
    let filtered = [...this.orders];
    
    // Filtre par statut
    if (this.filterStatut && this.filterStatut.trim() !== '') {
      const filterValue = this.filterStatut.trim().toUpperCase();
      filtered = filtered.filter(order => 
        order.statut && order.statut.toUpperCase() === filterValue
      );
    }
    
    // Recherche par texte (pour admin seulement)
    if (this.isAdmin && this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        return order.id?.toString().includes(term) ||
               order.user?.email?.toLowerCase().includes(term) ||
               `${order.user?.prenom} ${order.user?.nom}`.toLowerCase().includes(term);
      });
    }
    
    this.filteredOrders = filtered;
    console.log(`Filtre: ${this.filteredOrders.length}/${this.orders.length} commandes`);
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  clearFilter(): void {
    this.filterStatut = '';
    this.searchTerm = '';
    this.applyFilter();
  }

  // ========== NAVIGATION ==========
  
  viewOrderDetails(orderId: number): void {
    if (orderId) {
      this.router.navigate(['/orders', orderId]);
    }
  }

  // ========== FORMATAGE ==========
  
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
      return 'Date invalide';
    }
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' DT';
  }

  getTotalItems(order: Order): number {
    return order.items?.reduce((sum, item) => sum + item.quantite, 0) || 0;
  }

  // ========== STATISTIQUES ==========
  
  getStatutCount(statut: string): number {
    return this.statsByStatus[statut] || 0;
  }

  getTotalAmount(): string {
    return this.totalRevenue.toFixed(2).replace('.', ',') + ' DT';
  }

  getFilteredTotalAmount(): string {
    const total = this.filteredOrders.reduce((sum, order) => sum + order.total, 0);
    return total.toFixed(2).replace('.', ',') + ' DT';
  }

  // ========== UTILITAIRES ==========
  
  reloadOrders(): void {
    this.loadOrders();
  }
}