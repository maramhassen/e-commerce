package com.example.e_commerce.repository;
import com.example.e_commerce.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface categoryrepository extends JpaRepository<Category,Long> {
}
