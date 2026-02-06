package com.example.e_commerce.Repository;

import com.example.e_commerce.Entities.CartItem;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    @Transactional
    @Modifying
    void deleteAllByCartId(Long cartId);

    // Optionnel : pour calculer le total
    @Query("SELECT SUM(ci.prixUnitaire * ci.quantite) FROM CartItem ci WHERE ci.cart.id = :cartId")
    Double calculateCartTotal(@Param("cartId") Long cartId);
}
