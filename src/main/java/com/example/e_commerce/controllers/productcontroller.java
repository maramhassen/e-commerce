    package com.example.e_commerce.controllers;

    import com.example.e_commerce.entities.product;
    import com.example.e_commerce.entities.category;
    import com.example.e_commerce.services.filestorageservice;
    import com.example.e_commerce.services.iproductservice;
    import com.example.e_commerce.services.icategoryservice;
    import com.fasterxml.jackson.databind.ObjectMapper;
    import com.fasterxml.jackson.databind.JsonNode;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;
    import org.springframework.web.multipart.MultipartFile;
    import org.springframework.core.io.Resource;
    import org.springframework.http.MediaType;

    import java.nio.file.Files;
    import java.io.IOException;
    import java.util.List;
    import java.util.Map;

    @RestController
    @RequestMapping("/api/products")
    //@CrossOrigin(origins = "*", allowedHeaders = "*")
    //@CrossOrigin(allowCredentials = "true")
    public class productcontroller {
        private final iproductservice productService;

        @Autowired
        private icategoryservice categoryService;

        @Autowired
        private filestorageservice fileStorageService;

        @Autowired
        private ObjectMapper objectMapper;

        public productcontroller(iproductservice productService) {
            this.productService = productService;
        }

        // ==================== ENDPOINT POUR SERVIR LES IMAGES ====================

        @GetMapping("/images/{fileName:.+}")
        public ResponseEntity<Resource> getImage(@PathVariable String fileName) {
            try {
                System.out.println("📥 Demande d'image: " + fileName);

                Resource resource = fileStorageService.loadFileAsResource(fileName);

                String contentType;
                try {
                    contentType = Files.probeContentType(resource.getFile().toPath());
                    if (contentType == null) {
                        if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) {
                            contentType = "image/jpeg";
                        } else if (fileName.toLowerCase().endsWith(".png")) {
                            contentType = "image/png";
                        } else if (fileName.toLowerCase().endsWith(".gif")) {
                            contentType = "image/gif";
                        } else if (fileName.toLowerCase().endsWith(".webp")) {
                            contentType = "image/webp";
                        } else {
                            contentType = "application/octet-stream";
                        }
                    }
                } catch (IOException ex) {
                    System.err.println("⚠️ Impossible de déterminer le type MIME: " + ex.getMessage());
                    contentType = "application/octet-stream";
                }

                System.out.println("✅ Image trouvée: " + fileName + " (Type: " + contentType + ")");

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header("Cache-Control", "public, max-age=31536000")
                        .body(resource);

            } catch (Exception e) {
                System.err.println("❌ Image non trouvée: " + fileName + " - " + e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        }

        // ==================== CRÉATION ====================

        @PostMapping
        public ResponseEntity<?> create(@RequestBody Map<String, Object> productData) {
            try {
                System.out.println("📝 Création produit avec données: " + productData);

                product product = new product();
                product.setNom((String) productData.get("nom"));
                product.setDescription((String) productData.get("description"));
                product.setPrix(Double.parseDouble(productData.get("prix").toString()));
                product.setStock(Integer.parseInt(productData.get("stock").toString()));
                product.setActif(Boolean.parseBoolean(productData.get("actif").toString()));

                // Gérer l'image
                String imageUrl = (String) productData.get("imageUrl");
                if (imageUrl != null && !imageUrl.startsWith("assets/") && !imageUrl.contains("default-product")) {
                    product.setImageUrl(imageUrl);
                }

                // Gérer la catégorie
                Object categoryObj = productData.get("category");
                Object categoryIdObj = productData.get("categoryId");

                if (categoryObj instanceof Map) {
                    // Si category est un objet {id: X}
                    Map<String, Object> categoryMap = (Map<String, Object>) categoryObj;
                    if (categoryMap.containsKey("id")) {
                        Long categoryId = Long.valueOf(categoryMap.get("id").toString());
                        category category = categoryService.getCategoryById(categoryId);
                        product.setCategory(category);
                    }
                } else if (categoryIdObj != null) {
                    // Si categoryId est fourni directement
                    Long categoryId = Long.valueOf(categoryIdObj.toString());
                    category category = categoryService.getCategoryById(categoryId);
                    product.setCategory(category);
                }

                product savedProduct = productService.createProduct(product);
                System.out.println("✅ Produit créé avec ID: " + savedProduct.getId());

                return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);

            } catch (Exception e) {
                System.err.println("❌ Erreur création: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", e.getMessage()));
            }
        }

        // ==================== CRÉATION AVEC UPLOAD D'IMAGE ====================

        @PostMapping("/upload")
        public ResponseEntity<?> createProductWithImage(
                @RequestParam(value = "image", required = false) MultipartFile image,
                @RequestParam("product") String productJson) {

            try {
                System.out.println("📤 Upload création avec image");

                // Parser le JSON en Map pour accéder aux champs
                JsonNode productNode = objectMapper.readTree(productJson);

                product product = new product();
                product.setNom(productNode.get("nom").asText());
                product.setDescription(productNode.get("description").asText());
                product.setPrix(productNode.get("prix").asDouble());
                product.setStock(productNode.get("stock").asInt());
                product.setActif(productNode.get("actif").asBoolean());

                // Gérer la catégorie
                JsonNode categoryNode = productNode.get("category");
                if (categoryNode != null && !categoryNode.isNull()) {
                    Long categoryId = categoryNode.get("id").asLong();
                    category category = categoryService.getCategoryById(categoryId);
                    product.setCategory(category);
                }

                if (image != null && !image.isEmpty()) {
                    System.out.println("📸 Image reçue: " + image.getOriginalFilename());

                    String fileName = fileStorageService.storeFile(image);
                    product.setImageUrl(fileName);
                    System.out.println("✅ Nom de fichier généré: " + fileName);
                } else {
                    System.out.println("ℹ️ Aucune image fournie");
                }

                product savedProduct = productService.createProduct(product);
                System.out.println("✅ Produit créé: ID=" + savedProduct.getId() +
                        ", Image=" + savedProduct.getImageUrl());

                return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);

            } catch (Exception e) {
                System.err.println("❌ Erreur upload création: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", e.getMessage()));
            }
        }

        // ==================== LECTURE DE TOUS LES PRODUITS ====================

        @GetMapping
        public ResponseEntity<?> getAll() {
            try {
                List<product> products = productService.getAllProducts();

                System.out.println("📋 Récupération de " + products.size() + " produits");

                return ResponseEntity.ok(products);

            } catch (Exception e) {
                System.err.println("❌ Erreur récupération produits: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Erreur lors de la récupération des produits"));
            }
        }

        // ==================== LECTURE D'UN PRODUIT ====================

        @GetMapping("/{id}")
        public ResponseEntity<?> getById(@PathVariable Long id) {
            try {
                System.out.println("🔍 Récupération produit ID: " + id);

                product product = productService.getProductById(id);

                if (product == null) {
                    System.out.println("❌ Produit non trouvé ID: " + id);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Produit non trouvé"));
                }

                return ResponseEntity.ok(product);

            } catch (Exception e) {
                System.err.println("❌ Erreur récupération produit " + id + ": " + e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Erreur lors de la récupération du produit"));
            }
        }

        // ==================== MISE À JOUR ====================

        @PutMapping("/{id}")
        public ResponseEntity<?> update(@PathVariable Long id,
                                        @RequestBody Map<String, Object> productData) {
            try {
                System.out.println("✏️ Mise à jour produit ID: " + id);
                System.out.println("📋 Données reçues: " + productData);

                product existing = productService.getProductById(id);
                if (existing == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Produit non trouvé"));
                }

                // Mettre à jour les champs
                existing.setNom((String) productData.get("nom"));
                existing.setDescription((String) productData.get("description"));
                existing.setPrix(Double.parseDouble(productData.get("prix").toString()));
                existing.setStock(Integer.parseInt(productData.get("stock").toString()));
                existing.setActif(Boolean.parseBoolean(productData.get("actif").toString()));

                // Gérer l'image
                String imageUrl = (String) productData.get("imageUrl");
                if (imageUrl != null && !imageUrl.startsWith("assets/") &&
                        !imageUrl.contains("/images/") && !imageUrl.startsWith("http://localhost:4200")) {
                    existing.setImageUrl(imageUrl);
                }

                // Gérer la catégorie
                Object categoryObj = productData.get("category");
                Object categoryIdObj = productData.get("categoryId");

                if (categoryObj instanceof Map) {
                    Map<String, Object> categoryMap = (Map<String, Object>) categoryObj;
                    if (categoryMap.containsKey("id")) {
                        Long categoryId = Long.valueOf(categoryMap.get("id").toString());
                        category category = categoryService.getCategoryById(categoryId);
                        existing.setCategory(category);
                    }
                } else if (categoryIdObj != null) {
                    Long categoryId = Long.valueOf(categoryIdObj.toString());
                    category category = categoryService.getCategoryById(categoryId);
                    existing.setCategory(category);
                }

                product updatedProduct = productService.updateProduct(id, existing);
                System.out.println("✅ Produit mis à jour: " + updatedProduct.getNom());

                return ResponseEntity.ok(updatedProduct);

            } catch (Exception e) {
                System.err.println("❌ Erreur mise à jour: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", e.getMessage()));
            }
        }

        // ==================== MISE À JOUR AVEC UPLOAD D'IMAGE ====================

        @PutMapping("/{id}/upload")
        public ResponseEntity<?> updateProductWithImage(
                @PathVariable Long id,
                @RequestParam(value = "image", required = false) MultipartFile image,
                @RequestParam("product") String productJson) {

            try {
                System.out.println("📤 Upload mise à jour produit ID: " + id);

                product existingProduct = productService.getProductById(id);
                if (existingProduct == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Produit non trouvé"));
                }

                String oldImageUrl = existingProduct.getImageUrl();
                System.out.println("🖼️ Ancienne image: " + oldImageUrl);

                // Parser le JSON
                JsonNode productNode = objectMapper.readTree(productJson);

                // Mettre à jour les champs de base
                existingProduct.setNom(productNode.get("nom").asText());
                existingProduct.setDescription(productNode.get("description").asText());
                existingProduct.setPrix(productNode.get("prix").asDouble());
                existingProduct.setStock(productNode.get("stock").asInt());
                existingProduct.setActif(productNode.get("actif").asBoolean());

                // Gérer la catégorie
                JsonNode categoryNode = productNode.get("category");
                if (categoryNode != null && !categoryNode.isNull()) {
                    Long categoryId = categoryNode.get("id").asLong();
                    category category = categoryService.getCategoryById(categoryId);
                    existingProduct.setCategory(category);
                }

                if (image != null && !image.isEmpty()) {
                    System.out.println("📸 Nouvelle image reçue: " + image.getOriginalFilename());

                    // Supprimer l'ancienne image
                    if (oldImageUrl != null && !oldImageUrl.isEmpty()) {
                        fileStorageService.deleteFile(oldImageUrl);
                        System.out.println("🗑️ Ancienne image supprimée: " + oldImageUrl);
                    }

                    String fileName = fileStorageService.storeFile(image);
                    existingProduct.setImageUrl(fileName);
                    System.out.println("✅ Nouvelle image sauvegardée: " + fileName);

                } else if (productNode.has("imageUrl") &&
                        (productNode.get("imageUrl").isNull() ||
                                productNode.get("imageUrl").asText().isEmpty())) {
                    // Supprimer l'image si indiqué
                    if (oldImageUrl != null && !oldImageUrl.isEmpty()) {
                        fileStorageService.deleteFile(oldImageUrl);
                        System.out.println("🗑️ Image supprimée (vide): " + oldImageUrl);
                    }
                    existingProduct.setImageUrl(null);
                }
                // Sinon, garder l'image existante

                product updatedProduct = productService.updateProduct(id, existingProduct);
                System.out.println("✅ Produit mis à jour: ID=" + updatedProduct.getId());

                return ResponseEntity.ok(updatedProduct);

            } catch (Exception e) {
                System.err.println("❌ Erreur upload mise à jour: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", e.getMessage()));
            }
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<?> delete(@PathVariable Long id) {
            try {
                product product = productService.getProductById(id);

                // Supprimer l'image associée
                if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
                    fileStorageService.deleteFile(product.getImageUrl());
                }

                productService.deleteProduct(id);

                return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", e.getMessage()));
            }
        }

        // ==================== ENDPOINT DE TEST ====================

        @GetMapping("/test/images")
        public ResponseEntity<?> testImages() {
            try {
                List<product> products = productService.getAllProducts();

                StringBuilder response = new StringBuilder();
                response.append("<h1>Test d'images</h1>");
                response.append("<p>Total produits: ").append(products.size()).append("</p>");
                response.append("<ul>");

                for (product p : products) {
                    response.append("<li>")
                            .append(p.getId()).append(": ")
                            .append(p.getNom()).append(" - ")
                            .append(p.getImageUrl() != null ?
                                    "<a href=\"/api/products/images/" + p.getImageUrl() + "\" target=\"_blank\">" + p.getImageUrl() + "</a>" :
                                    "Pas d'image")
                            .append("</li>");
                }

                response.append("</ul>");

                return ResponseEntity.ok()
                        .contentType(MediaType.TEXT_HTML)
                        .body(response.toString());

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur: " + e.getMessage());
            }
        }
    }