package com.example.e_commerce.Repository;
import com.example.e_commerce.Entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product,Long> {

    List<Product> findByActifTrue();

    // Trouve tous les produits désactivés
    List<Product> findByActifFalse();


}
