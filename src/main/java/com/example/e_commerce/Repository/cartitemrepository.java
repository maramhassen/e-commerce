package com.example.e_commerce.Repository;

import com.example.e_commerce.Entities.cartitem;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface cartitemrepository extends JpaRepository<cartitem, Long> {

    Optional<cartitem> findByCartIdAndProductId(Long cartId, Long productId);

    List<cartitem> findByCartId(Long cartId);
    @Transactional
    @Modifying
    void deleteAllByCartId(Long cartId);

    @Query("SELECT SUM(ci.prixUnitaire * ci.quantite) FROM CartItem ci WHERE ci.cart.id = :cartId")
    Double calculateCartTotal(@Param("cartId") Long cartId);
}