package com.example.e_commerce.repository;

import com.example.e_commerce.entities.CartItem;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface cartitemrepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    List<CartItem> findByCartId(Long cartId);
    @Transactional
    @Modifying
    void deleteAllByCartId(Long cartId);

    @Query("SELECT SUM(ci.prixUnitaire * ci.quantite) FROM CartItem ci WHERE ci.cart.id = :cartId")
    Double calculateCartTotal(@Param("cartId") Long cartId);

    Double calculatuserRepositoryecartTotal(Long cartId);

    Optional<CartItem> findBycartIdAndProductId(Long id, Long id1);
}