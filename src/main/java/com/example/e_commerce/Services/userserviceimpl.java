package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.user;
import com.example.e_commerce.Repository.userrepository;
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
    public user createUser(user user) {
        return userRepository.save(user);
    }

    @Override
    public user updateUser(Long id, user user) {
        user existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        existingUser.setNom(user.getNom());
        existingUser.setEmail(user.getEmail());
        existingUser.setMotDePasse(user.getMotDePasse());
        existingUser.setRole(user.getRole());
        existingUser.setActif(user.isActif());

        return userRepository.save(existingUser);
    }

    @Override
    public user getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public List<user> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public Optional<user> getUserByEmail(String email) {
        return Optional.empty();
    }
}
