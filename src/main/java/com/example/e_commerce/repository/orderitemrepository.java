package com.example.e_commerce.repository;

import com.example.e_commerce.entities.orderitem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface orderitemrepository extends JpaRepository<orderitem,Long> {
}
