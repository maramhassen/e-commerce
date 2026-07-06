package com.example.e_commerce.services;

import com.example.e_commerce.entities.Category;
import com.example.e_commerce.repository.categoryrepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class categoryserviceimpl implements icategoryservice {
    private final categoryrepository categoryRepository;

    public categoryserviceimpl(categoryrepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    @Override
    public Category updateCategory(Long id, Category category) {
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        existingCategory.setNom(category.getNom());
        existingCategory.setDescription(category.getDescription());

        return categoryRepository.save(existingCategory);
    }

    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new RuntimeException("Impossible de supprimer une catégorie contenant des produits");
        }

        categoryRepository.delete(category);
    }


}
