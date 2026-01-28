package com.example.e_commerce.Services;

import com.example.e_commerce.Entities.*;
import com.example.e_commerce.Repository.CartRepository;
import com.example.e_commerce.Repository.OrderRepository;
import com.example.e_commerce.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements IOrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartRepository cartRepository,
                            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Order createOrderFromCart(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        Order order = new Order();
        order.setUser(user);
        order.setStatus(statut.CREATED);
        order.setDateCommande(new java.util.Date());

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0;

        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantite(cartItem.getQuantite());
            orderItem.setPrix(cartItem.getPrixUnitaire());
            orderItem.setOrder(order);

            total += cartItem.getQuantite() * cartItem.getPrixUnitaire();
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        order.setTotal(total);

        return orderRepository.save(order);
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @Override
    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }


    @Override
    public Order updateOrderStatus(Long orderId, statut statut) {
        Order order = getOrderById(orderId);
        order.setStatus(statut);
        return orderRepository.save(order);
    }


    @Override
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
}
