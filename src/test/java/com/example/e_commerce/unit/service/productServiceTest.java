package com.example.e_commerce.unit.service;

import com.example.e_commerce.entities.Product;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.services.ProductServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class productServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    void testCreateProduct_Success() {
        Product product = new Product();
        product.setNom("Produit Test");
        product.setPrix(99.99);
        product.setStock(10);

        Product savedProduct = new Product();
        savedProduct.setId(1L);
        savedProduct.setNom("Produit Test");
        savedProduct.setPrix(99.99);
        savedProduct.setStock(10);

        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        Product result = productService.createProduct(product);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Produit Test", result.getNom());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void testCreateProduct_WithNullName_ShouldThrowException() {
        Product product = new Product();
        product.setNom(null);
        product.setPrix(99.99);

        assertThrows(RuntimeException.class, () -> productService.createProduct(product));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testCreateProduct_WithEmptyName_ShouldThrowException() {
        Product product = new Product();
        product.setNom("");
        product.setPrix(99.99);

        assertThrows(RuntimeException.class, () -> productService.createProduct(product));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testCreateProduct_WithNegativePrice_ShouldThrowException() {
        Product product = new Product();
        product.setNom("Produit Test");
        product.setPrix(-10.0);

        assertThrows(RuntimeException.class, () -> productService.createProduct(product));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testGetProductById_Success() {
        Product product = new Product();
        product.setId(1L);
        product.setNom("Produit Test");
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        Product result = productService.getProductById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Produit Test", result.getNom());
        verify(productRepository, times(1)).findById(1L);
    }

    @Test
    void testGetProductById_NotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productService.getProductById(99L));
        assertEquals("Produit non trouvé avec ID: 99", exception.getMessage());
        verify(productRepository, times(1)).findById(99L);
    }

    @Test
    void testGetAllProducts_Success() {
        Product product1 = new Product();
        product1.setId(1L);
        product1.setNom("Produit 1");

        Product product2 = new Product();
        product2.setId(2L);
        product2.setNom("Produit 2");

        when(productRepository.findAll()).thenReturn(Arrays.asList(product1, product2));

        List<Product> result = productService.getAllProducts();

        assertEquals(2, result.size());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    void testUpdateProduct_Success() {
        Product existingProduct = new Product();
        existingProduct.setId(1L);
        existingProduct.setNom("Ancien Nom");
        existingProduct.setPrix(30.0);
        existingProduct.setStock(5);

        Product updatedProduct = new Product();
        updatedProduct.setNom("Nouveau Nom");
        updatedProduct.setPrix(40.0);
        updatedProduct.setStock(10);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existingProduct));
        when(productRepository.save(any(Product.class))).thenReturn(existingProduct);

        Product result = productService.updateProduct(1L, updatedProduct);

        assertNotNull(result);
        assertEquals("Nouveau Nom", result.getNom());
        assertEquals(40.0, result.getPrix());
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void testUpdateProduct_NotFound() {
        Product updatedProduct = new Product();
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> productService.updateProduct(99L, updatedProduct));
        verify(productRepository, times(1)).findById(99L);
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testDeleteProduct_Success() {
        Product product = new Product();
        product.setId(1L);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        doNothing().when(productRepository).delete(product);

        productService.deleteProduct(1L);

        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).delete(product);
    }

    @Test
    void testDeleteProduct_NotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> productService.deleteProduct(99L));
        verify(productRepository, times(1)).findById(99L);
        verify(productRepository, never()).delete(any(Product.class));
    }
}