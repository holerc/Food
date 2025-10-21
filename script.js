/*
 * Food Khmer - script.js
 * Functionality for Cart, Products, Auth, and Telegram Notification (NEW: Payment Modal & Invoice Upload)
 */

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // >>>>> ⚠️ កែប្រែតម្លៃខាងក្រោមនេះជាតម្លៃពិតរបស់អ្នក ⚠️ <<<<<
    // =================================================================
    const TELEGRAM_BOT_TOKEN = '8410825478:AAEmJEjU76FqCIFT-lhgEqBnTXNAAEClJjc'; // Bot Token
    const TELEGRAM_CHAT_ID = '7176789176';      // Chat ID របស់អ្នក
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

    // NEW Modal Elements
    const paymentModal = document.getElementById('payment-modal');
    const modalTotalDisplay = document.getElementById('modal-total-display');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const fileInput = document.getElementById('payment-receipt-file');
    const btnConfirmOrder = document.getElementById('btn-confirm-order');


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
        { id: 7, name: "Prahok ang chrouch / ប្រហុកអាំងជ្រុញ", desc: "​prahok grilled with herbs", price: 6.00, img: 'https://i.ytimg.com/vi/azgbm0AdfvA/sddefault.jpg' }
    ];

    // --- 2. Utility Functions ---

    /** Displays temporary message banner */
    const showMessage = (message, isError = false) => {
        const existingBanner = document.querySelector('.welcome-banner, .error-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('p');
        // ✅ កែប្រែ: លុប 'welcome-message' ចេញ
        banner.className = `welcome-banner ${isError ? 'error-banner' : ''}`;
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

    /** Renders Product Cards (UNCHANGED) */
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
            // ✅ កែប្រែ: ប្រើ display name ដូច Telegram
            const displayName = item.name.split('/')[0].trim(); 
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <h5>${displayName}</h5>
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

    /** Updates Cart totals and UI (UNCHANGED) */
    const updateCartDisplay = () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const count = cart.reduce((sum, item) => sum + item.qty, 0);

        totalDisplay.textContent = total.toFixed(2);
        cartCount.textContent = count;
        renderCart();
    };

    /** Toggles Visibility of Sections and sets active nav button (UNCHANGED) */
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

    // --- 3. Cart Handlers (UNCHANGED) ---

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

    // --- 4. Order & Telegram Notification (MODIFIED to include receipt info) ---

    /** Constructs and sends the order message to Telegram */
    const sendOrderToTelegram = async (orderItems, totalAmount, receiptFile) => {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error("Telegram API is not configured.");
            return false;
        }
        
        const customerName = localStorage.getItem('userName') || 'Guest'; 
        const customerPhone = localStorage.getItem('userPhone') || 'N/A';

        // 1. Prepare Text Message
        let orderMessage = "🔔 **ការបញ្ជាទិញថ្មី**\n\n";
        orderMessage += `👤 ឈ្មោះអ្នកបញ្ជាទិញ: **${customerName}**\n`;
        orderMessage += `📞 លេខទូរស័ព្ទ: **${customerPhone}**\n`;
        orderMessage += "--- **ផលិតផល** ---\n";
        
        orderItems.forEach(item => {
            const itemName = item.name.split('/')[0].trim();
            orderMessage += `🍜 ${itemName}\n`;
            orderMessage += `  - 💰 $${item.price.toFixed(2)} x ${item.qty} = $${(item.price * item.qty).toFixed(2)}\n`;
        });
        
        orderMessage += "\n--- **SUMMARY & PAYMENT** ---\n";
        orderMessage += `✅ តម្លៃសរុប: **$${totalAmount.toFixed(2)}**\n`;
        orderMessage += `🧾 ស្ថានភាពការទូទាត់: **វិក្កយបត្រ/សំបុត្របានផ្ទុកឡើង!**\n`;
        orderMessage += `⏱ ពេលវេលា: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ${new Date().toLocaleDateString()}\n`;
        orderMessage += "\n_សូមពិនិត្យមើលវិក្កយបត្រដែលបានភ្ជាប់ដើម្បីបញ្ជាក់ការទូទាត់!_";

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        let success = false;
        try {
            // Send the text order details first
            const responseText = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: orderMessage,
                    parse_mode: 'Markdown'
                })
            });

            const resultText = await responseText.json();
            if (resultText.ok) {
                success = true;
                console.log("Telegram text notification sent successfully!");

                // 2. Upload the file (Invoice/Receipt)
                if (receiptFile) {
                    const fileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
                    const formData = new FormData();
                    formData.append('chat_id', TELEGRAM_CHAT_ID);
                    formData.append('document', receiptFile);
                    formData.append('caption', `🧾 RECEIPT for order from ${customerName}. Total: $${totalAmount.toFixed(2)}`);

                    const responseFile = await fetch(fileUrl, {
                        method: 'POST',
                        body: formData
                    });

                    const resultFile = await responseFile.json();
                    if (!resultFile.ok) {
                         console.error("Telegram File Upload Error:", resultFile.description);
                         showMessage("Order received, but failed to send receipt file!", true);
                    } else {
                         console.log("Receipt file sent successfully!");
                    }
                }
                
                return success;
            } else {
                console.error("Telegram API Error:", resultText.description);
                return false;
            }
        } catch (error) {
            console.error("Error sending order to Telegram:", error);
            return false;
        }
    };

    // --- 5. Event Listeners ---

    // Product Grid Listener (UNCHANGED)
    productsContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('add-btn') || target.classList.contains('quick-add-btn')) {
            const id = parseInt(target.dataset.id);
            const qty = target.classList.contains('quick-add-btn') ? 1 : 1; 
            addToCart(id, qty);
        }
    });

    // Cart Controls Listener (UNCHANGED)
    cartGrid.addEventListener('click', handleCartControls);

    // Order/Clear/Buttons
    btnClear.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire cart?')) {
            cart = [];
            saveCart();
            showMessage("Cart cleared successfully!", true);
        }
    });

    // OPEN MODAL: When 'Order Now' is clicked, open payment modal
    btnOrder.addEventListener('click', () => {
        if (cart.length === 0) {
            showMessage("Your cart is empty!", true);
            return;
        }
        
        if (!isLoggedIn) {
             showMessage("Please Login or Register to place an order!", true);
             toggleSections('auth');
             return;
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        // Show Modal and update total display
        modalTotalDisplay.textContent = `$${total.toFixed(2)}`;
        paymentModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Disable background scroll

        // Reset file input and disable confirm button
        fileInput.value = '';
        btnConfirmOrder.disabled = true;
    });

    // CLOSE MODAL
    btnCloseModal.addEventListener('click', () => {
        paymentModal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    // FILE INPUT CHANGE LISTENER (Enable/Disable Confirm Button)
    fileInput.addEventListener('change', () => {
        btnConfirmOrder.disabled = fileInput.files.length === 0;
    });

    // CONFIRM ORDER (Send to Telegram)
    btnConfirmOrder.addEventListener('click', async () => {
        if (!fileInput.files[0]) {
            alert('Please upload your payment receipt before confirming.');
            return;
        }

        btnConfirmOrder.disabled = true;
        btnOrder.disabled = true; // Disable main button as well

        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const receiptFile = fileInput.files[0];

        // ផ្ញើសារនិងវិក្កយបត្រទៅកាន់ Telegram
        const success = await sendOrderToTelegram(cart, total, receiptFile);

        if (success) {
            alert(`Order Placed! Total: $${total.toFixed(2)}. Thank you for choosing Food Khmer!`);
            cart = [];
            saveCart();
            showMessage("Order confirmed! Receipt uploaded successfully.", false);
            paymentModal.classList.add('hidden');
            document.body.style.overflow = '';
        } else {
            showMessage("Failed to send order notification. Please check Telegram setup.", true);
        }

        // Re-enable buttons
        btnConfirmOrder.disabled = false;
        btnOrder.disabled = false;
    });

    // --- 6. Navigation & Auth Logic ---

    // Auth Handlers
    const handleLogin = (e) => {
        const phone = document.getElementById('loginPhone').value;
        const pass = document.getElementById('loginPass').value;
        
        const assumedName = localStorage.getItem('userName') || 'Customer'; 

        if (phone && pass) {
            isLoggedIn = true;
            localStorage.setItem('foodKhmerLoggedIn', true);
            localStorage.setItem('userPhone', phone); 
            if (!localStorage.getItem('userName')) {
                localStorage.setItem('userName', assumedName); 
            }
            showMessage(`Welcome back, ${assumedName}!`, false);
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
            localStorage.setItem('userName', name);
            localStorage.setItem('userPhone', phone); 
            // ✅ កែប្រែ: Log user in immediately after registration
            isLoggedIn = true; 
            localStorage.setItem('foodKhmerLoggedIn', true);

            // alert(`Registration successful for ${name}. You can now log in using phone: ${phone}`); // លុប alert នេះចោល
            
            document.getElementById('regName').value = '';
            document.getElementById('regPhone').value = '';
            document.getElementById('regPass').value = '';
            
            showMessage(`Registration successful! Welcome, ${name}!`, false);
            toggleSections('menu'); // ✅ ប្តូរទៅ Menu ភ្លាមៗ
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
        localStorage.removeItem('userName'); 
        showMessage("Logged out successfully.", true);
        toggleSections('auth');
    });


    // Navigation Logic
    document.getElementById('btn-home').addEventListener('click', () => toggleSections(isLoggedIn ? 'menu' : 'auth')); // ✅ កែប្រែ: បើ Logged In ទៅ Menu
    document.getElementById('btn-menu').addEventListener('click', () => toggleSections('menu'));
    document.getElementById('btn-cart').addEventListener('click', () => toggleSections('cart'));
    document.getElementById('hero-shop').addEventListener('click', () => toggleSections('menu'));
    document.getElementById('hero-auth').addEventListener('click', () => {
        // ✅ កែប្រែ: បើ Logged In មិនបាច់ Scroll ទេ
        if (!isLoggedIn) {
             authCard.scrollIntoView({ behavior: 'smooth' });
        }
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