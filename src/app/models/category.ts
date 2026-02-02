import { Product } from "./product";

export interface Category {
     id?: number;
    nom: string;
    description?: string;
    products?: Product[]; 

}
