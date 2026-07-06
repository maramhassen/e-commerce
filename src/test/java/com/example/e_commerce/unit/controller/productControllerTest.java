package com.example.e_commerce.unit.controller;

import com.example.e_commerce.controllers.ProductController;
import com.example.e_commerce.entities.Product;
import com.example.e_commerce.services.iproductservice;
import com.example.e_commerce.services.icategoryservice;
import com.example.e_commerce.services.filestorageservice;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Test "standalone" : on instancie le ProductController directement avec des mocks,
 * sans démarrer tout le contexte Spring. Avantages :
 *  - Aucun besoin de base de données (ni MySQL, ni H2)
 *  - Tests rapides et isolés
 *  - On teste UNIQUEMENT la couche Controller (le routage HTTP, la sérialisation JSON)
 */
@ExtendWith(MockitoExtension.class)
class productControllerTest {

    @Mock
    private iproductservice productService;

    @Mock
    private icategoryservice categoryService;

    @Mock
    private filestorageservice fileStorageService;

    @InjectMocks
    private ProductController productController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        // Le champ "objectMapper" du controller est @Autowired (pas constructeur),
        // donc @InjectMocks ne le remplit pas automatiquement : on l'injecte nous-mêmes.
        ReflectionTestUtils.setField(productController, "objectMapper", objectMapper);

        mockMvc = MockMvcBuilders.standaloneSetup(productController).build();
    }

    @Test
    void testGetAllProducts() throws Exception {
        Product product1 = new Product();
        product1.setId(1L);
        product1.setNom("Produit 1");

        Product product2 = new Product();
        product2.setId(2L);
        product2.setNom("Produit 2");

        List<Product> Products = Arrays.asList(product1, product2);
        when(productService.getAllProducts()).thenReturn(Products);

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(productService, times(1)).getAllProducts();
    }

    @Test
    void testGetProductById() throws Exception {
        Product product = new Product();
        product.setId(1L);
        product.setNom("Produit Test");
        when(productService.getProductById(1L)).thenReturn(product);

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.nom").value("Produit Test"));

        verify(productService, times(1)).getProductById(1L);
    }

    @Test
    void testCreateProduct() throws Exception {
        // Le controller attend un Map<String, Object> (@RequestBody Map<String, Object>)
        // donc on envoie un JSON brut correspondant à cette structure.
        String requestJson = """
                {
                    "nom": "Nouveau Produit",
                    "description": "Description test",
                    "prix": 49.99,
                    "stock": 5,
                    "actif": true
                }
                """;

        Product savedProduct = new Product();
        savedProduct.setId(1L);
        savedProduct.setNom("Nouveau Produit");
        savedProduct.setPrix(49.99);
        savedProduct.setStock(5);

        when(productService.createProduct(any(Product.class))).thenReturn(savedProduct);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.nom").value("Nouveau Produit"));

        verify(productService, times(1)).createProduct(any(Product.class));
    }

    @Test
    void testUpdateProduct() throws Exception {
        String requestJson = """
                {
                    "nom": "Produit Modifié",
                    "description": "Description modifiée",
                    "prix": 59.99,
                    "stock": 8,
                    "actif": true
                }
                """;

        Product existingProduct = new Product();
        existingProduct.setId(1L);
        existingProduct.setNom("Ancien nom");

        Product resultProduct = new Product();
        resultProduct.setId(1L);
        resultProduct.setNom("Produit Modifié");
        resultProduct.setPrix(59.99);

        when(productService.getProductById(1L)).thenReturn(existingProduct);
        when(productService.updateProduct(eq(1L), any(Product.class))).thenReturn(resultProduct);

        mockMvc.perform(put("/api/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Produit Modifié"));

        verify(productService, times(1)).updateProduct(eq(1L), any(Product.class));
    }

    @Test
    void testDeleteProduct() throws Exception {
        Product product = new Product();
        product.setId(1L);
        product.setImageUrl(null);

        when(productService.getProductById(1L)).thenReturn(product);
        doNothing().when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Product deleted successfully"));

        verify(productService, times(1)).deleteProduct(1L);
    }
}