document.addEventListener("DOMContentLoaded", function () {
  // Initialize cart
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Get modal elements
  const modal = document.getElementById("checkout-modal");
  const closeModalBtn = document.querySelector(".close");
  const checkoutForm = document.getElementById("checkout-form");

  // Ensure elements exist before attaching listeners
  if (modal && closeModalBtn && checkoutForm) {
    // Show modal when Checkout button is clicked
    document.getElementById("checkout-button").addEventListener("click", function () {
      cart = getCart(); // Refresh the cart

      if (cart.length === 0) {
        alert("No items in cart. Please add items before checking out.");
        return;
      }

      // Show the modal to collect user details
      modal.style.display = "block";
    });

    // Close modal when close button is clicked
    closeModalBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });

    // Close modal when clicking outside the modal content
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    // Handle form submission to proceed to payment
    checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Get user input values
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const address = document.getElementById("address").value;
      const phoneNumber = document.getElementById("phoneNumber").value;

      if (!name || !email || !address || !phoneNumber) {
        alert("All fields are required!");
        return;
      }

      // Proceed to payment with Paystack
      const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const orderId = "ORDER_" + new Date().getTime(); // Generate an order ID
      const cartItems = getCart();

      // Hide the modal
      modal.style.display = "none";

      // Call Paystack payment
      payWithPaystack(totalAmount, email, cartItems, {
        name: name,
        address: address,
        phoneNumber: phoneNumber,
      });
    });
  } else {
    console.error("Modal or buttons not found in DOM");
  }
});

// Paystack payment integration with cart data and user details
function payWithPaystack(totalAmount, userEmail, cartItems, userDetails) {
  const handler = PaystackPop.setup({
    key: "pk_test_8168df975740a7daac50c926c60f4a4694fc9d50", // Replace with your Paystack public key
    email: userEmail,
    amount: totalAmount * 100, // Convert to kobo
    currency: "NGN",
    ref: "ORDER_" + new Date().getTime(), // Unique reference
    callback: function (response) {
      // 1. First create or fetch the user
      createUser(userEmail, userDetails.name, userDetails.address, userDetails.phoneNumber)
        .then((userData) => {
          const userId = userData.id;

          // 2. Then create the order with the user's ID and the Paystack reference
          createOrder(userId, totalAmount, new Date().toISOString(), cartItems, response.reference)
            .then((orderData) => {

              // 3. Finally, record the payment
              recordPayment(response.reference, userEmail, totalAmount, orderData.id);
            })
            .catch((error) => {
              console.error("Order creation failed:", error);
              alert("Failed to create order. Please contact support.");
            });
        })
        .catch((error) => {
          console.error("User creation failed:", error);
          alert("Failed to create user. Please contact support.");
        });
    },
    onClose: function () {
      alert("Transaction was not completed, window closed.");
    },
  });
  handler.openIframe();
}

// Function to create a user
function createUser(email, name, address, phoneNumber) {
  const endpointUrl = `https://grublanerestaurant.com/api/users`;
  const userData = {
    email: email,
    name: name,
    address: address,
    phone_number: phoneNumber,
  };

  return fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {

      if (response.status === 200 || response.status === 201) {
        return response.json(); // Successful creation
      }

      if (response.status === 409) {
        return response.json().then((data) => {
          console.warn("Conflict: User already exists");
          return { userId: data.id }; // Return existing user's ID
        });
      }

      throw new Error(`Failed to create user: ${response.status}`);
    })
    .catch((error) => {
      console.error("Error creating user:", error.message);
      throw error;
    });
}

// Function to create an order (with Paystack reference after successful payment)
function createOrder(userId, amountPaid, date, cartItems, paystackReference) {
  const endpointUrl = `https://grublanerestaurant.com/api/orders`;
  const orderNumber = "ORDER_" + new Date().getTime(); // Generate a unique order number

  // Prepare the order details as a stringified JSON object
  const orderDetails = JSON.stringify({
    items: cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });

  const orderData = {
    user_id: userId,
    amount_paid: amountPaid,
    order_number: orderNumber,
    date: date,
    paystack_reference: paystackReference, // Include the Paystack reference from successful payment
    order_details: orderDetails, // Stringified order details
  };

  return fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })
    .then((response) => {
      if (response.status === 201) {
        return response.json();
      } else {
        throw new Error("Failed to create order.");
      }
    })
    .catch((error) => {
      console.error("Error creating order:", error);
      throw error;
    });
}

// Function to record payment details along with order ID
function recordPayment(reference, email, amount, orderId) {
  const paymentDetails = {
    order_id: orderId,
    amount: amount,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "Paystack",
    status: "Completed",
    paystack_refnumber: reference,
  };

  fetch("https://grublanerestaurant.com/api/payments/createPayments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentDetails),
  })
    .then((response) => response.json())
    .then(() => {
      alert("Payment successful and recorded!");
      localStorage.removeItem("cart");
      
      window.location.href = `order-confirmation.html?orderId=${orderId}`;
    })
    .catch((error) => {
      console.error("Payment recording failed:", error);
      alert("Failed to record payment. Please contact support.");
    });
}


// Get cart items from localStorage
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// Render the cart and set up buttons for adding/removing items
function renderCart() {
  const cartItemsContainer = document.getElementById("side-cart-items");
  cartItemsContainer.innerHTML = "";

  let totalPrice = 0;

  cart.forEach((item, index) => {
    const cartItemDiv = document.createElement("div");
    cartItemDiv.classList.add("side-cart-item");
    cartItemDiv.innerHTML = `
      <h4>${item.name}</h4>
      <p>N${item.price} x ${item.quantity}</p>
      <button class="decrease-quantity" data-index="${index}">-</button>
      <button class="increase-quantity" data-index="${index}">+</button>
      <span class="remove-btn" data-index="${index}">&times;</span>
    `;
    cartItemsContainer.appendChild(cartItemDiv);

    totalPrice += item.price * item.quantity;
  });

  document.getElementById("total-price").textContent = `Total: N${totalPrice}`;

  const checkoutButton = document.getElementById("checkout-button");
  checkoutButton.disabled = cart.length === 0;

  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const itemIndex = this.getAttribute("data-index");
      cart.splice(itemIndex, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });

  document.querySelectorAll(".decrease-quantity").forEach((button) => {
    button.addEventListener("click", function () {
      const itemIndex = this.getAttribute("data-index");
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
      }
    });
  });

  document.querySelectorAll(".increase-quantity").forEach((button) => {
    button.addEventListener("click", function () {
      const itemIndex = this.getAttribute("data-index");
      cart[itemIndex].quantity += 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });
}

// Initial render of the cart
renderCart();
