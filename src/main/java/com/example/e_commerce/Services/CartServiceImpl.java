package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.Cart;
import com.example.e_commerce.Entities.CartItem;
import com.example.e_commerce.Entities.Product;
import com.example.e_commerce.Repository.CartItemRepository;
import com.example.e_commerce.Repository.CartRepository;
import com.example.e_commerce.Repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartServiceImpl implements ICartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;  // Changé de Object à CartItemRepository
    private final ProductRepository productRepository;    // Changé de Object à ProductRepository

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;    // Correction
        this.productRepository = productRepository;      // Correction
    }

    @Override
    public Cart createCart(Cart cart) {
        return cartRepository.save(cart);
    }

    @Override
    public Cart updateCart(Long id, Cart cart) {
        Cart existingCart = cartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        existingCart.setTotal(cart.getTotal());
        existingCart.setUser(cart.getUser());
        existingCart.setItems(cart.getItems());

        return cartRepository.save(existingCart);
    }

    @Override
    public Cart getCartById(Long id) {
        return cartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
    }

    @Override
    public List<Cart> getAllCarts() {
        return cartRepository.findAll();
    }

    @Override
    public void deleteCart(Long id) {
        cartRepository.deleteById(id);
    }

    @Override
    @Transactional
    public CartItem addItemToCart(Long cartId, CartItem cartItem) {
        // 1. Trouver le panier
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier introuvable"));

        // 2. Vérifier que le produit existe
        if (cartItem.getProduct() == null || cartItem.getProduct().getId() == null) {
            throw new RuntimeException("Produit invalide");
        }

        Product product = productRepository.findById(cartItem.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID: " + cartItem.getProduct().getId()));

        // 3. Vérifier le stock
        if (product.getStock() < cartItem.getQuantite()) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock() + ", Demandé: " + cartItem.getQuantite());
        }

        // 4. Déduire le stock (optionnel, selon votre logique métier)
        product.setStock(product.getStock() - cartItem.getQuantite());
        productRepository.save(product);

        // 5. Configurer les relations
        cartItem.setCart(cart);
        cartItem.setProduct(product);
        cartItem.setPrixUnitaire(product.getPrix());

        // 6. Ajouter l'item au panier
        cart.getItems().add(cartItem);

        // 7. Recalculer le total du panier
        recalculerTotalPanier(cart);

        // 8. Sauvegarder
        cartRepository.save(cart);
        CartItem savedItem = cartItemRepository.save(cartItem);

        return savedItem;
    }

    // Méthode pour recalculer le total du panier
    private void recalculerTotalPanier(Cart cart) {
        double total = cart.getItems().stream()
                .mapToDouble(item -> item.getQuantite() * item.getPrixUnitaire())
                .sum();
        cart.setTotal(total);
    }

    // Méthode supplémentaire utile : ajouter un produit au panier par ID
    @Transactional
    @Override
    public CartItem addProductToCart(Long cartId, Long productId, int quantity) {
        // 1. Trouver le panier
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier introuvable"));

        // 2. Trouver le produit
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        // 3. Vérifier si l'article existe déjà dans le panier
        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            // Mettre à jour la quantité
            int nouvelleQuantite = existingItem.getQuantite() + quantity;

            // Vérifier le stock
            if (product.getStock() < nouvelleQuantite) {
                throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
            }

            existingItem.setQuantite(nouvelleQuantite);
            product.setStock(product.getStock() - quantity);
            productRepository.save(product);

            recalculerTotalPanier(cart);
            cartRepository.save(cart);
            return cartItemRepository.save(existingItem);
        } else {
            // Créer un nouvel item
            // Vérifier le stock
            if (product.getStock() < quantity) {
                throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
            }

            CartItem newItem = new CartItem();
            newItem.setQuantite(quantity);
            newItem.setPrixUnitaire(product.getPrix());
            newItem.setProduct(product);
            newItem.setCart(cart);

            product.setStock(product.getStock() - quantity);
            productRepository.save(product);

            cart.getItems().add(newItem);
            recalculerTotalPanier(cart);

            cartRepository.save(cart);
            return cartItemRepository.save(newItem);
        }
    }
}