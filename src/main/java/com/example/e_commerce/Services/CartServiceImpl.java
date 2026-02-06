package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.Cart;
import com.example.e_commerce.Entities.CartItem;
import com.example.e_commerce.Entities.Product;
import com.example.e_commerce.Entities.User;
import com.example.e_commerce.Repository.CartItemRepository;
import com.example.e_commerce.Repository.CartRepository;
import com.example.e_commerce.Repository.ProductRepository;
import com.example.e_commerce.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartServiceImpl implements ICartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;  // Ajouté

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {  // Ajouté
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;  // Ajouté
    }

    // MÉTHODES EXISTANTES (gardées telles quelles)
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

    @Override
    @Transactional
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

    // NOUVELLES MÉTHODES
    @Override
    public CartItem addItemToUserCart(Long userId, CartItem cartItem) {
        // 1. Trouver ou créer le panier de l'utilisateur
        Cart cart = findOrCreateCartForUser(userId);

        // 2. Vérifier que le produit existe
        if (cartItem.getProduct() == null || cartItem.getProduct().getId() == null) {
            throw new RuntimeException("Produit invalide");
        }

        Product product = productRepository.findById(cartItem.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID: " + cartItem.getProduct().getId()));

        // 3. Vérifier le stock
        if (product.getStock() < cartItem.getQuantite()) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        // 4. Vérifier si l'article existe déjà dans le panier
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItemOpt.isPresent()) {
            // Mettre à jour la quantité
            CartItem existingItem = existingItemOpt.get();
            int nouvelleQuantite = existingItem.getQuantite() + cartItem.getQuantite();

            existingItem.setQuantite(nouvelleQuantite);
            product.setStock(product.getStock() - cartItem.getQuantite());
            productRepository.save(product);

            recalculerTotalPanier(cart);
            cartRepository.save(cart);
            return cartItemRepository.save(existingItem);
        } else {
            // Créer un nouvel item
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantite(cartItem.getQuantite());
            newItem.setPrixUnitaire(product.getPrix());

            product.setStock(product.getStock() - cartItem.getQuantite());
            productRepository.save(product);

            cart.getItems().add(newItem);
            recalculerTotalPanier(cart);

            cartRepository.save(cart);
            return cartItemRepository.save(newItem);
        }
    }

    @Override
    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé pour l'utilisateur ID: " + userId));
    }

    @Override
    public void removeItemFromCart(Long cartId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé"));

        if (!item.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Cet item n'appartient pas au panier spécifié");
        }

        // Restaurer le stock
        Product product = item.getProduct();
        product.setStock(product.getStock() + item.getQuantite());
        productRepository.save(product);

        cartItemRepository.delete(item);

        // Recalculer le total du panier
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé"));
        recalculerTotalPanier(cart);
        cartRepository.save(cart);
    }

    @Override
    public void clearUserCart(Long userId) {
        Cart cart = getCartByUserId(userId);

        // Restaurer le stock pour tous les items
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantite());
            productRepository.save(product);
        }

        cartItemRepository.deleteAllByCartId(cart.getId());
        cart.getItems().clear();
        cart.setTotal(0.0);
        cartRepository.save(cart);
    }

    @Override
    public CartItem updateCartItemQuantity(Long cartId, Long itemId, int quantity) {
        if (quantity <= 0) {
            removeItemFromCart(cartId, itemId);
            return null;
        }

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé"));

        if (!item.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Cet item n'appartient pas au panier spécifié");
        }

        Product product = item.getProduct();
        int ancienneQuantite = item.getQuantite();
        int difference = quantity - ancienneQuantite;

        // Vérifier le stock si on augmente la quantité
        if (difference > 0 && product.getStock() < difference) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        // Ajuster le stock
        product.setStock(product.getStock() - difference);
        productRepository.save(product);

        item.setQuantite(quantity);
        CartItem updatedItem = cartItemRepository.save(item);

        // Recalculer le total du panier
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé"));
        recalculerTotalPanier(cart);
        cartRepository.save(cart);

        return updatedItem;
    }

    @Override
    public double calculateCartTotal(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé"));
        return cart.getTotal();
    }

    @Override
    public Cart findOrCreateCartForUser(Long userId) {
        // Chercher un panier existant pour cet utilisateur
        Optional<Cart> existingCart = cartRepository.findByUserId(userId);

        if (existingCart.isPresent()) {
            return existingCart.get();
        } else {
            // Créer un nouveau panier
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

            Cart newCart = new Cart();
            newCart.setUser(user);
            newCart.setTotal(0.0);

            return cartRepository.save(newCart);
        }
    }

    // Méthode pour recalculer le total du panier
    private void recalculerTotalPanier(Cart cart) {
        double total = cart.getItems().stream()
                .mapToDouble(item -> item.getQuantite() * item.getPrixUnitaire())
                .sum();
        cart.setTotal(total);
    }
}