/**
 * Checkout Module
 * Handles checkout-specific functionality including form validation, step management, and order processing
 */

class CheckoutManager {
  constructor() {
    this.cart = [];
    this.shippingMethod = 'standard';
    this.paymentMethod = 'credit-card';
    this.currentStep = 1;
    this.init();
  }

  init() {
    this.cacheDOM();
    this.loadCart();
    this.bindEvents();
    this.updateCartDisplay();
    this.showStep(1);
  }

  cacheDOM() {
    this.elements = {
      // Cart elements
      cartCounter: document.getElementById('cart-count'),
      mobileCartCount: document.getElementById('mobile-cart-count'),

      // Order summary elements
      orderItemsContainer: document.getElementById('order-items-container'),
      orderSubtotal: document.getElementById('order-subtotal'),
      orderShipping: document.getElementById('order-shipping'),
      orderTax: document.getElementById('order-tax'),
      orderTotal: document.getElementById('order-total'),

      // Form elements
      proceedToPayment: document.getElementById('proceed-to-payment'),
      placeOrder: document.getElementById('place-order'),

      // Confirmation elements
      confirmationItemsContainer: document.getElementById('confirmation-items-container'),
      confirmationSubtotal: document.getElementById('confirmation-subtotal'),
      confirmationShipping: document.getElementById('confirmation-shipping'),
      confirmationTax: document.getElementById('confirmation-tax'),
      confirmationTotal: document.getElementById('confirmation-total'),
      continueShopping: document.getElementById('continue-shopping'),
      viewOrderDetails: document.getElementById('view-order-details'),

      // Mobile menu elements
      hamburger: document.getElementById('hamburger'),
      mobileMenu: document.getElementById('mobileMenu'),
      closeBtn: document.getElementById('closeBtn')
    };
  }

  bindEvents() {
    // Proceed to Payment
    if (this.elements.proceedToPayment) {
      this.elements.proceedToPayment.addEventListener('click', () => {
        this.handleProceedToPayment();
      });
    }

    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
      method.addEventListener('click', () => {
        this.handlePaymentMethodSelection(method);
      });
    });

    // Place Order
    if (this.elements.placeOrder) {
      this.elements.placeOrder.addEventListener('click', () => {
        this.handlePlaceOrder();
      });
    }

    // Continue Shopping
    if (this.elements.continueShopping) {
      this.elements.continueShopping.addEventListener('click', () => {
        window.location.href = 'product2.html';
      });
    }

    // View Order Details
    if (this.elements.viewOrderDetails) {
      this.elements.viewOrderDetails.addEventListener('click', () => {
        showNotification('Order details would be displayed here.', 'info');
      });
    }

    // Mobile menu functionality
    this.bindMobileMenuEvents();
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('evoraCart');
      this.cart = saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load cart:', error);
      this.cart = [];
    }
  }

  updateCartDisplay() {
    const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);

    if (this.elements.cartCounter) {
      this.elements.cartCounter.textContent = totalItems;
    }
    if (this.elements.mobileCartCount) {
      this.elements.mobileCartCount.textContent = totalItems;
    }

    this.renderOrderSummary();
  }

  renderOrderSummary() {
    if (this.cart.length === 0) {
      if (this.elements.orderItemsContainer) {
        this.elements.orderItemsContainer.innerHTML = `
          <div class="text-center py-3">
            <p>Your cart is empty</p>
          </div>
        `;
      }
      this.updateTotalsDisplay(0, 0, 0, 0);
      return;
    }

    let orderHTML = '';
    let subtotal = 0;

    this.cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderHTML += `
        <div class="order-item">
          <img src="${this.getProductImage(item)}" class="order-item-img" alt="${item.name}">
          <div class="order-item-details">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
            <div class="order-item-quantity">Qty: ${item.quantity}</div>
          </div>
        </div>
      `;
    });

    if (this.elements.orderItemsContainer) {
      this.elements.orderItemsContainer.innerHTML = orderHTML;
    }

    const totals = this.calculateOrderTotals();
    this.updateTotalsDisplay(totals.subtotal, totals.shippingCost, totals.tax, totals.total);
  }

  calculateOrderTotals() {
    let subtotal = 0;

    this.cart.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const shippingCost = this.shippingMethod === 'standard' ? 5.99 : 12.99;
    const taxRate = 0.07;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  updateTotalsDisplay(subtotal, shippingCost, tax, total) {
    if (this.elements.orderSubtotal) {
      this.elements.orderSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    }
    if (this.elements.orderShipping) {
      this.elements.orderShipping.textContent = `$${shippingCost.toFixed(2)}`;
    }
    if (this.elements.orderTax) {
      this.elements.orderTax.textContent = `$${tax.toFixed(2)}`;
    }
    if (this.elements.orderTotal) {
      this.elements.orderTotal.textContent = `$${total.toFixed(2)}`;
    }
  }

  getProductImage(item) {
    return item.image || 'https://via.placeholder.com/60x60?text=Product';
  }

  showStep(stepNumber) {
    // Hide all steps with null checking
    const shippingForm = document.getElementById('shipping-form');
    const paymentForm = document.getElementById('payment-form');
    const confirmationPage = document.getElementById('confirmation-page');
    
    if (shippingForm) shippingForm.style.display = 'none';
    if (paymentForm) paymentForm.style.display = 'none';
    if (confirmationPage) confirmationPage.style.display = 'none';

    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
      step.classList.toggle('active', index + 1 <= stepNumber);
      if (index + 1 === stepNumber) {
        step.style.color = '#007bff';
      } else {
        step.style.color = '#6c757d';
      }
    });

    // Show the selected step
    if (stepNumber === 1) {
      if (shippingForm) shippingForm.style.display = 'block';
    } else if (stepNumber === 2) {
      if (paymentForm) paymentForm.style.display = 'block';
    } else if (stepNumber === 3) {
      if (confirmationPage) confirmationPage.style.display = 'block';
      this.generateOrderConfirmation();
    }
  }

  handleProceedToPayment() {
    // Validate shipping form
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zip = document.getElementById('zip').value;

    if (!fullName || !email || !address || !city || !state || !zip) {
      showNotification('Please fill in all required shipping information.', 'error');
      return;
    }

    // Get shipping method
    this.shippingMethod = document.querySelector('input[name="shipping"]:checked').value;

    // Update order summary with shipping method
    this.renderOrderSummary();

    // Show payment step
    this.showStep(2);
  }

  handlePaymentMethodSelection(methodElement) {
    document.querySelectorAll('.payment-method').forEach(m => {
      m.classList.remove('selected');
    });
    methodElement.classList.add('selected');
    this.paymentMethod = methodElement.getAttribute('data-method');

    // Show appropriate payment form
    document.getElementById('credit-card-form').style.display =
      this.paymentMethod === 'credit-card' ? 'block' : 'none';
  }

  handlePlaceOrder() {
    // Validate payment form based on selected method
    if (this.paymentMethod === 'credit-card') {
      const cardNumber = document.getElementById('card-number').value;
      const expiry = document.getElementById('expiry').value;
      const cvv = document.getElementById('cvv').value;

      if (!cardNumber || !expiry || !cvv) {
        showNotification('Please fill in all credit card information.', 'error');
        return;
      }
    }

    // Process the order
    this.showStep(3);

    // Clear the cart after successful order
    this.cart = [];
    localStorage.setItem('evoraCart', JSON.stringify(this.cart));
    this.updateCartDisplay();
  }

  generateOrderConfirmation() {
    if (this.cart.length === 0) {
      if (this.elements.confirmationItemsContainer) {
        this.elements.confirmationItemsContainer.innerHTML = `
          <div class="text-center py-3">
            <p>No items in order</p>
          </div>
        `;
      }
      return;
    }

    let confirmationHTML = '';
    this.cart.forEach(item => {
      confirmationHTML += `
        <div class="order-item">
          <img src="${this.getProductImage(item)}" class="order-item-img" alt="${item.name}">
          <div class="order-item-details">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
            <div class="order-item-quantity">Qty: ${item.quantity}</div>
          </div>
        </div>
      `;
    });

    if (this.elements.confirmationItemsContainer) {
      this.elements.confirmationItemsContainer.innerHTML = confirmationHTML;
    }

    // Update confirmation page totals
    const totals = this.calculateOrderTotals();

    if (this.elements.confirmationSubtotal) {
      this.elements.confirmationSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;
    }
    if (this.elements.confirmationShipping) {
      this.elements.confirmationShipping.textContent = `$${totals.shippingCost.toFixed(2)}`;
    }
    if (this.elements.confirmationTax) {
      this.elements.confirmationTax.textContent = `$${totals.tax.toFixed(2)}`;
    }
    if (this.elements.confirmationTotal) {
      this.elements.confirmationTotal.textContent = `$${totals.total.toFixed(2)}`;
    }

    // Set order number (random 6 digits)
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    document.getElementById('order-number').textContent = orderNumber;

    // Set order date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('order-date').textContent = dateStr;

    // Set estimated delivery
    const shippingDays = this.shippingMethod === 'standard' ? '5-7' : '2-3';
    document.getElementById('order-estimate').textContent = `${shippingDays} business days`;
  }

  bindMobileMenuEvents() {
    if (!this.elements.hamburger || !this.elements.mobileMenu || !this.elements.closeBtn) return;

    this.elements.hamburger.addEventListener('click', () => {
      this.elements.mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    this.elements.closeBtn.addEventListener('click', () => {
      this.elements.mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });

    this.elements.mobileMenu.addEventListener('click', (e) => {
      if (e.target === this.elements.mobileMenu) {
        this.elements.mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    document.querySelectorAll('.mobile-dropdown-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.nextElementSibling;
        const toggleIcon = toggle.querySelector('.toggle-icon');

        if (dropdown.style.display === 'block') {
          dropdown.style.display = 'none';
          if (toggleIcon) toggleIcon.textContent = '+';
        } else {
          dropdown.style.display = 'block';
          if (toggleIcon) toggleIcon.textContent = '-';
        }
      });
    });
  }
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" id="notificationCloseBtn">&times;</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(notification);
  
  // Add event listener for close button
  notification.querySelector('.notification-close').addEventListener('click', function() {
    this.parentElement.parentElement.remove();
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);

  // Add CSS if not already present
  if (!document.getElementById('notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
      }
      .notification-success {
        background: linear-gradient(135deg, #d4edda, #c3e6cb);
        border-left: 4px solid #28a745;
      }
      .notification-error {
        background: linear-gradient(135deg, #f8d7da, #f5c6cb);
        border-left: 4px solid #dc3545;
      }
      .notification-info {
        background: linear-gradient(135deg, #d1ecf1, #bee5eb);
        border-left: 4px solid #17a2b8;
      }
      .notification-content {
        padding: 15px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .notification-message {
        flex: 1;
        font-size: 14px;
        color: #333;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        margin-left: 10px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .notification-close:hover {
        color: #333;
      }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }
}

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const checkoutManager = new CheckoutManager();
/* Search Bar Logic appended by Assistant */
document.addEventListener("DOMContentLoaded", function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    // Only run if the search bar exists on this page
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            // Prevent submission if input is empty
            if (!searchInput.value.trim()) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
});
});