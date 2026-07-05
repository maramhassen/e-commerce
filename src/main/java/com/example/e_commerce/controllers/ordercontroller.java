package com.example.e_commerce.controllers;

import com.example.e_commerce.entities.order;
import com.example.e_commerce.entities.orderstatut;
import com.example.e_commerce.services.iorderservice;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
//@CrossOrigin(origins = "*", allowCredentials = "true")
//@CrossOrigin(allowCredentials = "true")
public class ordercontroller {
    private final iorderservice orderService;

    public ordercontroller(iorderservice orderService) {
        this.orderService = orderService;
    }

    // ==================== CRÉER UNE COMMANDE ====================
    @PostMapping("/create/{userId}")
    public ResponseEntity<?> createOrder(@PathVariable Long userId) {
        System.out.println("\n========== CONTROLLER: /api/orders/create/" + userId + " ==========");
        System.out.println("📨 REQUÊTE REÇUE POUR CRÉER UNE COMMANDE");
        System.out.println("Timestamp: " + new Date());
        System.out.println("Headers: " + "Content-Type: application/json");

        try {
            // Validation de l'ID
            if (userId == null || userId <= 0) {
                System.err.println("❌ ID utilisateur invalide: " + userId);
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("ID utilisateur invalide: " + userId);
            }

            System.out.println("🔄 Appel du service pour créer la commande...");
            order order = orderService.createOrderFromCart(userId);

            System.out.println("✅ SUCCÈS - Commande créée avec ID: " + order.getId());
            System.out.println("   Total: " + order.getTotal() + " DT");
            System.out.println("   Statut: " + order.getStatut());
            System.out.println("   Panier source ID: " +
                    (order.getSourceCart() != null ? order.getSourceCart().getId() : "null"));
            System.out.println("   Nombre d'articles: " +
                    (order.getItems() != null ? order.getItems().size() : 0));

            return ResponseEntity.ok(order);

        } catch (RuntimeException e) {
            System.err.println("❌ ERREUR dans le controller: " + e.getMessage());
            e.printStackTrace();

            String errorMessage = e.getMessage();
            if (errorMessage.contains("panier vide")) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Erreur: Le panier est vide");
            } else if (errorMessage.contains("non trouvé")) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("Erreur: " + errorMessage);
            } else {
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors de la création de la commande: " + errorMessage);
            }
        } catch (Exception e) {
            System.err.println("❌ ERREUR INATTENDUE: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur inattendue: " + e.getMessage());
        }
    }

    // ==================== RÉCUPÉRER UNE COMMANDE PAR ID ====================
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        System.out.println("📨 Récupération commande ID: " + id);

        try {
            order order = orderService.getOrderById(id);
            System.out.println("✅ Commande trouvée: ID=" + order.getId());
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            System.err.println("❌ Commande non trouvée: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Commande non trouvée avec ID: " + id);
        }
    }

    // ==================== RÉCUPÉRER LES COMMANDES D'UN UTILISATEUR ====================
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getOrdersByUser(@PathVariable Long userId) {
        System.out.println("📨 Récupération des commandes pour l'utilisateur: " + userId);

        try {
            List<order> orders = orderService.getOrdersByUser(userId);
            System.out.println("✅ " + orders.size() + " commandes trouvées pour l'utilisateur " + userId);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Erreur: " + e.getMessage());
        }
    }

    // ==================== RÉCUPÉRER TOUTES LES COMMANDES (ADMIN) ====================
    @GetMapping
    public ResponseEntity<List<order>> getAllOrders() {
        System.out.println("📨 Récupération de toutes les commandes");
        List<order> orders = orderService.getAllOrders();
        System.out.println("✅ " + orders.size() + " commandes trouvées");
        return ResponseEntity.ok(orders);
    }

    // ==================== METTRE À JOUR LE STATUT D'UNE COMMANDE ====================
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam orderstatut statut) {

        System.out.println("📨 Mise à jour statut commande " + orderId + " -> " + statut);

        try {
            order order = orderService.updateOrderStatus(orderId, statut);
            System.out.println("✅ Statut mis à jour pour la commande " + orderId);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Erreur: " + e.getMessage());
        }
    }

    // ==================== SUPPRIMER UNE COMMANDE ====================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        System.out.println("📨 Suppression commande ID: " + id);

        try {
            orderService.deleteOrder(id);
            System.out.println("✅ Commande " + id + " supprimée avec succès");
            return ResponseEntity.ok("Commande supprimée avec succès");
        } catch (RuntimeException e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Erreur: " + e.getMessage());
        }
    }

    // ==================== RÉCUPÉRER UNE COMMANDE PAR ID DE PANIER ====================
    @GetMapping("/cart/{cartId}")
    public ResponseEntity<?> getOrderByCartId(@PathVariable Long cartId) {
        System.out.println("📨 Récupération commande pour panier ID: " + cartId);

        try {
            order order = orderService.getOrderByCartId(cartId);
            System.out.println("✅ Commande trouvée: " + order.getId());
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            System.err.println("❌ " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Aucune commande trouvée pour le panier ID: " + cartId);
        }
    }

    // ==================== ENDPOINT DE TEST ====================
    @GetMapping("/test/{userId}")
    public ResponseEntity<String> testCreateOrder(@PathVariable Long userId) {
        System.out.println("🧪 TEST: Création commande pour userId: " + userId);

        try {
            order order = orderService.createOrderFromCart(userId);
            return ResponseEntity.ok("✅ TEST RÉUSSI! Commande créée avec ID: " + order.getId());
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("❌ TEST ÉCHOUÉ: " + e.getMessage());
        }
    }
}