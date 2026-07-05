package com.example.e_commerce.Repository;
import com.example.e_commerce.Entities.category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface categoryrepository extends JpaRepository<category,Long> {
}
