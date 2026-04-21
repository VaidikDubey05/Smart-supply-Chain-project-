package com.inventory.smart.service;

import com.inventory.smart.entity.Delivery;
import com.inventory.smart.entity.DeliveryStatus;
import com.inventory.smart.entity.OrderStatus;
import com.inventory.smart.exception.ResourceNotFoundException;
import com.inventory.smart.repository.CustomerOrderRepository;
import com.inventory.smart.repository.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private CustomerOrderRepository customerOrderRepository;

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    public Delivery updateDeliveryStatus(Long deliveryId, DeliveryStatus status) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));
        
        delivery.setDeliveryStatus(status);
        
        if (status == DeliveryStatus.OUT_FOR_DELIVERY) {
            delivery.getOrder().setStatus(OrderStatus.SHIPPED);
            customerOrderRepository.save(delivery.getOrder());
        } else if (status == DeliveryStatus.DELIVERED) {
            delivery.setDeliveryDate(LocalDateTime.now());
            // Update associated order status
            delivery.getOrder().setStatus(OrderStatus.DELIVERED);
            customerOrderRepository.save(delivery.getOrder());
        }
        
        return deliveryRepository.save(delivery);
    }
}
