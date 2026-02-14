package com.example.e_commerce.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double total;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCreation = new Date();

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"cart", "orders"})
    private User user;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("cart")
    private List<CartItem> items;

    @OneToOne(mappedBy = "sourceCart")
    @JsonIgnoreProperties("sourceCart")
    private Order order;

    // Constructeurs
    public Cart() {}

    public Cart(User user) {
        this.user = user;
        this.total = 0.0;
        this.dateCreation = new Date();
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public Date getDateCreation() { return dateCreation; }
    public void setDateCreation(Date dateCreation) { this.dateCreation = dateCreation; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public List<CartItem> getItems() { return items; }
    public void setItems(List<CartItem> items) { this.items = items; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
}