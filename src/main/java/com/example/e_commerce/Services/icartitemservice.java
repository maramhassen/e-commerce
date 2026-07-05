package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.cartitem;

import java.util.List;

public interface icartitemservice {
    cartitem createCartItem(cartitem cartItem);

    cartitem updateCartItem(Long id, cartitem cartItem);

    cartitem getCartItemById(Long id);

    List<cartitem> getAllCartItems();

    void deleteCartItem(Long id);
}
