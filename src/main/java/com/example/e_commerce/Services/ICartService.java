package com.example.e_commerce.Services;

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
}
