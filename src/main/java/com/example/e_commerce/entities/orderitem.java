package com.example.e_commerce.entities;
import jakarta.persistence.*;

@Entity
public class orderitem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantite;
    private double prix;

    @ManyToOne
    private product product;

    @ManyToOne
    private order order;


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public double getPrix() {
        return prix;
    }

    public void setPrix(double prix) {
        this.prix = prix;
    }

    public product getProduct() {
        return product;
    }

    public void setProduct(product product) {
        this.product = product;
    }

    public order getOrder() {
        return order;
    }

    public void setOrder(order order) {
        this.order = order;
    }
}
