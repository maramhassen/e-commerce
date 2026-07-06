package com.example.e_commerce.integration;

import com.example.e_commerce.entities.Product;
import com.example.e_commerce.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class productControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
    }

    @Test
    void testCreateProduct() throws Exception {

        String requestJson = """
                {
                    "nom": "Produit Test",
                    "description": "Description test",
                    "prix": 99.99,
                    "stock": 10,
                    "actif": true
                }
                """;

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nom").value("Produit Test"))
                .andExpect(jsonPath("$.prix").value(99.99));
    }

    @Test
    void testGetAllProducts() throws Exception {
        Product product = new Product();
        product.setNom("Produit 1");
        product.setPrix(50.00);
        product.setStock(1);
        productRepository.save(product);

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void testGetProductById() throws Exception {
        Product product = new Product();
        product.setNom("Produit Unique");
        product.setPrix(75.00);
        product.setStock(1);
        Product saved = productRepository.save(product);

        mockMvc.perform(get("/api/products/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.nom").value("Produit Unique"));
    }

    @Test
    void testGetProductById_NotFound() throws Exception {

        mockMvc.perform(get("/api/products/{id}", 999L))
                .andExpect(status().is5xxServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testUpdateProduct() throws Exception {
        Product product = new Product();
        product.setNom("Ancien Nom");
        product.setPrix(30.00);
        product.setStock(5);
        Product saved = productRepository.save(product);

        String requestJson = """
                {
                    "nom": "Nouveau Nom",
                    "description": "Description modifiée",
                    "prix": 40.00,
                    "stock": 8,
                    "actif": true
                }
                """;

        mockMvc.perform(put("/api/products/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Nouveau Nom"))
                .andExpect(jsonPath("$.prix").value(40.00));
    }

    @Test
    void testUpdateProduct_NotFound() throws Exception {

        String requestJson = """
                {
                    "nom": "Inexistant",
                    "description": "x",
                    "prix": 10.00,
                    "stock": 1,
                    "actif": true
                }
                """;

        mockMvc.perform(put("/api/products/{id}", 999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testDeleteProduct() throws Exception {
        Product product = new Product();
        product.setNom("Produit à supprimer");
        product.setPrix(20.00);
        product.setStock(1);
        Product saved = productRepository.save(product);

        mockMvc.perform(delete("/api/products/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Product deleted successfully"));

        mockMvc.perform(get("/api/products/{id}", saved.getId()))
                .andExpect(status().is5xxServerError());
    }

    @Test
    void testDeleteProduct_NotFound() throws Exception {

        mockMvc.perform(delete("/api/products/999"))
                .andExpect(status().is5xxServerError())
                .andExpect(jsonPath("$.error").exists());
    }
}