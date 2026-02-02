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
import { AdminGuard } from './core/guards/admin.guard';
import { CartComponent } from './cart/cart/cart.component';

const routes: Routes = [
  // ================= Auth =================
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },



  // ================= Categories =================
  { path: 'categories', component: CategoryListComponent },
  { path: 'categories/new', component: CategoryFormComponent },
  { path: 'categories/edit/:id', component: CategoryFormComponent },

  // ================= Produits =================
  { path: 'products', component: ProductListComponent },
  { path: 'products/new', component: ProductFormComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'products/edit/:id', component: ProductFormComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'products/:id', component: ProductDetailComponent }, // Détail produit public

  // ================= Panier =================
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] }, 

  // ================= Redirection par défaut =================
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: '**', redirectTo: '/products' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
