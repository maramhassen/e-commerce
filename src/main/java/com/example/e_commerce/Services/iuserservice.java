package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.user;

import java.util.List;
import java.util.Optional;

public interface iuserservice {
    user createUser(user user);

    user updateUser(Long id, user user);

    user getUserById(Long id);

    List<user> getAllUsers();

    void deleteUser(Long id);
    Optional<user> getUserByEmail(String email);

}
