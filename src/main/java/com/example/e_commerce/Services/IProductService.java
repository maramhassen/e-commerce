package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.Product;

import java.util.List;

public interface IProductService {
    Product createProduct(Product product);

    List<Product> getAllProducts();

    Product getProductById(Long id);

    Product updateProduct(Long id, Product product);

    void deleteProduct(Long id);
}
