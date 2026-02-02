import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule , ReactiveFormsModule } from '@angular/forms'; 
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { CategoryListComponent } from './categories/category-list/category-list.component';
import { CategoryFormComponent } from './categories/category-form/category-form.component';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from './products/product-list/product-list.component';
import { ProductDetailComponent } from './products/product-detail/product-detail.component';
import { ProductFormComponent } from './products/product-form/product-form.component';
import { CartComponent } from './cart/cart/cart.component';


@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    CategoryListComponent,
    CategoryFormComponent,
    ProductListComponent,
    ProductDetailComponent,
    ProductFormComponent,
    CartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }