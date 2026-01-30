import { CartItem } from "./cart-item";
import { User } from "./user";

export interface Cart {
    id?: number;
  user: User;
  items: CartItem[];
  totalPrice?: number; 
}
