package com.example.e_commerce.services;

import com.example.e_commerce.dto.CartItemRequest;
import com.example.e_commerce.entities.Cart;
import com.example.e_commerce.entities.CartItem;
import java.util.List;

public interface ICartService {
    // CRUD Cart
    Cart createCart(Cart cart);
    Cart updateCart(Long id, Cart cart);
    Cart getCartById(Long id);
    List<Cart> getAllCarts();
    void deleteCart(Long id);

    // Cart Items
    CartItem addItemToCart(Long cartId, CartItem cartItem);
    CartItem addProductToCart(Long cartId, Long productId, int quantity);
    CartItem addItemToUserCart(Long userId, CartItem cartItem);
    CartItem addItemToUserCart(Long userId, CartItemRequest request);

    // Gestion du panier
    Cart getCartByUserId(Long userId);
    void removeItemFromCart(Long cartId, Long itemId);
    void clearUserCart(Long userId);
    CartItem updateCartItemQuantity(Long cartId, Long itemId, int quantity);
    double calculateCartTotal(Long cartId);
    Cart findOrCreateCartForUser(Long userId);
}