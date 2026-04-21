const API_BASE = 'http://localhost:8081/api';

// State
let currentUser = null;
let currentAuthHeaders = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userWelcome = document.getElementById('user-welcome');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// Role-based elements
const adminElements = document.querySelectorAll('.admin-only');
const supplierElements = document.querySelectorAll('.supplier-only');

// --- Utilities ---

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function toggleAuth(type) {
    document.getElementById('tab-login').classList.toggle('active', type === 'login');
    document.getElementById('tab-register').classList.toggle('active', type === 'register');
    loginForm.classList.toggle('hidden', type !== 'login');
    registerForm.classList.toggle('hidden', type !== 'register');
}

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentAuthHeaders) {
        headers['Authorization'] = currentAuthHeaders;
    }
    return headers;
}

// --- Modals ---

window.openModal = function(id, data = null) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    
    if (id === 'product-modal') {
        loadSupplierDropdown();
        if (data) {
            document.getElementById('prod-id').value = data.id;
            document.getElementById('prod-name').value = data.name;
            document.getElementById('prod-desc').value = data.description;
            document.getElementById('prod-image').value = data.imageUrl || '';
            document.getElementById('prod-price').value = data.price;
            document.getElementById('prod-supplier').value = data.supplier.id;
            document.getElementById('initial-stock-group').classList.add('hidden');
        } else {
            document.getElementById('product-form').reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('initial-stock-group').classList.remove('hidden');
        }
    }
    
    if (id === 'stock-modal' && data) {
        document.getElementById('stock-inv-id').value = data.id;
        document.getElementById('stock-qty').value = '';
    }
};

window.closeModal = function(id) {
    document.getElementById(id).classList.add('hidden');
};

async function loadSupplierDropdown() {
    const select = document.getElementById('prod-supplier');
    if (!select) return;
    try {
        const res = await fetch(`${API_BASE}/suppliers`, { headers: getHeaders() });
        const suppliers = await res.json();
        select.innerHTML = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    } catch (e) {
        console.error("Failed to load suppliers for dropdown");
    }
}

// --- Authentication ---

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    
    currentAuthHeaders = 'Basic ' + btoa(user + ':' + pass);
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: getHeaders()
        });
        
        if (response.ok) {
            currentUser = await response.json();
            showToast(`Welcome back, ${currentUser.username}!`);
            loginSuccess();
        } else {
            showToast('Invalid credentials. Please try again.', 'error');
            currentAuthHeaders = null;
        }
    } catch (err) {
        showToast('Server connection failed. Is the backend running?', 'error');
        currentAuthHeaders = null;
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        username: document.getElementById('reg-username').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value
    };

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showToast('Account created! You can now login.');
            toggleAuth('login');
            registerForm.reset();
        } else {
            const msg = await response.text();
            showToast(msg || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Connection error during registration', 'error');
    }
});

function loginSuccess() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userWelcome.textContent = `Active Session: ${currentUser.role}`;

    // Handle role visibility
    adminElements.forEach(el => el.classList.toggle('hidden', currentUser.role !== 'ADMIN'));
    supplierElements.forEach(el => el.classList.toggle('hidden', currentUser.role !== 'SUPPLIER' && currentUser.role !== 'ADMIN'));

    loadProducts();
}

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    currentAuthHeaders = null;
    dashboardSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    loginForm.reset();
});

// --- Navigation ---

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        views.forEach(v => v.classList.add('hidden'));
        const target = document.getElementById(btn.dataset.target);
        target.classList.remove('hidden');

        if (btn.dataset.target === 'products-view') loadProducts();
        if (btn.dataset.target === 'orders-view') loadOrders();
        if (btn.dataset.target === 'inventory-view') loadInventory();
        if (btn.dataset.target === 'suppliers-view') loadSuppliers();
        if (btn.dataset.target === 'stats-view') loadAdminStats();
        if (btn.dataset.target === 'deliveries-view') loadDeliveries();
    });
});

// --- Product Management ---

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`, { headers: getHeaders() });
        const products = await res.json();
        const list = document.getElementById('product-list');
        list.className = 'product-grid';
        list.innerHTML = '';

        if (products.length === 0) {
            list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No products in catalog.</div>';
            return;
        }

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <span class="price-tag">$${p.price.toFixed(2)}</span>
                <div class="image-container">
                    <img src="${p.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}" class="product-img" alt="${p.name}">
                </div>
                <div class="product-info">
                    <h4>${p.name}</h4>
                    <p class="desc">${p.description || 'No description available.'}</p>
                    <div class="product-meta">
                        <span class="supplier-tag">${p.supplier.name}</span>
                        <span>In Stock: ...</span>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        ${currentUser.role === 'CUSTOMER' ? 
                            `<button class="btn-primary" style="flex: 1" onclick="orderProduct(${p.id})">Order Now</button>` : 
                            `<button class="btn-primary" style="flex: 1" onclick='openModal("product-modal", ${JSON.stringify(p)})'>Edit</button>
                             <button class="btn-danger" onclick="deleteProduct(${p.id})">Del</button>`
                        }
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        showToast('Failed to load products', 'error');
    }
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const payload = {
        name: document.getElementById('prod-name').value,
        description: document.getElementById('prod-desc').value,
        imageUrl: document.getElementById('prod-image').value,
        price: parseFloat(document.getElementById('prod-price').value),
        supplier: { id: parseInt(document.getElementById('prod-supplier').value) }
    };

    // If Supplier and not Admin, force their linked supplier ID
    if (currentUser.role === 'SUPPLIER' && currentUser.supplierId) {
        payload.supplier.id = currentUser.supplierId;
    }

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const savedProd = await res.json();
            
            // If new product and initial stock > 0, find its inventory and update
            const initialStock = parseInt(document.getElementById('prod-stock').value);
            if (!id && initialStock > 0) {
                const invRes = await fetch(`${API_BASE}/inventory`, { headers: getHeaders() });
                const inventory = await invRes.json();
                const item = inventory.find(i => i.product.id === savedProd.id);
                if (item) {
                    await fetch(`${API_BASE}/inventory/${item.id}?quantity=${initialStock}`, {
                        method: 'PUT',
                        headers: getHeaders()
                    });
                }
            }

            showToast(`Product ${id ? 'updated' : 'added'} successfully`);
            closeModal('product-modal');
            loadProducts();
        } else {
            showToast('Failed to save product', 'error');
        }
    } catch (e) {
        showToast('Network error while saving product', 'error');
    }
});

window.deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (res.ok) {
            showToast('Product deleted');
            loadProducts();
        }
    } catch (e) {
        showToast('Error deleting product', 'error');
    }
};

// --- Inventory & Orders ---

async function loadInventory() {
    try {
        const res = await fetch(`${API_BASE}/inventory`, { headers: getHeaders() });
        const items = await res.json();
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';

        items.forEach(i => {
            const isLow = i.availableQuantity <= i.lowStockThreshold;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${i.product.name}</strong></td>
                <td style="color: ${isLow ? 'var(--danger)' : 'var(--secondary)'}; font-weight: bold;">
                    ${i.availableQuantity} ${isLow ? '⚠️' : ''}
                </td>
                <td>${i.lowStockThreshold}</td>
                <td>
                    <button class="btn-ghost" onclick='openModal("stock-modal", ${JSON.stringify(i)})'>Update Stock</button>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (e) {
        showToast('Failed to load inventory', 'error');
    }
}

document.getElementById('stock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('stock-inv-id').value;
    const qty = document.getElementById('stock-qty').value;
    
    try {
        const res = await fetch(`${API_BASE}/inventory/${id}?quantity=${qty}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (res.ok) {
            showToast('Stock inventory updated');
            closeModal('stock-modal');
            loadInventory();
        }
    } catch (e) {
        showToast('Failed to update stock', 'error');
    }
});

window.orderProduct = async (productId) => {
    const payload = [{ product: { id: productId }, quantity: 1 }];
    try {
        const res = await fetch(`${API_BASE}/orders/user/${currentUser.id}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('Order successful! Stock deducted.');
            loadProducts();
        } else {
            const err = await res.text();
            showToast(err || 'Order failed', 'error');
        }
    } catch (e) {
        showToast('Error placing order', 'error');
    }
};

async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/orders/user/${currentUser.id}`, { headers: getHeaders() });
        const list = document.getElementById('order-list');
        list.innerHTML = '';

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Server error while fetching orders');
        }

        const orders = await res.json();

        if (orders.length === 0) {
            list.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-secondary);">No orders found. Start shopping!</td></tr>';
            return;
        }

        orders.forEach(o => {
            const tr = document.createElement('tr');
            const total = o.totalAmount != null ? o.totalAmount.toFixed(2) : '0.00';
            tr.innerHTML = `
                <td>#${o.id}</td>
                <td>${new Date(o.orderDate).toLocaleDateString()}</td>
                <td>$${total}</td>
                <td><span class="tag ${o.status}">${o.status}</span></td>
            `;
            list.appendChild(tr);
        });
    } catch (e) {
        console.error('Order Load Error:', e);
        showToast(e.message || 'Failed to load orders', 'error');
    }
}

// --- Admin Features ---

async function loadSuppliers() {
    try {
        const res = await fetch(`${API_BASE}/suppliers`, { headers: getHeaders() });
        const suppliers = await res.json();
        const list = document.getElementById('supplier-list');
        list.innerHTML = '';

        suppliers.forEach(s => {
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.innerHTML = `
                <h4>${s.name}</h4>
                <p>📧 ${s.contactEmail}</p>
                <p>📞 ${s.phone || 'N/A'}</p>
                <p>📍 ${s.address || 'N/A'}</p>
            `;
            list.appendChild(div);
        });
    } catch (e) {
        showToast('Failed to load suppliers', 'error');
    }
}

document.getElementById('supplier-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('supp-name').value,
        contactEmail: document.getElementById('supp-email').value,
        phone: document.getElementById('supp-phone').value,
        address: document.getElementById('supp-address').value
    };

    try {
        const res = await fetch(`${API_BASE}/suppliers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('New supplier registered');
            closeModal('supplier-modal');
            loadSuppliers();
        }
    } catch (e) {
        showToast('Error registering supplier', 'error');
    }
});

async function loadAdminStats() {
    try {
        const dRes = await fetch(`${API_BASE}/deliveries`, { headers: getHeaders() });
        const deliveries = await dRes.json();
        document.getElementById('stat-deliveries').textContent = deliveries.length;

        const lsRes = await fetch(`${API_BASE}/inventory/low-stock`, { headers: getHeaders() });
        const lowStock = await lsRes.json();
        document.getElementById('stat-low-stock').textContent = lowStock.length;

        const sRes = await fetch(`${API_BASE}/suppliers`, { headers: getHeaders() });
        const suppliers = await sRes.json();
        document.getElementById('stat-partners').textContent = suppliers.length;
    } catch (e) {
        console.error("Failed to load admin analytics");
    }
}

async function loadDeliveries() {
    try {
        const res = await fetch(`${API_BASE}/deliveries`, { headers: getHeaders() });
        const deliveries = await res.json();
        const list = document.getElementById('delivery-management-list');
        list.innerHTML = '';

        if (deliveries.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No active deliveries.</td></tr>';
            return;
        }

        deliveries.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>DEL-${d.id}</td>
                <td><strong>${d.order.user.username}</strong></td>
                <td>Order #${d.order.id}</td>
                <td><span class="tag ${d.deliveryStatus}">${d.deliveryStatus}</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        ${d.deliveryStatus === 'PENDING' ? 
                            `<button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="updateDeliveryStatus(${d.id}, 'OUT_FOR_DELIVERY')">Ship</button>` : ''
                        }
                        ${d.deliveryStatus === 'OUT_FOR_DELIVERY' ? 
                            `<button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; background: var(--secondary);" onclick="updateDeliveryStatus(${d.id}, 'DELIVERED')">Deliver</button>` : ''
                        }
                        ${d.deliveryStatus === 'DELIVERED' ? 
                            `<span style="color: var(--secondary); font-size: 0.8rem;">Completed</span>` : ''
                        }
                    </div>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (e) {
        showToast('Failed to load deliveries', 'error');
    }
}

window.updateDeliveryStatus = async (id, status) => {
    try {
        const res = await fetch(`${API_BASE}/deliveries/${id}/status?status=${status}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (res.ok) {
            showToast(`Delivery status updated to ${status}`);
            loadDeliveries();
            if (document.getElementById('stats-view').classList.contains('active')) loadAdminStats();
        } else {
            showToast('Failed to update delivery', 'error');
        }
    } catch (e) {
        showToast('Network error during delivery update', 'error');
    }
};
