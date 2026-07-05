package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.order;
import com.example.e_commerce.Entities.orderstatut;
import java.util.List;

public interface iorderservice {
    order createOrderFromCart(Long userId);
    order getOrderById(Long id);
    List<order> getOrdersByUser(Long userId);
    List<order> getAllOrders();
    order updateOrderStatus(Long orderId, orderstatut statut);
    void deleteOrder(Long id);
    order getOrderByCartId(Long cartId);
}