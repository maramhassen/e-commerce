package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.cartitem;
import com.example.e_commerce.Repository.cartitemrepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class cartitemserviceimpl implements icartitemservice {
    private final cartitemrepository cartItemRepository;

    public cartitemserviceimpl(cartitemrepository cartItemRepository) {
        this.cartItemRepository = cartItemRepository;
    }

    @Override
    public cartitem createCartItem(cartitem cartItem) {
        return cartItemRepository.save(cartItem);
    }

    @Override
    public cartitem updateCartItem(Long id, cartitem cartItem) {
        cartitem existingItem = cartItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CartItem not found with id: " + id));

        existingItem.setQuantite(cartItem.getQuantite());
        existingItem.setPrixUnitaire(cartItem.getPrixUnitaire());
        existingItem.setProduct(cartItem.getProduct());
        existingItem.setCart(cartItem.getCart());

        return cartItemRepository.save(existingItem);
    }

    @Override
    public cartitem getCartItemById(Long id) {
        return cartItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CartItem not found with id: " + id));
    }

    @Override
    public List<cartitem> getAllCartItems() {
        return cartItemRepository.findAll();
    }

    @Override
    public void deleteCartItem(Long id) {
        cartItemRepository.deleteById(id);
    }
}