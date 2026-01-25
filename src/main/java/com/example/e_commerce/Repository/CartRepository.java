package com.example.e_commerce.Repository;
import com.example.e_commerce.Entities.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart,Long> {
}
