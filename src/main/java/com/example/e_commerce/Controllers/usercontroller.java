package com.example.e_commerce.Controllers;

import com.example.e_commerce.Entities.user;
import com.example.e_commerce.Services.iuserservice;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
//@CrossOrigin(origins = "http://localhost:4200")
//@CrossOrigin(origins = "*")
public class usercontroller {
    private final iuserservice userService;

    public usercontroller(iuserservice userService) {
        this.userService = userService;
    }

    // CREATE
    @PostMapping
    public user createUser(@RequestBody user user) {
        return userService.createUser(user);
    }

    // READ ALL
    @GetMapping
    public List<user> getAllUsers() {
        return userService.getAllUsers();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public user getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public user updateUser(@PathVariable Long id, @RequestBody user user) {
        return userService.updateUser(id, user);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
