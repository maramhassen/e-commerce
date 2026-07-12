package com.example.e_commerce.unit.controller;

import com.example.e_commerce.controllers.CategoryController;
import com.example.e_commerce.entities.Category;
import com.example.e_commerce.services.ICategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Test "standalone" : on instancie le CategoryController directement avec des mocks,
 * sans démarrer tout le contexte Spring.
 */
@ExtendWith(MockitoExtension.class)
class categoryControllerTest {

    @Mock
    private ICategoryService categoryService;

    @InjectMocks
    private CategoryController categoryController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController).build();
    }

    @Test
    void testCreateCategory() throws Exception {
        String requestJson = """
                {
                    "nom": "Électronique",
                    "description": "Catégorie électronique"
                }
                """;

        Category savedCategory = new Category();
        savedCategory.setId(1L);
        savedCategory.setNom("Électronique");
        savedCategory.setDescription("Catégorie électronique");

        when(categoryService.createCategory(any(Category.class))).thenReturn(savedCategory);

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.nom").value("Électronique"));

        verify(categoryService, times(1)).createCategory(any(Category.class));
    }

    @Test
    void testGetAllCategories() throws Exception {
        Category category1 = new Category();
        category1.setId(1L);
        category1.setNom("Catégorie 1");

        Category category2 = new Category();
        category2.setId(2L);
        category2.setNom("Catégorie 2");

        when(categoryService.getAllCategories()).thenReturn(Arrays.asList(category1, category2));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(categoryService, times(1)).getAllCategories();
    }

    @Test
    void testGetCategoryById() throws Exception {
        Category category = new Category();
        category.setId(1L);
        category.setNom("Électronique");

        when(categoryService.getCategoryById(1L)).thenReturn(category);

        mockMvc.perform(get("/api/categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.nom").value("Électronique"));

        verify(categoryService, times(1)).getCategoryById(1L);
    }

    @Test
    void testUpdateCategory() throws Exception {
        String requestJson = """
                {
                    "nom": "Nom Modifié",
                    "description": "Description modifiée"
                }
                """;

        Category updatedCategory = new Category();
        updatedCategory.setId(1L);
        updatedCategory.setNom("Nom Modifié");
        updatedCategory.setDescription("Description modifiée");

        when(categoryService.updateCategory(eq(1L), any(Category.class))).thenReturn(updatedCategory);

        mockMvc.perform(put("/api/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Nom Modifié"));

        verify(categoryService, times(1)).updateCategory(eq(1L), any(Category.class));
    }

    @Test
    void testDeleteCategory() throws Exception {
        doNothing().when(categoryService).deleteCategory(1L);

        mockMvc.perform(delete("/api/categories/1"))
                .andExpect(status().isOk());

        verify(categoryService, times(1)).deleteCategory(1L);
    }
}