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
        recalculerTotalPanier(cart);

        cartRepository.save(cart);
        CartItem savedItem = cartItemRepository.save(cartItem);

        System.out.println("✅ Item ajouté avec succès, ID: " + savedItem.getId());
        return savedItem;
    }

    @Override
    @Transactional
    public CartItem addProductToCart(Long cartId, Long productId, int quantity) {
        System.out.println("\n========== DÉBUT addProductToCart ==========");
        System.out.println("CartId: " + cartId + ", ProductId: " + productId + ", Quantity: " + quantity);

        // 1. Récupérer le panier avec tous ses items
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier introuvable avec id: " + cartId));

        // FORCER le chargement des items
        System.out.println("Panier trouvé. Nombre d'items AVANT chargement: " + cart.getItems().size());
        cart.getItems().size(); // Force l'initialisation de la collection

        // Afficher tous les items existants
        System.out.println("Items existants dans le panier:");
        for (CartItem item : cart.getItems()) {
            System.out.println("   - Item ID: " + item.getId() +
                    ", Product ID: " + item.getProduct().getId() +
                    ", Quantité: " + item.getQuantite());
        }

        // 2. Récupérer le produit
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec id: " + productId));
        System.out.println("Produit trouvé: " + product.getNom() + ", Stock: " + product.getStock());

        // 3. RECHERCHER L'ITEM EXISTANT - MÉTHODE ROBUSTE
        CartItem existingItem = null;
        for (CartItem item : cart.getItems()) {
            if (item.getProduct().getId().equals(productId)) {
                existingItem = item;
                System.out.println("👉 ITEM EXISTANT TROUVÉ! ID: " + item.getId());
                break;
            }
        }

        // 4. Si aucun item trouvé dans la collection, chercher dans le repository
        if (existingItem == null) {
            Optional<CartItem> itemOpt = cartItemRepository.findByCartIdAndProductId(cartId, productId);
            if (itemOpt.isPresent()) {
                existingItem = itemOpt.get();
                System.out.println("👉 ITEM EXISTANT TROUVÉ VIA REPOSITORY! ID: " + existingItem.getId());
            }
        }

        if (existingItem != null) {
            // Mettre à jour la quantité
            System.out.println("   Ancienne quantité: " + existingItem.getQuantite());

            int nouvelleQuantite = existingItem.getQuantite() + quantity;
            System.out.println("   Nouvelle quantité: " + nouvelleQuantite);

            // Vérifier le stock
            if (product.getStock() < nouvelleQuantite) {
                throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
            }

            // Mettre à jour
            existingItem.setQuantite(nouvelleQuantite);
            product.setStock(product.getStock() - quantity);
            productRepository.save(product);

            // Sauvegarder
            CartItem saved = cartItemRepository.save(existingItem);

            // Recalculer le total
            recalculerTotalPanier(cart);
            cartRepository.save(cart);

            System.out.println("✅ MISE À JOUR EFFECTUÉE - Item ID: " + saved.getId());
            System.out.println("   Nouvelle quantité totale: " + saved.getQuantite());
            System.out.println("========== FIN addProductToCart ==========\n");
            return saved;

        } else {
            // Créer un nouvel item
            System.out.println("🆕 NOUVEL ITEM - Création");

            // Vérifier le stock
            if (product.getStock() < quantity) {
                throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
            }

            CartItem newItem = new CartItem();
            newItem.setQuantite(quantity);
            newItem.setPrixUnitaire(product.getPrix());
            newItem.setProduct(product);
            newItem.setCart(cart);

            // Mettre à jour le stock
            product.setStock(product.getStock() - quantity);
            productRepository.save(product);

            // Sauvegarder
            CartItem saved = cartItemRepository.save(newItem);

            // Ajouter au panier et recalculer
            cart.getItems().add(saved);
            recalculerTotalPanier(cart);
            cartRepository.save(cart);

            System.out.println("✅ NOUVEL ITEM CRÉÉ - ID: " + saved.getId());
            System.out.println("========== FIN addProductToCart ==========\n");
            return saved;
        }
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

            recalculerTotalPanier(cart);
            cartRepository.save(cart);
            return cartItemRepository.save(existingItem);
        } else {
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
    public void clearUserCart(Long userId) {
        System.out.println("🧹 clearUserCart - userId: " + userId);

        Cart cart = getCartByUserId(userId);

        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantite());
            productRepository.save(product);
        }

        cartItemRepository.deleteAllByCartId(cart.getId());
        cart.getItems().clear();
        cart.setTotal(0.0);
        cartRepository.save(cart);

        System.out.println("✅ Panier vidé avec succès");
    }

    @Override
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
        return updatedItem;
    }

    @Override
    public double calculateCartTotal(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé avec id: " + cartId));
        return cart.getTotal();
    }

    @Override
    public Cart findOrCreateCartForUser(Long userId) {
        System.out.println("🔄 findOrCreateCartForUser - UserId: " + userId);

        Optional<Cart> existingCart = cartRepository.findByUserId(userId);

        if (existingCart.isPresent()) {
            System.out.println("   ✅ Panier existant trouvé: ID=" + existingCart.get().getId());
            return existingCart.get();
        } else {
            System.out.println("   🆕 Création nouveau panier pour user: " + userId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

            Cart newCart = new Cart();
            newCart.setUser(user);
            newCart.setTotal(0.0);
            newCart.setDateCreation(new Date());

            Cart saved = cartRepository.save(newCart);
            System.out.println("   ✅ Nouveau panier créé: ID=" + saved.getId());
            return saved;
        }
    }

    private void recalculerTotalPanier(Cart cart) {
        // Recharger les items depuis la base pour être sûr
        List<CartItem> freshItems = cartItemRepository.findByCartId(cart.getId());

        double total = freshItems.stream()
                .mapToDouble(item -> item.getQuantite() * item.getPrixUnitaire())
                .sum();

        System.out.println("💰 Recalcul total panier: " + total + " DT");
        cart.setTotal(total);
    }
}