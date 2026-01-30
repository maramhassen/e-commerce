import { OrderItem } from "./order-item";
import { User } from "./user";

export interface Order {
     id?: number;
  user: User;                
  items: OrderItem[];        
  totalPrice?: number;       
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt?: string;       
}
