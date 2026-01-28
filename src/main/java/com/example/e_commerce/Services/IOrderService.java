package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.Order;
import com.example.e_commerce.Entities.statut;

import java.util.List;

public interface IOrderService {
    Order createOrderFromCart(Long userId);

    Order getOrderById(Long id);

    List<Order> getOrdersByUser(Long userId);

    List<Order> getAllOrders();

    Order updateOrderStatus(Long orderId, statut statut);

    void deleteOrder(Long id);
}
