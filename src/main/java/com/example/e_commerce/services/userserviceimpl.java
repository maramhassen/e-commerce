package com.example.e_commerce.services;

import com.example.e_commerce.entities.User;
import com.example.e_commerce.repository.userrepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
@Service
public class userserviceimpl implements iuserservice {
    private final userrepository userRepository;

    public userserviceimpl(userrepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        existingUser.setNom(user.getNom());
        existingUser.setEmail(user.getEmail());
        existingUser.setMotDePasse(user.getMotDePasse());
        existingUser.setRole(user.getRole());
        existingUser.setActif(user.isActif());

        return userRepository.save(existingUser);
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public Optional<User> getUserByEmail(String email) {
        return Optional.empty();
    }
}
