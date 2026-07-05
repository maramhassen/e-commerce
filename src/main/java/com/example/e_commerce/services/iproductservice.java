package com.example.e_commerce.services;

import com.example.e_commerce.entities.product;

import java.util.List;

public interface iproductservice {
    product createProduct(product product);

    List<product> getAllProducts();

    product getProductById(Long id);

    product updateProduct(Long id, product product);

    void deleteProduct(Long id);
}
