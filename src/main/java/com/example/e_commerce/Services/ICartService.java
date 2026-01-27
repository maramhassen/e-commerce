package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.Cart;

import java.util.List;

public interface ICartService {
    Cart createCart(Cart cart);

    Cart updateCart(Long id, Cart cart);

    Cart getCartById(Long id);

    List<Cart> getAllCarts();

    void deleteCart(Long id);
}
