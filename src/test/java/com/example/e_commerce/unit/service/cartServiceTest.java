package com.example.e_commerce.unit.service;

import com.example.e_commerce.entities.Cart;
import com.example.e_commerce.entities.CartItem;
import com.example.e_commerce.entities.Product;
import com.example.e_commerce.entities.User;
import com.example.e_commerce.repository.CartItemRepository;
import com.example.e_commerce.repository.CartRepository;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.repository.UserRepository;
import com.example.e_commerce.services.CartServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class cartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        cart = new Cart();
        cart.setId(1L);
        cart.setTotal(0.0);
        cart.setItems(new ArrayList<>());

        product = new Product();
        product.setId(1L);
        product.setNom("Produit Test");
        product.setPrix(50.0);
        product.setStock(10);
    }

    @Test
    void testCreateCart_Success() {
        Cart newCart = new Cart();
        when(cartRepository.save(any(Cart.class))).thenReturn(newCart);

        Cart result = cartService.createCart(newCart);

        assertNotNull(result);
        assertNotNull(newCart.getDateCreation());
        verify(cartRepository, times(1)).save(any(Cart.class));
    }

    @Test
    void testUpdateCart_Success() {
        Cart updatedCart = new Cart();
        updatedCart.setTotal(100.0);

        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        Cart result = cartService.updateCart(1L, updatedCart);

        assertNotNull(result);
        assertEquals(100.0, result.getTotal());
        verify(cartRepository, times(1)).findById(1L);
        verify(cartRepository, times(1)).save(any(Cart.class));
    }

    @Test
    void testUpdateCart_NotFound() {
        Cart updatedCart = new Cart();
        when(cartRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> cartService.updateCart(99L, updatedCart));
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    void testGetCartById_Success() {
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));

        Cart result = cartService.getCartById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(cartRepository, times(1)).findById(1L);
    }

    @Test
    void testGetCartById_NotFound() {
        when(cartRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> cartService.getCartById(99L));
    }

    @Test
    void testGetAllCarts_Success() {
        Cart cart2 = new Cart();
        cart2.setId(2L);
        when(cartRepository.findAll()).thenReturn(Arrays.asList(cart, cart2));

        List<Cart> result = cartService.getAllCarts();

        assertEquals(2, result.size());
        verify(cartRepository, times(1)).findAll();
    }

    @Test
    void testDeleteCart_Success() {
        doNothing().when(cartRepository).deleteById(1L);

        cartService.deleteCart(1L);

        verify(cartRepository, times(1)).deleteById(1L);
    }

    @Test
    void testAddItemToCart_Success() {
        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setQuantite(2);

        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(cartItem);
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(100.0);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartItem result = cartService.addItemToCart(1L, cartItem);

        assertNotNull(result);
        assertEquals(8, product.getStock());
        verify(productRepository, times(1)).save(any(Product.class));
        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    void testAddItemToCart_CartNotFound_ShouldThrowException() {
        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);

        when(cartRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> cartService.addItemToCart(99L, cartItem));
    }

    @Test
    void testAddItemToCart_InvalidProduct_ShouldThrowException() {
        CartItem cartItem = new CartItem();
        cartItem.setProduct(null);

        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));

        assertThrows(RuntimeException.class, () -> cartService.addItemToCart(1L, cartItem));
    }

    @Test
    void testAddItemToCart_ProductNotFound_ShouldThrowException() {
        Product unknownProduct = new Product();
        unknownProduct.setId(99L);
        CartItem cartItem = new CartItem();
        cartItem.setProduct(unknownProduct);

        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> cartService.addItemToCart(1L, cartItem));
    }

    @Test
    void testAddItemToCart_InsufficientStock_ShouldThrowException() {
        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setQuantite(50);

        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThrows(RuntimeException.class, () -> cartService.addItemToCart(1L, cartItem));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testAddProductToCart_NewItem_Success() {
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, 1L)).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(100.0);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartItem result = cartService.addProductToCart(1L, 1L, 3);

        assertNotNull(result);
        assertEquals(3, result.getQuantite());
        assertEquals(7, product.getStock());
    }

    @Test
    void testAddProductToCart_ExistingItem_Success() {
        CartItem existingItem = new CartItem();
        existingItem.setQuantite(2);
        existingItem.setProduct(product);
        existingItem.setCart(cart);

        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, 1L)).thenReturn(Optional.of(existingItem));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(existingItem);
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(150.0);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartItem result = cartService.addProductToCart(1L, 1L, 3);

        assertEquals(5, result.getQuantite());
        assertEquals(7, product.getStock());
    }

    @Test
    void testAddProductToCart_InsufficientStock_ShouldThrowException() {
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThrows(RuntimeException.class, () -> cartService.addProductToCart(1L, 1L, 50));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testGetCartByUserId_Success() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));

        Cart result = cartService.getCartByUserId(1L);

        assertNotNull(result);
        verify(cartRepository, times(1)).findByUserId(1L);
    }

    @Test
    void testGetCartByUserId_NotFound() {
        when(cartRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> cartService.getCartByUserId(99L));
    }

    @Test
    void testRemoveItemFromCart_Success() {
        CartItem item = new CartItem();
        item.setId(1L);
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantite(2);

        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(0.0);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        cartService.removeItemFromCart(1L, 1L);

        assertEquals(12, product.getStock());
        verify(cartItemRepository, times(1)).delete(item);
    }

    @Test
    void testRemoveItemFromCart_ItemNotFound_ShouldThrowException() {
        when(cartItemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> cartService.removeItemFromCart(1L, 99L));
    }

    @Test
    void testRemoveItemFromCart_ItemNotBelongToCart_ShouldThrowException() {
        Cart otherCart = new Cart();
        otherCart.setId(2L);
        CartItem item = new CartItem();
        item.setId(1L);
        item.setCart(otherCart);

        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThrows(RuntimeException.class, () -> cartService.removeItemFromCart(1L, 1L));
        verify(cartItemRepository, never()).delete(any(CartItem.class));
    }

    @Test
    void testClearUserCart_Success() {
        CartItem item = new CartItem();
        item.setProduct(product);
        item.setQuantite(3);
        cart.setItems(new ArrayList<>(List.of(item)));

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        doNothing().when(cartItemRepository).deleteAllByCartId(1L);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        cartService.clearUserCart(1L);

        assertEquals(13, product.getStock());
        assertEquals(0.0, cart.getTotal());
        verify(cartItemRepository, times(1)).deleteAllByCartId(1L);
    }

    @Test
    void testUpdateCartItemQuantity_Increase_Success() {
        CartItem item = new CartItem();
        item.setId(1L);
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantite(2);

        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(item);
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(200.0);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartItem result = cartService.updateCartItemQuantity(1L, 1L, 5);

        assertNotNull(result);
        assertEquals(5, result.getQuantite());
        assertEquals(7, product.getStock());
    }

    @Test
    void testUpdateCartItemQuantity_ZeroOrNegative_ShouldRemoveItem() {
        CartItem item = new CartItem();
        item.setId(1L);
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantite(2);

        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(0.0);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartItem result = cartService.updateCartItemQuantity(1L, 1L, 0);

        assertNull(result);
        verify(cartItemRepository, times(1)).delete(item);
    }

    @Test
    void testUpdateCartItemQuantity_InsufficientStock_ShouldThrowException() {
        CartItem item = new CartItem();
        item.setId(1L);
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantite(2);

        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThrows(RuntimeException.class, () -> cartService.updateCartItemQuantity(1L, 1L, 100));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testCalculateCartTotal_Success() {
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(75.5);

        double result = cartService.calculateCartTotal(1L);

        assertEquals(75.5, result);
    }

    @Test
    void testCalculateCartTotal_NullReturnsZero() {
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(null);

        double result = cartService.calculateCartTotal(1L);

        assertEquals(0.0, result);
    }

    @Test
    void testFindOrCreateCartForUser_WithItemsFound() {
        CartItem item = new CartItem();
        item.setProduct(product);
        item.setQuantite(1);
        item.setPrixUnitaire(50.0);
        cart.setItems(new ArrayList<>(List.of(item)));

        when(cartRepository.findCartsWithItemsByUserId(1L)).thenReturn(List.of(cart));
        when(cartItemRepository.calculateCartTotal(1L)).thenReturn(50.0);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        Cart result = cartService.findOrCreateCartForUser(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(cartRepository, never()).save(argThat(c -> false));
    }

    @Test
    void testFindOrCreateCartForUser_NoItemsButCartExists() {
        when(cartRepository.findCartsWithItemsByUserId(1L)).thenReturn(new ArrayList<>());
        when(cartRepository.findAllByUserIdOrderByDateCreationDesc(1L)).thenReturn(List.of(cart));

        Cart result = cartService.findOrCreateCartForUser(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    void testFindOrCreateCartForUser_CreateNew() {
        User user = new User();
        user.setId(1L);

        when(cartRepository.findCartsWithItemsByUserId(1L)).thenReturn(new ArrayList<>());
        when(cartRepository.findAllByUserIdOrderByDateCreationDesc(1L)).thenReturn(new ArrayList<>());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        Cart result = cartService.findOrCreateCartForUser(1L);

        assertNotNull(result);
        verify(cartRepository, times(1)).save(any(Cart.class));
    }

    @Test
    void testFindOrCreateCartForUser_UserNotFound_ShouldThrowException() {
        when(cartRepository.findCartsWithItemsByUserId(99L)).thenReturn(new ArrayList<>());
        when(cartRepository.findAllByUserIdOrderByDateCreationDesc(99L)).thenReturn(new ArrayList<>());
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> cartService.findOrCreateCartForUser(99L));
    }
}