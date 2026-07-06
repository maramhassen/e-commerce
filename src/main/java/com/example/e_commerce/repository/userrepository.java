package com.example.e_commerce.repository;
import com.example.e_commerce.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface userrepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
}
