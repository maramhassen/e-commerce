package com.example.e_commerce.Repository;
import com.example.e_commerce.Entities.user;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface userrepository extends JpaRepository<user,Long> {
    Optional<user> findByEmail(String email);
}
