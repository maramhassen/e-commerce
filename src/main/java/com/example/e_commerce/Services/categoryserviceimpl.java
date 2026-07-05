package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.category;
import com.example.e_commerce.Repository.categoryrepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class categoryserviceimpl implements icategoryservice {
    private final categoryrepository categoryRepository;

    public categoryserviceimpl(categoryrepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public category createCategory(category category) {
        return categoryRepository.save(category);
    }

    @Override
    public category updateCategory(Long id, category category) {
        category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        existingCategory.setNom(category.getNom());
        existingCategory.setDescription(category.getDescription());

        return categoryRepository.save(existingCategory);
    }

    @Override
    public category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    @Override
    public List<category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public void deleteCategory(Long id) {
        category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new RuntimeException("Impossible de supprimer une catégorie contenant des produits");
        }

        categoryRepository.delete(category);
    }


}
