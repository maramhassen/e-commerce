package com.example.e_commerce.Repository;
import com.example.e_commerce.Entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category,Long> {
}
