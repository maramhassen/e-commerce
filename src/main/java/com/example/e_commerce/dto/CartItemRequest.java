package com.example.e_commerce.dto;

public class CartItemRequest {
    private Long productId;
    private int quantite;

    public CartItemRequest() {}

    public CartItemRequest(Long productId, int quantite) {
        this.productId = productId;
        this.quantite = quantite;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public int getQuantite() { return quantite; }
    public void setQuantite(int quantite) { this.quantite = quantite; }

}
