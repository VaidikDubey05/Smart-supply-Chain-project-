package com.inventory.smart.service;

import com.inventory.smart.entity.Inventory;
import com.inventory.smart.exception.ResourceNotFoundException;
import com.inventory.smart.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    public Inventory updateStock(Long id, Integer quantity) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + id));
        inventory.setAvailableQuantity(quantity);
        return inventoryRepository.save(inventory);
    }
}
