package com.example.e_commerce.repository;

import com.example.e_commerce.entities.order;
import com.example.e_commerce.entities.orderstatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface orderrepository extends JpaRepository<order, Long> {
    List<order> findByUserId(Long userId);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId ORDER BY o.dateCommande DESC")
    List<order> findByUserIdOrderByDateCommandeDesc(@Param("userId") Long userId);

    Optional<order> findBySourceCartId(Long cartId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.sourceCart.id = :cartId")
    Long countBySourceCartId(@Param("cartId") Long cartId);

    // ========== NOUVELLES MÉTHODES POUR L'ADMIN ==========

    // Rechercher des commandes par statut
    List<order> findByStatut(orderstatut statut);

    // Rechercher des commandes par email client
    @Query("SELECT o FROM Order o WHERE o.user.email LIKE %:email% ORDER BY o.dateCommande DESC")
    List<order> findByUserEmailContaining(@Param("email") String email);

    // Rechercher des commandes par numéro (ID)
    @Query("SELECT o FROM Order o WHERE CAST(o.id AS string) LIKE %:orderId%")
    List<order> findByOrderIdContaining(@Param("orderId") String orderId);

    // Statistiques pour l'admin
    @Query("SELECT COUNT(o) FROM Order o")
    Long getTotalOrdersCount();

    @Query("SELECT SUM(o.total) FROM Order o")
    Double getTotalRevenue();

    @Query("SELECT o.statut, COUNT(o) FROM Order o GROUP BY o.statut")
    List<Object[]> getOrdersCountByStatus();

    // Commandes récentes (limit 10)
    @Query("SELECT o FROM Order o ORDER BY o.dateCommande DESC")
    List<order> findTop10ByOrderByDateCommandeDesc();
}