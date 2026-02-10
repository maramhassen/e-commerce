package com.example.e_commerce.Controllers;

import com.example.e_commerce.Entities.Product;
import com.example.e_commerce.Services.FileStorageService;
import com.example.e_commerce.Services.IProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:4200" , allowedHeaders = "*")
public class ProductController {
    private final IProductService productService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ObjectMapper objectMapper;

    public ProductController(IProductService productService) {
        this.productService = productService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Product product) {
        try {
            // Ne pas stocker les URLs locales
            if (product.getImageUrl() != null &&
                    (product.getImageUrl().startsWith("assets/") ||
                            product.getImageUrl().contains("default-product"))) {
                product.setImageUrl(null);
            }

            Product savedProduct = productService.createProduct(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // CREATE WITH IMAGE UPLOAD
    @PostMapping("/upload")
    public ResponseEntity<?> createProductWithImage(
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam("product") String productJson) {

        try {
            Product product = objectMapper.readValue(productJson, Product.class);

            if (image != null && !image.isEmpty()) {
                String fileName = fileStorageService.storeFile(image);
                product.setImageUrl(fileName);
            }

            Product savedProduct = productService.createProduct(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // READ ALL
    @GetMapping
    public List<Product> getAll() {
        List<Product> products = productService.getAllProducts();

        // Ne pas modifier les URLs, laisser le frontend gérer
        return products;
    }

    // READ ONE
    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody Product product) {
        try {
            // Ne pas stocker les URLs locales
            if (product.getImageUrl() != null &&
                    product.getImageUrl().startsWith("assets/")) {
                // Garder l'ancienne image si on tente de mettre une URL locale
                Product existing = productService.getProductById(id);
                product.setImageUrl(existing.getImageUrl());
            }

            Product updatedProduct = productService.updateProduct(id, product);
            return ResponseEntity.ok(updatedProduct);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // UPDATE WITH IMAGE
    @PutMapping("/{id}/upload")
    public ResponseEntity<?> updateProductWithImage(
            @PathVariable Long id,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam("product") String productJson) {

        try {
            Product existingProduct = productService.getProductById(id);
            String oldImageUrl = existingProduct.getImageUrl();

            Product productUpdates = objectMapper.readValue(productJson, Product.class);

            existingProduct.setNom(productUpdates.getNom());
            existingProduct.setDescription(productUpdates.getDescription());
            existingProduct.setPrix(productUpdates.getPrix());
            existingProduct.setStock(productUpdates.getStock());
            existingProduct.setActif(productUpdates.isActif());

            if (image != null && !image.isEmpty()) {
                // Supprimer l'ancienne image
                if (oldImageUrl != null && !oldImageUrl.isEmpty()) {
                    fileStorageService.deleteFile(oldImageUrl);
                }

                String fileName = fileStorageService.storeFile(image);
                existingProduct.setImageUrl(fileName);
            } else if (productUpdates.getImageUrl() == null ||
                    productUpdates.getImageUrl().trim().isEmpty()) {
                // Supprimer l'image si aucune fournie
                if (oldImageUrl != null && !oldImageUrl.isEmpty()) {
                    fileStorageService.deleteFile(oldImageUrl);
                }
                existingProduct.setImageUrl(null);
            }
            // Sinon, garder l'image existante

            Product updatedProduct = productService.updateProduct(id, existingProduct);
            return ResponseEntity.ok(updatedProduct);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            Product product = productService.getProductById(id);

            // Supprimer l'image associée
            if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
                fileStorageService.deleteFile(product.getImageUrl());
            }

            productService.deleteProduct(id);

            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}