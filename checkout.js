document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load cart items
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        window.location.href = 'index.html';
        return;
    }

    // Load saved addresses
    loadSavedAddresses();
    // Load order items
    loadOrderItems();
    // Calculate and display summary
    updateOrderSummary();
    // Setup payment method handlers
    setupPaymentMethods();

    // Place order button handler
    document.getElementById('place-order-btn').addEventListener('click', placeOrder);
});

function loadSavedAddresses() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`)) || [];
    const container = document.getElementById('saved-addresses');

    if (addresses.length === 0) {
        container.innerHTML = `
            <p class="no-address">No saved addresses. Please add a delivery address.</p>
        `;
        return;
    }

    container.innerHTML = addresses.map((address, index) => `
        <div class="address-card ${index === 0 ? 'selected' : ''}" data-index="${index}">
            <h3>
                <i class="fas fa-${address.type === 'home' ? 'home' : address.type === 'work' ? 'briefcase' : 'map-marker-alt'}"></i>
                ${address.type.charAt(0).toUpperCase() + address.type.slice(1)}
            </h3>
            <p>${address.completeAddress}</p>
            <p>${address.city}, ${address.pincode}</p>
        </div>
    `).join('');

    // Add click handlers for address selection
    document.querySelectorAll('.address-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
}



    const itemsHTML = cart.map(item => `
        <div class="item-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <div class="price">₹${item.price} × ${item.quantity}</div>
                <div class="item-quantity">
                    Quantity: ${item.quantity}
                </div>
            </div>
        </div>
    `).join('');

    const summaryHTML = cart.map(item => `
        <div class="price-row">
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
        </div>
    `).join('');

    container.innerHTML = itemsHTML;
    summaryContainer.innerHTML = summaryHTML;
}

function updateOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemsTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = itemsTotal >= 500 ? 0 : 40;
    const taxes = Math.round(itemsTotal * 0.05); // 5% tax
    const total = itemsTotal + deliveryFee + taxes;

    document.getElementById('items-total').textContent = `₹${itemsTotal}`;
    document.getElementById('delivery-fee').textContent = `₹${deliveryFee}`;
    document.getElementById('taxes').textContent = `₹${taxes}`;
    document.getElementById('total-amount').textContent = `₹${total}`;
}

function setupPaymentMethods() {
    const paymentForms = {
        upi: document.getElementById('upi-form'),
        card: document.getElementById('card-form')
    };

    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Hide all payment forms
            Object.values(paymentForms).forEach(form => {
                if (form) form.style.display = 'none';
            });

            // Show selected payment form
            const selectedForm = paymentForms[e.target.value];
            if (selectedForm) selectedForm.style.display = 'block';
        });
    });
}

function placeOrder() {
    // Validate address selection
    const selectedAddress = document.querySelector('.address-card.selected');
    if (!selectedAddress) {
        alert('Please select a delivery address');
        return;
    }

    // Validate payment method
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (!selectedPayment) {
        alert('Please select a payment method');
        return;
    }

    // Get order details
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`)) || [];
    const address = addresses[selectedAddress.dataset.index];

    const order = {
        orderId: 'ORD' + Date.now(),
        userId: currentUser.email,
        items: cart,
        address: address,
        paymentMethod: selectedPayment.value,
        itemsTotal: parseFloat(document.getElementById('items-total').textContent.slice(1)),
        deliveryFee: parseFloat(document.getElementById('delivery-fee').textContent.slice(1)),
        taxes: parseFloat(document.getElementById('taxes').textContent.slice(1)),
        totalAmount: parseFloat(document.getElementById('total-amount').textContent.slice(1)),
        status: 'Pending',
        orderDate: new Date().toISOString()
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem(`orders_${currentUser.email}`)) || [];
    orders.unshift(order);
    localStorage.setItem(`orders_${currentUser.email}`, JSON.stringify(orders));

    // Clear cart
    localStorage.removeItem('cart');

    // Show success message and redirect
    alert('Order placed successfully!');
    window.location.href = 'order-confirmation.html?orderId=' + order.orderId;
} 