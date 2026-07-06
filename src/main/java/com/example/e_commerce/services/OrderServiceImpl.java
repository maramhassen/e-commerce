package com.example.e_commerce.services;

import com.example.e_commerce.entities.*;
import com.example.e_commerce.repository.CartRepository;
import com.example.e_commerce.repository.OrderRepository;
import com.example.e_commerce.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@Transactional
public class OrderServiceImpl implements IOrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartRepository cartRepository,
                            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
    }

    // ===== MÉTHODE MODIFIÉE - VERSION CORRIGÉE =====
    @Override
    @Transactional
    public Order createOrderFromCart(Long userId) {
        System.out.println("\n========== CRÉATION COMMANDE POUR USER: " + userId + " ==========");

        try {
            // 1. Récupérer l'utilisateur
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));
            System.out.println("✅ Utilisateur trouvé: " + user.getEmail());

            // 2. Récupérer le BON panier (celui avec des articles et le plus récent)
            List<Cart> cartsWithItems = cartRepository.findCartsWithItemsByUserId(userId);

            if (cartsWithItems.isEmpty()) {
                throw new RuntimeException("Aucun panier avec articles trouvé pour l'utilisateur " + userId);
            }

            // Prendre le premier panier de la liste (le plus récent avec articles)
            Cart cart = cartsWithItems.get(0);
            System.out.println("✅ Panier sélectionné pour la commande: ID=" + cart.getId());

            // Forcer le chargement de tous les items
            if (cart.getItems() != null) {
                cart.getItems().size(); // Force l'initialisation
            }

            System.out.println("📦 Articles dans le panier (avant création commande):");
            double panierTotal = 0;
            if (cart.getItems() != null) {
                for (CartItem item : cart.getItems()) {
                    double ligneTotal = item.getQuantite() * item.getPrixUnitaire();
                    panierTotal += ligneTotal;
                    System.out.println("   - " + item.getProduct().getNom() +
                            " x" + item.getQuantite() +
                            " @ " + item.getPrixUnitaire() + " DT" +
                            " = " + ligneTotal + " DT");
                }
            }
            System.out.println("💰 Total du panier: " + panierTotal + " DT");

            // 3. Vérifier que le panier a des articles
            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new RuntimeException("Impossible de créer une commande : panier vide");
            }

            // 4. Vérifier que ce panier n'a pas déjà une commande associée
            if (cart.getOrder() != null) {
                throw new RuntimeException("Ce panier a déjà une commande associée: " + cart.getOrder().getId());
            }

            // 5. Créer la commande avec le lien vers le panier
            Order order = new Order();
            order.setUser(user);
            order.setDateCommande(new Date());
            order.setStatut(OrderStatut.EN_ATTENTE);
            order.setSourceCart(cart); // Lien important

            // 6. Créer les OrderItems à partir de TOUS les CartItems
            List<OrderItem> orderItems = new ArrayList<>();
            double totalCommande = 0;

            for (CartItem cartItem : cart.getItems()) {
                OrderItem orderItem = new OrderItem();
                orderItem.setProduct(cartItem.getProduct());
                orderItem.setQuantite(cartItem.getQuantite());
                orderItem.setPrix(cartItem.getPrixUnitaire()); // Prix au moment de l'achat
                orderItem.setOrder(order);

                orderItems.add(orderItem);
                totalCommande += cartItem.getQuantite() * cartItem.getPrixUnitaire();

                System.out.println("   ✅ Transféré vers commande: " + cartItem.getProduct().getNom() +
                        " (x" + cartItem.getQuantite() + ") = " +
                        (cartItem.getQuantite() * cartItem.getPrixUnitaire()) + " DT");
            }

            order.setItems(orderItems);
            order.setTotal(totalCommande);

            // 7. Sauvegarder la commande
            Order savedOrder = orderRepository.save(order);
            System.out.println("✅ Commande sauvegardée: ID=" + savedOrder.getId());
            System.out.println("📦 Nombre d'articles dans la commande: " + savedOrder.getItems().size());
            System.out.println("💰 Total de la commande: " + savedOrder.getTotal() + " DT");

            // 8. Associer la commande au panier (mise à jour bidirectionnelle)
            cart.setOrder(savedOrder);
            cartRepository.save(cart);
            System.out.println("✅ Panier mis à jour avec la référence de la commande");

            // 9. Créer un NOUVEAU panier vide pour l'utilisateur
            Cart newCart = new Cart();
            newCart.setUser(user);
            newCart.setTotal(0.0);
            newCart.setDateCreation(new Date());
            cartRepository.save(newCart);
            System.out.println("🆕 Nouveau panier vide créé pour l'utilisateur: ID=" + newCart.getId());

            System.out.println("========== COMMANDE CRÉÉE AVEC SUCCÈS ==========\n");
            return savedOrder;

        } catch (Exception e) {
            System.err.println("❌ ERREUR lors de la création de la commande: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la création de la commande: " + e.getMessage());
        }
    }

    @Override
    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec ID: " + id));

        // Forcer le chargement des items
        if (order.getItems() != null) {
            order.getItems().size();
            System.out.println("📦 Commande " + id + " contient " + order.getItems().size() + " articles");
        }

        return order;
    }

    @Override
    public List<Order> getOrdersByUser(Long userId) {
        // Vérifier que l'utilisateur existe
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        List<Order> orders = orderRepository.findByUserIdOrderByDateCommandeDesc(userId);
        System.out.println("📦 " + orders.size() + " commandes trouvées pour l'utilisateur " + userId);

        // Forcer le chargement des items pour chaque commande
        for (Order order : orders) {
            if (order.getItems() != null) {
                order.getItems().size();
            }
        }

        return orders;
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Order updateOrderStatus(Long orderId, OrderStatut statut) {
        Order order = getOrderById(orderId);
        order.setStatut(statut);
        return orderRepository.save(order);
    }

    @Override
    public void deleteOrder(Long id) {
        Order order = getOrderById(id);

        // Mettre à jour le panier associé si nécessaire
        if (order.getSourceCart() != null) {
            Cart cart = order.getSourceCart();
            cart.setOrder(null);
            cartRepository.save(cart);
            System.out.println("✅ Lien avec le panier supprimé");
        }

        orderRepository.deleteById(id);
        System.out.println("✅ Commande " + id + " supprimée");
    }

    @Override
    public Order getOrderByCartId(Long cartId) {
        return orderRepository.findBySourceCartId(cartId)
                .orElseThrow(() -> new RuntimeException("Aucune commande trouvée pour le panier ID: " + cartId));
    }
}