package com.inventory.smart.controller;

import com.inventory.smart.entity.CustomerOrder;
import com.inventory.smart.entity.OrderItem;
import com.inventory.smart.service.CustomerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class CustomerOrderController {

    @Autowired
    private CustomerOrderService orderService;

    @PostMapping("/user/{userId}")
    public ResponseEntity<CustomerOrder> placeOrder(@PathVariable Long userId, @RequestBody List<OrderItem> items) {
        return new ResponseEntity<>(orderService.placeOrder(userId, items), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CustomerOrder>> getUserOrders(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<CustomerOrder> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }
}
