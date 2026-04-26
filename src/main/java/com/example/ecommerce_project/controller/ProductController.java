package com.example.ecommerce_project.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.ecommerce_project.entity.Product;
import com.example.ecommerce_project.service.ProductService;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> getProducts(@RequestParam(required = false) Boolean bestseller) {
        List<Product> allProducts = productService.getAllProducts();
        
        if (bestseller != null && bestseller) {
            return allProducts.stream().limit(3).toList();
        }
        return allProducts;
    }

    @GetMapping("/categories")
public List<String> getCategories() {
    List<String> categories = productService.getAllCategories();
    
    System.out.println("MySQL'den gelen kategori sayısı: " + categories.size());
    
    return categories;
}
@GetMapping("/ping")
public String ping() {
    return "Backend sapasaglam ayakta!";
}
}