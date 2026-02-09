import { Cart } from "./cart";
import { Product } from "./product";

export interface CartItem {
  id?: number;
  quantite: number;
  prixUnitaire: number;
  product: Partial<Product>;
  cart?: Cart;  // ✅ AJOUTEZ CETTE LIGNE
  cartId?: number;
}
