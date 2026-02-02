import { Product } from "./product";

export interface CartItem {
  id?: number;
  quantite: number;
  prixUnitaire: number;
  product: Product;
}
