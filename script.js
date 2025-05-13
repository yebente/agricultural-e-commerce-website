document.addEventListener('DOMContentLoaded', function() {
  // Cart functionality
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartOverlay = document.getElementById('cart');
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartTotalAmount = document.getElementById('cart-total-amount');
  const cartCount = document.getElementById('cart-count');
  const checkoutBtn = document.querySelector('.checkout-btn');
  const closeCartBtn = document.querySelector('.close-cart');
  const cartIcon = document.querySelector('.cart-icon a');
  const cartContainer = document.querySelector('.cart-container');
  
  updateCartUI();
  updateCartCount();

  // Initialize quantity selectors for all product cards
  const initializeQuantitySelectors = () => {
    const quantitySelectors = document.querySelectorAll('.quantity-selector');
    
    quantitySelectors.forEach(selector => {
      const minusBtn = selector.querySelector('.minus');
      const plusBtn = selector.querySelector('.plus');
      const input = selector.querySelector('.qty-input');
      
      if (minusBtn && plusBtn && input) {
        // Set initial value if not set
        if (!input.value) input.value = "1";

        minusBtn.addEventListener('click', () => {
          let value = parseInt(input.value);
          if (value > 1) {
            input.value = value - 1;
          }
        });
        
        plusBtn.addEventListener('click', () => {
          let value = parseInt(input.value);
          input.value = value + 1;
        });
        
        input.addEventListener('change', () => {
          let value = parseInt(input.value);
          if (isNaN(value) || value < 1) {
            input.value = 1;
          }
        });
      }
    });
  };

  // Initialize add to cart buttons for all products
  const initializeAddToCartButtons = () => {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
      button.addEventListener('click', () => {
        const productCard = button.closest('.product-card');
        if (!productCard) return;

        const productId = productCard.dataset.id || Date.now().toString();
        const productName = productCard.querySelector('h3')?.textContent;
        const priceElement = productCard.querySelector('.price')?.textContent;
        const productPrice = parseFloat(priceElement?.replace('KSh ', '')) || 0;
        const productImage = productCard.querySelector('.product-image img')?.src;
        const quantityInput = productCard.querySelector('.qty-input');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        if (productName && productPrice && quantity > 0) {
          addToCart(productId, productName, productPrice, productImage, quantity);
          
          // Reset quantity input to 1
          if (quantityInput) quantityInput.value = "1";
          
          // Show cart
          showCart();
        }
      });
    });
  };

  function showCart() {
    if (cartOverlay) {
      cartOverlay.classList.add('active');
      document.body.classList.add('cart-open');
    }
  }

  function hideCart() {
    if (cartOverlay) {
      cartOverlay.classList.remove('active');
      document.body.classList.remove('cart-open');
    }
  }

  // Show cart when clicking cart icon
  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      showCart();
    });
  }

  // Close cart with close button
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', hideCart);
  }

  // Close cart with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartOverlay?.classList.contains('active')) {
      hideCart();
    }
  });

  function addToCart(productId, name, price, image, quantity = 1) {
    const existingItemIndex = cart.findIndex(i => i.id === productId);
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
      showNotification(`Updated quantity of ${name} in cart!`);
    } else {
      cart.push({
        id: productId,
        name: name,
        price: price,
        image: image,
        quantity: quantity
      });
      showNotification(`${name} added to cart!`);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    updateCartCount();
  }

  function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('#cart-count');
    cartCountElements.forEach(element => {
      element.textContent = totalItems;
    });
  }

  function updateCartUI() {
    if (!cartItemsContainer) return;

    // Ensure cart header has proper close button
    const cartHeader = document.querySelector('.cart-header');
    if (cartHeader) {
      const closeBtn = cartHeader.querySelector('.close-cart');
      if (closeBtn) {
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.setAttribute('aria-label', 'Close Cart');
      }
    }

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
      if (checkoutBtn) checkoutBtn.style.display = 'none';
      return;
    }

    let cartHTML = '';
    let total = 0;

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      cartHTML += `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-price">KSh ${item.price.toFixed(2)}</div>
            <div class="cart-item-quantity">
              <button class="qty-btn minus" onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})">-</button>
              <input type="number" class="qty-value" value="${item.quantity}" 
                onchange="updateCartItemQuantity('${item.id}', parseInt(this.value) || 1)" 
                min="1" style="width: 50px; text-align: center;">
              <button class="qty-btn plus" onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    if (cartTotalAmount) {
      cartTotalAmount.textContent = `KSh ${total.toFixed(2)}`;
    }
    if (checkoutBtn) {
      checkoutBtn.style.display = 'block';
    }

    // Update checkout form totals if they exist
    const orderSubtotal = document.getElementById('order-subtotal');
    const orderTotal = document.getElementById('order-total');
    const deliveryFee = document.getElementById('delivery-fee');
    
    if (orderSubtotal && orderTotal && deliveryFee) {
      const deliveryFeeAmount = parseFloat(deliveryFee.textContent.replace('KSh ', '')) || 0;
      orderSubtotal.textContent = `KSh ${total.toFixed(2)}`;
      orderTotal.textContent = `KSh ${(total + deliveryFeeAmount).toFixed(2)}`;
    }
  }

  // Initialize functionality
  initializeQuantitySelectors();
  initializeAddToCartButtons();
  updateCartUI();
  updateCartCount();

  // Add checkout functionality
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      if (cart.length > 0) {
        // Clear the cart
        cart = [];
        localStorage.clear();
        
        // Update UI
        updateCartUI();
        updateCartCount();
        
        // Show success message
        showNotification('Checkout Successful! Thank you for your purchase.');
        
        // Close cart after a short delay
        setTimeout(hideCart, 1500);
      } else {
        showNotification('Your cart is empty!');
      }
    });
  }

  // Make functions available globally
  window.updateCartItemQuantity = function(itemId, newQuantity) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex > -1) {
      // If new quantity would be less than 1, remove the item
      if (newQuantity < 1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        
        if (cart.length === 0) {
          localStorage.clear();
          showNotification('Cart is now empty. Cache cleared!');
          setTimeout(hideCart, 1000);
        } else {
          localStorage.setItem('cart', JSON.stringify(cart));
          showNotification(`${removedItem.name} removed from cart`);
        }
      } else {
        // Otherwise update the quantity
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Cart updated!');
      }
      
      updateCartUI();
      updateCartCount();
    }
  };

  window.removeFromCart = function(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
      const removedItem = cart[itemIndex];
      cart.splice(itemIndex, 1);
      
      if (cart.length === 0) {
        localStorage.clear();
        showNotification('Cart is now empty. Cache cleared!');
        setTimeout(hideCart, 1000);
      } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification(`${removedItem.name} removed from cart`);
      }
      
      updateCartUI();
      updateCartCount();
    }
  };

  window.clearCartAndCache = function() {
    cart = [];
    localStorage.clear();
    updateCartUI();
    updateCartCount();
    showNotification('Cart and cache cleared successfully!');
    setTimeout(hideCart, 1000);
  };

  // Product filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');

      const filter = this.getAttribute('data-filter');

      productCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 100);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      let isValid = true;
      const requiredFields = form.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
      });

      if (isValid) {
        showNotification('Form submitted successfully!');
        form.reset();
      } else {
        showNotification('Please fill in all required fields.');
      }
    });
  });

  // Add notification styles
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-green);
      color: white;
      padding: 1rem 2rem;
      border-radius: 4px;
      opacity: 0;
      transform: translateY(100%);
      transition: all 0.3s ease;
      z-index: 1000;
    }

    .notification.success {
      background: var(--success);
      box-shadow: 0 4px 12px rgba(67, 160, 71, 0.2);
    }

    .notification.show {
      opacity: 1;
      transform: translateY(0);
    }

    /* Enhanced Cart Close Button */
    .close-cart {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 32px;
      height: 32px;
      background: var(--primary-green);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 1002;
      padding: 0;
    }

    .close-cart:hover {
      background: var(--secondary-green);
      transform: rotate(90deg);
    }

    .close-cart i {
      color: white;
      font-size: 18px;
      line-height: 1;
    }
  `;
  document.head.appendChild(style);

  // Mobile menu functionality
  const showMenuBtn = document.getElementById('showMenu');
  const hideMenuBtn = document.getElementById('hideMenu');
  const navLinks = document.getElementById('navLinks');
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  function showMenu() {
    navLinks.classList.add('nav-active');
    document.body.style.overflow = 'hidden';
    overlay.style.display = 'block';
  }

  function hideMenu() {
    navLinks.classList.remove('nav-active');
    document.body.style.overflow = '';
    overlay.style.display = 'none';
  }

  if (showMenuBtn) {
    showMenuBtn.addEventListener('click', showMenu);
  }

  if (hideMenuBtn) {
    hideMenuBtn.addEventListener('click', hideMenu);
  }

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    const isClickInsideMenu = navLinks.contains(event.target);
    const isClickOnMenuIcon = showMenuBtn && showMenuBtn.contains(event.target);
    const isClickOnCloseIcon = hideMenuBtn && hideMenuBtn.contains(event.target);
    
    if (navLinks.classList.contains('nav-active') && !isClickInsideMenu && !isClickOnMenuIcon && !isClickOnCloseIcon) {
      hideMenu();
    }
  });

  // Close menu when pressing Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && navLinks.classList.contains('nav-active')) {
      hideMenu();
    }
  });

  // Close menu when clicking on navigation links
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', hideMenu);
  });

  overlay.addEventListener('click', hideMenu);
});

// <!-- JavaScript for Seedlings Filter -->
document.addEventListener('DOMContentLoaded', function() {
  // Seedlings filtering functionality
  const seedlingsFilterBtns = document.querySelectorAll('.seedlings-filter .filter-btn');
  const seedlingsCards = document.querySelectorAll('.seedlings-container .product-card');
  
  seedlingsFilterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons
      seedlingsFilterBtns.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      const filterValue = this.getAttribute('data-filter');
      
      seedlingsCards.forEach(card => {
        if (filterValue === 'all-seedlings' || card.getAttribute('data-category') === filterValue) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
  
  // Add quantity and add-to-cart functionality for seedlings
  const seedlingMinusBtns = document.querySelectorAll('.seedlings-container .minus');
  const seedlingPlusBtns = document.querySelectorAll('.seedlings-container .plus');
  const seedlingQtyInputs = document.querySelectorAll('.seedlings-container .qty-input');
  
  seedlingMinusBtns.forEach((btn, index) => {
    btn.addEventListener('click', function() {
      let value = parseInt(seedlingQtyInputs[index].value);
      if (value > 1) {
        seedlingQtyInputs[index].value = value - 1;
      }
    });
  });
  
  seedlingPlusBtns.forEach((btn, index) => {
    btn.addEventListener('click', function() {
      let value = parseInt(seedlingQtyInputs[index].value);
      seedlingQtyInputs[index].value = value + 1;
    });
  });
  
  // Connect seedling add-to-cart buttons to main cart functionality
  const seedlingAddToCartBtns = document.querySelectorAll('.seedlings-container .add-to-cart-btn');
  
  seedlingAddToCartBtns.forEach((btn) => {
    btn.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productId = productCard.dataset.id;
      const productName = productCard.querySelector('h3').textContent;
      const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('KSh ', ''));
      const productImage = productCard.querySelector('.product-image img').src;
      const productQuantity = parseInt(productCard.querySelector('.qty-input').value);
      
      if (productQuantity > 0) {
        addToCart(productId, productName, productPrice, productImage, productQuantity);
      }
    });
  });
});

function showNotification(message) {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'notification';
  
  // Add success class for checkout success message
  if (message.includes('Checkout Successful')) {
    notification.classList.add('success');
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);

  // Add show class after a small delay to trigger animation
  setTimeout(() => notification.classList.add('show'), 10);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// *Explanation of the JavaScript Code:*

// 1.  **DOMContentLoaded Listener:** Ensures that the JavaScript code runs only after the entire HTML document has been loaded.
// 2.  *DOM Element Selection:* Selects the necessary HTML elements using their IDs and classes (navigation links, menu icons, "Add to Cart" buttons, cart count span, quantity buttons, product cards, and filter buttons).
// 3.  *Mobile Menu Toggle:*
//     * showMenu(): Adds the show-menu class to the navLinks element, which (as per your CSS) will slide the mobile menu into view.
//     * hideMenu(): Removes the show-menu class to hide the mobile menu.
//     * Event listeners are added to the hamburger (fa-bars) and close (fa-times) icons to call these functions on click.
// 4.  *Cart Count:*
//     * cartItemCount: A variable to keep track of the number of items added to the cart (basic implementation).
//     * updateCartCount(): Updates the text content of the cart-count span in the navigation.
//     * An event listener is added to each "Add to Cart" button. When clicked, it increments cartItemCount and calls updateCartCount(). *Note:* This is a very basic implementation. A real e-commerce site would need more complex logic to track individual items and quantities.
// 5.  *Quantity Selector:*
//     * Event listeners are added to the "+" and "-" buttons within each quantity selector.
//     * When the "+" button is clicked, it increments the value of the corresponding quantity input field.
//     * When the "-" button is clicked, it decrements the value (but doesn't go below 1).
// 6.  *Product Filtering:*
//     * Event listeners are added to each filter button.
//     * When a filter button is clicked:
//         * It gets the data-filter attribute value (e.g., "dairy", "poultry", "all").
//         * It updates the styling of the active filter button.
//         * It iterates through each product card. If the data-category attribute of the product card matches the filterValue (or if filterValue is "all"), the product card is shown (display: 'block'). Otherwise, it's hidden (display: 'none').

// *How to Use This:*

// 1.  **Save this code as script.js** in the same directory as your index.html file.
// 2.  **Make sure the src attribute in your <script> tag in index.html points to this file:**
//     html
//     <script src="script.js"></script>
//     </body>
//     </html>
    

// Now, when you open your index.html in a browser:

// * The hamburger menu icon in the navigation should toggle the mobile menu on smaller screens.
// * Clicking the "Add to Cart" buttons will increment the number displayed in the cart icon (with a basic alert for now).
// * Clicking the "+" and "-" buttons in the quantity selectors will update the quantity input fields.
// * Clicking the filter buttons ("Dairy", "Poultry", "Crops", "Honey") will show only the products belonging to that category. Clicking "All Products" will show all products.

// This adds the basic interactivity you requested. Remember that for a real e-commerce site, you would need to implement more advanced features like a proper shopping cart, storing cart data, handling checkout, etc. Let me know if you have any further questions!
// Citations: [[1]](https://github.com/VIVEK7755/vivek7755.github.io)
