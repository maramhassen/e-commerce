package com.example.e_commerce.repository;

import com.example.e_commerce.entities.Cart;
import com.example.e_commerce.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUser(User user);

    @Query("SELECT c FROM Cart c WHERE c.user.id = :userId")
    Optional<Cart> findByUserId(@Param("userId") Long userId);

    // 1. Trouver les paniers avec des articles (non vides) pour un utilisateur
    @Query("SELECT c FROM Cart c WHERE c.user.id = :userId AND SIZE(c.items) > 0 ORDER BY c.dateCreation DESC")
    List<Cart> findCartsWithItemsByUserId(@Param("userId") Long userId);

    // 2. Trouver tous les paniers d'un utilisateur triés par date de création (du plus récent au plus ancien)
    @Query("SELECT c FROM Cart c WHERE c.user.id = :userId ORDER BY c.dateCreation DESC")
    List<Cart> findAllByUserIdOrderByDateCreationDesc(@Param("userId") Long userId);

    // 3. Trouver le dernier panier créé par l'utilisateur (avec ou sans articles)
    @Query("SELECT c FROM Cart c WHERE c.user.id = :userId ORDER BY c.dateCreation DESC")
    List<Cart> findLatestCartByUserId(@Param("userId") Long userId);

    // 4. Compter le nombre de paniers pour un utilisateur
    @Query("SELECT COUNT(c) FROM Cart c WHERE c.user.id = :userId")
    Long countByUserId(@Param("userId") Long userId);
}