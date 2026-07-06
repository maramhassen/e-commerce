package com.example.e_commerce.services;

import com.example.e_commerce.entities.Product;

import java.util.List;

public interface iproductservice {
    Product createProduct(Product product);

    List<Product> getAllProducts();

    Product getProductById(Long id);

    Product updateProduct(Long id, Product product);

    void deleteProduct(Long id);
}
