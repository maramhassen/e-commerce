package com.example.e_commerce.unit.controller;

import com.example.e_commerce.controllers.OrderController;
import com.example.e_commerce.entities.Order;
import com.example.e_commerce.entities.OrderStatut;
import com.example.e_commerce.services.IOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Test "standalone" : on instancie le OrderController directement avec des mocks,
 * sans démarrer tout le contexte Spring.
 */
@ExtendWith(MockitoExtension.class)
class orderControllerTest {

    @Mock
    private IOrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController).build();
    }

    @Test
    void testCreateOrder_Success() throws Exception {
        Order order = new Order();
        order.setId(1L);
        order.setTotal(100.0);
        order.setStatut(OrderStatut.EN_ATTENTE);
        order.setItems(new ArrayList<>());

        when(orderService.createOrderFromCart(1L)).thenReturn(order);

        mockMvc.perform(post("/api/orders/create/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.total").value(100.0));

        verify(orderService, times(1)).createOrderFromCart(1L);
    }

    @Test
    void testCreateOrder_EmptyCart_ShouldReturnBadRequest() throws Exception {
        when(orderService.createOrderFromCart(1L))
                .thenThrow(new RuntimeException("Impossible de créer une commande : panier vide"));

        mockMvc.perform(post("/api/orders/create/1"))
                .andExpect(status().isBadRequest());

        verify(orderService, times(1)).createOrderFromCart(1L);
    }

    @Test
    void testCreateOrder_UserNotFound_ShouldReturnNotFound() throws Exception {
        when(orderService.createOrderFromCart(99L))
                .thenThrow(new RuntimeException("Erreur lors de la création de la commande: Utilisateur non trouvé avec ID: 99"));

        mockMvc.perform(post("/api/orders/create/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateOrder_UnexpectedError_ShouldReturnInternalServerError() throws Exception {
        when(orderService.createOrderFromCart(1L))
                .thenThrow(new RuntimeException("Erreur inconnue de la base de données"));

        mockMvc.perform(post("/api/orders/create/1"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetOrder_Success() throws Exception {
        Order order = new Order();
        order.setId(1L);
        order.setTotal(50.0);

        when(orderService.getOrderById(1L)).thenReturn(order);

        mockMvc.perform(get("/api/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));

        verify(orderService, times(1)).getOrderById(1L);
    }

    @Test
    void testGetOrder_NotFound() throws Exception {
        when(orderService.getOrderById(99L)).thenThrow(new RuntimeException("Commande non trouvée avec ID: 99"));

        mockMvc.perform(get("/api/orders/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetOrdersByUser_Success() throws Exception {
        Order order1 = new Order();
        order1.setId(1L);
        Order order2 = new Order();
        order2.setId(2L);

        when(orderService.getOrdersByUser(1L)).thenReturn(Arrays.asList(order1, order2));

        mockMvc.perform(get("/api/orders/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(orderService, times(1)).getOrdersByUser(1L);
    }

    @Test
    void testGetOrdersByUser_Error_ShouldReturnBadRequest() throws Exception {
        when(orderService.getOrdersByUser(99L))
                .thenThrow(new RuntimeException("Utilisateur non trouvé avec ID: 99"));

        mockMvc.perform(get("/api/orders/user/99"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetAllOrders() throws Exception {
        Order order1 = new Order();
        order1.setId(1L);
        Order order2 = new Order();
        order2.setId(2L);

        List<Order> orders = Arrays.asList(order1, order2);
        when(orderService.getAllOrders()).thenReturn(orders);

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        verify(orderService, times(1)).getAllOrders();
    }

    @Test
    void testUpdateOrderStatus_Success() throws Exception {
        Order order = new Order();
        order.setId(1L);
        order.setStatut(OrderStatut.CONFIRMEE);

        when(orderService.updateOrderStatus(1L, OrderStatut.CONFIRMEE)).thenReturn(order);

        mockMvc.perform(put("/api/orders/1/status")
                        .param("statut", "CONFIRMEE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("CONFIRMEE"));

        verify(orderService, times(1)).updateOrderStatus(1L, OrderStatut.CONFIRMEE);
    }

    @Test
    void testUpdateOrderStatus_NotFound() throws Exception {
        when(orderService.updateOrderStatus(99L, OrderStatut.LIVREE))
                .thenThrow(new RuntimeException("Commande non trouvée avec ID: 99"));

        mockMvc.perform(put("/api/orders/99/status")
                        .param("statut", "LIVREE"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteOrder_Success() throws Exception {
        doNothing().when(orderService).deleteOrder(1L);

        mockMvc.perform(delete("/api/orders/1"))
                .andExpect(status().isOk());

        verify(orderService, times(1)).deleteOrder(1L);
    }

    @Test
    void testDeleteOrder_NotFound() throws Exception {
        doThrow(new RuntimeException("Commande non trouvée avec ID: 99")).when(orderService).deleteOrder(99L);

        mockMvc.perform(delete("/api/orders/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetOrderByCartId_Success() throws Exception {
        Order order = new Order();
        order.setId(1L);

        when(orderService.getOrderByCartId(1L)).thenReturn(order);

        mockMvc.perform(get("/api/orders/cart/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));

        verify(orderService, times(1)).getOrderByCartId(1L);
    }

    @Test
    void testGetOrderByCartId_NotFound() throws Exception {
        when(orderService.getOrderByCartId(99L))
                .thenThrow(new RuntimeException("Aucune commande trouvée pour le panier ID: 99"));

        mockMvc.perform(get("/api/orders/cart/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testTestCreateOrder_Success() throws Exception {
        Order order = new Order();
        order.setId(1L);

        when(orderService.createOrderFromCart(1L)).thenReturn(order);

        mockMvc.perform(get("/api/orders/test/1"))
                .andExpect(status().isOk());

        verify(orderService, times(1)).createOrderFromCart(1L);
    }

    @Test
    void testTestCreateOrder_Failure() throws Exception {
        when(orderService.createOrderFromCart(99L))
                .thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/api/orders/test/99"))
                .andExpect(status().isBadRequest());
    }
}