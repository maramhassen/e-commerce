package com.example.e_commerce.unit.service;

import com.example.e_commerce.Entities.user;
import com.example.e_commerce.Repository.userrepository;
import com.example.e_commerce.Services.userserviceimpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class userServiceTest {
    @Mock
    private userrepository userRepository;

    @InjectMocks
    private userserviceimpl userService;

    @Test
    void testCreateUser_Success() {
        // Arrange
        user user = new user();
        user.setNom("Dupont");
        user.setEmail("dupont@example.com");
        user.setMotDePasse("password123");

        user savedUser = new user();
        savedUser.setId(1L);
        savedUser.setNom("Dupont");
        savedUser.setEmail("dupont@example.com");

        when(userRepository.save(any(user.class))).thenReturn(savedUser);

        // Act
        user result = userService.createUser(user);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Dupont", result.getNom());
        verify(userRepository, times(1)).save(any(user.class));
    }

    @Test
    void testGetUserById_Success() {
        // Arrange
        user user = new user();
        user.setId(1L);
        user.setNom("Dupont");
        user.setEmail("dupont@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act
        user result = userService.getUserById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Dupont", result.getNom());
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void testGetUserById_NotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> userService.getUserById(99L));
        verify(userRepository, times(1)).findById(99L);
    }

    @Test
    void testGetAllUsers_Success() {
        // Arrange
        user user1 = new user();
        user1.setId(1L);
        user1.setNom("Dupont");

        user user2 = new user();
        user2.setId(2L);
        user2.setNom("Martin");

        when(userRepository.findAll()).thenReturn(Arrays.asList(user1, user2));

        // Act
        List<user> result = userService.getAllUsers();

        // Assert
        assertEquals(2, result.size());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void testUpdateUser_Success() {
        // Arrange
        user existingUser = new user();
        existingUser.setId(1L);
        existingUser.setNom("AncienNom");
        existingUser.setEmail("ancien@email.com");

        user updatedUser = new user();
        updatedUser.setNom("NouveauNom");
        updatedUser.setEmail("nouveau@email.com");
        updatedUser.setMotDePasse("newpassword");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(user.class))).thenReturn(existingUser);

        // Act
        user result = userService.updateUser(1L, updatedUser);

        // Assert
        assertNotNull(result);
        assertEquals("NouveauNom", result.getNom());
        assertEquals("nouveau@email.com", result.getEmail());
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(any(user.class));
    }

    @Test
    void testUpdateUser_NotFound() {
        // Arrange
        user updatedUser = new user();
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> userService.updateUser(99L, updatedUser));
        verify(userRepository, times(1)).findById(99L);
        verify(userRepository, never()).save(any(user.class));
    }

    @Test
    void testDeleteUser_Success() {
        // Act
        userService.deleteUser(1L);

        // Assert
        verify(userRepository, times(1)).deleteById(1L);
    }
}
