import { CartItem } from './cart-item';
import { User } from './user';

export interface Cart {
  id?: number;
  total: number;
  dateCreation?: Date;
  user?: User;
  items: CartItem[];
}
