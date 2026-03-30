// 🔥 Firebase import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBwQ-Oc7e_MVNiwPRBBEtaEL43f2yS2gyw",
  authDomain: "rice-shop-43a1d.firebaseapp.com",
  projectId: "rice-shop-43a1d",
  storageBucket: "rice-shop-43a1d.firebasestorage.app",
  messagingSenderId: "827517885866",
  appId: "1:827517885866:web:6d9ae1832d7f019a649fd3"
};

// 🔥 Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Get selected category
const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("category");

// 🔹 Global variables
let allProducts = [];

// 🔹 Fetch products and display
onSnapshot(collection(db, "products"), (snapshot) => {
  allProducts = [];
  snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));

  if (selectedCategory === "rice") showRice();
  else if (selectedCategory === "bellfresh") showBellFresh();
  else displayProducts(allProducts);
});

// 🔹 Display products function
function displayProducts(products) {
  const productsDiv = document.getElementById("products");
  productsDiv.innerHTML = "";

  products.forEach(p => {
    let firstLabel = (p.category === "bellfresh") ? "Packets" : "Bags";
    let secondLabel = (p.category === "bellfresh") ? "Pieces" : "Quintal";
    let secondClass = (p.category === "bellfresh") ? "pieces" : "quintal";
    let unitText = (p.category === "bellfresh") ? `${p.weight} pieces` : `${p.weight} kg`;

    productsDiv.innerHTML += `
      <div class="product-card">
        <img src="images/${p.image}" class="icon">
        <div class="details">
          <h3>
            ${p.teluguName || ""} <br>
            <small>${p.name} (${unitText})</small>
          </h3>
          <div class="price">₹${p.price}</div>
          <div class="labels">
            <span>${firstLabel}</span>
            <span>${secondLabel}</span>
          </div>
          <div class="inputs">
            <input type="number" value="0" id="qty-${p.id}" 
                   oninput="calculate(this, ${p.weight}, '${p.category}')">
            <input type="text" class="${secondClass}" value="0.00" readonly>
          </div>
          <button onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.category}')">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  });
}

// 🔹 Filter functions
function showRice() {
  const rice = allProducts.filter(p => p.category === "rice");
  displayProducts(rice);
}

function showBellFresh() {
  const bell = allProducts.filter(p => p.category === "bellfresh");
  displayProducts(bell);
}

// 🔹 Navigation
window.goToProducts = (category) => window.location.href = "product.html?category=" + category;
window.goBack = () => window.history.back();
window.goToCategory = (category) => window.location.href = "product.html?category=" + category;

// 🔹 Calculate function
window.calculate = (input, kg, category) => {
  let bags = parseFloat(input.value) || 0;
  kg = parseFloat(kg) || 0;
  let card = input.closest(".product-card");

  if (category === "bellfresh") {
    let p = card.querySelector(".pieces");
    if (p) p.value = isNaN(bags * kg) ? 0 : bags * kg;
  } else {
    let q = card.querySelector(".quintal");
    if (q) q.value = isNaN((bags * kg)/100) ? 0 : ((bags * kg)/100).toFixed(2);
  }
};

// 🔹 Add to Cart
window.addToCart = function(id, name, price, category) {
  let input = document.getElementById(`qty-${id}`);
  let qty = parseInt(input.value) || 0;

  let cart = JSON.parse(localStorage.getItem("cart")) || {};

  if (qty > 0) {
    cart[id] = { name, price, bags: qty, category };

    // 🔥 Message
    alert(name + " add to cart ✅");

  } else {
    delete cart[id];
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateTotal();
};
// 🔹 Update total
function updateTotal() {
  let cart = JSON.parse(localStorage.getItem("cart")) || {};
  let total = 0;
  for (let key in cart) total += cart[key].bags * cart[key].price;

  let el = document.getElementById("finalTotal");
  if (el) el.innerText = total.toFixed(2);

  localStorage.setItem("total", total);
}

window.goToCart = function() {
  window.location.href = "cart.html";
};

// 🔹 Place Order navigation
window.placeOrder = function() {
  window.location.href = "order.html";
};

// 🔹 Submit order to Firestore
window.submitOrder = async () => {
  let phone = document.getElementById("phone").value;
  let cartData = JSON.parse(localStorage.getItem("cart")) || {};
  let total = localStorage.getItem("total") || 0;

  if (!phone) return alert("Enter phone number");

  try {
    await addDoc(collection(db, "orders"), {
      phone,
      items: Object.values(cartData).map(item => ({
        name: item.name,
        price: item.price,
        bags: item.bags,
        total: item.bags * item.price
      })),
      totalAmount: total,
      status: "new",
      createdAt: new Date()
    });

    alert("Order saved ✅");
    localStorage.removeItem("cart");
    localStorage.removeItem("total");
    window.location.href = "thankyou.html";

  } catch (e) {
    console.error(e);
    alert("Error ❌");
  }
};

// 🔹 Order page frontend
window.onload = function () {

  // 🔹 Cart Page
  let cartDiv = document.getElementById("cartItems");
  if (cartDiv) {
    let cart = JSON.parse(localStorage.getItem("cart")) || {};
    let total = 0;

    cartDiv.innerHTML = "";

    for (let key in cart) {
      let item = cart[key];
      let itemTotal = item.bags * item.price;
      total += itemTotal;

      cartDiv.innerHTML += `
        <div>
          <strong>${item.name}</strong><br>
          Qty: ${item.bags} × ₹${item.price} = ₹${itemTotal}
        </div>
        <hr>
      `;
    }

    document.getElementById("finalTotal").innerText = total;
  }

  // 🔹 Order Page
  let orderDiv = document.getElementById("orderDetails");

let cart = JSON.parse(localStorage.getItem("cart")) || {};

orderDiv.innerHTML = "";

for (let key in cart) {
  let item = cart[key];

  orderDiv.innerHTML += `
    <div class="order-item">
      <strong>${item.name}</strong><br>
      ${item.bags} × ₹${item.price} = ₹${item.bags * item.price}
    </div>
  `;
}
}
window.submitOrder = async function () {
  let phone = document.getElementById("phone").value;
  let cartData = JSON.parse(localStorage.getItem("cart")) || {};
  let total = localStorage.getItem("total") || 0;

  if (!phone) {
    alert("Enter phone number");
    return;
  }

  if (Object.keys(cartData).length === 0) {
    alert("Cart is empty!");
    return;
  }

  try {
    // 🔹 Save order to Firebase
    await addDoc(collection(db, "orders"), {
      phone: phone,
      items: Object.values(cartData).map(item => ({
        name: item.name,
        price: item.price,
        bags: item.bags,
        total: item.bags * item.price
      })),
      totalAmount: total,
      status: "new",
      createdAt: new Date()
    });

    // 🔹 Show order details on same page
    const orderDiv = document.getElementById("orderDetails");
    orderDiv.innerHTML = `<h3>Order Details for: ${phone}</h3>`;
    
    Object.values(cartData).forEach(item => {
      orderDiv.innerHTML += `
        <div>
          <strong>${item.name}</strong> - ${item.bags} ${item.category === 'bellfresh' ? 'packets' : 'bags'} × ₹${item.price} = ₹${item.bags * item.price}
        </div>
      `;
    });

    orderDiv.innerHTML += `<h3>Total: ₹${total}</h3>`;

    // 🔹 Clear cart from localStorage (optional)
    localStorage.removeItem("cart");
    localStorage.removeItem("total");

  } catch (e) {
    console.error(e);
    alert("Error saving order ❌");
  }
};

