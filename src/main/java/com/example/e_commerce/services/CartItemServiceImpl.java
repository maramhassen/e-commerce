package com.example.e_commerce.services;

import com.example.e_commerce.entities.CartItem;
import com.example.e_commerce.repository.CartItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CartItemServiceImpl implements ICartItemService {
    private final CartItemRepository cartItemRepository;

    public CartItemServiceImpl(CartItemRepository cartItemRepository) {
        this.cartItemRepository = cartItemRepository;
    }

    @Override
    public CartItem createCartItem(CartItem cartItem) {
        return cartItemRepository.save(cartItem);
    }

    @Override
    public CartItem updateCartItem(Long id, CartItem cartItem) {
        CartItem existingItem = cartItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CartItem not found with id: " + id));

        existingItem.setQuantite(cartItem.getQuantite());
        existingItem.setPrixUnitaire(cartItem.getPrixUnitaire());
        existingItem.setProduct(cartItem.getProduct());
        existingItem.setCart(cartItem.getCart());

        return cartItemRepository.save(existingItem);
    }

    @Override
    public CartItem getCartItemById(Long id) {
        return cartItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CartItem not found with id: " + id));
    }

    @Override
    public List<CartItem> getAllCartItems() {
        return cartItemRepository.findAll();
    }

    @Override
    public void deleteCartItem(Long id) {
        cartItemRepository.deleteById(id);
    }
}