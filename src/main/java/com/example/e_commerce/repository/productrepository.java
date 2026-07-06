package com.example.e_commerce.repository;
import com.example.e_commerce.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface productrepository extends JpaRepository<Product,Long> {

    List<Product> findByActifTrue();

    // Trouve tous les produits désactivés
    List<Product> findByActifFalse();


}
