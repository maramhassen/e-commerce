package com.example.e_commerce.services;

import com.example.e_commerce.entities.category;

import java.util.List;

public interface icategoryservice {
    category createCategory(category category);

    category updateCategory(Long id, category category);

    category getCategoryById(Long id);

    List<category> getAllCategories();

    void deleteCategory(Long id);
}
