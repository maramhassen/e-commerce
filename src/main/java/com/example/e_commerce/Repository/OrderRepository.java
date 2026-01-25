package com.example.e_commerce.Repository;
import com.example.e_commerce.Entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order,Long> {
}
