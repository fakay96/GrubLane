async function fetchMenuData(menuType) {
  const takeOut = menuType === "take_out" ? true : false;

  let endpointUrl = `https://grublanerestaurant.com/api/dish/getDishes?take_out=${takeOut}`;
  let allDishes = [];
  let menuContainer = document.getElementById("menu-container");

  try {
    while (endpointUrl) {
      const response = await fetch(endpointUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      allDishes = allDishes.concat(data.dishes);

      // If there's a next page, update endpointUrl; otherwise, stop.
      endpointUrl = data.next;
    }

    // Once all pages are fetched, render the menu.
    renderMenu(allDishes, takeOut, menuContainer);
  } catch (error) {
    console.error("Error fetching menu data:", error);
    menuContainer.innerHTML = `<div class="text-center"><h2>Error Fetching Data</h2><p>We couldn't fetch the menu data. Please try again later.</p></div>`;
  }
}

function renderMenu(dishes, takeOut, menuContainer) {
  let menuHtml = "";
  let allCategories = new Set(); // To collect unique categories

  if (!dishes || dishes.length === 0) {
    menuHtml = `<div class="menu-item"><h3 class="text-center">No menu items available</h3></div>`;
  } else {
    dishes.forEach((item) => {
      // Collect unique categories
      allCategories.add(item.subcategory);

      menuHtml += `
        <div class="menu-item" data-category="${item.subcategory.toLowerCase()}">
          <img src="${item.imageUrl}" alt="${item.name}">
          <h3>${item.name}</h3>
          <p><strong>N${item.price}</strong></p>
          <p class="rating" data-dish-id="${item.id}" data-average-rating="${item.average_rating || 0}">
            ${generateStarRating(item.average_rating || 0)}
          </p>
          <button class="add-to-cart-btn" data-item="${item.name}" data-price="${item.price}">
            Add to Cart
          </button>
        </div>`;
    });
  }

  // Set the inner HTML for the grid container
  menuContainer.innerHTML = menuHtml;

  // Render the filter buttons dynamically
  renderFilters([...allCategories]);

  // Attach cart functionality and rating functionality
  addCartFunctionality();
  addRatingFunctionality(); // Attach rating event listeners
}

function generateStarRating(rating) {
  let starHtml = "";
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? "fa fa-star" : "fa fa-star-o";
    starHtml += `<i class="${starClass}" aria-hidden="true" data-rating="${i}"></i>`;
  }
  return starHtml;
}

function addRatingFunctionality() {
  document.querySelectorAll(".rating i").forEach((star) => {
    star.addEventListener("mouseover", function () {
      const rating = parseInt(this.getAttribute("data-rating"));
      updateStars(rating, this.parentElement);
    });

    star.addEventListener("mouseout", function () {
      const rating = parseInt(
        this.parentElement.getAttribute("data-average-rating")
      );
      updateStars(rating, this.parentElement);
    });

    star.addEventListener("click", function () {
      const dishId = this.parentElement.getAttribute("data-dish-id");
      const rating = parseInt(this.getAttribute("data-rating"));

      // Make an API call to submit the rating
      submitRating(dishId, rating, this.parentElement);
    });
  });
}

function updateStars(rating, ratingElement) {
  ratingElement.querySelectorAll("i").forEach((star) => {
    const starRating = parseInt(star.getAttribute("data-rating"));
    star.className = starRating <= rating ? "fa fa-star" : "fa fa-star-o";
  });
}

function submitRating(dishId, rating, ratingElement) {
  fetch(`https://grublanerestaurant.com/api/dish/rateDish/${dishId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rating }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }
      return response.json();
    })
    .then(() => {
      alert("Your feedback has been submitted.");
      // Update the average rating and re-render stars
      ratingElement.setAttribute("data-average-rating", rating);
      updateStars(rating, ratingElement);
    })
    .catch((error) => {
      alert("Failed to submit rating. Please try again later.");
      console.error("Error submitting rating:", error);
    });
}

function renderFilters(categories) {
  const filterContainer = document.getElementById("filter-container");
  let filterHtml = `<button class="filter-btn" data-category="all">All</button>`;

  categories.forEach((category) => {
    filterHtml += `<button class="filter-btn" data-category="${category.toLowerCase()}">${category}</button>`;
  });

  filterContainer.innerHTML = filterHtml;

  // Attach click event listeners to filter buttons
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const category = this.getAttribute("data-category");
      filterMenuByCategory(category);
    });
  });
}

function filterMenuByCategory(category) {
  const items = document.querySelectorAll(".menu-item");

  items.forEach((item) => {
    const itemCategory = item.getAttribute("data-category");

    if (category === "all" || itemCategory === category) {
      item.style.display = "block"; // Show matching items
    } else {
      item.style.display = "none"; // Hide non-matching items
    }
  });
}
function addCartFunctionality() {
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const itemName = this.getAttribute("data-item");
      const itemPrice = parseInt(this.getAttribute("data-price"));
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existingItemIndex = cart.findIndex(
        (item) => item.name === itemName
      );

      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
      } else {
        cart.push({ name: itemName, price: itemPrice, quantity: 1 });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      document.getElementById("side-cart").classList.add("active");
      document.getElementById("overlay").classList.add("active");
    });
  });
}

function renderCart() {
  const cartItemsContainer = document.getElementById("side-cart-items");
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cartItemsContainer.innerHTML = "";

  let totalPrice = 0;
  cart.forEach((item, index) => {
    const cartItemDiv = document.createElement("div");
    cartItemDiv.classList.add("side-cart-item");
    cartItemDiv.innerHTML = `
      <h4>${item.name}</h4>
      <p>N${item.price} x ${item.quantity}</p>
      <button class="decrease-btn" data-index="${index}">-</button>
      <button class="increase-btn" data-index="${index}">+</button>
      <span class="remove-btn" data-index="${index}">&times;</span>
    `;
    cartItemsContainer.appendChild(cartItemDiv);

    totalPrice += item.price * item.quantity;
  });

  document.getElementById("total-price").textContent = `Total: N${totalPrice}`;
  document.getElementById("checkout-button").disabled = cart.length === 0;

  // Add functionality to remove item
  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const itemIndex = this.getAttribute("data-index");
      cart.splice(itemIndex, 1); // Remove item from cart
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });

  // Add functionality to increase/decrease quantity
  document.querySelectorAll(".decrease-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const itemIndex = this.getAttribute("data-index");
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
      } else {
        cart.splice(itemIndex, 1); // Remove item if quantity is zero
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });

  document.querySelectorAll(".increase-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const itemIndex = this.getAttribute("data-index");
      cart[itemIndex].quantity += 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pageType = document.body.dataset.pageType;
  fetchMenuData(pageType);
});
