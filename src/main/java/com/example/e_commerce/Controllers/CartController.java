package com.example.e_commerce.Controllers;

import com.example.e_commerce.Entities.Cart;
import com.example.e_commerce.Entities.CartItem;
import com.example.e_commerce.Services.ICartService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
@CrossOrigin(origins = "http://localhost:4200")
public class CartController {
    private final ICartService cartService;

    public CartController(ICartService cartService) {
        this.cartService = cartService;
    }

    // CREATE
    @PostMapping
    public Cart createCart(@RequestBody Cart cart) {
        return cartService.createCart(cart);
    }

    // READ ALL
    @GetMapping
    public List<Cart> getAllCarts() {
        return cartService.getAllCarts();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public Cart getCartById(@PathVariable Long id) {
        return cartService.getCartById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Cart updateCart(@PathVariable Long id, @RequestBody Cart cart) {
        return cartService.updateCart(id, cart);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteCart(@PathVariable Long id) {
        cartService.deleteCart(id);
    }

    @PostMapping("/{cartId}/add-item")
    public CartItem addItemToCart(@PathVariable Long cartId, @RequestBody CartItem cartItem) {
        return cartService.addItemToCart(cartId, cartItem);
    }

}
