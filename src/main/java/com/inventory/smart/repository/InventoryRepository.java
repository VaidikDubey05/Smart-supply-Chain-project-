package com.inventory.smart.repository;

import com.inventory.smart.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Inventory findByProductId(Long productId);

    @Query("SELECT i FROM Inventory i WHERE i.availableQuantity <= i.lowStockThreshold")
    List<Inventory> findLowStockItems();
}
