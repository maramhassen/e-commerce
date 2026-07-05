package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.product;
import com.example.e_commerce.Repository.productrepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class productserviceimpl implements iproductservice {

    private final productrepository productRepository;

    public productserviceimpl(productrepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public product createProduct(product product) {
        // Validation des données
        if (product.getNom() == null || product.getNom().trim().isEmpty()) {
            throw new RuntimeException("Le nom du produit est obligatoire");
        }

        if (product.getPrix() <= 0) {
            throw new RuntimeException("Le prix doit être supérieur à 0");
        }

        // Si imageUrl est vide, le mettre à null
        if (product.getImageUrl() != null && product.getImageUrl().trim().isEmpty()) {
            product.setImageUrl(null);
        }

        return productRepository.save(product);
    }

    @Override
    public List<product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec ID: " + id));
    }

    @Override
    @Transactional
    public product updateProduct(Long id, product product) {
        product existing = getProductById(id);

        existing.setNom(product.getNom());
        existing.setDescription(product.getDescription());
        existing.setPrix(product.getPrix());
        existing.setStock(product.getStock());
        existing.setActif(product.isActif());
        existing.setCategory(product.getCategory());

        // Ne mettre à jour l'image que si elle n'est pas null
        if (product.getImageUrl() != null) {
            existing.setImageUrl(product.getImageUrl());
        }

        return productRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        product product = getProductById(id);
        productRepository.delete(product);
    }
}