package com.example.e_commerce.repository;

import com.example.e_commerce.entities.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface orderitemrepository extends JpaRepository<OrderItem,Long> {
}
