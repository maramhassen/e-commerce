package com.example.e_commerce.Controllers;

import com.example.e_commerce.Entities.Product;
import com.example.e_commerce.Services.IProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin("*")
public class ProductController {
    private final IProductService productService;

    public ProductController(IProductService productService) {
        this.productService = productService;
    }

    // CREATE
    @PostMapping
    public Product create(@RequestBody Product product) {
        return productService.createProduct(product);
    }

    // READ ALL
    @GetMapping
    public List<Product> getAll() {
        return productService.getAllProducts();
    }

    // READ ONE
    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Product update(@PathVariable Long id,
                          @RequestBody Product product) {
        return productService.updateProduct(id, product);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        productService.deleteProduct(id);
    }

}
