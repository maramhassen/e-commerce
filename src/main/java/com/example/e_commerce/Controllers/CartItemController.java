package com.example.e_commerce.Controllers;

import com.example.e_commerce.Entities.CartItem;
import com.example.e_commerce.Services.ICartItemService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart-items")
//@CrossOrigin(origins = "*")
public class CartItemController {
    private final ICartItemService cartItemService;

    public CartItemController(ICartItemService cartItemService) {
        this.cartItemService = cartItemService;
    }

    // CREATE
    @PostMapping
    public CartItem createCartItem(@RequestBody CartItem cartItem) {
        return cartItemService.createCartItem(cartItem);
    }

    // READ ALL
    @GetMapping
    public List<CartItem> getAllCartItems() {
        return cartItemService.getAllCartItems();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public CartItem getCartItemById(@PathVariable Long id) {
        return cartItemService.getCartItemById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public CartItem updateCartItem(@PathVariable Long id,
                                   @RequestBody CartItem cartItem) {
        return cartItemService.updateCartItem(id, cartItem);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteCartItem(@PathVariable Long id) {
        cartItemService.deleteCartItem(id);
    }
}
