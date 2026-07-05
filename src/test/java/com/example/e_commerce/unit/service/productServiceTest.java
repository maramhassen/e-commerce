package com.example.e_commerce.unit.service;

import com.example.e_commerce.entities.product;
import com.example.e_commerce.repository.productrepository;
import com.example.e_commerce.services.productserviceimpl;
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
    private productrepository productRepository;

    @InjectMocks
    private productserviceimpl productService;

    @Test
    void testCreateProduct_Success() {
        product product = new product();
        product.setNom("Produit Test");
        product.setPrix(99.99);
        product.setStock(10);

        product savedProduct = new product();
        savedProduct.setId(1L);
        savedProduct.setNom("Produit Test");
        savedProduct.setPrix(99.99);
        savedProduct.setStock(10);

        when(productRepository.save(any(product.class))).thenReturn(savedProduct);

        product result = productService.createProduct(product);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Produit Test", result.getNom());
        verify(productRepository, times(1)).save(any(product.class));
    }

    @Test
    void testCreateProduct_WithNullName_ShouldThrowException() {
        product product = new product();
        product.setNom(null);
        product.setPrix(99.99);

        assertThrows(RuntimeException.class, () -> productService.createProduct(product));
        verify(productRepository, never()).save(any(product.class));
    }

    @Test
    void testCreateProduct_WithEmptyName_ShouldThrowException() {
        product product = new product();
        product.setNom("");
        product.setPrix(99.99);

        assertThrows(RuntimeException.class, () -> productService.createProduct(product));
        verify(productRepository, never()).save(any(product.class));
    }

    @Test
    void testCreateProduct_WithNegativePrice_ShouldThrowException() {
        product product = new product();
        product.setNom("Produit Test");
        product.setPrix(-10.0);

        assertThrows(RuntimeException.class, () -> productService.createProduct(product));
        verify(productRepository, never()).save(any(product.class));
    }

    @Test
    void testGetProductById_Success() {
        product product = new product();
        product.setId(1L);
        product.setNom("Produit Test");
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        product result = productService.getProductById(1L);

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
        product product1 = new product();
        product1.setId(1L);
        product1.setNom("Produit 1");

        product product2 = new product();
        product2.setId(2L);
        product2.setNom("Produit 2");

        when(productRepository.findAll()).thenReturn(Arrays.asList(product1, product2));

        List<product> result = productService.getAllProducts();

        assertEquals(2, result.size());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    void testUpdateProduct_Success() {
        product existingProduct = new product();
        existingProduct.setId(1L);
        existingProduct.setNom("Ancien Nom");
        existingProduct.setPrix(30.0);
        existingProduct.setStock(5);

        product updatedProduct = new product();
        updatedProduct.setNom("Nouveau Nom");
        updatedProduct.setPrix(40.0);
        updatedProduct.setStock(10);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existingProduct));
        when(productRepository.save(any(product.class))).thenReturn(existingProduct);

        product result = productService.updateProduct(1L, updatedProduct);

        assertNotNull(result);
        assertEquals("Nouveau Nom", result.getNom());
        assertEquals(40.0, result.getPrix());
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(any(product.class));
    }

    @Test
    void testUpdateProduct_NotFound() {
        product updatedProduct = new product();
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> productService.updateProduct(99L, updatedProduct));
        verify(productRepository, times(1)).findById(99L);
        verify(productRepository, never()).save(any(product.class));
    }

    @Test
    void testDeleteProduct_Success() {
        product product = new product();
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
        verify(productRepository, never()).delete(any(product.class));
    }
}