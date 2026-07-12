package com.example.e_commerce.unit.service;

import com.example.e_commerce.entities.Category;
import com.example.e_commerce.entities.Product;
import com.example.e_commerce.repository.CategoryRepository;
import com.example.e_commerce.services.CategoryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class categoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void testCreateCategory_Success() {
        Category category = new Category();
        category.setNom("Électronique");
        category.setDescription("Catégorie électronique");

        Category savedCategory = new Category();
        savedCategory.setId(1L);
        savedCategory.setNom("Électronique");
        savedCategory.setDescription("Catégorie électronique");

        when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

        Category result = categoryService.createCategory(category);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Électronique", result.getNom());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void testUpdateCategory_Success() {
        Category existingCategory = new Category();
        existingCategory.setId(1L);
        existingCategory.setNom("Ancien Nom");
        existingCategory.setDescription("Ancienne description");

        Category updatedCategory = new Category();
        updatedCategory.setNom("Nouveau Nom");
        updatedCategory.setDescription("Nouvelle description");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existingCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(existingCategory);

        Category result = categoryService.updateCategory(1L, updatedCategory);

        assertNotNull(result);
        assertEquals("Nouveau Nom", result.getNom());
        assertEquals("Nouvelle description", result.getDescription());
        verify(categoryRepository, times(1)).findById(1L);
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void testUpdateCategory_NotFound() {
        Category updatedCategory = new Category();
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> categoryService.updateCategory(99L, updatedCategory));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void testGetCategoryById_Success() {
        Category category = new Category();
        category.setId(1L);
        category.setNom("Électronique");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        Category result = categoryService.getCategoryById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Électronique", result.getNom());
        verify(categoryRepository, times(1)).findById(1L);
    }

    @Test
    void testGetCategoryById_NotFound() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> categoryService.getCategoryById(99L));
        verify(categoryRepository, times(1)).findById(99L);
    }

    @Test
    void testGetAllCategories_Success() {
        Category category1 = new Category();
        category1.setId(1L);
        category1.setNom("Catégorie 1");

        Category category2 = new Category();
        category2.setId(2L);
        category2.setNom("Catégorie 2");

        when(categoryRepository.findAll()).thenReturn(Arrays.asList(category1, category2));

        List<Category> result = categoryService.getAllCategories();

        assertEquals(2, result.size());
        verify(categoryRepository, times(1)).findAll();
    }

    @Test
    void testDeleteCategory_Success() {
        Category category = new Category();
        category.setId(1L);
        category.setProducts(Collections.emptyList());

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        doNothing().when(categoryRepository).delete(category);

        categoryService.deleteCategory(1L);

        verify(categoryRepository, times(1)).findById(1L);
        verify(categoryRepository, times(1)).delete(category);
    }

    @Test
    void testDeleteCategory_NotFound() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> categoryService.deleteCategory(99L));
        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void testDeleteCategory_WithProducts_ShouldThrowException() {
        Category category = new Category();
        category.setId(1L);
        Product product = new Product();
        product.setId(1L);
        category.setProducts(List.of(product));

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        assertThrows(RuntimeException.class, () -> categoryService.deleteCategory(1L));
        verify(categoryRepository, never()).delete(any(Category.class));
    }
}