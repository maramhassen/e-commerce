package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.category;

import java.util.List;

public interface icategoryservice {
    category createCategory(category category);

    category updateCategory(Long id, category category);

    category getCategoryById(Long id);

    List<category> getAllCategories();

    void deleteCategory(Long id);
}
