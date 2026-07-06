package com.example.e_commerce.services;

import com.example.e_commerce.dto.CartItemRequest;
import com.example.e_commerce.entities.Cart;
import com.example.e_commerce.entities.CartItem;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface icartservice {
    // cRUD cart
    Cart createcart(Cart cart);
    Cart updatecart(Long id, Cart cart);
    Cart getcartById(Long id);
    List<Cart> getAllcarts();
    void deletecart(Long id);

    // cart Items
    CartItem addItemTocart(Long cartId, CartItem cartItem);
    CartItem addProductTocart(Long cartId, Long productId, int quantity);
    CartItem addItemToUsercart(Long userId, CartItem cartItem);
    CartItem addItemToUsercart(Long userId, CartItemRequest request);

    // Gestion du panier
    Cart getcartByUserId(Long userId);
    void removeItemFromcart(Long cartId, Long itemId);
    void clearUsercart(Long userId);
    CartItem updatecartItemQuantity(Long cartId, Long itemId, int quantity);

    @Transactional
    CartItem updatecartitemQuantity(Long cartId, Long itemId, int quantity);

    double calculatecartTotal(Long cartId);
    Cart findOrcreatecartForUser(Long userId);

    Cart createCart(Cart cart);

    Cart updateCart(Long id, Cart cart);

    Cart getCartById(Long id);

    List<Cart> getAllCarts();

    void deleteCart(Long id);

    @Transactional
    CartItem addItemToCart(Long cartId, CartItem cartItem);

    @Transactional
    CartItem addProductToCart(Long cartId, Long productId, int quantity);

    CartItem addItemToUserCart(Long userId, CartItem cartItem);

    CartItem addItemToUserCart(Long userId, CartItemRequest request);

    Cart getCartByUserId(Long userId);

    @Transactional
    void removeItemFromCart(Long cartId, Long itemId);

    @Transactional
    void clearUserCart(Long userId);

    @Transactional
    CartItem updateCartItemQuantity(Long cartId, Long itemId, int quantity);

    double calculateCartTotal(Long cartId);

    // ===== MÉTHODE MODIFIÉE - VERSION CORRIGÉE =====
    Cart findOrCreateCartForUser(Long userId);

    Cart findOrCreatecartForUser(Long userId);
}