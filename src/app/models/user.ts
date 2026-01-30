export interface User {
    id?: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: 'CLIENT' | 'ADMIN' ;
}
