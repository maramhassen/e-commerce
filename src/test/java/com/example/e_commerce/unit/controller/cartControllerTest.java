package com.example.e_commerce.unit.controller;

import com.example.e_commerce.controllers.CartController;
import com.example.e_commerce.entities.Cart;
import com.example.e_commerce.entities.CartItem;
import com.example.e_commerce.entities.Product;
import com.example.e_commerce.services.ICartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/*
 * Test "standalone" : on instancie le CartController directement avec des mocks,
 * sans démarrer tout le contexte Spring. On teste uniquement la couche Controller
 * (routage HTTP, sérialisation JSON), le service métier étant mocké.
 */
@ExtendWith(MockitoExtension.class)
class cartControllerTest {

    @Mock
    private ICartService cartService;

    @InjectMocks
    private CartController cartController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(cartController).build();
    }

    @Test
    void testCreateCart() throws Exception {
        String requestJson = """
                {
                    "total": 0.0
                }
                """;

        Cart savedCart = new Cart();
        savedCart.setId(1L);
        savedCart.setTotal(0.0);

        when(cartService.createCart(any(Cart.class))).thenReturn(savedCart);

        mockMvc.perform(post("/api/carts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));

        verify(cartService, times(1)).createCart(any(Cart.class));
    }

    @Test
    void testGetAllCarts() throws Exception {
        Cart cart1 = new Cart();
        cart1.setId(1L);
        Cart cart2 = new Cart();
        cart2.setId(2L);

        when(cartService.getAllCarts()).thenReturn(Arrays.asList(cart1, cart2));

        mockMvc.perform(get("/api/carts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(cartService, times(1)).getAllCarts();
    }

    @Test
    void testGetCartById() throws Exception {
        Cart cart = new Cart();
        cart.setId(1L);
        cart.setTotal(50.0);

        when(cartService.getCartById(1L)).thenReturn(cart);

        mockMvc.perform(get("/api/carts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.total").value(50.0));

        verify(cartService, times(1)).getCartById(1L);
    }

    @Test
    void testUpdateCart() throws Exception {
        String requestJson = """
                {
                    "total": 120.0
                }
                """;

        Cart updatedCart = new Cart();
        updatedCart.setId(1L);
        updatedCart.setTotal(120.0);

        when(cartService.updateCart(eq(1L), any(Cart.class))).thenReturn(updatedCart);

        mockMvc.perform(put("/api/carts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(120.0));

        verify(cartService, times(1)).updateCart(eq(1L), any(Cart.class));
    }

    @Test
    void testDeleteCart() throws Exception {
        doNothing().when(cartService).deleteCart(1L);

        mockMvc.perform(delete("/api/carts/1"))
                .andExpect(status().isOk());

        verify(cartService, times(1)).deleteCart(1L);
    }

    @Test
    void testAddItemToCart() throws Exception {
        String requestJson = """
                {
                    "quantite": 2
                }
                """;

        CartItem savedItem = new CartItem();
        savedItem.setId(1L);
        savedItem.setQuantite(2);

        when(cartService.addItemToCart(eq(1L), any(CartItem.class))).thenReturn(savedItem);

        mockMvc.perform(post("/api/carts/1/add-item")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.quantite").value(2));

        verify(cartService, times(1)).addItemToCart(eq(1L), any(CartItem.class));
    }

    @Test
    void testAddProductToCart() throws Exception {
        CartItem savedItem = new CartItem();
        savedItem.setId(1L);
        savedItem.setQuantite(3);

        when(cartService.addProductToCart(1L, 2L, 3)).thenReturn(savedItem);

        mockMvc.perform(post("/api/carts/1/add-product/2")
                        .param("quantity", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantite").value(3));

        verify(cartService, times(1)).addProductToCart(1L, 2L, 3);
    }

    @Test
    void testAddItemToUserCart() throws Exception {
        String requestJson = """
                {
                    "quantite": 1
                }
                """;

        CartItem savedItem = new CartItem();
        savedItem.setId(1L);
        savedItem.setQuantite(1);

        when(cartService.addItemToUserCart(eq(1L), any(CartItem.class))).thenReturn(savedItem);

        mockMvc.perform(post("/api/carts/user/1/add-item")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));

        verify(cartService, times(1)).addItemToUserCart(eq(1L), any(CartItem.class));
    }

    @Test
    void testGetCartByUserId() throws Exception {
        Cart cart = new Cart();
        cart.setId(1L);

        when(cartService.findOrCreateCartForUser(1L)).thenReturn(cart);

        mockMvc.perform(get("/api/carts/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));

        verify(cartService, times(1)).findOrCreateCartForUser(1L);
    }

    @Test
    void testRemoveItemFromCart() throws Exception {
        doNothing().when(cartService).removeItemFromCart(1L, 2L);

        mockMvc.perform(delete("/api/carts/1/remove-item/2"))
                .andExpect(status().isOk());

        verify(cartService, times(1)).removeItemFromCart(1L, 2L);
    }

    @Test
    void testClearUserCart() throws Exception {
        doNothing().when(cartService).clearUserCart(1L);

        mockMvc.perform(delete("/api/carts/user/1/clear"))
                .andExpect(status().isOk());

        verify(cartService, times(1)).clearUserCart(1L);
    }

    @Test
    void testUpdateCartItemQuantity() throws Exception {
        CartItem updatedItem = new CartItem();
        updatedItem.setId(2L);
        updatedItem.setQuantite(5);

        when(cartService.updateCartItemQuantity(1L, 2L, 5)).thenReturn(updatedItem);

        mockMvc.perform(put("/api/carts/1/update-item/2")
                        .param("quantity", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantite").value(5));

        verify(cartService, times(1)).updateCartItemQuantity(1L, 2L, 5);
    }

    @Test
    void testCalculateCartTotal() throws Exception {
        when(cartService.calculateCartTotal(1L)).thenReturn(99.5);

        mockMvc.perform(get("/api/carts/1/total"))
                .andExpect(status().isOk())
                .andExpect(content().string("99.5"));

        verify(cartService, times(1)).calculateCartTotal(1L);
    }

    @Test
    void testFindOrCreateCartForUser() throws Exception {
        Cart cart = new Cart();
        cart.setId(1L);

        when(cartService.findOrCreateCartForUser(1L)).thenReturn(cart);

        mockMvc.perform(get("/api/carts/user/1/find-or-create"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));

        verify(cartService, times(1)).findOrCreateCartForUser(1L);
    }

    @Test
    void testAddItemToCartSimple() throws Exception {
        String requestJson = """
                {
                    "productId": 2,
                    "quantite": 4
                }
                """;

        CartItem savedItem = new CartItem();
        savedItem.setId(1L);
        savedItem.setQuantite(4);

        when(cartService.addProductToCart(1L, 2L, 4)).thenReturn(savedItem);

        mockMvc.perform(post("/api/carts/1/add-item-simple")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantite").value(4));

        verify(cartService, times(1)).addProductToCart(1L, 2L, 4);
    }
}