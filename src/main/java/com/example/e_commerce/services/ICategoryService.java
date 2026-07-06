package com.example.e_commerce.services;

import com.example.e_commerce.entities.Category;

import java.util.List;

public interface ICategoryService {
    Category createCategory(Category category);

    Category updateCategory(Long id, Category category);

    Category getCategoryById(Long id);

    List<Category> getAllCategories();

    void deleteCategory(Long id);
}
