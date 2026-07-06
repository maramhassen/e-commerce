package com.example.e_commerce.services;

import com.example.e_commerce.entities.Order;
import com.example.e_commerce.entities.OrderStatut;
import java.util.List;

public interface IOrderService {
    Order createOrderFromCart(Long userId);
    Order getOrderById(Long id);
    List<Order> getOrdersByUser(Long userId);
    List<Order> getAllOrders();
    Order updateOrderStatus(Long orderId, OrderStatut statut);
    void deleteOrder(Long id);
    Order getOrderByCartId(Long cartId);
}