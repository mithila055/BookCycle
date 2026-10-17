const seedBooks = [
  { id: "b1", title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", condition: "Good", price: 280, location: "Dhanmondi", seller: "Nusrat Jahan", color: "#b4664d" },
  { id: "b2", title: "Atomic Habits", author: "James Clear", category: "Self-help", condition: "Like new", price: 450, location: "Uttara", seller: "Rafi Ahmed", color: "#326c6a" },
  { id: "b3", title: "Pather Panchali", author: "Bibhutibhushan", category: "Bangla", condition: "Good", price: 220, location: "Mirpur", seller: "Maliha Khan", color: "#7a6a4e" },
  { id: "b4", title: "Sapiens", author: "Yuval Noah Harari", category: "History", condition: "Like new", price: 550, location: "Banani", seller: "Tanvir Hasan", color: "#475d79" },
  { id: "b5", title: "Norwegian Wood", author: "Haruki Murakami", category: "Fiction", condition: "Used", price: 300, location: "Mohammadpur", seller: "Sadia Rahman", color: "#806276" },
  { id: "b6", title: "Think and Grow Rich", author: "Napoleon Hill", category: "Self-help", condition: "Good", price: 190, location: "Gulshan", seller: "Arif Chowdhury", color: "#a27a4f" },
  { id: "b7", title: "Basic Physics", author: "H.C. Verma", category: "Academic", condition: "Used", price: 680, location: "Farmgate", seller: "Fahim Noor", color: "#456c81" },
  { id: "b8", title: "The Kite Runner", author: "Khaled Hosseini", category: "Fiction", condition: "Good", price: 350, location: "Bashundhara", seller: "Ayesha Karim", color: "#8a5e55" }
];

const state = {
  books: JSON.parse(localStorage.getItem("bookcycle_books") || "null") || seedBooks,
  users: JSON.parse(localStorage.getItem("bookcycle_users") || "[]"),
  messages: JSON.parse(localStorage.getItem("bookcycle_messages") || "[]"),
  orders: JSON.parse(localStorage.getItem("bookcycle_orders") || "[]"),
  favorites: JSON.parse(localStorage.getItem("bookcycle_favorites") || "[]"),
  cart: JSON.parse(localStorage.getItem("bookcycle_cart") || "[]"),
  currentUser: JSON.parse(localStorage.getItem("bookcycle_current_user") || "null"),
  view: "browse",
  filters: { query: "", category: "All categories", condition: "Any condition", location: "" }
};

const app = document.querySelector("#app");
const modalBackdrop = document.querySelector("#modal-backdrop");
const modalContent = document.querySelector("#modal-content");
const toast = document.querySelector("#toast");

function persist() {
  localStorage.setItem("bookcycle_books", JSON.stringify(state.books));
  localStorage.setItem("bookcycle_users", JSON.stringify(state.users));
  localStorage.setItem("bookcycle_messages", JSON.stringify(state.messages));
  localStorage.setItem("bookcycle_orders", JSON.stringify(state.orders));
  localStorage.setItem("bookcycle_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("bookcycle_cart", JSON.stringify(state.cart));
  localStorage.setItem("bookcycle_current_user", JSON.stringify(state.currentUser));
}

function money(value) { return `৳${Number(value).toLocaleString("en-BD")}`; }
function initials(name) { return name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase(); }
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
function coverContent(book) {
  const coverImage = book.images?.[0] || book.image;
  return coverImage
    ? `<img class="cover-image" src="${escapeHTML(coverImage)}" alt="${escapeHTML(book.title)} cover" />`
    : `<span class="cover-title">${escapeHTML(book.title)}</span><span class="cover-author">${escapeHTML(book.author)}</span>`;
}
function miniCover(book, symbol = "B") {
  const coverImage = book.images?.[0] || book.image;
  return coverImage
    ? `<span class="mini-cover mini-cover-image"><img src="${escapeHTML(coverImage)}" alt="${escapeHTML(book.title)} cover" /></span>`
    : `<span class="mini-cover" style="background:${escapeHTML(book.color || "#1d6b66")}">${symbol}</span>`;
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.add("hidden"), 2800);
}
function openModal(html) { modalContent.innerHTML = html; modalBackdrop.classList.remove("hidden"); }
function closeModal() { modalBackdrop.classList.add("hidden"); }
function requireAuth(action) {
  if (!state.currentUser) { showAuth("login"); return false; }
  return true;
}

function renderHeader() {
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === state.view));
  const unreadCount = state.currentUser ? state.messages.filter(message => message.to === state.currentUser.email && !message.read).length : 0;
  document.querySelector(".notification-dot").classList.toggle("hidden", unreadCount === 0);
  document.querySelector("#cart-count").textContent = state.cart.reduce((total, item) => total + item.quantity, 0);
  const account = document.querySelector("#account-area");
  account.innerHTML = state.currentUser
    ? `<div class="account-menu"><span class="account-name">${escapeHTML(state.currentUser.name)}</span><span class="avatar">${initials(state.currentUser.name)}</span><button class="text-button" id="logout-button">Log out</button></div>`
    : `<button class="button secondary" id="login-button">Log in</button>`;
  document.querySelector("#logout-button")?.addEventListener("click", () => {
    state.currentUser = null; persist(); render(); showToast("You have been logged out.");
  });
  document.querySelector("#login-button")?.addEventListener("click", () => showAuth("login"));
  document.querySelector("#header-list-book")?.addEventListener("click", showListingForm);
  const cartButton = document.querySelector("#cart-button");
  cartButton.onclick = () => showCart();
}

function addToCart(bookId) {
  const existing = state.cart.find(item => item.bookId === bookId);
  if (existing) existing.quantity += 1;
  else state.cart.push({ bookId, quantity: 1 });
  persist(); renderHeader(); showToast("Book added to your cart.");
}

function showCart(selectedIds = state.cart.map(item => item.bookId)) {
  if (!state.cart.length) {
    openModal(`<h2>Your cart is empty</h2><p class="modal-intro">Save books here while you decide which ones deserve a new home.</p><button class="button full" id="continue-shopping">Continue browsing</button>`);
    document.querySelector("#continue-shopping").onclick = closeModal;
    return;
  }
  const items = state.cart.map(item => ({ ...item, book: state.books.find(book => book.id === item.bookId) })).filter(item => item.book);
  const selectedItems = items.filter(item => selectedIds.includes(item.book.id));
  const total = selectedItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  openModal(`<h2>Your cart</h2><p class="modal-intro">${items.length} book${items.length > 1 ? "s" : ""} ready for checkout.</p>
    <div class="cart-selection-note">Select the books you want to order.</div><div>${items.map(item => `<div class="cart-row"><label class="cart-select"><input type="checkbox" data-cart-select="${item.book.id}" ${selectedIds.includes(item.book.id) ? "checked" : ""} aria-label="Select ${escapeHTML(item.book.title)}" /></label>${miniCover(item.book)}<div class="row-content"><strong>${escapeHTML(item.book.title)}</strong><small>${money(item.book.price)} each</small></div><div class="quantity-controls"><button data-cart-action="decrease" data-cart-id="${item.book.id}" aria-label="Decrease quantity">−</button><span class="quantity-value">${item.quantity}</span><button data-cart-action="increase" data-cart-id="${item.book.id}" aria-label="Increase quantity">+</button></div><button class="text-button" data-cart-action="remove" data-cart-id="${item.book.id}">Remove</button></div>`).join("")}</div>
    <div class="cart-total"><span>Selected total</span><span class="price">${money(total)}</span></div><div class="form-actions"><button class="button outline" id="clear-cart">Clear cart</button><button class="button coral" id="checkout-cart" ${selectedItems.length ? "" : "disabled"}>Order selected</button></div>`);
  document.querySelectorAll("[data-cart-select]").forEach(input => input.addEventListener("change", () => {
    const nextSelectedIds = [...document.querySelectorAll("[data-cart-select]:checked")].map(selected => selected.dataset.cartSelect);
    showCart(nextSelectedIds);
  }));
  document.querySelectorAll("[data-cart-action]").forEach(button => button.addEventListener("click", () => {
    const item = state.cart.find(cartItem => cartItem.bookId === button.dataset.cartId);
    if (button.dataset.cartAction === "increase") item.quantity += 1;
    if (button.dataset.cartAction === "decrease") item.quantity -= 1;
    if (button.dataset.cartAction === "remove" || item.quantity <= 0) state.cart = state.cart.filter(cartItem => cartItem.bookId !== button.dataset.cartId);
    persist(); renderHeader(); showCart(selectedIds.filter(id => state.cart.some(cartItem => cartItem.bookId === id)));
  }));
  document.querySelector("#clear-cart").onclick = () => { state.cart = []; persist(); renderHeader(); closeModal(); showToast("Cart cleared."); };
  document.querySelector("#checkout-cart").onclick = () => {
    if (!requireAuth()) return;
    showCheckout(selectedItems, selectedIds);
  };
}

function showCheckout(selectedItems, selectedIds) {
  const purchasableItems = selectedItems.filter(item => item.book.owner !== state.currentUser.email);
  if (!purchasableItems.length) {
    showToast("Your own listings cannot be ordered.");
    return;
  }
  const subtotal = purchasableItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const deliveryFee = 60;
  const total = subtotal + deliveryFee;
  openModal(`<h2>Confirm your order</h2><p class="modal-intro">Review your items and delivery details before sending the request to the sellers.</p>
    <div class="checkout-summary">${purchasableItems.map(item => `<div class="checkout-item">${miniCover(item.book)}<div class="row-content"><strong>${escapeHTML(item.book.title)}</strong><small>${item.quantity} × ${money(item.book.price)}</small></div><strong>${money(item.book.price * item.quantity)}</strong></div>`).join("")}
      <div class="checkout-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="checkout-line"><span>Delivery charge</span><strong>${money(deliveryFee)}</strong></div><div class="checkout-total"><span>Total</span><strong>${money(total)}</strong></div>
    </div>
    <form id="checkout-form"><div class="form-grid">
      <label class="form-field">Full name<input class="field" name="name" value="${escapeHTML(state.currentUser.name)}" required /></label>
      <label class="form-field">Phone number<input class="field" name="phone" type="tel" placeholder="01XXXXXXXXX" required /></label>
      <label class="form-field full-width">Delivery address<textarea class="field" name="address" rows="3" placeholder="House, road, area, city" required></textarea></label>
      <label class="form-field full-width">Payment method<select class="select" name="payment"><option>Cash on delivery</option><option>Mobile payment on delivery</option></select></label>
    </div><div class="form-actions"><button type="button" class="button secondary" id="back-to-cart">Back to cart</button><button class="button coral">Confirm order</button></div></form>`);
  document.querySelector("#back-to-cart").onclick = () => showCart(selectedIds);
  document.querySelector("#checkout-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const orderNumber = `BC-${Date.now().toString().slice(-8)}`;
    purchasableItems.forEach(item => {
      state.orders.push({ id: Date.now() + Math.random(), orderNumber, title: item.book.title, price: item.book.price * item.quantity, color: item.book.color, buyer: state.currentUser.email, seller: item.book.owner || item.book.seller, status: "Pending", customer: data.name, phone: data.phone, address: data.address, payment: data.payment });
    });
    const orderedIds = purchasableItems.map(item => item.book.id);
    state.cart = state.cart.filter(item => !orderedIds.includes(item.bookId));
    persist(); renderHeader();
    openModal(`<div class="order-success"><div class="success-mark">✓</div><h2>Order request confirmed</h2><p class="modal-intro">Your request has been sent to the seller${purchasableItems.length > 1 ? "s" : ""}.</p><div class="order-number"><span>Order number</span><strong>${orderNumber}</strong></div><p class="notice">You chose ${escapeHTML(data.payment)}. The seller will contact you to confirm availability and delivery.</p><button class="button full" id="finish-order">Continue shopping</button></div>`);
    document.querySelector("#finish-order").onclick = () => { closeModal(); state.view = "browse"; render(); };
  });
}

function bookCard(book) {
  return `<article class="book-card">
    <div class="book-cover ${book.image ? "has-image" : ""}" style="background:${escapeHTML(book.color || "#1d6b66")}">
      <span class="cover-badge">${escapeHTML(book.condition)}</span>
      ${coverContent(book)}
    </div>
    <div class="book-info">
      <h3 title="${escapeHTML(book.title)}">${escapeHTML(book.title)}</h3>
      <div class="book-meta">${escapeHTML(book.category)} · ${escapeHTML(book.location)}</div>
      <div class="book-bottom"><strong class="price">${money(book.price)}</strong><div class="card-actions"><button class="favorite-button ${state.favorites.includes(book.id) ? "saved" : ""}" data-favorite-id="${book.id}" aria-label="${state.favorites.includes(book.id) ? "Remove from saved books" : "Save book"}">${state.favorites.includes(book.id) ? "♥" : "♡"}</button><button class="button" data-book-id="${book.id}">View details</button></div></div>
    </div>
  </article>`;
}

function renderBrowse() {
  const filtered = state.books.filter(book => {
    const needle = state.filters.query.toLowerCase();
    return (!needle || `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(needle))
      && (state.filters.category === "All categories" || book.category === state.filters.category)
      && (state.filters.condition === "Any condition" || book.condition === state.filters.condition)
      && (!state.filters.location || book.location.toLowerCase().includes(state.filters.location.toLowerCase()));
  });
  app.innerHTML = `<section class="hero">
    <div><p class="eyebrow">A better way to read</p><h1>Good books deserve<br />a <em>second chapter.</em></h1></div>
    <div class="hero-actions"><p class="hero-copy">Discover affordable pre-owned books from readers around Bangladesh, or pass your own favorites forward.</p><button class="button coral" id="browse-list-book">+ Sell a book</button></div>
  </section>
  <section class="search-panel" aria-label="Book search and filters">
    <input class="field search-field" id="search-input" placeholder="Search by title, author, or keyword" value="${escapeHTML(state.filters.query)}" />
    <select class="select" id="category-filter">${["All categories", "Fiction", "Self-help", "Bangla", "History", "Academic"].map(value => `<option ${state.filters.category === value ? "selected" : ""}>${value}</option>`).join("")}</select>
    <select class="select" id="condition-filter">${["Any condition", "Like new", "Good", "Used"].map(value => `<option ${state.filters.condition === value ? "selected" : ""}>${value}</option>`).join("")}</select>
    <input class="field" id="location-filter" placeholder="Location" value="${escapeHTML(state.filters.location)}" />
  </section>
  <div class="section-heading"><h2>Freshly listed</h2><span class="result-count">${filtered.length} books found</span></div>
  <section class="book-grid">${filtered.length ? filtered.map(bookCard).join("") : `<div class="empty-state">No books match those filters.<br />Try a broader search.</div>`}</section>`;
  ["search-input", "category-filter", "condition-filter", "location-filter"].forEach(id => document.querySelector(`#${id}`).addEventListener("input", event => {
    const key = id === "search-input" ? "query" : id === "category-filter" ? "category" : id === "condition-filter" ? "condition" : "location";
    state.filters[key] = event.target.value; renderBrowse();
  }));
  document.querySelectorAll("[data-book-id]").forEach(button => button.addEventListener("click", () => showBookDetails(button.dataset.bookId)));
  document.querySelectorAll("[data-favorite-id]").forEach(button => button.addEventListener("click", () => {
    const bookId = button.dataset.favoriteId;
    state.favorites = state.favorites.includes(bookId) ? state.favorites.filter(id => id !== bookId) : [...state.favorites, bookId];
    persist(); renderBrowse(); showToast(state.favorites.includes(bookId) ? "Book saved for later." : "Book removed from saved books.");
  }));
  document.querySelector("#browse-list-book").addEventListener("click", showListingForm);
}

function renderDashboard() {
  if (!requireAuth()) return;
  const mine = state.books.filter(book => book.owner === state.currentUser.email);
  const myOrders = state.orders.filter(order => order.buyer === state.currentUser.email);
  app.innerHTML = `<div class="dashboard-top"><div><p class="eyebrow">Your reading marketplace</p><h1>Welcome, ${escapeHTML(state.currentUser.name.split(" ")[0])}.</h1></div><button class="button coral" id="add-listing">+ Sell a book</button></div>
    <section class="stats"><div class="stat"><span>Active listings</span><strong>${mine.length}</strong></div><div class="stat"><span>Purchase requests</span><strong>${myOrders.length}</strong></div><div class="stat"><span>Saved books</span><strong>${state.favorites.length}</strong></div></section>
    <div class="dashboard-grid"><section class="panel"><h2>Your listings</h2>${mine.length ? mine.map(book => `<div class="listing-row">${miniCover(book)}<div class="row-content"><strong>${escapeHTML(book.title)}</strong><small>${money(book.price)} · ${book.condition}</small></div><div class="row-actions"><button class="text-button" data-delete="${book.id}">Remove</button></div></div>`).join("") : `<div class="empty-state">You have not listed any books yet.</div>`}</section>
    <section class="panel"><h2>Messages & activity</h2>${state.messages.length || myOrders.length ? [...state.messages.filter(message => message.from === state.currentUser.email || message.to === state.currentUser.email).slice(-3).map(message => `<div class="message-row"><span class="mini-cover" style="background:var(--soft-coral);color:var(--coral)">✉</span><div class="row-content"><strong>${message.from === state.currentUser.email ? "To seller" : "New seller message"}</strong><small>${escapeHTML(message.text)}</small></div></div>`), ...myOrders.slice(-3).reverse().map(order => `<div class="message-row"><span class="mini-cover" style="background:${order.color}">↗</span><div class="row-content"><strong>Request for ${escapeHTML(order.title)}</strong><small>${order.status} · ${money(order.price)}</small></div></div>`)].join("") : `<div class="notice">Your purchase requests and seller conversations will appear here.</div>`}</section></div>`;
  document.querySelector("#add-listing").addEventListener("click", showListingForm);
  document.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => {
    state.books = state.books.filter(book => book.id !== button.dataset.delete); persist(); render(); showToast("Listing removed.");
  }));
}

function showAuth(mode = "login") {
  openModal(`<h2>${mode === "login" ? "Welcome back" : "Join BookCycle"}</h2><p class="modal-intro">${mode === "login" ? "Log in to message sellers and manage your listings." : "Create an account and give your books a new home."}</p>
    <form id="auth-form"><div class="form-grid">${mode === "register" ? `<label class="form-field full-width">Full name<input class="field" name="name" required /></label>` : ""}
      <label class="form-field full-width">Email address<input class="field" name="email" type="email" required /></label><label class="form-field full-width">Password<input class="field" name="password" type="password" minlength="6" required /></label></div><div class="form-actions"><button class="button full">${mode === "login" ? "Log in" : "Create account"}</button></div></form>
    <div class="auth-switch">${mode === "login" ? "New to BookCycle?" : "Already have an account?"} <button type="button" id="auth-switch">${mode === "login" ? "Create an account" : "Log in"}</button></div>`);
  document.querySelector("#auth-switch").addEventListener("click", () => showAuth(mode === "login" ? "register" : "login"));
  document.querySelector("#auth-form").addEventListener("submit", event => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const existing = state.users.find(user => user.email === data.email);
    if (mode === "login") {
      if (!existing || existing.password !== data.password) { showToast("Email or password is incorrect."); return; }
      state.currentUser = existing;
    } else {
      if (existing) { showToast("An account with this email already exists."); return; }
      state.currentUser = { name: data.name, email: data.email, password: data.password }; state.users.push(state.currentUser);
    }
    persist(); closeModal(); render(); showToast(mode === "login" ? "Welcome back!" : "Account created successfully.");
  });
}

function showListingForm() {
  if (!requireAuth()) return;
  let listingImages = [];
  openModal(`<h2>List a book</h2><p class="modal-intro">Tell other readers about a book you’re ready to pass on.</p><form id="listing-form"><div class="form-grid">
    <label class="form-field full-width">Book title<input class="field" name="title" required /></label><label class="form-field">Author<input class="field" name="author" required /></label><label class="form-field">Price (৳)<input class="field" name="price" type="number" min="1" required /></label>
    <div class="photo-upload form-field"><span>Book photos</span><label class="photo-upload-box" for="listing-images">📷 <strong>Add book photos</strong><small>Select multiple JPG, PNG or WebP images · each up to 2 MB</small></label><input class="visually-hidden" id="listing-images" name="images" type="file" accept="image/*" multiple /></div>
    <label class="form-field">Category<select class="select" name="category"><option>Fiction</option><option>Self-help</option><option>Bangla</option><option>History</option><option>Academic</option></select></label><label class="form-field">Condition<select class="select" name="condition"><option>Like new</option><option>Good</option><option>Used</option></select></label>
    <label class="form-field full-width">Location<input class="field" name="location" placeholder="e.g. Dhanmondi" required /></label>
    <div class="image-previews hidden" id="listing-image-previews" aria-label="Selected book photo previews"></div>
    </div><div class="form-actions"><button type="button" class="button secondary" id="cancel-listing">Cancel</button><button class="button">Publish listing</button></div></form>`);
  document.querySelector("#cancel-listing").addEventListener("click", closeModal);
  document.querySelector("#listing-images").addEventListener("change", event => {
    const files = [...event.target.files];
    const previewContainer = document.querySelector("#listing-image-previews");
    if (!files.length) { listingImages = []; previewContainer.innerHTML = ""; previewContainer.classList.add("hidden"); return; }
    if (files.some(file => !file.type.startsWith("image/"))) { event.target.value = ""; showToast("Please choose image files only."); return; }
    if (files.some(file => file.size > 2 * 1024 * 1024)) { event.target.value = ""; showToast("Each image must be smaller than 2 MB."); return; }
    Promise.all(files.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", reject);
      reader.readAsDataURL(file);
    }))).then(images => {
      listingImages = images;
      previewContainer.innerHTML = listingImages.map((image, index) => `<img src="${escapeHTML(image)}" alt="Book photo ${index + 1} preview" />`).join("");
      previewContainer.classList.remove("hidden");
    }).catch(() => showToast("Could not read the selected images."));
  });
  document.querySelector("#listing-form").addEventListener("submit", event => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
    delete data.images;
    state.books.unshift({ ...data, id: `b${Date.now()}`, price: Number(data.price), images: listingImages, image: listingImages[0] || "", seller: state.currentUser.name, owner: state.currentUser.email, color: "#1d6b66" });
    persist(); closeModal(); render(); showToast("Your book is now listed.");
  });
}

function showBookDetails(id) {
  const book = state.books.find(item => item.id === id);
  const images = book.images?.length ? book.images : (book.image ? [book.image] : []);
  const gallery = images.length > 1 ? `<div class="book-gallery">${images.map((image, index) => `<img src="${escapeHTML(image)}" alt="${escapeHTML(book.title)} photo ${index + 1}" />`).join("")}</div>` : "";
  openModal(`<div class="book-cover ${images.length ? "has-image" : ""}" style="height:180px;background:${escapeHTML(book.color)};border-radius:9px;margin-bottom:23px">${coverContent(book)}</div>${gallery}<h2>${escapeHTML(book.title)}</h2><p class="modal-intro">${escapeHTML(book.author)} · ${escapeHTML(book.category)} · ${escapeHTML(book.condition)}<br />Located in ${escapeHTML(book.location)} · Listed by ${escapeHTML(book.seller)}</p><div class="book-bottom"><strong class="price">${money(book.price)}</strong><div class="card-actions"><button class="button outline" id="add-cart">Add to cart</button><button class="button coral" id="request-book">Request this book</button></div></div>`);
  document.querySelector("#add-cart").addEventListener("click", () => { addToCart(book.id); closeModal(); });
  document.querySelector("#request-book").addEventListener("click", () => {
    if (!requireAuth()) return;
    if (book.owner === state.currentUser.email) { showToast("This is your own listing."); return; }
    state.orders.push({ id: Date.now(), title: book.title, price: book.price, color: book.color, buyer: state.currentUser.email, seller: book.owner || book.seller, status: "Pending" });
    state.messages.push({ to: book.owner || book.seller, from: state.currentUser.email, text: `I’m interested in your book, "${book.title}".`, read: false });
    persist(); closeModal(); showToast("Purchase request sent to the seller.");
  });
}

function render() {
  renderHeader();
  state.view === "dashboard" ? renderDashboard() : renderBrowse();
}

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", event => {
  event.preventDefault(); state.view = button.dataset.view; render();
}));
document.querySelector("#modal-close").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", event => { if (event.target === modalBackdrop) closeModal(); });
document.querySelector("#notification-button").addEventListener("click", () => {
  if (!state.currentUser) { showToast("Log in to view notifications."); return; }
  const unread = state.messages.filter(message => message.to === state.currentUser.email && !message.read);
  unread.forEach(message => { message.read = true; });
  persist(); renderHeader(); showToast(unread.length ? `${unread.length} message notification${unread.length > 1 ? "s" : ""} marked as read.` : "No new notifications.");
});
render();
