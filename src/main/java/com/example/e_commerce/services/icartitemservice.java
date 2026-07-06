package com.example.e_commerce.services;

import com.example.e_commerce.entities.CartItem;

import java.util.List;

public interface icartitemservice {
    CartItem createCartItem(CartItem cartItem);

    CartItem updateCartItem(Long id, CartItem cartItem);

    CartItem getCartItemById(Long id);

    List<CartItem> getAllCartItems();

    void deleteCartItem(Long id);
}
