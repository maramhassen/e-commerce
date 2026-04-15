package com.example.e_commerce.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200","http://102.141.206.178",
                        "http://102.141.206.178:80","http://frontend-service" )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        // Configuration spécifique pour les images
        registry.addMapping("/api/products/images/**")
                .allowedOrigins("http://localhost:4200","http://102.141.206.178",
                        "http://102.141.206.178:80")
                .allowedMethods("GET")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}