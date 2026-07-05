package com.example.e_commerce.services;

import com.example.e_commerce.DTO.cartitemrequest;
import com.example.e_commerce.entities.cart;
import com.example.e_commerce.entities.cartitem;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface icartservice {
    // cRUD cart
    cart createcart(cart cart);
    cart updatecart(Long id, cart cart);
    cart getcartById(Long id);
    List<cart> getAllcarts();
    void deletecart(Long id);

    // cart Items
    cartitem addItemTocart(Long cartId, cartitem cartItem);
    cartitem addProductTocart(Long cartId, Long productId, int quantity);
    cartitem addItemToUsercart(Long userId, cartitem cartItem);
    cartitem addItemToUsercart(Long userId, cartitemrequest request);

    // Gestion du panier
    cart getcartByUserId(Long userId);
    void removeItemFromcart(Long cartId, Long itemId);
    void clearUsercart(Long userId);
    cartitem updatecartItemQuantity(Long cartId, Long itemId, int quantity);
    double calculatecartTotal(Long cartId);
    cart findOrcreatecartForUser(Long userId);

    cart createCart(cart cart);

    cart updateCart(Long id, cart cart);

    cart getCartById(Long id);

    List<cart> getAllCarts();

    void deleteCart(Long id);

    @Transactional
    cartitem addItemToCart(Long cartId, cartitem cartItem);

    @Transactional
    cartitem addProductToCart(Long cartId, Long productId, int quantity);

    cartitem addItemToUserCart(Long userId, cartitem cartItem);

    cartitem addItemToUserCart(Long userId, cartitemrequest request);

    cart getCartByUserId(Long userId);

    @Transactional
    void removeItemFromCart(Long cartId, Long itemId);

    @Transactional
    void clearUserCart(Long userId);

    @Transactional
    cartitem updateCartItemQuantity(Long cartId, Long itemId, int quantity);

    double calculateCartTotal(Long cartId);

    // ===== MÉTHODE MODIFIÉE - VERSION CORRIGÉE =====
    cart findOrCreateCartForUser(Long userId);
}