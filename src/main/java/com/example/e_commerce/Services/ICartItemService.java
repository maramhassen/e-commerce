package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.CartItem;

import java.util.List;

public interface ICartItemService {
    CartItem createCartItem(CartItem cartItem);

    CartItem updateCartItem(Long id, CartItem cartItem);

    CartItem getCartItemById(Long id);

    List<CartItem> getAllCartItems();

    void deleteCartItem(Long id);
}
