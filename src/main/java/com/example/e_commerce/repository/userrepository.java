package com.example.e_commerce.repository;
import com.example.e_commerce.entities.user;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface userrepository extends JpaRepository<user,Long> {
    Optional<user> findByEmail(String email);
}
