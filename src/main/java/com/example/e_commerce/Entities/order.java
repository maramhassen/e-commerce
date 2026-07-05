package com.example.e_commerce.Entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "orders")
public class order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private orderstatut statut = orderstatut.EN_ATTENTE;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCommande = new Date();

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"orders", "cart"})
    private user user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("order")
    private List<orderitem> items;

    @OneToOne
    @JoinColumn(name = "cart_id", unique = true)
    @JsonIgnoreProperties({"order", "items", "user"})
    private cart sourceCart;

    // Constructeurs
    public order() {}

    public order(user user, cart sourceCart) {
        this.user = user;
        this.sourceCart = sourceCart;
        this.dateCommande = new Date();
        this.statut = orderstatut.EN_ATTENTE;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public orderstatut getStatut() { return statut; }
    public void setStatut(orderstatut statut) { this.statut = statut; }

    public Date getDateCommande() { return dateCommande; }
    public void setDateCommande(Date dateCommande) { this.dateCommande = dateCommande; }

    public user getUser() { return user; }
    public void setUser(user user) { this.user = user; }

    public List<orderitem> getItems() { return items; }
    public void setItems(List<orderitem> items) { this.items = items; }

    public cart getSourceCart() { return sourceCart; }
    public void setSourceCart(cart sourceCart) { this.sourceCart = sourceCart; }
}