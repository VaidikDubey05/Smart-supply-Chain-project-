package com.inventory.smart.service;

import com.inventory.smart.entity.Inventory;
import com.inventory.smart.entity.Product;
import com.inventory.smart.entity.Supplier;
import com.inventory.smart.exception.ResourceNotFoundException;
import com.inventory.smart.repository.InventoryRepository;
import com.inventory.smart.repository.ProductRepository;
import com.inventory.smart.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Transactional
    public Product addProduct(Product product) {
        Supplier supplier = supplierRepository.findById(product.getSupplier().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        product.setSupplier(supplier);
        Product savedProduct = productRepository.save(product);

        // Auto-create inventory entry
        Inventory inventory = new Inventory();
        inventory.setProduct(savedProduct);
        inventory.setAvailableQuantity(0);
        inventory.setLowStockThreshold(10);
        inventoryRepository.save(inventory);

        return savedProduct;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product updateProduct(Long id, Product updatedProduct) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        
        existing.setName(updatedProduct.getName());
        existing.setDescription(updatedProduct.getDescription());
        existing.setPrice(updatedProduct.getPrice());
        
        if (updatedProduct.getSupplier() != null && updatedProduct.getSupplier().getId() != null) {
            Supplier supplier = supplierRepository.findById(updatedProduct.getSupplier().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
            existing.setSupplier(supplier);
        }
        return productRepository.save(existing);
    }

    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }
}
