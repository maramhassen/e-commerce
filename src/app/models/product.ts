import { Category } from './category';

export interface Product {
  id?: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  imageUrl?: string;
  actif?: boolean;
  dateAjout?: Date;
  categoryId?: number;
  category?: Category;
}