package com.example.e_commerce.Services;

import com.example.e_commerce.DTO.CartItemRequest;
import com.example.e_commerce.Entities.Cart;
import com.example.e_commerce.Entities.CartItem;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ICartService {
    Cart createCart(Cart cart);
    Cart updateCart(Long id, Cart cart);
    Cart getCartById(Long id);
    List<Cart> getAllCarts();
    void deleteCart(Long id);
    CartItem addItemToCart(Long cartId, CartItem cartItem);

    // Méthode supplémentaire utile : ajouter un produit au panier par ID
    @Transactional
    CartItem addProductToCart(Long cartId, Long productId, int quantity);

    // NOUVELLES MÉTHODES
    CartItem addItemToUserCart(Long userId, CartItem cartItem);
    Cart getCartByUserId(Long userId);
    void removeItemFromCart(Long cartId, Long itemId);
    void clearUserCart(Long userId);
    CartItem updateCartItemQuantity(Long cartId, Long itemId, int quantity);
    double calculateCartTotal(Long cartId);

    Cart findOrCreateCartForUser(Long userId);
    CartItem addItemToUserCart(Long userId, CartItemRequest request);

}