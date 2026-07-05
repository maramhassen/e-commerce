package com.example.e_commerce.services;

import com.example.e_commerce.dto.cartitemrequest;
import com.example.e_commerce.entities.cart;
import com.example.e_commerce.entities.cartitem;
import com.example.e_commerce.entities.product;
import com.example.e_commerce.entities.user;
import com.example.e_commerce.repository.cartitemrepository;
import com.example.e_commerce.repository.cartrepository;
import com.example.e_commerce.repository.productrepository;
import com.example.e_commerce.repository.userrepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public abstract class cartserviceimpl implements icartservice {
    private final cartrepository cartrepository;
    private final cartitemrepository cartitemrepository;
    private final productrepository productrepository;
    private final userrepository userrepository;

    public cartserviceimpl(cartrepository cartrepository,
                           cartitemrepository cartitemrepository,
                           productrepository productrepository,
                           userrepository userrepository) {
        this.cartrepository = cartrepository;
        this.cartitemrepository = cartitemrepository;
        this.productrepository = productrepository;
        this.userrepository = userrepository;
    }

    @Override
    public cart createcart(cart cart) {
        if (cart.getDateCreation() == null) {
            cart.setDateCreation(new Date());
        }
        return cartrepository.save(cart);
    }

    @Override
    public cart updatecart(Long id, cart cart) {
        cart existingcart = cartrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("cart not found with id: " + id));

        existingcart.setTotal(cart.getTotal());
        existingcart.setUser(cart.getUser());
        existingcart.setItems(cart.getItems());

        return cartrepository.save(existingcart);
    }

    @Override
    public cart getcartById(Long id) {
        return cartrepository.findById(id)
                .orElseThrow(() -> new RuntimeException("cart not found with id: " + id));
    }

    @Override
    public List<cart> getAllcarts() {
        return cartrepository.findAll();
    }

    @Override
    public void deletecart(Long id) {
        cartrepository.deleteById(id);
    }

    @Transactional
    @Override
    public cartitem addItemTocart(Long cartId, cartitem cartitem) {
        System.out.println("🔧 addItemTocart - cartId: " + cartId);

        cart cart = cartrepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier introuvable avec id: " + cartId));

        if (cartitem.getProduct() == null || cartitem.getProduct().getId() == null) {
            throw new RuntimeException("Produit invalide");
        }

        product product = productrepository.findById(cartitem.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID: " + cartitem.getProduct().getId()));

        if (product.getStock() < cartitem.getQuantite()) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        product.setStock(product.getStock() - cartitem.getQuantite());
        productrepository.save(product);

        cartitem.setCart(cart);
        cartitem.setProduct(product);
        cartitem.setPrixUnitaire(product.getPrix());

        cart.getItems().add(cartitem);

        cartitem savedItem = cartitemrepository.save(cartitem);

        // Recalculer le total après ajout
        recalculerTotalPanier(cart);
        cartrepository.save(cart);

        System.out.println("✅ Item ajouté avec succès, ID: " + savedItem.getId());
        System.out.println("💰 Nouveau total du panier: " + cart.getTotal() + " DT");
        return savedItem;
    }

    @Transactional
    @Override
    public cartitem addProductTocart(Long cartId, Long productId, int quantity) {
        System.out.println("\n========== DÉBUT addProductTocart ==========");
        System.out.println("cartId: " + cartId + ", ProductId: " + productId + ", Quantity: " + quantity);

        cart cart = cartrepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier introuvable avec id: " + cartId));

        cart.getItems().size();

        product product = productrepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec id: " + productId));
        System.out.println("Produit trouvé: " + product.getNom() + ", Stock: " + product.getStock());

        if (product.getStock() < quantity) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        Optional<cartitem> existingItemOpt = cartitemrepository.findBycartIdAndProductId(cartId, productId);

        cartitem cartitem;
        if (existingItemOpt.isPresent()) {
            cartitem = existingItemOpt.get();
            int nouvelleQuantite = cartitem.getQuantite() + quantity;
            if (product.getStock() < nouvelleQuantite) {
                throw new RuntimeException("Stock insuffisant pour la quantité totale. Disponible: " + product.getStock());
            }
            cartitem.setQuantite(nouvelleQuantite);
            System.out.println("✅ Mise à jour quantité: " + nouvelleQuantite);
        } else {
            cartitem = new cartitem();
            cartitem.setCart(cart);
            cartitem.setProduct(product);
            cartitem.setQuantite(quantity);
            cartitem.setPrixUnitaire(product.getPrix());
            cart.getItems().add(cartitem);
            System.out.println("🆕 Nouvel item créé");
        }

        product.setStock(product.getStock() - quantity);
        productrepository.save(product);

        cartitem savedItem = cartitemrepository.save(cartitem);

        // Recalculer le total après ajout/mise à jour
        recalculerTotalPanier(cart);
        cartrepository.save(cart);

        System.out.println("✅ Item sauvegardé, ID: " + savedItem.getId());
        System.out.println("💰 Nouveau total du panier: " + cart.getTotal() + " DT");
        System.out.println("========== FIN addProductTocart ==========\n");
        return savedItem;
    }

    @Override
    public cartitem addItemToUsercart(Long userId, cartitem cartitem) {
        System.out.println("🔧 addItemToUsercart - userId: " + userId);

        cart cart = findOrCreatecartForUser(userId);

        if (cartitem.getProduct() == null || cartitem.getProduct().getId() == null) {
            throw new RuntimeException("Produit invalide");
        }

        product product = productrepository.findById(cartitem.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable avec l'ID: " + cartitem.getProduct().getId()));

        if (product.getStock() < cartitem.getQuantite()) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        Optional<cartitem> existingItemOpt = cartitemrepository.findBycartIdAndProductId(cart.getId(), product.getId());

        if (existingItemOpt.isPresent()) {
            cartitem existingItem = existingItemOpt.get();
            int nouvelleQuantite = existingItem.getQuantite() + cartitem.getQuantite();

            existingItem.setQuantite(nouvelleQuantite);
            product.setStock(product.getStock() - cartitem.getQuantite());
            productrepository.save(product);

            cartitemrepository.save(existingItem);
        } else {
            cartitem newItem = new cartitem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantite(cartitem.getQuantite());
            newItem.setPrixUnitaire(product.getPrix());

            product.setStock(product.getStock() - cartitem.getQuantite());
            productrepository.save(product);

            cart.getItems().add(newItem);
            cartitemrepository.save(newItem);
        }

        // Recalculer le total après modification
        recalculerTotalPanier(cart);
        cartrepository.save(cart);

        return cartitemrepository.save(cartitem);
    }

    @Override
    public cartitem addItemToUsercart(Long userId, cartitemrequest request) {
        System.out.println("🔧 addItemToUsercart avec request - userId: " + userId);
        cart cart = findOrCreatecartForUser(userId);
        return addProductTocart(cart.getId(), request.getProductId(), request.getQuantite());
    }

    @Override
    public cart getcartByUserId(Long userId) {
        System.out.println("🔍 getcartByUserId - userId: " + userId);
        return cartrepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé pour l'utilisateur ID: " + userId));
    }

    @Transactional
    @Override
    public void removeItemFromcart(Long cartId, Long itemId) {
        System.out.println("🗑️ removeItemFromcart - cartId: " + cartId + ", itemId: " + itemId);

        cartitem item = cartitemrepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé avec id: " + itemId));

        if (!item.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Cet item n'appartient pas au panier spécifié");
        }

        product product = item.getProduct();
        product.setStock(product.getStock() + item.getQuantite());
        productrepository.save(product);

        cartitemrepository.delete(item);

        cart cart = cartrepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé avec id: " + cartId));
        recalculerTotalPanier(cart);
        cartrepository.save(cart);

        System.out.println("✅ Item supprimé avec succès");
    }

    @Transactional
    @Override
    public void clearUsercart(Long userId) {
        System.out.println("🧹 clearUsercart - userId: " + userId);

        cart cart = getcartByUserId(userId);

        for (cartitem item : cart.getItems()) {
            product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantite());
            productrepository.save(product);
            System.out.println("📦 Stock restitué: +" + item.getQuantite() + " pour " + product.getNom());
        }

        cartitemrepository.deleteAllByCartId(cart.getId());

        cart.getItems().clear();
        cart.setTotal(0.0);

        cartrepository.save(cart);

        System.out.println("✅ Panier vidé avec succès");
        System.out.println("💰 Total du panier: " + cart.getTotal() + " DT");
    }

    @Transactional
    @Override
    public cartitem updatecartitemQuantity(Long cartId, Long itemId, int quantity) {
        System.out.println("📝 updatecartitemQuantity - cartId: " + cartId + ", itemId: " + itemId + ", quantity: " + quantity);

        if (quantity <= 0) {
            removeItemFromcart(cartId, itemId);
            return null;
        }

        cartitem item = cartitemrepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé avec id: " + itemId));

        if (!item.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Cet item n'appartient pas au panier spécifié");
        }

        product product = item.getProduct();
        int ancienneQuantite = item.getQuantite();
        int difference = quantity - ancienneQuantite;

        if (difference > 0 && product.getStock() < difference) {
            throw new RuntimeException("Stock insuffisant. Disponible: " + product.getStock());
        }

        product.setStock(product.getStock() - difference);
        productrepository.save(product);

        item.setQuantite(quantity);
        cartitem updatedItem = cartitemrepository.save(item);

        cart cart = cartrepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé avec id: " + cartId));

        recalculerTotalPanier(cart);
        cartrepository.save(cart);

        System.out.println("✅ Quantité mise à jour avec succès");
        System.out.println("💰 Nouveau total du panier: " + cart.getTotal() + " DT");
        return updatedItem;
    }

    @Override
    public double calculatecartTotal(Long cartId) {
        Double total = cartitemrepository.calculatuserRepositoryecartTotal(cartId);
        return total != null ? total : 0.0;
    }


    @Override
    public cart findOrCreatecartForUser(Long userId) {
        System.out.println("\n========== findOrCreatecartForUser ==========");
        System.out.println("🔄 RECHERCHE DU BON PANIER POUR USER: " + userId);

        // ÉTAPE 1: Chercher d'abord les paniers qui ont des articles (non vides)
        List<cart> cartsWithItems = cartrepository.findcartsWithItemsByUserId(userId);
        if (!cartsWithItems.isEmpty()) {
            cart cart = cartsWithItems.get(0); // Prendre le plus récent avec articles
            System.out.println("✅ Panier AVEC articles trouvé: ID=" + cart.getId());
            System.out.println("📦 Nombre d'articles: " + (cart.getItems() != null ? cart.getItems().size() : 0));

            // Afficher les articles
            if (cart.getItems() != null) {
                for (cartitem item : cart.getItems()) {
                    System.out.println("   - " + item.getProduct().getNom() +
                            " x" + item.getQuantite() +
                            " = " + (item.getQuantite() * item.getPrixUnitaire()) + " DT");
                }
            }

            // Recalculer le total pour être sûr
            recalculerTotalPanier(cart);
            cartrepository.save(cart);
            return cart;
        }

        // ÉTAPE 2: Si aucun panier avec articles, prendre le dernier panier créé
        List<cart> allcarts = cartrepository.findAllByUserIdOrderByDateCreationDesc(userId);
        if (!allcarts.isEmpty()) {
            cart cart = allcarts.get(0);
            System.out.println("✅ Dernier panier trouvé (peut-être vide): ID=" + cart.getId());
            System.out.println("📦 Nombre d'articles: " + (cart.getItems() != null ? cart.getItems().size() : 0));
            return cart;
        }

        // ÉTAPE 3: Créer un nouveau panier
        System.out.println("🆕 Aucun panier trouvé - Création nouveau panier pour user: " + userId);
        user user = userrepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        cart newcart = new cart();
        newcart.setUser(user);
        newcart.setTotal(0.0);
        newcart.setDateCreation(new Date());

        cart saved = cartrepository.save(newcart);
        System.out.println("✅ Nouveau panier créé: ID=" + saved.getId());
        System.out.println("========== FIN findOrCreatecartForUser ==========\n");
        return saved;
    }

    // Méthode privée pour recalculer le total du panier
    private void recalculerTotalPanier(cart cart) {
        Double total = cartitemrepository.calculateCartTotal(cart.getId());
        cart.setTotal(total != null ? total : 0.0);
        System.out.println("💰 Recalcul total panier ID " + cart.getId() + ": " + cart.getTotal() + " DT");
    }
}