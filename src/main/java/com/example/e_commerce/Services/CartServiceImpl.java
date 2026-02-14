package com.example.e_commerce.Services;

import com.example.e_commerce.DTO.CartItemRequest;
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

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartServiceImpl implements ICartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Cart createCart(Cart cart) {
        if (cart.getDateCreation() == null) {
            cart.setDateCreation(new Date());
        }
        return cartRepository.save(cart);
    }

    @Override
    public Cart updateCart(Long id, Cart cart) {
        Cart existingCart = cartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + id));

        existingCart.setTotal(cart.getTotal());
        existingCart.setUser(cart.getUser());
        existingCart.setItems(cart.getItems());

        return cartRepository.save(existingCart);
    }

    @Override
    public Cart getCartById(Long id) {
        return cartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + id));
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
        System.out.println("🔧 addItemToCart - cartId: " + cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier introuvable avec id: " + cartId));

        if (cartItem.getProduct() == null || cartItem.getProduct().getId() == null) {
            throw new RuntimeException("Produit invalide");
        }

        Product product = productRepository.findById(cartItem.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID: " + cartItem.getProduct().getId()));

        if (product.getStock() < cartItem.getQuantite()) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        product.setStock(product.getStock() - cartItem.getQuantite());
        productRepository.save(product);

        cartItem.setCart(cart);
        cartItem.setProduct(product);
        cartItem.setPrixUnitaire(product.getPrix());

        cart.getItems().add(cartItem);

        CartItem savedItem = cartItemRepository.save(cartItem);

        // Recalculer le total après ajout
        recalculerTotalPanier(cart);
        cartRepository.save(cart);

        System.out.println("✅ Item ajouté avec succès, ID: " + savedItem.getId());
        System.out.println("💰 Nouveau total du panier: " + cart.getTotal() + " DT");
        return savedItem;
    }

    @Override
    @Transactional
    public CartItem addProductToCart(Long cartId, Long productId, int quantity) {
        System.out.println("\n========== DÉBUT addProductToCart ==========");
        System.out.println("CartId: " + cartId + ", ProductId: " + productId + ", Quantity: " + quantity);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier introuvable avec id: " + cartId));

        cart.getItems().size();

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec id: " + productId));
        System.out.println("Produit trouvé: " + product.getNom() + ", Stock: " + product.getStock());

        if (product.getStock() < quantity) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cartId, productId);

        CartItem cartItem;
        if (existingItemOpt.isPresent()) {
            cartItem = existingItemOpt.get();
            int nouvelleQuantite = cartItem.getQuantite() + quantity;
            if (product.getStock() < nouvelleQuantite) {
                throw new RuntimeException("Stock insuffisant pour la quantité totale. Disponible: " + product.getStock());
            }
            cartItem.setQuantite(nouvelleQuantite);
            System.out.println("✅ Mise à jour quantité: " + nouvelleQuantite);
        } else {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantite(quantity);
            cartItem.setPrixUnitaire(product.getPrix());
            cart.getItems().add(cartItem);
            System.out.println("🆕 Nouvel item créé");
        }

        product.setStock(product.getStock() - quantity);
        productRepository.save(product);

        CartItem savedItem = cartItemRepository.save(cartItem);

        // Recalculer le total après ajout/mise à jour
        recalculerTotalPanier(cart);
        cartRepository.save(cart);

        System.out.println("✅ Item sauvegardé, ID: " + savedItem.getId());
        System.out.println("💰 Nouveau total du panier: " + cart.getTotal() + " DT");
        System.out.println("========== FIN addProductToCart ==========\n");
        return savedItem;
    }

    @Override
    public CartItem addItemToUserCart(Long userId, CartItem cartItem) {
        System.out.println("🔧 addItemToUserCart - userId: " + userId);

        Cart cart = findOrCreateCartForUser(userId);

        if (cartItem.getProduct() == null || cartItem.getProduct().getId() == null) {
            throw new RuntimeException("Produit invalide");
        }

        Product product = productRepository.findById(cartItem.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID: " + cartItem.getProduct().getId()));

        if (product.getStock() < cartItem.getQuantite()) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int nouvelleQuantite = existingItem.getQuantite() + cartItem.getQuantite();

            existingItem.setQuantite(nouvelleQuantite);
            product.setStock(product.getStock() - cartItem.getQuantite());
            productRepository.save(product);

            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantite(cartItem.getQuantite());
            newItem.setPrixUnitaire(product.getPrix());

            product.setStock(product.getStock() - cartItem.getQuantite());
            productRepository.save(product);

            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        // Recalculer le total après modification
        recalculerTotalPanier(cart);
        cartRepository.save(cart);

        return cartItemRepository.save(cartItem);
    }

    @Override
    public CartItem addItemToUserCart(Long userId, CartItemRequest request) {
        System.out.println("🔧 addItemToUserCart avec request - userId: " + userId);
        Cart cart = findOrCreateCartForUser(userId);
        return addProductToCart(cart.getId(), request.getProductId(), request.getQuantite());
    }

    @Override
    public Cart getCartByUserId(Long userId) {
        System.out.println("🔍 getCartByUserId - userId: " + userId);
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé pour l'utilisateur ID: " + userId));
    }

    @Override
    @Transactional
    public void removeItemFromCart(Long cartId, Long itemId) {
        System.out.println("🗑️ removeItemFromCart - cartId: " + cartId + ", itemId: " + itemId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé avec id: " + itemId));

        if (!item.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Cet item n'appartient pas au panier spécifié");
        }

        Product product = item.getProduct();
        product.setStock(product.getStock() + item.getQuantite());
        productRepository.save(product);

        cartItemRepository.delete(item);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé avec id: " + cartId));
        recalculerTotalPanier(cart);
        cartRepository.save(cart);

        System.out.println("✅ Item supprimé avec succès");
    }

    @Override
    @Transactional
    public void clearUserCart(Long userId) {
        System.out.println("🧹 clearUserCart - userId: " + userId);

        Cart cart = getCartByUserId(userId);

        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantite());
            productRepository.save(product);
            System.out.println("📦 Stock restitué: +" + item.getQuantite() + " pour " + product.getNom());
        }

        cartItemRepository.deleteAllByCartId(cart.getId());

        cart.getItems().clear();
        cart.setTotal(0.0);

        cartRepository.save(cart);

        System.out.println("✅ Panier vidé avec succès");
        System.out.println("💰 Total du panier: " + cart.getTotal() + " DT");
    }

    @Override
    @Transactional
    public CartItem updateCartItemQuantity(Long cartId, Long itemId, int quantity) {
        System.out.println("📝 updateCartItemQuantity - cartId: " + cartId + ", itemId: " + itemId + ", quantity: " + quantity);

        if (quantity <= 0) {
            removeItemFromCart(cartId, itemId);
            return null;
        }

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé avec id: " + itemId));

        if (!item.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Cet item n'appartient pas au panier spécifié");
        }

        Product product = item.getProduct();
        int ancienneQuantite = item.getQuantite();
        int difference = quantity - ancienneQuantite;

        if (difference > 0 && product.getStock() < difference) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        product.setStock(product.getStock() - difference);
        productRepository.save(product);

        item.setQuantite(quantity);
        CartItem updatedItem = cartItemRepository.save(item);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé avec id: " + cartId));

        recalculerTotalPanier(cart);
        cartRepository.save(cart);

        System.out.println("✅ Quantité mise à jour avec succès");
        System.out.println("💰 Nouveau total du panier: " + cart.getTotal() + " DT");
        return updatedItem;
    }

    @Override
    public double calculateCartTotal(Long cartId) {
        Double total = cartItemRepository.calculateCartTotal(cartId);
        return total != null ? total : 0.0;
    }

    // ===== MÉTHODE MODIFIÉE - VERSION CORRIGÉE =====
    @Override
    public Cart findOrCreateCartForUser(Long userId) {
        System.out.println("\n========== findOrCreateCartForUser ==========");
        System.out.println("🔄 RECHERCHE DU BON PANIER POUR USER: " + userId);

        // ÉTAPE 1: Chercher d'abord les paniers qui ont des articles (non vides)
        List<Cart> cartsWithItems = cartRepository.findCartsWithItemsByUserId(userId);
        if (!cartsWithItems.isEmpty()) {
            Cart cart = cartsWithItems.get(0); // Prendre le plus récent avec articles
            System.out.println("✅ Panier AVEC articles trouvé: ID=" + cart.getId());
            System.out.println("📦 Nombre d'articles: " + (cart.getItems() != null ? cart.getItems().size() : 0));

            // Afficher les articles
            if (cart.getItems() != null) {
                for (CartItem item : cart.getItems()) {
                    System.out.println("   - " + item.getProduct().getNom() +
                            " x" + item.getQuantite() +
                            " = " + (item.getQuantite() * item.getPrixUnitaire()) + " DT");
                }
            }

            // Recalculer le total pour être sûr
            recalculerTotalPanier(cart);
            cartRepository.save(cart);
            return cart;
        }

        // ÉTAPE 2: Si aucun panier avec articles, prendre le dernier panier créé
        List<Cart> allCarts = cartRepository.findAllByUserIdOrderByDateCreationDesc(userId);
        if (!allCarts.isEmpty()) {
            Cart cart = allCarts.get(0);
            System.out.println("✅ Dernier panier trouvé (peut-être vide): ID=" + cart.getId());
            System.out.println("📦 Nombre d'articles: " + (cart.getItems() != null ? cart.getItems().size() : 0));
            return cart;
        }

        // ÉTAPE 3: Créer un nouveau panier
        System.out.println("🆕 Aucun panier trouvé - Création nouveau panier pour user: " + userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        Cart newCart = new Cart();
        newCart.setUser(user);
        newCart.setTotal(0.0);
        newCart.setDateCreation(new Date());

        Cart saved = cartRepository.save(newCart);
        System.out.println("✅ Nouveau panier créé: ID=" + saved.getId());
        System.out.println("========== FIN findOrCreateCartForUser ==========\n");
        return saved;
    }

    // Méthode privée pour recalculer le total du panier
    private void recalculerTotalPanier(Cart cart) {
        Double total = cartItemRepository.calculateCartTotal(cart.getId());
        cart.setTotal(total != null ? total : 0.0);
        System.out.println("💰 Recalcul total panier ID " + cart.getId() + ": " + cart.getTotal() + " DT");
    }
}