package com.example.e_commerce.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
public class cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double total;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCreation = new Date();

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"cart", "orders"})
    private user user;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("cart")
    private List<cartitem> items;

    @OneToOne(mappedBy = "sourceCart")
    @JsonIgnoreProperties("sourceCart")
    private order order;

    // Constructeurs
    public cart() {}

    public cart(user user) {
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

    public user getUser() { return user; }
    public void setUser(user user) { this.user = user; }

    public List<cartitem> getItems() { return items; }
    public void setItems(List<cartitem> items) { this.items = items; }

    public order getOrder() { return order; }
    public void setOrder(order order) { this.order = order; }
}