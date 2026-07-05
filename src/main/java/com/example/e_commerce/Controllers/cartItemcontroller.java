package com.example.e_commerce.Controllers;

import com.example.e_commerce.Entities.cartitem;
import com.example.e_commerce.Services.icartitemservice;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart-items")
//@CrossOrigin(origins = "*")
public class cartItemcontroller {
    private final icartitemservice cartItemService;

    public cartItemcontroller(icartitemservice cartItemService) {
        this.cartItemService = cartItemService;
    }

    // CREATE
    @PostMapping
    public cartitem createCartItem(@RequestBody cartitem cartItem) {
        return cartItemService.createCartItem(cartItem);
    }

    // READ ALL
    @GetMapping
    public List<cartitem> getAllCartItems() {
        return cartItemService.getAllCartItems();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public cartitem getCartItemById(@PathVariable Long id) {
        return cartItemService.getCartItemById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public cartitem updateCartItem(@PathVariable Long id,
                                   @RequestBody cartitem cartItem) {
        return cartItemService.updateCartItem(id, cartItem);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteCartItem(@PathVariable Long id) {
        cartItemService.deleteCartItem(id);
    }
}
