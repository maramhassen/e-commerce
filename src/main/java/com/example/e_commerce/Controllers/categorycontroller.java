package com.example.e_commerce.Controllers;

import com.example.e_commerce.Entities.category;
import com.example.e_commerce.Services.icategoryservice;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
//@CrossOrigin(origins = "*")

public class categorycontroller {
    private final icategoryservice categoryService;

    public categorycontroller(icategoryservice categoryService) {
        this.categoryService = categoryService;
    }

    // CREATE
    @PostMapping
    public category createCategory(@RequestBody category category) {
        return categoryService.createCategory(category);
    }

    // READ ALL
    @GetMapping
    public List<category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public category getCategoryById(@PathVariable Long id) {
        return categoryService.getCategoryById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public category updateCategory(@PathVariable Long id,
                                   @RequestBody category category) {
        return categoryService.updateCategory(id, category);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }
}
