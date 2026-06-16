package com.example.e_commerce.integration;

import com.example.e_commerce.Entities.Role;
import com.example.e_commerce.Entities.User;
import com.example.e_commerce.Repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Test d'intégration : contexte Spring complet + vraie base H2.
 * Les statuts attendus (200/500) reflètent le comportement RÉEL observé
 * dans UserControllerTest (standalone) : le controller utilisateur ne fait
 * pas de try/catch explicite comme ProductController -> les exceptions
 * du service remontent telles quelles et Spring les traduit en 500.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testCreateUser() throws Exception {
        User user = new User();
        user.setNom("Dupont");
        user.setPrenom("Jean");
        user.setEmail("jean.dupont@example.com");
        user.setMotDePasse("password123");
        user.setRole(Role.CLIENT);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nom").value("Dupont"))
                .andExpect(jsonPath("$.email").value("jean.dupont@example.com"));
    }

    @Test
    void testGetAllUsers() throws Exception {
        User user1 = new User();
        user1.setNom("Martin");
        user1.setEmail("martin@example.com");
        user1.setRole(Role.CLIENT);

        User user2 = new User();
        user2.setNom("Bernard");
        user2.setEmail("bernard@example.com");
        user2.setRole(Role.CLIENT);

        userRepository.save(user1);
        userRepository.save(user2);

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void testGetUserById() throws Exception {
        User user = new User();
        user.setNom("Durand");
        user.setEmail("durand@example.com");
        user.setRole(Role.CLIENT);
        User saved = userRepository.save(user);

        mockMvc.perform(get("/api/users/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.nom").value("Durand"));
    }

    @Test
    void testGetUserById_NotFound() throws Exception {
        // UserController ne capture aucune exception (contrairement à ProductController).
        // L'exception du service traverse tout le pipeline MVC sans être convertie
        // en réponse HTTP -> MockMvc relance une ServletException encapsulant la cause.
        org.junit.jupiter.api.Assertions.assertThrows(jakarta.servlet.ServletException.class, () ->
                mockMvc.perform(get("/api/users/999")));
    }

    @Test
    void testUpdateUser() throws Exception {
        User user = new User();
        user.setNom("AncienNom");
        user.setEmail("ancien@example.com");
        user.setRole(Role.CLIENT);
        User saved = userRepository.save(user);

        User updatedUser = new User();
        updatedUser.setNom("NouveauNom");
        updatedUser.setEmail("nouveau@email.com");
        updatedUser.setRole(Role.CLIENT);

        mockMvc.perform(put("/api/users/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("NouveauNom"))
                .andExpect(jsonPath("$.email").value("nouveau@email.com"));
    }

    @Test
    void testUpdateUser_NotFound() throws Exception {
        User updatedUser = new User();
        updatedUser.setNom("Inexistant");
        updatedUser.setEmail("x@example.com");
        updatedUser.setRole(Role.CLIENT);

        // updateUser() lève une RuntimeException via le service, non interceptée
        // par le controller -> MockMvc relance une ServletException.
        String body = objectMapper.writeValueAsString(updatedUser);
        org.junit.jupiter.api.Assertions.assertThrows(jakarta.servlet.ServletException.class, () ->
                mockMvc.perform(put("/api/users/{id}", 999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)));
    }

    @Test
    void testDeleteUser() throws Exception {
        User user = new User();
        user.setNom("À supprimer");
        user.setEmail("delete@example.com");
        user.setRole(Role.CLIENT);
        User saved = userRepository.save(user);

        mockMvc.perform(delete("/api/users/{id}", saved.getId()))
                .andExpect(status().isOk());

        // L'utilisateur ne doit plus exister -> getUserById() lève une exception
        // non interceptée -> ServletException relancée par MockMvc (même cause que
        // testGetUserById_NotFound).
        org.junit.jupiter.api.Assertions.assertThrows(jakarta.servlet.ServletException.class, () ->
                mockMvc.perform(get("/api/users/{id}", saved.getId())));
    }

    @Test
    void testDeleteUser_NotFound() throws Exception {
        // userService.deleteUser() appelle userRepository.deleteById(id) (vu dans
        // UserServiceTest : verify(userRepository, times(1)).deleteById(1L), sans
        // vérification d'existence au préalable). Spring Data JPA deleteById()
        // sur un id inexistant ne lève pas d'exception par défaut -> 200 OK.
        mockMvc.perform(delete("/api/users/999"))
                .andExpect(status().isOk());
    }
}