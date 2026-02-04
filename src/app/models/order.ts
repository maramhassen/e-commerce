import { Statut } from './statut';
import { User } from './user';
import { OrderItem } from './order-item';

export interface Order {
  id?: number;
  total: number;
  statut: Statut;
  dateCommande: Date | string;
  user: User;
  items: OrderItem[];
}