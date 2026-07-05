package com.example.e_commerce.controllers;

import com.example.e_commerce.DTO.cartitemrequest;
import com.example.e_commerce.entities.cart;
import com.example.e_commerce.entities.cartitem;
import com.example.e_commerce.services.icartservice;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
//@CrossOrigin(origins = "*")
public class cartcontroller {
    private final icartservice cartService;

    public cartcontroller(icartservice cartService) {
        this.cartService = cartService;
    }

    // CREATE
    @PostMapping
    public cart createCart(@RequestBody cart cart) {
        return cartService.createCart(cart);
    }

    // READ ALL
    @GetMapping
    public List<cart> getAllCarts() {
        return cartService.getAllCarts();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public cart getCartById(@PathVariable Long id) {
        return cartService.getCartById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public cart updateCart(@PathVariable Long id, @RequestBody cart cart) {
        return cartService.updateCart(id, cart);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteCart(@PathVariable Long id) {
        cartService.deleteCart(id);
    }

    // AJOUTER UN ITEM À UN PANIER SPÉCIFIQUE (par cartId)
    @PostMapping("/{cartId}/add-item")
    public cartitem addItemToCart(@PathVariable Long cartId, @RequestBody cartitem cartItem) {
        return cartService.addItemToCart(cartId, cartItem);
    }

    // AJOUTER UN PRODUIT AU PANIER (alternative)
    @PostMapping("/{cartId}/add-product/{productId}")
    public cartitem addProductToCart(@PathVariable Long cartId,
                                     @PathVariable Long productId,
                                     @RequestParam int quantity) {
        return cartService.addProductToCart(cartId, productId, quantity);
    }

    // AJOUTER UN ITEM AU PANIER DE L'UTILISATEUR
    @PostMapping("/user/{userId}/add-item")
    public cartitem addItemToUserCart(@PathVariable Long userId, @RequestBody cartitem cartItem) {
        return cartService.addItemToUserCart(userId, cartItem);
    }

    // ========== MÉTHODE CORRIGÉE ==========
    // RÉCUPÉRER LE PANIER DE L'UTILISATEUR - UTILISE findOrCreateCartForUser
    @GetMapping("/user/{userId}")
    public cart getCartByUserId(@PathVariable Long userId) {
        // Cette méthode crée automatiquement le panier s'il n'existe pas
        return cartService.findOrCreateCartForUser(userId);
    }

    // SUPPRIMER UN ITEM DU PANIER
    @DeleteMapping("/{cartId}/remove-item/{itemId}")
    public void removeItemFromCart(@PathVariable Long cartId, @PathVariable Long itemId) {
        cartService.removeItemFromCart(cartId, itemId);
    }

    // VIDER LE PANIER DE L'UTILISATEUR
    @DeleteMapping("/user/{userId}/clear")
    public void clearUserCart(@PathVariable Long userId) {
        cartService.clearUserCart(userId);
    }

    // METTRE À JOUR LA QUANTITÉ D'UN ITEM
    @PutMapping("/{cartId}/update-item/{itemId}")
    public cartitem updateCartItemQuantity(
            @PathVariable Long cartId,
            @PathVariable Long itemId,
            @RequestParam int quantity) {
        return cartService.updateCartItemQuantity(cartId, itemId, quantity);
    }

    // CALCULER LE TOTAL DU PANIER
    @GetMapping("/{cartId}/total")
    public double calculateCartTotal(@PathVariable Long cartId) {
        return cartService.calculateCartTotal(cartId);
    }

    // TROUVER OU CRÉER UN PANIER POUR L'UTILISATEUR
    @GetMapping("/user/{userId}/find-or-create")
    public cart findOrCreateCartForUser(@PathVariable Long userId) {
        return cartService.findOrCreateCartForUser(userId);
    }

    // AJOUT SIMPLE (utilisé par le frontend)
    @PostMapping("/{cartId}/add-item-simple")
    public cartitem addItemToCartSimple(@PathVariable Long cartId,
                                        @RequestBody cartitemrequest request) {
        return cartService.addProductToCart(cartId, request.getProductId(), request.getQuantite());
    }
}