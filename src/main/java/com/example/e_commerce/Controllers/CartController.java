package com.example.e_commerce.Controllers;

import com.example.e_commerce.DTO.CartItemRequest;
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

    // AJOUTER UN ITEM À UN PANIER SPÉCIFIQUE (par cartId)
    @PostMapping("/{cartId}/add-item")
    public CartItem addItemToCart(@PathVariable Long cartId, @RequestBody CartItem cartItem) {
        return cartService.addItemToCart(cartId, cartItem);
    }

    // AJOUTER UN PRODUIT AU PANIER (alternative)
    @PostMapping("/{cartId}/add-product/{productId}")
    public CartItem addProductToCart(@PathVariable Long cartId,
                                     @PathVariable Long productId,
                                     @RequestParam int quantity) {
        return cartService.addProductToCart(cartId, productId, quantity);
    }

    //  AJOUTER UN ITEM AU PANIER DE L'UTILISATEUR
    @PostMapping("/user/{userId}/add-item")
    public CartItem addItemToUserCart(@PathVariable Long userId, @RequestBody CartItem cartItem) {
        return cartService.addItemToUserCart(userId, cartItem);
    }

    //  RÉCUPÉRER LE PANIER DE L'UTILISATEUR
    @GetMapping("/user/{userId}")
    public Cart getCartByUserId(@PathVariable Long userId) {
        return cartService.getCartByUserId(userId);
    }

    //  SUPPRIMER UN ITEM DU PANIER
    @DeleteMapping("/{cartId}/remove-item/{itemId}")
    public void removeItemFromCart(@PathVariable Long cartId, @PathVariable Long itemId) {
        cartService.removeItemFromCart(cartId, itemId);
    }

    //  VIDER LE PANIER DE L'UTILISATEUR
    @DeleteMapping("/user/{userId}/clear")
    public void clearUserCart(@PathVariable Long userId) {
        cartService.clearUserCart(userId);
    }

    //  METTRE À JOUR LA QUANTITÉ D'UN ITEM
    @PutMapping("/{cartId}/update-item/{itemId}")
    public CartItem updateCartItemQuantity(
            @PathVariable Long cartId,
            @PathVariable Long itemId,
            @RequestParam int quantity) {
        return cartService.updateCartItemQuantity(cartId, itemId, quantity);
    }

    //  CALCULER LE TOTAL DU PANIER
    @GetMapping("/{cartId}/total")
    public double calculateCartTotal(@PathVariable Long cartId) {
        return cartService.calculateCartTotal(cartId);
    }

    // TROUVER OU CRÉER UN PANIER POUR L'UTILISATEUR
    @GetMapping("/user/{userId}/find-or-create")
    public Cart findOrCreateCartForUser(@PathVariable Long userId) {
        return cartService.findOrCreateCartForUser(userId);
    }

    // Dans CartController.java, ajoutez cette méthode :
    @PostMapping("/{cartId}/add-item-simple")
    public CartItem addItemToCartSimple(@PathVariable Long cartId,
                                        @RequestBody CartItemRequest request) {
        return cartService.addProductToCart(cartId, request.getProductId(), request.getQuantite());
    }


}