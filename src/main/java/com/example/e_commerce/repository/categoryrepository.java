package com.example.e_commerce.repository;
import com.example.e_commerce.entities.category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface categoryrepository extends JpaRepository<category,Long> {
}
