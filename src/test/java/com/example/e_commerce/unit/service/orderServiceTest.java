package com.example.e_commerce.unit.service;

import com.example.e_commerce.entities.*;
import com.example.e_commerce.repository.CartRepository;
import com.example.e_commerce.repository.OrderRepository;
import com.example.e_commerce.repository.UserRepository;
import com.example.e_commerce.services.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class orderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User user;
    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@esprit.tn");

        product = new Product();
        product.setId(1L);
        product.setNom("Produit Test");
        product.setPrix(50.0);

        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setQuantite(2);
        cartItem.setPrixUnitaire(50.0);

        cart = new Cart();
        cart.setId(1L);
        cart.setUser(user);
        cart.setItems(new ArrayList<>(List.of(cartItem)));
    }

    @Test
    void testCreateOrderFromCart_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findCartsWithItemsByUserId(1L)).thenReturn(List.of(cart));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(10L);
            return o;
        });
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        Order result = orderService.createOrderFromCart(1L);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals(100.0, result.getTotal());
        assertEquals(OrderStatut.EN_ATTENTE, result.getStatut());
        assertEquals(1, result.getItems().size());
        verify(orderRepository, times(1)).save(any(Order.class));
        verify(cartRepository, times(2)).save(any(Cart.class));
    }

    @Test
    void testCreateOrderFromCart_UserNotFound_ShouldThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> orderService.createOrderFromCart(99L));
        assertTrue(exception.getMessage().contains("Utilisateur non trouvé"));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testCreateOrderFromCart_NoCartWithItems_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findCartsWithItemsByUserId(1L)).thenReturn(new ArrayList<>());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> orderService.createOrderFromCart(1L));
        assertTrue(exception.getMessage().contains("Aucun panier avec articles"));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testCreateOrderFromCart_EmptyCartItems_ShouldThrowException() {
        Cart emptyCart = new Cart();
        emptyCart.setId(2L);
        emptyCart.setItems(new ArrayList<>());

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findCartsWithItemsByUserId(1L)).thenReturn(List.of(emptyCart));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> orderService.createOrderFromCart(1L));
        assertTrue(exception.getMessage().contains("panier vide"));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testCreateOrderFromCart_CartAlreadyHasOrder_ShouldThrowException() {
        Order existingOrder = new Order();
        existingOrder.setId(5L);
        cart.setOrder(existingOrder);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findCartsWithItemsByUserId(1L)).thenReturn(List.of(cart));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> orderService.createOrderFromCart(1L));
        assertTrue(exception.getMessage().contains("déjà une commande"));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testGetOrderById_Success() {
        Order order = new Order();
        order.setId(1L);
        order.setItems(new ArrayList<>());

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Order result = orderService.getOrderById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(orderRepository, times(1)).findById(1L);
    }

    @Test
    void testGetOrderById_NotFound() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> orderService.getOrderById(99L));
        assertEquals("Commande non trouvée avec ID: 99", exception.getMessage());
    }

    @Test
    void testGetOrdersByUser_Success() {
        Order order1 = new Order();
        order1.setId(1L);
        order1.setItems(new ArrayList<>());
        Order order2 = new Order();
        order2.setId(2L);
        order2.setItems(new ArrayList<>());

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserIdOrderByDateCommandeDesc(1L)).thenReturn(Arrays.asList(order1, order2));

        List<Order> result = orderService.getOrdersByUser(1L);

        assertEquals(2, result.size());
        verify(orderRepository, times(1)).findByUserIdOrderByDateCommandeDesc(1L);
    }

    @Test
    void testGetOrdersByUser_UserNotFound_ShouldThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> orderService.getOrdersByUser(99L));
        verify(orderRepository, never()).findByUserIdOrderByDateCommandeDesc(anyLong());
    }

    @Test
    void testGetAllOrders_Success() {
        Order order1 = new Order();
        order1.setId(1L);
        Order order2 = new Order();
        order2.setId(2L);

        when(orderRepository.findAll()).thenReturn(Arrays.asList(order1, order2));

        List<Order> result = orderService.getAllOrders();

        assertEquals(2, result.size());
        verify(orderRepository, times(1)).findAll();
    }

    @Test
    void testUpdateOrderStatus_Success() {
        Order order = new Order();
        order.setId(1L);
        order.setItems(new ArrayList<>());
        order.setStatut(OrderStatut.EN_ATTENTE);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        Order result = orderService.updateOrderStatus(1L, OrderStatut.CONFIRMEE);

        assertEquals(OrderStatut.CONFIRMEE, result.getStatut());
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    void testUpdateOrderStatus_NotFound() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> orderService.updateOrderStatus(99L, OrderStatut.LIVREE));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testDeleteOrder_Success() {
        Order order = new Order();
        order.setId(1L);
        order.setItems(new ArrayList<>());
        order.setSourceCart(null);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        doNothing().when(orderRepository).deleteById(1L);

        orderService.deleteOrder(1L);

        verify(orderRepository, times(1)).deleteById(1L);
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    void testDeleteOrder_WithSourceCart_ShouldClearCartLink() {
        Order order = new Order();
        order.setId(1L);
        order.setItems(new ArrayList<>());
        order.setSourceCart(cart);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        doNothing().when(orderRepository).deleteById(1L);

        orderService.deleteOrder(1L);

        assertNull(cart.getOrder());
        verify(cartRepository, times(1)).save(cart);
        verify(orderRepository, times(1)).deleteById(1L);
    }

    @Test
    void testDeleteOrder_NotFound() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> orderService.deleteOrder(99L));
        verify(orderRepository, never()).deleteById(anyLong());
    }

    @Test
    void testGetOrderByCartId_Success() {
        Order order = new Order();
        order.setId(1L);

        when(orderRepository.findBySourceCartId(1L)).thenReturn(Optional.of(order));

        Order result = orderService.getOrderByCartId(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void testGetOrderByCartId_NotFound() {
        when(orderRepository.findBySourceCartId(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> orderService.getOrderByCartId(99L));
    }
}