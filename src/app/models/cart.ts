import { CartItem } from './cart-item';
import { User } from './user';
import { Order } from './order';

export interface Cart {
  id?: number;
  total: number;
  dateCreation?: Date;
  user?: User;
  items: CartItem[];
  order?: Order;  
}