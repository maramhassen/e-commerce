package com.example.e_commerce.Services;

import com.example.e_commerce.DTO.cartitemrequest;
import com.example.e_commerce.Entities.cart;
import com.example.e_commerce.Entities.cartitem;
import java.util.List;

public interface icartservice {
    // CRUD Cart
    cart createCart(cart cart);
    cart updateCart(Long id, cart cart);
    cart getCartById(Long id);
    List<cart> getAllCarts();
    void deleteCart(Long id);

    // Cart Items
    cartitem addItemToCart(Long cartId, cartitem cartItem);
    cartitem addProductToCart(Long cartId, Long productId, int quantity);
    cartitem addItemToUserCart(Long userId, cartitem cartItem);
    cartitem addItemToUserCart(Long userId, cartitemrequest request);

    // Gestion du panier
    cart getCartByUserId(Long userId);
    void removeItemFromCart(Long cartId, Long itemId);
    void clearUserCart(Long userId);
    cartitem updateCartItemQuantity(Long cartId, Long itemId, int quantity);
    double calculateCartTotal(Long cartId);
    cart findOrCreateCartForUser(Long userId);
}