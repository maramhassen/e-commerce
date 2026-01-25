package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.User;

import java.util.List;
import java.util.Optional;

public interface IUserService {
    User createUser(User user);

    User updateUser(Long id, User user);

    User getUserById(Long id);

    List<User> getAllUsers();

    void deleteUser(Long id);
    Optional<User> getUserByEmail(String email);

}
