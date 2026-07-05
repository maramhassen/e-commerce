package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.product;

import java.util.List;

public interface iproductservice {
    product createProduct(product product);

    List<product> getAllProducts();

    product getProductById(Long id);

    product updateProduct(Long id, product product);

    void deleteProduct(Long id);
}
