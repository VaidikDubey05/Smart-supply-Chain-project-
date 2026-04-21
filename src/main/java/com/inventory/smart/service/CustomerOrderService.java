package com.inventory.smart.service;

import com.inventory.smart.entity.*;
import com.inventory.smart.exception.InsufficientStockException;
import com.inventory.smart.exception.ResourceNotFoundException;
import com.inventory.smart.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomerOrderService {

    @Autowired
    private CustomerOrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Transactional
    public CustomerOrder placeOrder(Long userId, List<OrderItem> items) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        double totalAmount = 0.0;

        CustomerOrder order = new CustomerOrder();
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(0.0); // temporary

        CustomerOrder savedOrder = orderRepository.save(order);

        for (OrderItem item : items) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            Inventory inventory = inventoryRepository.findByProductId(product.getId());
            if (inventory == null || inventory.getAvailableQuantity() < item.getQuantity()) {
                throw new InsufficientStockException("Not enough stock for product: " + product.getName());
            }

            // Deduct stock
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() - item.getQuantity());
            inventoryRepository.save(inventory);

            item.setOrder(savedOrder);
            item.setProduct(product);
            item.setPrice(product.getPrice());
            
            totalAmount += product.getPrice() * item.getQuantity();

            orderItemRepository.save(item);
        }

        savedOrder.setTotalAmount(totalAmount);
        
        // Auto-create Delivery record
        Delivery delivery = new Delivery();
        delivery.setOrder(savedOrder);
        delivery.setDeliveryStatus(DeliveryStatus.PENDING);
        deliveryRepository.save(delivery);

        return orderRepository.save(savedOrder);
    }

    public List<CustomerOrder> getUserOrders(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    @Transactional
    public CustomerOrder cancelOrder(Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Order cannot be cancelled in current status.");
        }

        order.setStatus(OrderStatus.CANCELLED);

        // Restore inventory
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Inventory inventory = inventoryRepository.findByProductId(item.getProduct().getId());
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);
        }

        return orderRepository.save(order);
    }
}
