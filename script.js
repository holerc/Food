/*
 * Food Khmer - script.js
 * Functionality for Cart, Products, Auth, and Telegram Notification
 */

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // >>>>> ⚠️ កែប្រែតម្លៃខាងក្រោមនេះជាតម្លៃពិតរបស់អ្នក ⚠️ <<<<<
    // =================================================================
    const TELEGRAM_BOT_TOKEN = '8410825478:AAEmJEjU76FqCIFT-lhgEqBnTXNAAEClJjc'; // ឧទាហរណ៍: 123456789:ABC-DEF-GHI-JKL
    const TELEGRAM_CHAT_ID = '7176789176';      // ឧទាហរណ៍: -1001234567890 (សម្រាប់ Group) ឬ ID ផ្ទាល់ខ្លួន
    // =================================================================

    // --- 1. DOM Elements & Initial Data ---
    const productsContainer = document.getElementById('products');
    const cartGrid = document.getElementById('cart');
    const cartCount = document.getElementById('cart-count');
    const totalDisplay = document.getElementById('total');
    const btnOrder = document.getElementById('btn-order');
    const btnClear = document.getElementById('btn-clear');
    const authCard = document.getElementById('auth');
    const shopSection = document.getElementById('shop');
    const navButtons = document.querySelectorAll('.nav-btn');
    const cartPanel = document.getElementById('cart-panel');
    const logoutBtn = document.getElementById('btn-logout');

    let cart = JSON.parse(localStorage.getItem('foodKhmerCart')) || [];
    let isLoggedIn = JSON.parse(localStorage.getItem('foodKhmerLoggedIn')) || false;
    let products = [];
    
    // --- Sample Product Data (ទិន្នន័យមុខម្ហូប) ---
    const initialProducts = [
        { id: 1, name: "Amok Fish / អាម៉ុកត្រី", desc: "Traditional Khmer fish curry steamed in banana leaves.", price: 7.50, img: 'https://silkroadrecipes.com/wp-content/uploads/2024/08/Cambodian-Khmer-Fish-Amok-Recipe-square.jpg' },
        { id: 2, name: "Khmer Curry / ការីខ្មែរ", desc: "Sweet and spicy red curry with chicken and vegetables.", price: 6.80, img: 'https://angkorchef.com/wp-content/uploads/2021/09/Red-Curry.jpg' },
        { id: 3, name: "Lok Lak Beef / គោលកលាក់", desc: "Stir-fried beef served with fresh lettuce and pepper sauce.", price: 8.90, img: 'https://sreyda.com/wp-content/uploads/2024/01/lok-lak-e1756853556964.png' },
        { id: 4, name: "Kuy Teav / គុយទាវ", desc: "A hearty noodle soup, usually with pork or beef.", price: 5.50, img: 'https://grantourismotravels.com/wp-content/uploads/2021/10/Cambodian-Kuy-Teav-Recipe-Classic-Chicken-Noodle-Soup-Copyright-2022-Terence-Carter-Grantourismo-T-500x375.jpg' },
        { id: 5, name: "Nom Banh Chok / នំបញ្ចុក", desc: "Khmer rice noodles with a green fish curry sauce.", price: 6.00, img: 'https://grantourismotravels.com/wp-content/uploads/2021/02/Authentic-Nom-Banh-Chok-Recipe-Cambodian-Khmer-Noodles-Copyright-2021-Terence-Carter-Grantourismo.jpg' },
        { id: 6, name: "Mango Sticky Rice / បាយដំណើបស្វាយ", desc: "Sweet dessert with fresh mango and coconut sticky rice.", price: 4.00, img: 'https://www.voyagecambodge.com/cdn/kh-public/bey_dom_neib-MAX-w1000h600.jpg' },
        { id: 6, name: "Prahok ang chrouch / ប្រហុកអាំងជ្រុញ", desc: "​prahok grilled with herbs", price: 6.00, img: 'https://i.ytimg.com/vi/azgbm0AdfvA/sddefault.jpg' }
    ];

    // --- 2. Utility Functions ---

    /** Displays temporary message banner */
    const showMessage = (message, isError = false) => {
        const existingBanner = document.querySelector('.welcome-banner, .error-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('p');
        banner.className = `welcome-banner welcome-message ${isError ? 'error-banner' : ''}`;
        banner.textContent = message;
        shopSection.prepend(banner);

        setTimeout(() => {
            banner.style.opacity = 0;
            setTimeout(() => banner.remove(), 400);
        }, 3000);
    };

    /** Saves cart to Local Storage and updates display */
    const saveCart = () => {
        localStorage.setItem('foodKhmerCart', JSON.stringify(cart));
        updateCartDisplay();
    };

    /** Renders Product Cards */
    const renderProducts = (productsToRender) => {
        productsContainer.innerHTML = '';
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card card';
            productCard.innerHTML = `
                <img src="${product.img}" alt="${product.name}" class="product-img">
                <div class="product-body">
                    <div>
                        <div class="product-info">
                            <h4>${product.name}</h4>
                            <span class="product-price">$${product.price.toFixed(2)}</span>
                        </div>
                        <p class="product-desc">${product.desc}</p>
                    </div>
                    <div class="product-actions">
                        <button class="btn primary add-btn" data-id="${product.id}">Add to Cart / បន្ថែម</button>
                        <button class="btn quick-add-btn" data-id="${product.id}">+1</button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });
    };

    /** Renders Cart Items */
    const renderCart = () => {
        cartGrid.innerHTML = '';
        if (cart.length === 0) {
            cartGrid.innerHTML = '<p class="cart-empty" style="text-align: center; color: var(--color-text-light); margin: 0;">Cart is empty / កន្ត្រកទទេ។</p>';
            btnOrder.disabled = true;
            btnClear.disabled = true;
            return;
        }

        btnOrder.disabled = false;
        btnClear.disabled = false;

        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <p class="cart-item-price">$${item.price.toFixed(2)} x ${item.qty} = <strong>$${(item.price * item.qty).toFixed(2)}</strong></p>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-controls">
                        <button data-id="${item.id}" data-action="decrease">-</button>
                        <span>${item.qty}</span>
                        <button data-id="${item.id}" data-action="increase">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">Remove</button>
                </div>
            `;
            cartGrid.appendChild(itemElement);
        });
    };

    /** Updates Cart totals and UI */
    const updateCartDisplay = () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const count = cart.reduce((sum, item) => sum + item.qty, 0);

        totalDisplay.textContent = total.toFixed(2);
        cartCount.textContent = count;
        renderCart();
    };

    /** Toggles Visibility of Sections and sets active nav button */
    const toggleSections = (targetSection) => {
        // Reset all sections to hidden
        shopSection.classList.add('hidden');
        authCard.classList.add('hidden');
        cartPanel.classList.add('hidden'); 

        // Remove active class from nav buttons
        navButtons.forEach(btn => btn.classList.remove('active-tab'));

        if (targetSection === 'menu') {
            shopSection.classList.remove('hidden');
            cartPanel.classList.remove('hidden'); 
            document.getElementById('btn-menu').classList.add('active-tab');
        } else if (targetSection === 'cart') {
            shopSection.classList.remove('hidden'); 
            cartPanel.classList.remove('hidden');
            document.getElementById('btn-cart').classList.add('active-tab');
            
            // On mobile, scroll to cart panel
            if (window.innerWidth <= 1024) {
                 cartPanel.scrollIntoView({ behavior: 'smooth' });
            }

        } else if (targetSection === 'auth') {
            authCard.classList.remove('hidden');
            document.getElementById('btn-home').classList.add('active-tab');
        } else { // Default to Home/Menu
            shopSection.classList.remove('hidden');
            cartPanel.classList.remove('hidden');
            document.getElementById('btn-home').classList.add('active-tab');
        }

        // Handle Auth Card visibility based on login status
        authCard.classList.toggle('hidden', isLoggedIn);
        logoutBtn.classList.toggle('hidden', !isLoggedIn);
    };

    // --- 3. Cart Handlers ---

    /** Adds a product to the cart */
    const addToCart = (productId, qty = 1) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const cartItem = cart.find(item => item.id === productId);

        if (cartItem) {
            cartItem.qty += qty;
        } else {
            cart.push({ ...product, qty });
        }
        
        saveCart();
        showMessage(`${product.name.split('/')[0].trim()} (+${qty}) added to cart!`, false);
    };

    /** Changes quantity or removes item */
    const handleCartControls = (e) => {
        const target = e.target;
        const productId = parseInt(target.dataset.id);

        if (target.classList.contains('remove-btn')) {
            cart = cart.filter(item => item.id !== productId);
            showMessage("Item removed from cart.", true);
        } else if (target.dataset.action) {
            const action = target.dataset.action;
            const item = cart.find(item => item.id === productId);
            
            if (item) {
                if (action === 'increase') {
                    item.qty++;
                } else if (action === 'decrease' && item.qty > 1) {
                    item.qty--;
                } else if (action === 'decrease' && item.qty === 1) {
                    cart = cart.filter(item => item.id !== productId); // Remove if qty hits 0
                }
            }
        }
        
        saveCart();
    };

    // --- 4. Order & Telegram Notification ---

    /** Constructs and sends the order message to Telegram */
    const sendOrderToTelegram = async (orderItems, totalAmount) => {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
            console.error("Telegram API is not configured. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.");
            return false;
        }

        let orderMessage = "🔔 **NEW FOOD ORDER (Food Khmer)**\n\n";
        orderMessage += "--- **ITEMS** ---\n";
        
        orderItems.forEach(item => {
            const itemName = item.name.split('/')[0].trim();
            orderMessage += `🍜 ${itemName}\n`;
            orderMessage += `  - 💰 $${item.price.toFixed(2)} x ${item.qty} = $${(item.price * item.qty).toFixed(2)}\n`;
        });
        
        orderMessage += "\n--- **SUMMARY** ---\n";
        orderMessage += `✅ Total Amount: **$${totalAmount.toFixed(2)}**\n`;
        orderMessage += `👤 Customer (Phone): **${localStorage.getItem('userPhone') || 'Guest'}**\n`;
        orderMessage += `⏱ Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ${new Date().toLocaleDateString()}\n`;
        orderMessage += "\n_Please confirm the order immediately!_";

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: orderMessage,
                    parse_mode: 'Markdown' // Use Markdown for bold/italic formatting
                })
            });

            const result = await response.json();
            if (result.ok) {
                console.log("Telegram notification sent successfully!");
                return true;
            } else {
                console.error("Telegram API Error:", result.description);
                return false;
            }
        } catch (error) {
            console.error("Error sending order to Telegram:", error);
            return false;
        }
    };

    // --- 5. Event Listeners ---

    // Product Grid Listener
    productsContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('add-btn') || target.classList.contains('quick-add-btn')) {
            const id = parseInt(target.dataset.id);
            const qty = target.classList.contains('quick-add-btn') ? 1 : 1; 
            addToCart(id, qty);
        }
    });

    // Cart Controls Listener
    cartGrid.addEventListener('click', handleCartControls);

    // Order/Clear/Buttons
    btnClear.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire cart?')) {
            cart = [];
            saveCart();
            showMessage("Cart cleared successfully!", true);
        }
    });

    btnOrder.addEventListener('click', async () => {
        if (cart.length === 0) {
            showMessage("Your cart is empty!", true);
            return;
        }
        
        // Disable button during processing
        btnOrder.disabled = true;

        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        // ផ្ញើសារទៅកាន់ Telegram
        const success = await sendOrderToTelegram(cart, total);

        if (success) {
            alert(`Order Placed! Total: $${total.toFixed(2)}. Thank you for choosing Food Khmer!`);
            cart = [];
            saveCart();
            showMessage("Order confirmed! Your order has been sent to our team.", false);
        } else {
            showMessage("Failed to send order notification. Please check Telegram setup.", true);
        }

        // Re-enable button
        btnOrder.disabled = false;
    });

    // --- 6. Navigation & Auth Logic ---

    // Auth Handlers (Basic implementation for UI purpose)
    const handleLogin = (e) => {
        const phone = document.getElementById('loginPhone').value;
        const pass = document.getElementById('loginPass').value;

        if (phone && pass) {
            isLoggedIn = true;
            localStorage.setItem('foodKhmerLoggedIn', true);
            localStorage.setItem('userPhone', phone); // Save phone number for order
            showMessage(`Welcome back! ${phone}`, false);
            toggleSections('menu'); 
        } else {
            showMessage("Please fill in both phone and password.", true);
        }
        e.preventDefault();
    };

    const handleRegister = (e) => {
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const pass = document.getElementById('regPass').value;

        if (name && phone && pass) {
            alert(`Registration successful for ${name}. You can now log in using phone: ${phone}`);
            document.getElementById('regName').value = '';
            document.getElementById('regPhone').value = '';
            document.getElementById('regPass').value = '';
            showMessage("Registration successful! Please log in.", false);
        } else {
            showMessage("Please fill in all registration fields.", true);
        }
        e.preventDefault();
    };

    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('btn-register').addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', () => {
        isLoggedIn = false;
        localStorage.setItem('foodKhmerLoggedIn', false);
        localStorage.removeItem('userPhone');
        showMessage("Logged out successfully.", true);
        toggleSections('auth');
    });


    // Navigation Logic
    document.getElementById('btn-home').addEventListener('click', () => toggleSections('auth'));
    document.getElementById('btn-menu').addEventListener('click', () => toggleSections('menu'));
    document.getElementById('btn-cart').addEventListener('click', () => toggleSections('cart'));
    document.getElementById('hero-shop').addEventListener('click', () => toggleSections('menu'));
    document.getElementById('hero-auth').addEventListener('click', () => {
        authCard.scrollIntoView({ behavior: 'smooth' });
    });


    // --- 7. Initialization ---

    // Set Footer Year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Load products and render
    products = initialProducts;
    renderProducts(products);
    updateCartDisplay();
    
    // Set initial view
    toggleSections(isLoggedIn ? 'menu' : 'auth');
});