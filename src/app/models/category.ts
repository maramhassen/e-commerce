import { Product } from "./product";

export interface Category {
     id?: number;
  name: string;
  products?: Product[]; // optionnel, liste des produits de cette catégorie

}
