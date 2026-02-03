import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { CategoryListComponent } from './categories/category-list/category-list.component';
import { CategoryFormComponent } from './categories/category-form/category-form.component';
import { ProductListComponent } from './products/product-list/product-list.component';
import { ProductDetailComponent } from './products/product-detail/product-detail.component';
import { ProductFormComponent } from './products/product-form/product-form.component';
import { AuthGuard } from './core/guards/auth.guard';
import { CartComponent } from './cart/cart/cart.component';

const routes: Routes = [
  // ================= Auth =================
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },

  // ================= Categories (Admin) =================
  { path: 'categories', component: CategoryListComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'categories/new', component: CategoryFormComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'categories/edit/:id', component: CategoryFormComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },

  // ================= Produits =================
  { path: 'products', component: ProductListComponent, canActivate: [AuthGuard], data: { role: 'CLIENT' } },
  { path: 'products/new', component: ProductFormComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'products/edit/:id', component: ProductFormComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'products/:id', component: ProductDetailComponent }, // Détail produit public

  // ================= Panier (Client) =================
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard], data: { role: 'CLIENT' } },

  // ================= Redirection par défaut =================
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: '**', redirectTo: '/products' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
