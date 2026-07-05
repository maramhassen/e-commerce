package com.example.e_commerce.Repository;

import com.example.e_commerce.Entities.orderitem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface orderitemrepository extends JpaRepository<orderitem,Long> {
}
