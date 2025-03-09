class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.total = 0;
        this.init();
    }

    init() {
        // Add event listeners to all add-to-cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productData = {
                    id: button.dataset.id,
                    name: button.dataset.name,
                    price: parseFloat(button.dataset.price),
                    image: button.dataset.image
                };
                this.addItem(productData);
            });
        });

        // Initialize checkout button
        this.initCheckoutButton();

        // Add event listener to cart button to toggle cart visibility
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                const shoppingCart = document.querySelector('.shopping-cart');
                shoppingCart.classList.toggle('active');
            });
        }

        // Initial render of cart
        this.renderCart();
    }

    initCheckoutButton() {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.handleCheckout();
            });
        }
    }

    handleCheckout() {
        // Check if cart is empty
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty!', 'error');
            return;
        }

        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            this.showNotification('Please login to checkout', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        // Save current cart state
        this.saveCart();

        // Redirect to checkout page
        window.location.href = 'checkout.html';
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image,
                quantity: 1
            });
        }

        this.saveCart();
        this.renderCart();
        this.showNotification('Item added to cart!', 'success');
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveCart();
        this.renderCart();
    }

    updateQuantity(id, quantity) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.quantity = parseInt(quantity);
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                this.saveCart();
                this.renderCart();
            }
        }
    }

    calculateTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    renderCart() {
        const cartContainer = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (cartContainer) {
            if (this.items.length === 0) {
                cartContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
                if (cartTotal) cartTotal.textContent = 'total : ₹0/-';
            } else {
                cartContainer.innerHTML = this.items.map(item => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="content">
                            <h3>${item.name}</h3>
                            <div class="price">₹${item.price}/- x ${item.quantity}</div>
                        </div>
                        <div class="quantity-controls">
                            <button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <i class="fas fa-times" onclick="cart.removeItem('${item.id}')"></i>
                    </div>
                `).join('');
                
                if (cartTotal) cartTotal.textContent = `total : ₹${this.calculateTotal()}/-`;
            }
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Add this to ensure the cart is initialized after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Reinitialize checkout button
    cart.initCheckoutButton();
}); 