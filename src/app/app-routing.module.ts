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
import { OrderDetailComponent } from './orders/order-detail/order-detail.component';
import { OrderListComponent } from './orders/order-list/order-list.component';
import { HomeComponent } from './shared/home/home.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { AdminGuard } from './core/guards/admin.guard'; // IMPORTANT: Ajoutez cette ligne

const routes: Routes = [
  // ================= Pages publiques =================
  { path: '', component: HomeComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'products/:id', component: ProductDetailComponent },

  // ================= Routes protégées =================
  
  // Client uniquement
  { 
    path: 'cart', 
    component: CartComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'CLIENT' } 
  },
  { 
    path: 'orders', 
    component: OrderListComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'orders/:id', 
    component: OrderDetailComponent, 
    canActivate: [AuthGuard],  
  },

  // Admin uniquement
  { 
    path: 'categories', 
    component: CategoryListComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'ADMIN' } 
  },
  { 
    path: 'categories/new', 
    component: CategoryFormComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'ADMIN' } 
  },
  { 
    path: 'categories/edit/:id', 
    component: CategoryFormComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'ADMIN' } 
  },
  {
  path: 'admin/products/new',
  component: ProductFormComponent,
  canActivate: [AdminGuard]
  },
  { 
    path: 'products/edit/:id', 
    component: ProductFormComponent, 
    canActivate: [AdminGuard], 
    data: { role: 'ADMIN' } 
  },

  // Routes accessibles aux deux rôles (authentification requise)
  { 
    path: 'products', 
    component: ProductListComponent, 
    canActivate: [AuthGuard] 
  },
  { path: 'users', component: UserListComponent },
  // ================= Redirections =================
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }