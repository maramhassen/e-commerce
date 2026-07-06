package com.example.e_commerce.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatut statut = OrderStatut.EN_ATTENTE;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCommande = new Date();

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"orders", "cart"})
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("order")
    private List<OrderItem> items;

    @OneToOne
    @JoinColumn(name = "cart_id", unique = true)
    @JsonIgnoreProperties({"order", "items", "user"})
    private Cart sourceCart;

    // Constructeurs
    public Order() {}

    public Order(User user, Cart sourceCart) {
        this.user = user;
        this.sourceCart = sourceCart;
        this.dateCommande = new Date();
        this.statut = OrderStatut.EN_ATTENTE;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public OrderStatut getStatut() { return statut; }
    public void setStatut(OrderStatut statut) { this.statut = statut; }

    public Date getDateCommande() { return dateCommande; }
    public void setDateCommande(Date dateCommande) { this.dateCommande = dateCommande; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public Cart getSourceCart() { return sourceCart; }
    public void setSourceCart(Cart sourceCart) { this.sourceCart = sourceCart; }
}