package com.example.e_commerce.Repository;
import com.example.e_commerce.Entities.Cart;
import com.example.e_commerce.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart,Long> {
    Optional<Cart> findByUser(User user);
}
