// ============================================================
// SMART CAFÉ ORDER & REVENUE MANAGEMENT SYSTEM
// script.js — All application logic, data, and state management
// ============================================================

// ─────────────────────────────────────────────
// 1. INITIAL DATA & STATE
// ─────────────────────────────────────────────

const DEFAULT_MENU = [
  // Coffee
  { id: "m001", category: "Coffee", name: "Cappuccino",   price: 180, icon: "☕", available: true },
  { id: "m002", category: "Coffee", name: "Espresso",     price: 120, icon: "☕", available: true },
  { id: "m003", category: "Coffee", name: "Latte",        price: 160, icon: "☕", available: true },
  { id: "m004", category: "Coffee", name: "Cold Coffee",  price: 200, icon: "🧊", available: true },
  // Tea
  { id: "m005", category: "Tea",    name: "Masala Tea",   price: 60,  icon: "🍵", available: true },
  { id: "m006", category: "Tea",    name: "Green Tea",    price: 80,  icon: "🍵", available: true },
  { id: "m007", category: "Tea",    name: "Lemon Tea",    price: 70,  icon: "🍵", available: true },
  // Snacks
  { id: "m008", category: "Snacks", name: "Sandwich",     price: 180, icon: "🥪", available: true },
  { id: "m009", category: "Snacks", name: "French Fries", price: 150, icon: "🍟", available: true },
  { id: "m010", category: "Snacks", name: "Burger",       price: 250, icon: "🍔", available: true },
  { id: "m011", category: "Snacks", name: "Garlic Bread", price: 120, icon: "🥖", available: true },
  // Desserts
  { id: "m012", category: "Desserts", name: "Brownie",    price: 130, icon: "🍫", available: true },
  { id: "m013", category: "Desserts", name: "Cheesecake", price: 200, icon: "🎂", available: true },
  { id: "m014", category: "Desserts", name: "Ice Cream",  price: 110, icon: "🍦", available: true },
];

const STATUS_COLORS = {
  "Pending":   { bg: "#fef3c7", text: "#92400e" },
  "New":       { bg: "#dbeafe", text: "#1e40af" },
  "Preparing": { bg: "#fed7aa", text: "#9a3412" },
  "Ready":     { bg: "#d1fae5", text: "#065f46" },
  "Completed": { bg: "#e0e7ff", text: "#3730a3" },
  "Cancelled": { bg: "#fee2e2", text: "#991b1b" },
};

const PAYMENT_COLORS = {
  "Paid":    { bg: "#d1fae5", text: "#065f46" },
  "Pending": { bg: "#fef3c7", text: "#92400e" },
  "Partial": { bg: "#fed7aa", text: "#9a3412" },
};

// ─────────────────────────────────────────────
// 2. STATE MANAGEMENT (localStorage backed)
// ─────────────────────────────────────────────

let state = {
  menu: [],
  orders: [],
  notifications: [],
  currentOrderItems: [],
  currentCustomerName: "",
  currentDiscount: 0,
  currentPaymentMethod: "Cash",
  currentPaymentStatus: "Pending",
  orderCounter: 1000,
  activeSection: "dashboard",
  menuFilterCategory: "All",
  activeOrdersFilter: "All",
  historyFilter: "today",
  historySearch: "",
  revenueFilter: "today",
  orderSearchQuery: "",
  editingMenuItem: null,
  activeOrdersSearch: "",
};

function saveState() {
  try {
    localStorage.setItem("cafeState", JSON.stringify({
      menu: state.menu,
      orders: state.orders,
      orderCounter: state.orderCounter,
      notifications: state.notifications.slice(0, 50),
    }));
  } catch (e) { /* quota */ }
}

function loadState() {
  try {
    const saved = localStorage.getItem("cafeState");
    if (saved) {
      const parsed = JSON.parse(saved);
      state.menu = parsed.menu && parsed.menu.length ? parsed.menu : DEFAULT_MENU;
      state.orders = parsed.orders || [];
      state.orderCounter = parsed.orderCounter || 1000;
      state.notifications = parsed.notifications || [];
      state.orders.forEach(o => {
        if (!o.customerCount) o.customerCount = 1;
        if (!o.tableNo) o.tableNo = "";
      });
      if (state.orders.length > 0 && !state.orders.some(o => o.status === "Pending")) {
        const candidate = state.orders.find(o => o.status === "New") || state.orders[0];
        if (candidate) candidate.status = "Pending";
      }
    } else {
      state.menu = [...DEFAULT_MENU];
      seedSampleOrders();
    }
  } catch (e) {
    state.menu = [...DEFAULT_MENU];
    seedSampleOrders();
  }
}

// ─────────────────────────────────────────────
// 3. SAMPLE DATA SEEDING
// ─────────────────────────────────────────────

function seedSampleOrders() {
  const now = Date.now();
  const day = 86400000;
  const sampleOrders = [
    { daysAgo: 0, hrs: 2, customer: "Priya S.",  items: [{id:"m001",name:"Cappuccino",price:180,qty:2,icon:"☕"},{id:"m008",name:"Sandwich",price:180,qty:1,icon:"🥪"}], status:"Completed", payment:"Paid",    method:"UPI",  discount:0 },
    { daysAgo: 0, hrs: 1, customer: "Rahul M.",  items: [{id:"m003",name:"Latte",price:160,qty:1,icon:"☕"},{id:"m009",name:"French Fries",price:150,qty:1,icon:"🍟"}], status:"Preparing", payment:"Pending", method:"Cash", discount:0 },
    { daysAgo: 0, hrs: 1, customer: "Anjali K.", items: [{id:"m010",name:"Burger",price:250,qty:2,icon:"🍔"},{id:"m013",name:"Cheesecake",price:200,qty:1,icon:"🎂"}], status:"Ready",     payment:"Paid",    method:"Card", discount:10 },
    { daysAgo: 0, hrs: 0.5, customer: "Dev P.",  items: [{id:"m002",name:"Espresso",price:120,qty:3,icon:"☕"}], status:"Pending", payment:"Pending", method:"Cash", discount:0 },
    { daysAgo: 0, hrs: 2, customer: "Sneha R.",  items: [{id:"m005",name:"Masala Tea",price:60,qty:2,icon:"🍵"},{id:"m011",name:"Garlic Bread",price:120,qty:1,icon:"🥖"}], status:"Completed", payment:"Paid", method:"UPI", discount:0 },
    { daysAgo: 0, hrs: 3, customer: "Arjun V.",  items: [{id:"m004",name:"Cold Coffee",price:200,qty:1,icon:"🧊"},{id:"m012",name:"Brownie",price:130,qty:2,icon:"🍫"}], status:"Completed", payment:"Partial", method:"Cash", discount:5 },
    { daysAgo: 0, hrs: 4, customer: "Meera T.",  items: [{id:"m006",name:"Green Tea",price:80,qty:1,icon:"🍵"}], status:"Cancelled", payment:"Pending", method:"Cash", discount:0 },
    { daysAgo: 1, hrs: 2, customer: "Kiran B.",  items: [{id:"m001",name:"Cappuccino",price:180,qty:1,icon:"☕"},{id:"m010",name:"Burger",price:250,qty:1,icon:"🍔"}], status:"Completed", payment:"Paid", method:"Card", discount:0 },
    { daysAgo: 1, hrs: 3, customer: "Priya S.",  items: [{id:"m003",name:"Latte",price:160,qty:2,icon:"☕"}], status:"Completed", payment:"Paid", method:"UPI", discount:0 },
    { daysAgo: 1, hrs: 5, customer: "Rahul M.",  items: [{id:"m009",name:"French Fries",price:150,qty:2,icon:"🍟"},{id:"m013",name:"Cheesecake",price:200,qty:1,icon:"🎂"}], status:"Completed", payment:"Paid", method:"Cash", discount:0 },
    { daysAgo: 2, hrs: 2, customer: "Dev P.",    items: [{id:"m002",name:"Espresso",price:120,qty:2,icon:"☕"},{id:"m008",name:"Sandwich",price:180,qty:2,icon:"🥪"}], status:"Completed", payment:"Paid", method:"UPI", discount:0 },
    { daysAgo: 3, hrs: 2, customer: "Anjali K.", items: [{id:"m014",name:"Ice Cream",price:110,qty:3,icon:"🍦"},{id:"m001",name:"Cappuccino",price:180,qty:1,icon:"☕"}], status:"Completed", payment:"Paid", method:"Card", discount:0 },
  ];

  sampleOrders.forEach((s, i) => {
    const orderTime = new Date(now - s.daysAgo * day - s.hrs * 3600000);
    const subtotal = s.items.reduce((a, it) => a + it.price * it.qty, 0);
    const discountAmt = Math.round(subtotal * s.discount / 100);
    const total = subtotal - discountAmt;
    const collected = s.payment === "Paid" ? total : s.payment === "Partial" ? Math.round(total * 0.6) : 0;
    state.orderCounter++;
    state.orders.push({
      id: "#" + state.orderCounter,
      customer: s.customer,
      tableNo: "T" + ((i % 6) + 1),
      customerCount: Math.floor(Math.random() * 3) + 1,
      items: s.items,
      subtotal, discount: s.discount, discountAmt, total, collected,
      paymentMethod: s.method, paymentStatus: s.payment, status: s.status,
      createdAt: orderTime.toISOString(), updatedAt: orderTime.toISOString(), notes: "",
    });
  });
}

// ─────────────────────────────────────────────
// 4. HELPERS
// ─────────────────────────────────────────────

function formatCurrency(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso) {
  return formatDate(iso) + ", " + formatTime(iso);
}

function todayStart() {
  const d = new Date(); d.setHours(0,0,0,0); return d.getTime();
}

function isToday(iso)    { return new Date(iso).getTime() >= todayStart(); }
function isYesterday(iso){ const t = new Date(iso).getTime(); const yd = todayStart()-86400000; return t>=yd && t<todayStart(); }
function isThisWeek(iso) { return new Date(iso).getTime() >= todayStart()-6*86400000; }
function isThisMonth(iso){ const d=new Date(iso); const n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }

function getUniqueCategories() {
  return ["All", ...new Set(state.menu.map(m => m.category))];
}

function generateOrderId() {
  state.orderCounter++;
  return "#" + state.orderCounter;
}

function addNotification(type, message, orderId) {
  const icons = { new:"🆕", pending:"⚠️", ready:"✅", payment:"💳", cancel:"❌", info:"ℹ️" };
  state.notifications.unshift({
    id: Date.now(),
    type, icon: icons[type]||"ℹ️", message, orderId: orderId||"",
    time: new Date().toISOString(), read: false,
  });
  if (state.notifications.length > 100) state.notifications.pop();
  updateNotificationBadge();
  saveState();
}

function updateNotificationBadge() {
  const unread = state.notifications.filter(n => !n.read).length;
  const badge = document.getElementById("notif-badge");
  if (badge) {
    badge.textContent = unread > 9 ? "9+" : unread;
    badge.style.display = unread > 0 ? "flex" : "none";
  }
}

// ─────────────────────────────────────────────
// 5. CART LOGIC
// ─────────────────────────────────────────────

function addToCart(menuId) {
  const item = state.menu.find(m => m.id === menuId);
  if (!item || !item.available) return;
  const existing = state.currentOrderItems.find(i => i.id === menuId);
  if (existing) { existing.qty++; } else { state.currentOrderItems.push({ ...item, qty: 1 }); }
  renderCart();
  showToast(item.icon + " " + item.name + " added");
}

function removeFromCart(menuId) {
  const idx = state.currentOrderItems.findIndex(i => i.id === menuId);
  if (idx === -1) return;
  if (state.currentOrderItems[idx].qty > 1) { state.currentOrderItems[idx].qty--; }
  else { state.currentOrderItems.splice(idx, 1); }
  renderCart();
}

function removeItemFromCart(menuId) {
  state.currentOrderItems = state.currentOrderItems.filter(i => i.id !== menuId);
  renderCart();
}

function clearCart() {
  state.currentOrderItems = [];
  state.currentDiscount = 0;
  const ids = ["customer-name-input","table-no-input","discount-input","order-status-select","payment-method-select","payment-status-select"];
  const defaults = ["","","0","Pending","Cash","Pending"];
  ids.forEach((id, i) => { const el = document.getElementById(id); if (el) { if (el.tagName==="SELECT") el.value=defaults[i]; else el.value=defaults[i]; } });
  renderCart();
}

function getCartTotals() {
  const subtotal = state.currentOrderItems.reduce((a, i) => a + i.price * i.qty, 0);
  const discountAmt = Math.round(subtotal * (state.currentDiscount || 0) / 100);
  const total = subtotal - discountAmt;
  return { subtotal, discountAmt, total };
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const cartEmpty = document.getElementById("cart-empty");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartDiscountEl = document.getElementById("cart-discount");
  const cartTotal = document.getElementById("cart-total");
  const placeOrderBtn = document.getElementById("place-order-btn");
  if (!cartItems) return;

  const { subtotal, discountAmt, total } = getCartTotals();

  if (state.currentOrderItems.length === 0) {
    if (cartEmpty) cartEmpty.style.display = "flex";
    cartItems.innerHTML = "";
    if (cartSubtotal) cartSubtotal.textContent = "₹0";
    if (cartDiscountEl) cartDiscountEl.textContent = "- ₹0";
    if (cartTotal) cartTotal.textContent = "₹0";
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }
  if (cartEmpty) cartEmpty.style.display = "none";
  if (placeOrderBtn) placeOrderBtn.disabled = false;

  cartItems.innerHTML = state.currentOrderItems.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-icon">${item.icon}</span>
        <div class="cart-item-details">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">${formatCurrency(item.price)} each</span>
        </div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="removeFromCart('${item.id}')">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" onclick="addToCart('${item.id}')">+</button>
        <span class="cart-item-total">${formatCurrency(item.price * item.qty)}</span>
        <button class="remove-btn" onclick="removeItemFromCart('${item.id}')">✕</button>
      </div>
    </div>
  `).join("");

  if (cartSubtotal) cartSubtotal.textContent = formatCurrency(subtotal);
  if (cartDiscountEl) cartDiscountEl.textContent = "- " + formatCurrency(discountAmt);
  if (cartTotal) cartTotal.textContent = formatCurrency(total);
}

// ─────────────────────────────────────────────
// 6. PLACE ORDER
// ─────────────────────────────────────────────

function placeOrder() {
  if (state.currentOrderItems.length === 0) { showToast("Add items first!", "error"); return; }
  const customerName = (document.getElementById("customer-name-input")?.value || "").trim() || "Walk-in Customer";
  const tableNo = (document.getElementById("table-no-input")?.value || "").trim();
  const discount = parseFloat(document.getElementById("discount-input")?.value || "0") || 0;
  const orderStatus = document.getElementById("order-status-select")?.value || "Pending";
  const paymentMethod = document.getElementById("payment-method-select")?.value || "Cash";
  const paymentStatus = document.getElementById("payment-status-select")?.value || "Pending";
  const subtotal = state.currentOrderItems.reduce((a, i) => a + i.price * i.qty, 0);
  const discountAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discountAmt;
  const collected = paymentStatus === "Paid" ? total : paymentStatus === "Partial" ? Math.round(total * 0.5) : 0;

  const order = {
    id: generateOrderId(),
    customer: customerName, tableNo, customerCount: 1,
    items: state.currentOrderItems.map(i => ({ ...i })),
    subtotal, discount, discountAmt, total, collected,
    paymentMethod, paymentStatus, status: orderStatus,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: "",
  };

  state.orders.unshift(order);
  addNotification(orderStatus === "Pending" ? "pending" : "new", `${orderStatus} order ${order.id} placed for ${order.customer}`, order.id);
  if (paymentStatus === "Pending") addNotification("payment", "Payment pending for " + order.id + " — " + formatCurrency(total), order.id);

  saveState();
  clearCart();
  showToast("✅ Order " + order.id + " placed (" + orderStatus + ")!", "success");
  navigateTo("active-orders");
}

// ─────────────────────────────────────────────
// 7. ORDER MANAGEMENT
// ─────────────────────────────────────────────

function updateOrderStatus(orderId, newStatus) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  order.updatedAt = new Date().toISOString();
  if (newStatus === "Pending") addNotification("pending", "Order " + orderId + " marked as Pending.", orderId);
  if (newStatus === "Completed" && order.paymentStatus !== "Paid") addNotification("payment", "Order " + orderId + " completed but payment is still " + order.paymentStatus + "!", orderId);
  if (newStatus === "Ready") addNotification("ready", "Order " + orderId + " is ready for pickup!", orderId);
  if (newStatus === "Cancelled") addNotification("cancel", "Order " + orderId + " has been cancelled.", orderId);
  saveState();
  renderActiveOrders();
  if (state.activeSection === "dashboard") updateDashboard();
}

function updatePaymentStatus(orderId, newPayStatus, newMethod) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  order.paymentStatus = newPayStatus;
  if (newMethod) order.paymentMethod = newMethod;
  if (newPayStatus === "Paid") order.collected = order.total;
  else if (newPayStatus === "Partial") order.collected = Math.round(order.total * 0.5);
  else order.collected = 0;
  order.updatedAt = new Date().toISOString();
  saveState();
  renderActiveOrders();
  if (state.activeSection === "dashboard") updateDashboard();
  showToast("Payment updated to " + newPayStatus + " for " + orderId, "success");
}

function markAsPaid(orderId) { updatePaymentStatus(orderId, "Paid"); renderRevenuePage(); }

function deleteOrder(orderId) {
  if (!confirm("Delete order " + orderId + "?")) return;
  state.orders = state.orders.filter(o => o.id !== orderId);
  saveState();
  renderActiveOrders();
  if (state.activeSection === "dashboard") updateDashboard();
  showToast("Order deleted.", "info");
}

// ─────────────────────────────────────────────
// 8. MENU MANAGEMENT
// ─────────────────────────────────────────────

function openMenuItemModal(itemId) {
  state.editingMenuItem = itemId || null;
  const modal = document.getElementById("menu-item-modal");
  const title = document.getElementById("menu-modal-title");
  const nameEl = document.getElementById("menu-item-name");
  const categoryEl = document.getElementById("menu-item-category");
  const priceEl = document.getElementById("menu-item-price");
  const iconEl = document.getElementById("menu-item-icon");
  const availableEl = document.getElementById("menu-item-available");

  if (itemId) {
    const item = state.menu.find(m => m.id === itemId);
    if (!item) return;
    title.textContent = "Edit Menu Item";
    nameEl.value = item.name;
    categoryEl.value = item.category;
    priceEl.value = item.price;
    iconEl.value = item.icon;
    availableEl.checked = item.available;
  } else {
    title.textContent = "Add Menu Item";
    nameEl.value = ""; categoryEl.value = "Coffee"; priceEl.value = ""; iconEl.value = "☕"; availableEl.checked = true;
  }
  modal.classList.add("active");
}

function closeMenuItemModal() {
  document.getElementById("menu-item-modal").classList.remove("active");
  state.editingMenuItem = null;
}

function saveMenuItem() {
  const name = document.getElementById("menu-item-name").value.trim();
  const category = document.getElementById("menu-item-category").value;
  const price = parseFloat(document.getElementById("menu-item-price").value);
  const icon = document.getElementById("menu-item-icon").value.trim() || "🍽️";
  const available = document.getElementById("menu-item-available").checked;
  if (!name) { showToast("Name required", "error"); return; }
  if (!price || price <= 0) { showToast("Valid price required", "error"); return; }
  if (state.editingMenuItem) {
    const item = state.menu.find(m => m.id === state.editingMenuItem);
    if (item) Object.assign(item, { name, category, price, icon, available });
  } else {
    state.menu.push({ id: "m" + Date.now().toString().slice(-6), category, name, price, icon, available });
  }
  saveState();
  closeMenuItemModal();
  renderMenuPage();
  renderMenuGrid();
  showToast("Menu item " + (state.editingMenuItem ? "updated" : "added") + "!", "success");
}

function deleteMenuItem(itemId) {
  if (!confirm("Delete this menu item?")) return;
  state.menu = state.menu.filter(m => m.id !== itemId);
  saveState(); renderMenuPage(); renderMenuGrid();
  showToast("Menu item deleted.", "info");
}

function toggleMenuItemAvailability(itemId) {
  const item = state.menu.find(m => m.id === itemId);
  if (!item) return;
  item.available = !item.available;
  saveState(); renderMenuPage(); renderMenuGrid();
}

// ─────────────────────────────────────────────
// 9. DASHBOARD STATS
// ─────────────────────────────────────────────

function getDashboardStats() {
  const td = state.orders.filter(o => isToday(o.createdAt));
  const nonCancelled = td.filter(o => o.status !== "Cancelled");
  const totalSalesToday = nonCancelled.reduce((a, o) => a + o.total, 0);
  const collectedToday = nonCancelled.reduce((a, o) => a + o.collected, 0);
  const itemCount = {};
  state.orders.filter(o => o.status !== "Cancelled").forEach(o => o.items.forEach(i => { itemCount[i.name] = (itemCount[i.name]||0)+i.qty; }));
  const mostOrdered = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
  return {
    totalOrdersToday: td.length,
    completedToday: td.filter(o=>o.status==="Completed").length,
    pendingOrders: td.filter(o=>!["Completed","Cancelled"].includes(o.status)).length,
    cancelledToday: td.filter(o=>o.status==="Cancelled").length,
    totalSalesToday, collectedToday,
    pendingPaymentToday: totalSalesToday - collectedToday,
    uniqueCustomers: new Set(td.map(o=>o.customer)).size,
    mostOrdered,
  };
}

function getWeeklySales() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
    const nd = new Date(d); nd.setDate(nd.getDate()+1);
    const ords = state.orders.filter(o=>{const t=new Date(o.createdAt).getTime(); return t>=d.getTime()&&t<nd.getTime()&&o.status!=="Cancelled";});
    days.push({ label: d.toLocaleDateString("en-IN",{weekday:"short"}), sales: ords.reduce((a,o)=>a+o.total,0), orders: ords.length });
  }
  return days;
}

function getMonthlySales() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth()-i,1); d.setHours(0,0,0,0);
    const nm = new Date(d); nm.setMonth(nm.getMonth()+1);
    const ords = state.orders.filter(o=>{const t=new Date(o.createdAt).getTime(); return t>=d.getTime()&&t<nm.getTime()&&o.status!=="Cancelled";});
    months.push({ label: d.toLocaleDateString("en-IN",{month:"short"}), sales: ords.reduce((a,o)=>a+o.total,0), orders: ords.length });
  }
  return months;
}

function getPaymentBreakdown() {
  const today = state.orders.filter(o=>isToday(o.createdAt)&&o.status!=="Cancelled");
  const b = {Cash:0,UPI:0,Card:0};
  today.forEach(o=>{if(b[o.paymentMethod]!==undefined) b[o.paymentMethod]+=o.total;});
  return b;
}

// ─────────────────────────────────────────────
// 10. REVENUE DATA
// ─────────────────────────────────────────────

function getRevenueData(filter) {
  let orders;
  if (filter==="today") orders=state.orders.filter(o=>isToday(o.createdAt));
  else if (filter==="week") orders=state.orders.filter(o=>isThisWeek(o.createdAt));
  else orders=state.orders.filter(o=>isThisMonth(o.createdAt));
  const nc = orders.filter(o=>o.status!=="Cancelled");
  const totalOrderValue = nc.reduce((a,o)=>a+o.total,0);
  const collected = nc.reduce((a,o)=>a+o.collected,0);
  return {
    totalOrderValue, collected, pending: totalOrderValue-collected,
    unpaidOrders: nc.filter(o=>o.paymentStatus==="Pending"),
    partialOrders: nc.filter(o=>o.paymentStatus==="Partial"),
    cancelledOrders: orders.filter(o=>o.status==="Cancelled"),
    discountedOrders: nc.filter(o=>o.discountAmt>0),
    totalDiscounts: nc.filter(o=>o.discountAmt>0).reduce((a,o)=>a+o.discountAmt,0),
  };
}

// ─────────────────────────────────────────────
// 11. CHARTS (Canvas)
// ─────────────────────────────────────────────

function formatCurrencyShort(n) {
  if (n >= 100000) return "₹"+(n/100000).toFixed(1)+"L";
  if (n >= 1000) return "₹"+(n/1000).toFixed(1)+"k";
  return "₹"+Math.round(n);
}

function drawBarChart(canvasId, labels, values, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 300;
  const H = canvas.offsetHeight || 200;
  canvas.width = W; canvas.height = H;
  ctx.clearRect(0,0,W,H);
  if (!values.length) return;
  const max = Math.max(...values, 1);
  const padL=60, padR=16, padT=20, padB=40;
  const chartW=W-padL-padR, chartH=H-padT-padB;
  const gap=chartW/labels.length;
  const barW=Math.max(8, gap*0.55);

  for (let i=0;i<=4;i++) {
    const y=padT+chartH-(chartH*i/4);
    ctx.strokeStyle="#e5e7eb"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
    ctx.fillStyle="#9ca3af"; ctx.font="11px Inter,sans-serif"; ctx.textAlign="right";
    ctx.fillText(formatCurrencyShort(max*i/4), padL-6, y+4);
  }

  labels.forEach((label,i)=>{
    const x=padL+i*gap+gap/2-barW/2;
    const barH=Math.max(2,(values[i]/max)*chartH);
    const y=padT+chartH-barH;
    const grad=ctx.createLinearGradient(0,y,0,y+barH);
    grad.addColorStop(0, color); grad.addColorStop(1, color+"99");
    ctx.fillStyle=grad;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x,y,barW,barH,[4,4,0,0]); ctx.fill(); }
    else { ctx.fillRect(x,y,barW,barH); }
    ctx.fillStyle="#6b7280"; ctx.font="11px Inter,sans-serif"; ctx.textAlign="center";
    ctx.fillText(label, x+barW/2, H-8);
  });
}

function drawDonutChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 300;
  const H = canvas.offsetHeight || 200;
  canvas.width = W; canvas.height = H;
  ctx.clearRect(0,0,W,H);
  const colors = ["#8B4513","#D2691E","#CD853F","#DEB887"];
  const total = Object.values(data).reduce((a,v)=>a+v,0)||1;
  const cx=W*0.38, cy=H/2, r=Math.min(cx,cy)-16;
  let sa=-Math.PI/2;
  const entries = Object.entries(data).filter(([,v])=>v>0);
  entries.forEach(([key,val],i)=>{
    const slice=(val/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,sa,sa+slice); ctx.closePath();
    ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
    sa+=slice;
  });
  ctx.beginPath(); ctx.arc(cx,cy,r*0.55,0,Math.PI*2);
  ctx.fillStyle=document.documentElement.style.getPropertyValue("--card-bg")||"#fff"; ctx.fill();

  // center text
  ctx.fillStyle="#374151"; ctx.font="bold 13px Inter,sans-serif"; ctx.textAlign="center";
  ctx.fillText(formatCurrencyShort(total), cx, cy-4);
  ctx.fillStyle="#9ca3af"; ctx.font="10px Inter"; ctx.fillText("Today", cx, cy+12);

  // legend
  const lx=W*0.68;
  entries.forEach(([key,val],i)=>{
    const y=cy-((entries.length-1)*14)+i*30;
    ctx.fillStyle=colors[i%colors.length];
    if (ctx.roundRect){ctx.beginPath();ctx.roundRect(lx,y-8,11,11,2);ctx.fill();}
    else ctx.fillRect(lx,y-8,11,11);
    ctx.fillStyle="#374151"; ctx.font="11px Inter"; ctx.textAlign="left";
    ctx.fillText(key, lx+16, y+1);
    ctx.fillStyle="#6b7280"; ctx.font="10px Inter";
    ctx.fillText(formatCurrencyShort(val), lx+16, y+13);
  });
}

function renderAllCharts() {
  const weekly=getWeeklySales(); const monthly=getMonthlySales();
  drawBarChart("weekly-chart", weekly.map(d=>d.label), weekly.map(d=>d.sales), "#8B4513");
  drawBarChart("monthly-chart", monthly.map(d=>d.label), monthly.map(d=>d.sales), "#D2691E");
  drawBarChart("weekly-orders-chart", weekly.map(d=>d.label), weekly.map(d=>d.orders), "#CD853F");
  drawDonutChart("payment-donut", getPaymentBreakdown());
}

// ─────────────────────────────────────────────
// 12. RENDER FUNCTIONS
// ─────────────────────────────────────────────

function setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }

function updateDashboard() {
  const stats = getDashboardStats();
  setEl("stat-total-orders", stats.totalOrdersToday);
  setEl("stat-completed", stats.completedToday);
  setEl("stat-pending", stats.pendingOrders);
  setEl("stat-cancelled", stats.cancelledToday);
  setEl("stat-sales", formatCurrency(stats.totalSalesToday));
  setEl("stat-pending-payment", formatCurrency(stats.pendingPaymentToday));
  setEl("stat-customers", stats.uniqueCustomers);

  const moEl = document.getElementById("most-ordered-list");
  if (moEl) {
    moEl.innerHTML = stats.mostOrdered.map((item,i)=>`
      <div class="most-ordered-item">
        <span class="rank">#${i+1}</span>
        <span class="item-name">${item.name}</span>
        <div class="item-bar"><div class="item-bar-fill" style="width:${(item.count/(stats.mostOrdered[0]?.count||1))*100}%"></div></div>
        <span class="item-count">${item.count}</span>
      </div>
    `).join("");
  }

  const activeW = document.getElementById("dashboard-active-orders");
  if (activeW) {
    const active=state.orders.filter(o=>!["Completed","Cancelled"].includes(o.status)).slice(0,6);
    activeW.innerHTML = active.length ? active.map(o=>`
      <div class="dash-order-row" onclick="navigateTo('active-orders')">
        <span class="order-id-badge">${o.id}</span>
        <span class="order-customer">${o.customer}</span>
        <span class="status-chip sm" style="background:${STATUS_COLORS[o.status]?.bg};color:${STATUS_COLORS[o.status]?.text}">${o.status}</span>
        <span class="order-amount">${formatCurrency(o.total)}</span>
      </div>`).join("") : `<div class="empty-state-sm">No orders right now</div>`;
  }

  const pendW = document.getElementById("dashboard-pending-payments");
  if (pendW) {
    const pp=state.orders.filter(o=>o.paymentStatus!=="Paid"&&o.status!=="Cancelled").slice(0,6);
    pendW.innerHTML = pp.length ? pp.map(o=>`
      <div class="dash-order-row pending-row" onclick="navigateTo('revenue')">
        <span class="order-id-badge">${o.id}</span>
        <span class="order-customer">${o.customer}</span>
        <span class="payment-chip sm" style="background:${PAYMENT_COLORS[o.paymentStatus]?.bg};color:${PAYMENT_COLORS[o.paymentStatus]?.text}">${o.paymentStatus}</span>
        <span class="order-amount danger">${formatCurrency(o.total-o.collected)}</span>
      </div>`).join("") : `<div class="empty-state-sm">No pending payments 🎉</div>`;
  }

  setTimeout(renderAllCharts, 60);
}

function renderMenuGrid() {
  const grid = document.getElementById("menu-grid");
  const catBar = document.getElementById("menu-category-bar");
  if (!grid) return;
  const categories = getUniqueCategories();
  if (catBar) {
    catBar.innerHTML = categories.map(cat=>`
      <button class="cat-btn ${state.menuFilterCategory===cat?"active":""}" onclick="filterMenuCategory('${cat}')">${cat}</button>
    `).join("");
  }
  const filtered = state.menuFilterCategory==="All" ? state.menu : state.menu.filter(m=>m.category===state.menuFilterCategory);
  grid.innerHTML = filtered.map(item=>`
    <button class="menu-card ${!item.available?"unavailable":""}" onclick="${item.available?"addToCart('"+item.id+"')":""}">
      <span class="menu-card-icon">${item.icon}</span>
      <span class="menu-card-name">${item.name}</span>
      <span class="menu-card-price">${formatCurrency(item.price)}</span>
      ${!item.available?'<span class="unavailable-tag">Unavailable</span>':""}
    </button>
  `).join("");
}

function filterMenuCategory(cat) { state.menuFilterCategory=cat; renderMenuGrid(); }

function renderActiveOrders() {
  const container = document.getElementById("active-orders-list");
  if (!container) return;
  let orders = [...state.orders];
  if (state.activeOrdersFilter!=="All") orders=orders.filter(o=>o.status===state.activeOrdersFilter);
  const search=(state.activeOrdersSearch||"").toLowerCase();
  if (search) orders=orders.filter(o=>o.id.toLowerCase().includes(search)||o.customer.toLowerCase().includes(search));

  if (!orders.length) { container.innerHTML=`<div class="empty-state"><span>📋</span><p>No orders found</p></div>`; return; }

  container.innerHTML = orders.map(o=>`
    <div class="order-card ${o.paymentStatus!=="Paid"&&o.status!=="Cancelled"?"has-pending-payment":""}">
      <div class="order-card-header">
        <div class="order-card-id-group">
          <span class="order-id-badge large">${o.id}</span>
          ${o.tableNo?`<span class="table-badge">🪑 ${o.tableNo}</span>`:""}
          <span class="order-time">${formatDateTime(o.createdAt)}</span>
        </div>
        <div class="order-card-actions">
          <select class="status-select" onchange="updateOrderStatus('${o.id}',this.value)" ${o.status==="Cancelled"?"disabled":""}>
            ${["Pending","New","Preparing","Ready","Completed","Cancelled"].map(s=>`<option value="${s}" ${o.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
          <button class="icon-btn danger" onclick="deleteOrder('${o.id}')" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="order-card-body">
        <div class="order-customer-info">
          <span class="customer-avatar">${o.customer[0]}</span>
          <div><strong>${o.customer}</strong>${o.tableNo?`<span class="sub-text"> · Table ${o.tableNo}</span>`:""}</div>
        </div>
        <div class="order-items-list">${o.items.map(i=>`<span class="order-item-chip">${i.icon} ${i.name} ×${i.qty}</span>`).join("")}</div>
      </div>
      <div class="order-card-footer">
        <div class="order-amounts">
          <span class="amount-label">Total: <strong>${formatCurrency(o.total)}</strong></span>
          ${o.discountAmt>0?`<span class="discount-text">Discount: -${formatCurrency(o.discountAmt)} (${o.discount}%)</span>`:""}
        </div>
        <div class="payment-controls">
          <span class="status-chip sm" style="background:${STATUS_COLORS[o.status]?.bg};color:${STATUS_COLORS[o.status]?.text}">${o.status}</span>
          <span class="payment-chip sm" style="background:${PAYMENT_COLORS[o.paymentStatus]?.bg};color:${PAYMENT_COLORS[o.paymentStatus]?.text}">${o.paymentStatus}</span>
          <span class="method-badge">${o.paymentMethod}</span>
          ${o.paymentStatus!=="Paid"&&o.status!=="Cancelled"?`<button class="pay-now-btn" onclick="markAsPaid('${o.id}')">Mark Paid ✓</button>`:""}
        </div>
        ${o.paymentStatus!=="Paid"&&o.status!=="Cancelled"?`<div class="pending-alert">⚠️ ${formatCurrency(o.total-o.collected)} payment pending</div>`:""}
      </div>
    </div>
  `).join("");
}

function renderMenuPage() {
  const container = document.getElementById("menu-page-list");
  if (!container) return;
  const categories = [...new Set(state.menu.map(m=>m.category))];
  container.innerHTML = categories.map(cat=>`
    <div class="menu-category-section">
      <h3 class="menu-cat-title">${cat}</h3>
      <div class="menu-admin-grid">
        ${state.menu.filter(m=>m.category===cat).map(item=>`
          <div class="menu-admin-card ${!item.available?"unavailable":""}">
            <div class="menu-admin-icon">${item.icon}</div>
            <div class="menu-admin-info">
              <span class="menu-admin-name">${item.name}</span>
              <span class="menu-admin-price">${formatCurrency(item.price)}</span>
            </div>
            <div class="menu-admin-badge">
              <button class="avail-toggle ${item.available?"avail":"unavail"}" onclick="toggleMenuItemAvailability('${item.id}')">${item.available?"Available":"Unavailable"}</button>
            </div>
            <div class="menu-admin-actions">
              <button class="icon-btn" onclick="openMenuItemModal('${item.id}')">✏️</button>
              <button class="icon-btn danger" onclick="deleteMenuItem('${item.id}')">🗑️</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function renderOrderHistory() {
  const body = document.getElementById("order-history-table-body");
  if (!body) return;
  let orders = [...state.orders];
  const filter=state.historyFilter; const search=(state.historySearch||"").toLowerCase();
  if (filter==="today") orders=orders.filter(o=>isToday(o.createdAt));
  else if (filter==="yesterday") orders=orders.filter(o=>isYesterday(o.createdAt));
  else if (filter==="week") orders=orders.filter(o=>isThisWeek(o.createdAt));
  else if (filter==="month") orders=orders.filter(o=>isThisMonth(o.createdAt));
  if (search) orders=orders.filter(o=>o.id.toLowerCase().includes(search)||o.customer.toLowerCase().includes(search));
  if (!orders.length) { body.innerHTML=`<tr><td colspan="8" class="table-empty">No orders found for this period</td></tr>`; return; }
  body.innerHTML = orders.map(o=>`
    <tr class="${o.paymentStatus==="Pending"&&o.status!=="Cancelled"?"row-pending":""}">
      <td><span class="order-id-badge">${o.id}</span></td>
      <td>${o.customer}</td>
      <td class="items-cell">${o.items.map(i=>i.icon+" "+i.name+"×"+i.qty).join(", ")}</td>
      <td>${formatCurrency(o.total)}</td>
      <td><span class="payment-chip sm" style="background:${PAYMENT_COLORS[o.paymentStatus]?.bg};color:${PAYMENT_COLORS[o.paymentStatus]?.text}">${o.paymentStatus}</span></td>
      <td><span class="status-chip sm" style="background:${STATUS_COLORS[o.status]?.bg};color:${STATUS_COLORS[o.status]?.text}">${o.status}</span></td>
      <td>${o.paymentMethod}</td>
      <td class="time-cell">${formatDateTime(o.createdAt)}</td>
    </tr>
  `).join("");
}

function renderRevenuePage() {
  const data = getRevenueData(state.revenueFilter);
  setEl("rev-total-value", formatCurrency(data.totalOrderValue));
  setEl("rev-collected", formatCurrency(data.collected));
  setEl("rev-pending", formatCurrency(data.pending));
  setEl("rev-discounts", formatCurrency(data.totalDiscounts));
  const pct = data.totalOrderValue>0?(data.collected/data.totalOrderValue)*100:0;
  const pb = document.getElementById("rev-progress-bar");
  if (pb) pb.style.width=pct.toFixed(1)+"%";
  setEl("rev-progress-pct", pct.toFixed(1)+"% collected");

  const renderList = (elId, items, emptyMsg, rowFn) => {
    const el=document.getElementById(elId);
    if (el) el.innerHTML = items.length ? items.map(rowFn).join("") : `<div class="empty-state-sm">${emptyMsg}</div>`;
  };

  renderList("rev-unpaid-list", data.unpaidOrders, "✅ No unpaid orders", o=>`
    <div class="rev-order-row">
      <span class="order-id-badge">${o.id}</span><span>${o.customer}</span><span>${o.paymentMethod}</span>
      <span class="danger-text">${formatCurrency(o.total)}</span>
      <span class="status-chip sm" style="background:${STATUS_COLORS[o.status]?.bg};color:${STATUS_COLORS[o.status]?.text}">${o.status}</span>
      <button class="pay-now-btn sm" onclick="markAsPaid('${o.id}')">Mark Paid</button>
    </div>`);

  renderList("rev-partial-list", data.partialOrders, "✅ No partial payments", o=>`
    <div class="rev-order-row">
      <span class="order-id-badge">${o.id}</span><span>${o.customer}</span>
      <span>${formatCurrency(o.collected)} / ${formatCurrency(o.total)}</span>
      <span class="warning-text">${formatCurrency(o.total-o.collected)} pending</span>
      <button class="pay-now-btn sm" onclick="markAsPaid('${o.id}')">Mark Paid</button>
    </div>`);

  renderList("rev-cancelled-list", data.cancelledOrders, "No cancelled orders", o=>`
    <div class="rev-order-row">
      <span class="order-id-badge">${o.id}</span><span>${o.customer}</span>
      <span>${o.items.map(i=>i.name+"×"+i.qty).join(", ")}</span>
      <span>${formatCurrency(o.total)}</span><span class="time-text">${formatDateTime(o.createdAt)}</span>
    </div>`);

  renderList("rev-discount-list", data.discountedOrders, "No discounted orders", o=>`
    <div class="rev-order-row">
      <span class="order-id-badge">${o.id}</span><span>${o.customer}</span>
      <span>${o.discount}% off</span><span class="warning-text">-${formatCurrency(o.discountAmt)}</span>
      <span>${formatCurrency(o.total)}</span>
    </div>`);
}

function renderNotifications() {
  const panel = document.getElementById("notifications-panel");
  if (!panel) return;
  if (!state.notifications.length) { panel.innerHTML=`<div class="empty-state-sm">No notifications yet</div>`; return; }
  panel.innerHTML = state.notifications.slice(0,30).map(n=>`
    <div class="notif-item ${n.read?"read":"unread"}">
      <span class="notif-icon">${n.icon}</span>
      <div class="notif-body"><p>${n.message}</p><span class="notif-time">${formatTime(n.time)}</span></div>
    </div>
  `).join("");
  state.notifications.forEach(n=>n.read=true);
  updateNotificationBadge(); saveState();
}

// ─────────────────────────────────────────────
// 13. NAVIGATION
// ─────────────────────────────────────────────

function navigateTo(section) {
  state.activeSection = section;
  document.querySelectorAll(".nav-link").forEach(el=>el.classList.toggle("active", el.dataset.section===section));
  document.querySelectorAll(".page-section").forEach(el=>el.classList.toggle("active", el.id==="section-"+section));
  document.getElementById("sidebar")?.classList.remove("open");
  const sectionTitles = {
    "dashboard":"Dashboard","new-order":"New Order","active-orders":"Orders",
    "menu":"Menu Management","history":"Order History","revenue":"Revenue Monitoring",
    "notifications":"Notifications","settings":"Settings"
  };
  setEl("page-title", sectionTitles[section]||section);
  switch(section) {
    case "dashboard": updateDashboard(); break;
    case "new-order": renderMenuGrid(); renderCart(); break;
    case "active-orders": renderActiveOrders(); break;
    case "menu": renderMenuPage(); break;
    case "history": renderOrderHistory(); break;
    case "revenue": renderRevenuePage(); break;
    case "notifications": renderNotifications(); break;
  }
}

// ─────────────────────────────────────────────
// 14. TOAST
// ─────────────────────────────────────────────

function showToast(msg, type) {
  type = type || "info";
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add("show"));
  setTimeout(()=>{ toast.classList.remove("show"); setTimeout(()=>toast.remove(), 300); }, 3000);
}

// ─────────────────────────────────────────────
// 15. EVENT HANDLERS
// ─────────────────────────────────────────────

function handleActiveOrdersSearch(e) { state.activeOrdersSearch=e.target.value; renderActiveOrders(); }
function handleHistorySearch(e) { state.historySearch=e.target.value; renderOrderHistory(); }
function handleDiscountChange(e) { let v=parseFloat(e.target.value)||0; if(v<0)v=0; if(v>100)v=100; state.currentDiscount=v; renderCart(); }
function setHistoryFilter(f) { state.historyFilter=f; document.querySelectorAll(".hist-filter-btn").forEach(b=>b.classList.toggle("active",b.dataset.filter===f)); renderOrderHistory(); }
function setActiveOrdersFilter(f) { state.activeOrdersFilter=f; document.querySelectorAll(".ao-filter-btn").forEach(b=>b.classList.toggle("active",b.dataset.filter===f)); renderActiveOrders(); }
function setRevenueFilter(f) { state.revenueFilter=f; document.querySelectorAll(".rev-filter-btn").forEach(b=>b.classList.toggle("active",b.dataset.filter===f)); renderRevenuePage(); }
function toggleSidebar() { document.getElementById("sidebar")?.classList.toggle("open"); }
function toggleNotifications() { const p=document.getElementById("notif-dropdown"); if(!p) return; const open=p.classList.toggle("open"); if(open) renderNotifications(); }

function clearAllData() {
  if(!confirm("Delete ALL data and reset to sample data?")) return;
  localStorage.removeItem("cafeState"); location.reload();
}

function exportData() {
  const data=JSON.stringify({menu:state.menu,orders:state.orders},null,2);
  const blob=new Blob([data],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="cafe-data-"+new Date().toISOString().slice(0,10)+".json"; a.click();
  URL.revokeObjectURL(url); showToast("Data exported!", "success");
}

// ─────────────────────────────────────────────
// 16. CLOCK
// ─────────────────────────────────────────────

function startClock() {
  function tick() {
    const now=new Date();
    setEl("current-time", now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    setEl("current-date", now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
  }
  tick(); setInterval(tick,1000);
}

// ─────────────────────────────────────────────
// 17. INIT
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", ()=>{
  loadState();
  startClock();
  navigateTo("dashboard");
  updateNotificationBadge();

  const pp=state.orders.filter(o=>o.paymentStatus==="Pending"&&isToday(o.createdAt));
  if (pp.length) addNotification("pending", pp.length+" order(s) have pending payments today");

  let resizeTimer;
  window.addEventListener("resize", ()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{ if(state.activeSection==="dashboard") renderAllCharts(); },200); });

  document.addEventListener("click", e=>{
    const d=document.getElementById("notif-dropdown"); const btn=document.getElementById("notif-btn");
    if(d&&!d.contains(e.target)&&e.target!==btn&&!btn?.contains(e.target)) d.classList.remove("open");
  });
});
