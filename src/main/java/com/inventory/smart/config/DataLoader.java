package com.inventory.smart.config;

import com.inventory.smart.entity.*;
import com.inventory.smart.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataLoader {

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (productRepository.count() < 20) {
                inventoryRepository.deleteAll();
                productRepository.deleteAll();
                supplierRepository.deleteAll();

                Supplier s1 = new Supplier(null, "TechCore Solutions", "sales@techcore.com", "+1-555-0101", "Silicon Valley, CA");
                Supplier s2 = new Supplier(null, "Global Logistics", "info@globallogistics.com", "+1-555-0102", "Chicago, IL");
                supplierRepository.saveAll(Arrays.asList(s1, s2));

                if (userRepository.findByUsername("admin").isEmpty()) {
                    userRepository.save(new User(null, "admin", passwordEncoder.encode("admin123"), "admin@smart.com", Role.ADMIN, null));
                }
                if (userRepository.findByUsername("tech_supplier").isEmpty()) {
                    userRepository.save(new User(null, "tech_supplier", passwordEncoder.encode("supplier123"), "tech@techcore.com", Role.SUPPLIER, s1.getId()));
                }
                if (userRepository.findByUsername("john_customer").isEmpty()) {
                    userRepository.save(new User(null, "john_customer", passwordEncoder.encode("customer123"), "john@gmail.com", Role.CUSTOMER, null));
                }

                List<Product> products = Arrays.asList(
                    new Product(null, "Logitech G-Pro Mouse", "Professional ergonomic wireless mouse", 129.99, s1, "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?q=80&w=800"),
                    new Product(null, "Keychron K2 Keyboard", "75% RGB Wireless Mechanical Keyboard", 89.00, s1, "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800"),
                    new Product(null, "LG UltraWide Monitor", "34-inch Curved Nano IPS Display", 699.99, s1, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800"),
                    new Product(null, "Sony WH-1000XM4", "Industry-leading Noise Cancelling Headphones", 348.00, s1, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800"),
                    new Product(null, "iPhone 13 Pro Max", "Sierra Blue, 256GB Storage", 1099.00, s1, "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?q=80&w=800"),
                    new Product(null, "DJI Mavic Air 2", "4K Drone with 48MP Camera", 799.00, s1, "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800"),
                    new Product(null, "Nintendo Switch", "OLED Model with Neon Blue/Red", 349.99, s1, "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=800"),
                    new Product(null, "Apple Watch Series 7", "Starlight Aluminum Case, GPS", 399.00, s1, "https://images.unsplash.com/photo-1544117518-30dd5ff7a9bc?q=80&w=800"),
                    new Product(null, "Bose SoundLink Revolve+", "360-degree wireless speaker", 299.00, s1, "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=800"),
                    new Product(null, "Anker PowerCore 20K", "High-capacity portable charger", 59.99, s1, "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800"),
                    
                    new Product(null, "Razer DeathAdder V2", "Best-in-class gaming mouse", 69.99, s2, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800"),
                    new Product(null, "Secretlab Titan EVO", "Ergonomic gaming chair - Stealth", 499.00, s2, "https://images.unsplash.com/photo-1598550476439-6847785fce6f?q=80&w=800"),
                    new Product(null, "Blue Yeti USB Mic", "Professional podcasting microphone", 129.00, s2, "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800"),
                    new Product(null, "ASUS ROG Zephyrus", "G14 Gaming Laptop, Ryzen 9", 1499.00, s2, "https://images.unsplash.com/photo-1516339901600-af13a7bc3044?q=80&w=800"),
                    new Product(null, "Samsung T7 Touch", "1TB Portable SSD with Fingerprint", 159.99, s2, "https://images.unsplash.com/photo-1628558416379-83b3c177dc71?q=80&w=800"),
                    new Product(null, "GoPro Hero 10 Black", "Action Camera, 5.3K Video", 399.00, s2, "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=800"),
                    new Product(null, "Phillips Hue Starter Kit", "Smart lighting system", 199.00, s2, "https://images.unsplash.com/photo-1550985543-f47f38aee65e?q=80&w=800"),
                    new Product(null, "Google Nest Hub", "2nd Gen Smart Display", 99.00, s2, "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?q=80&w=800"),
                    new Product(null, "PS5 DualSense Controller", "Midnight Black wireless", 69.99, s2, "https://images.unsplash.com/photo-1605906302474-f60df45a80dd?q=80&w=800"),
                    new Product(null, "NETGEAR Nighthawk AX12", "WiFi 6 Router, Max Coverage", 449.00, s2, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800")
                );

                productRepository.saveAll(products);

                for (Product p : products) {
                    inventoryRepository.save(new Inventory(null, p, 20 + (int)(Math.random() * 50), 10));
                }

                System.out.println("==================================================");
                System.out.println("20-Product Professional Catalog Loaded!");
                System.out.println("==================================================");
            }
        };
    }
}
