import { Product } from './product';

export interface OrderItem {
  id?: number;
  quantite: number;
  prix: number;
  product: Product;
  order?: any;
}