package com.example.e_commerce.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    @Autowired
    public FileStorageService() {
        // ✅ Utiliser le chemin absolu correct
        String uploadDir = System.getenv("FILE_UPLOAD_DIR") != null
                ? System.getenv("FILE_UPLOAD_DIR")
                : "/app/uploads/images";

        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            if (!Files.exists(this.fileStorageLocation)) {
                Files.createDirectories(this.fileStorageLocation);
                System.out.println("📁 Répertoire créé: " + this.fileStorageLocation);
            } else {
                System.out.println("📁 Répertoire existant: " + this.fileStorageLocation);
            }
        } catch (Exception e) {
            throw new RuntimeException("Impossible de créer le répertoire: " + this.fileStorageLocation, e);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            // Vérifier si le fichier n'est pas vide
            if (file.isEmpty()) {
                throw new RuntimeException("Le fichier est vide.");
            }

            // Vérifier le type de fichier
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Seules les images sont autorisées.");
            }

            // Générer un nom de fichier unique
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";

            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID().toString() + fileExtension;

            // Copier le fichier dans le répertoire de destination
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            System.out.println("✅ Fichier sauvegardé: " + fileName);
            return fileName;

        } catch (IOException ex) {
            throw new RuntimeException("Erreur lors du stockage du fichier. Veuillez réessayer!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("Fichier non trouvé: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("Fichier non trouvé: " + fileName, ex);
        }
    }

    public void deleteFile(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }

        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            boolean deleted = Files.deleteIfExists(filePath);

            if (deleted) {
                System.out.println("🗑️ Fichier supprimé: " + fileName);
            }
        } catch (IOException ex) {
            System.err.println("⚠️ Impossible de supprimer le fichier: " + fileName);
        }
    }

    public Path getStorageLocation() {
        return fileStorageLocation;
    }
}