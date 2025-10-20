/* script.js
   Register / Login / Products / Cart / Order -> Telegram
   Mix Khmer + English labels in UI.
*/

/* ------------------ Config ------------------ */
// Put your Telegram bot token and chat id here:
const TELEGRAM_BOT_TOKEN = "8410825478:AAEmJEjU76FqCIFT-lhgEqBnTXNAAEClJjc"; // <-- paste your bot token here e.g. 123456:ABC-...
const TELEGRAM_CHAT_ID = "7176789176";   // <-- paste the chat id (destination) here

/* ------------------ Helpers ------------------ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ------------------ Sample Products (default) ------------------ */
/* Each product has an 'img' field — keep it, replace src files later */
const products = [
  { id: 1, name: "Burger (បឺហ្គឺ)", price: 5.00, img: "https://i.pinimg.com/1200x/71/f8/dd/71f8dd52a02a233c46f1ab4d88d22f7a.jpg", desc: "Juicy beef • មាំមាត់"},
  { id: 2, name: "Pizza (ភីហ្សា)", price: 8.50, img: "https://i.pinimg.com/1200x/70/84/07/7084077edde5bd6122e5d5c305140fac.jpg", desc: "Cheesy goodness"},
  { id: 3, name: "Fried Chicken (សាច់មាន់បំពង)", price: 6.00, img: "https://i.pinimg.com/736x/eb/bf/0e/ebbf0e54e8c2f6d8dd5b9fb5df59a6ac.jpg", desc: "Crispy & tasty"},
  { id: 4, name: "Sushi (ស៊ូស៊ី)", price: 10.00, img: "https://i.pinimg.com/1200x/7c/13/52/7c135253509e7cf878fa866ef3481dd1.jpg", desc: "Fresh selection"},
  { id: 5, name: "Coca-Cola (កូកា)", price: 1.50, img: "https://i.pinimg.com/736x/82/82/00/828200fd4ca6d8f82d1612ea4f5a9457.jpg", desc: "Cold drink"},
  { id: 6, name: "Salad (សាឡាដ)", price: 4.20, img: "https://i.pinimg.com/736x/15/52/6d/15526d105aa6c7c52cf0eb96cbd358aa.jpg", desc: "Healthy choice"}
];

/* ------------------ State ------------------ */
let cart = JSON.parse(localStorage.getItem("fk_cart") || "[]");
let users = JSON.parse(localStorage.getItem("fk_users") || "[]"); // basic user store
let currentUser = JSON.parse(localStorage.getItem("fk_user") || "null");

/* ------------------ DOM Elements ------------------ */
const productsEl = $("#products");
const cartEl = $("#cart");
const totalEl = $("#total");
const cartCountEl = $("#cart-count");
const authPanel = $("#auth");
const shopSection = $("#shop");
const btnLogout = $("#btn-logout");

/* ------------------ Init ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  updateAuthUI();
  document.getElementById("year").textContent = new Date().getFullYear();
});

/* ------------------ Product Rendering ------------------ */
function renderProducts() {
  productsEl.innerHTML = "";
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}" onerror="this.style.opacity=0.6; this.src='assets/placeholder.png'"/>
      <div>
        <div class="product-info">
          <h4>${p.name}</h4>
          <div class="product-price">$${p.price.toFixed(2)}</div>
        </div>
        <p style="margin:6px 0 10px; color: #6b7280;">${p.desc}</p>
        <div style="display:flex;gap:8px; align-items:center;">
          <button class="btn" data-id="${p.id}" onclick="addToCart(${p.id})">Add to Cart / បន្ថែម</button>
          <button class="btn ghost" onclick="quickAdd(${p.id})">+1</button>
        </div>
      </div>
    `;
    productsEl.appendChild(card);
  });
}

/* Quick add helper */
function quickAdd(id){
  addToCart(id);
}

/* ------------------ Cart Logic ------------------ */
function saveCart(){
  localStorage.setItem("fk_cart", JSON.stringify(cart));
}

function addToCart(id){
  const p = products.find(x => x.id === id);
  if(!p) return;
  const item = cart.find(i => i.id === id);
  if(item) item.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, qty: 1});
  saveCart();
  renderCart();
}

function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function changeQty(id, delta){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) removeFromCart(id);
  else {
    saveCart();
    renderCart();
  }
}

function clearCart(){
  if(!confirm("Clear cart? / លុបកន្ត្រក?")) return;
  cart = [];
  saveCart();
  renderCart();
}

/* Render cart UI */
function renderCart(){
  cartEl.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <img src="${item.img}" alt="${item.name}" onerror="this.style.opacity=0.6; this.src='assets/placeholder.png'"/>
      <div class="meta">
        <h5>${item.name}</h5>
        <div style="color:#6b7280;font-size:13px;">$${item.price.toFixed(2)} x ${item.qty} = $${(item.price*item.qty).toFixed(2)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div class="qty-controls">
          <button onclick="changeQty(${item.id}, -1)">-</button>
          <div style="min-width:26px;text-align:center">${item.qty}</div>
          <button onclick="changeQty(${item.id}, 1)">+</button>
        </div>
        <button style="font-size:12px;padding:6px;border-radius:8px;background:transparent;border:0;color:#ff6b6b;cursor:pointer" onclick="removeFromCart(${item.id})">Remove / លុប</button>
      </div>
    `;
    cartEl.appendChild(el);
  });

  totalEl.textContent = total.toFixed(2);
  cartCountEl.textContent = cart.reduce((s,i) => s + i.qty, 0);
}

/* ------------------ Authentication (simple) ------------------ */
function updateAuthUI(){
  if(currentUser){
    authPanel.style.display = "none";
    shopSection.style.display = "block";
    btnLogout.classList.remove("hidden");
    $("#btn-logout").onclick = logout;
    // show welcome
    const welcome = document.createElement("div");
    welcome.style.margin = "8px 0 12px";
    welcome.innerHTML = `<strong>Welcome / ស្វាគមន៍, ${currentUser.name}</strong>`;
    // inject at top of shop if not exists
    if(!document.querySelector(".welcome-banner")){
      const node = document.createElement("div");
      node.className = "welcome-banner";
      node.style.marginBottom = "10px";
      node.appendChild(welcome);
      shopSection.prepend(node);
    }
  } else {
    authPanel.style.display = "block";
    shopSection.style.display = "block";
    btnLogout.classList.add("hidden");
    const wb = document.querySelector(".welcome-banner");
    if(wb) wb.remove();
  }
}

function register(){
  const name = $("#regName").value.trim();
  const phone = $("#regPhone").value.trim();
  const pass = $("#regPass").value.trim();
  if(!name || !phone || !pass){ alert("Please fill all / សូមបំពេញទាំងអស់"); return; }
  if(users.find(u => u.phone === phone)){ alert("Phone already used / លេខបានស្នាក់"); return; }

  const user = { id: Date.now(), name, phone, pass };
  users.push(user);
  localStorage.setItem("fk_users", JSON.stringify(users));
  // auto login
  currentUser = { id: user.id, name: user.name, phone: user.phone };
  localStorage.setItem("fk_user", JSON.stringify(currentUser));
  alert("Registered and logged in / ចុះឈ្មោះរួចហើយ");
  updateAuthUI();
}

function login(){
  const phone = $("#loginPhone").value.trim();
  const pass = $("#loginPass").value.trim();
  const user = users.find(u => u.phone === phone && u.pass === pass);
  if(!user){ alert("Invalid credentials / លេខឬពាក្យសម្ងាត់ខុស"); return; }
  currentUser = { id: user.id, name: user.name, phone: user.phone };
  localStorage.setItem("fk_user", JSON.stringify(currentUser));
  alert("Welcome back / ស្វាគមន៍វិញ " + user.name);
  updateAuthUI();
}

function logout(){
  if(!confirm("Logout / ចាកចេញ?")) return;
  currentUser = null;
  localStorage.removeItem("fk_user");
  updateAuthUI();
}

/* ------------------ Order / Telegram ------------------ */
async function order(){
  if(!currentUser){
    alert("Please login or register first / សូមចូលឬចុះឈ្មោះ មុន");
    return;
  }
  if(cart.length === 0){
    alert("Cart is empty / កន្ត្រកទទេ");
    return;
  }

  // Build message (Khmer + English)
  let message = `🍽️ ការបញ្ជាទិញថ្មី / New Order!\n\n`;
  message += `🙎‍♂️ ឈ្មោះ / Name: ${currentUser.name}\n`;
  message += `📞 លេខ / Phone: ${currentUser.phone}\n\n`;
  message += `🛒 Order List:\n`;

  cart.forEach(i => {
    message += `- ${i.name} x${i.qty} = $${(i.price * i.qty).toFixed(2)}\n`;
  });

  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  message += `\n💵 តម្លៃសរុប / Total: $${total.toFixed(2)}`;

  // Send to Telegram if config provided
  if(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID){
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML"
        })
      });
      const data = await res.json();
      if(data.ok){
        alert("Order sent! / បញ្ជាទិញផ្ញើរួចហើយ");
        // optionally store orders history or clear cart
        cart = [];
        saveCart();
        renderCart();
      } else {
        console.error("Telegram error:", data);
        alert("Failed to send to Telegram. Check token/chat id. / មិនអាចផ្ញើទៅ Telegram បាន");
      }
    } catch (err){
      console.error(err);
      alert("Network error / ពិបាកភ្ជាប់");
    }
  } else {
    // If not configured, just show the message to the user to copy
    alert("Telegram token or chat id not configured.\n\nOrder preview:\n\n" + message);
  }
}

/* ------------------ UI Buttons binding ------------------ */
$("#btn-register").addEventListener("click", register);
$("#btn-login").addEventListener("click", login);
$("#btn-clear").addEventListener("click", clearCart);
$("#btn-order").addEventListener("click", order);
$("#btn-logout").addEventListener("click", logout);

$("#hero-shop").addEventListener("click", () => { window.scrollTo({ top: document.querySelector("#products").offsetTop - 80, behavior: "smooth" }); });
$("#hero-auth").addEventListener("click", () => { window.scrollTo({ top: authPanel.offsetTop - 20, behavior: "smooth" }); });

$("#btn-home").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
$("#btn-menu").addEventListener("click", () => window.scrollTo({ top: document.querySelector("#products").offsetTop - 80, behavior: "smooth" }));
$("#btn-cart").addEventListener("click", () => window.scrollTo({ top: document.querySelector("#cart-panel").offsetTop - 80, behavior: "smooth" }));

/* expose functions to global so inline onclick can use them */
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.order = order;
window.quickAdd = quickAdd;
