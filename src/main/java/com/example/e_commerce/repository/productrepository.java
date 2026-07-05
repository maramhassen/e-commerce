package com.example.e_commerce.repository;
import com.example.e_commerce.entities.product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface productrepository extends JpaRepository<product,Long> {

    List<product> findByActifTrue();

    // Trouve tous les produits désactivés
    List<product> findByActifFalse();


}
