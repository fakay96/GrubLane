async function fetchMenuData(menuType) {
  console.log(menuType);
  const takeOut = menuType === "take_out" ? true : false;

  let endpointUrl = `https://grublanerestaurant.com/api/dish/getDishes?take_out=${takeOut}`;
  let allDishes = [];
  let menuContainer = document.getElementById("menu-container");

  try {
    while (endpointUrl) {
      console.log("Fetching menu from: ", endpointUrl);
      const response = await fetch(endpointUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Menu data: ", data);

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

  if (!dishes || dishes.length === 0) {
    menuHtml = `
      <div class="text-center">
        <h2>No menu items available</h2>
        <p>We couldn't find any menu items at the moment for this type. Please try again later.</p>
      </div>`;
  } else {
    const groupedMenu = {};
    dishes.forEach((dish) => {
      const { subcategory, average_rating, id } = dish;
      if (!groupedMenu[subcategory]) {
        groupedMenu[subcategory] = [];
      }
      groupedMenu[subcategory].push({ ...dish, average_rating });
    });

    for (const subcategory in groupedMenu) {
      const subcategoryId = subcategory.replace(/\s+/g, "-").toLowerCase();
      menuHtml += `
        <section class="menu-section">
          <h3 class="menu-category" onclick="toggleMenu('${subcategoryId}')">${subcategory}</h3>
          <div class="menu-items" id="${subcategoryId}" style="display: none; transition: all 0.3s ease;">`; // Smooth transition for menu items

      groupedMenu[subcategory].forEach((item) => {
        menuHtml += `
          <article class="menu-item-card">
            <div class="menu-item fancy-card">
              ${takeOut ? `
                <div class="menu-item-image">
                  <img src="${item.image_url || 'default-image.jpg'}" alt="${item.name}" class="menu-image" />
                </div>` : ""}
              <h5 class="menu-item-name">${item.name}</h5>
              <p class="price"><strong>N${item.price}</strong></p>
              <button class="add-to-cart-btn" data-item="${item.name}" data-price="${item.price}">Add to Cart</button>
              <div class="rating" data-dish-id="${item.id}" data-average-rating="${item.average_rating || 0}">
                ${generateStarRating(item.average_rating || 0)}
              </div>
            </div>
          </article>`;
      });

      menuHtml += `</div></section>`;
    }
  }

  menuContainer.innerHTML = menuHtml;
  addCartFunctionality();
  addRatingFunctionality();
}

function generateStarRating(rating) {
  let starHtml = "";
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? "fa fa-star" : "fa fa-star-o";
    starHtml += `<i class="${starClass}" aria-hidden="true" data-rating="${i}"></i>`;
  }
  return starHtml;
}

function toggleMenu(subcategoryId) {
  const menuItems = document.getElementById(subcategoryId);
  if (menuItems.style.display === "none" || menuItems.style.display === "") {
    menuItems.style.display = "grid"; // Show menu items as grid
  } else {
    menuItems.style.display = "none"; // Hide menu items
  }
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

      fetch(`https://grublanerestaurant.com/api/dish/createDish/${dishId}`, {
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
          updateDishRating(dishId, rating); // Update only the specific dish rating
        })
        .catch((error) => {
          alert("Failed to submit rating. Please try again later.");
          console.error("Error submitting rating:", error);
        });
    });
  });
}

function updateDishRating(dishId, newRating) {
  const ratingElement = document.querySelector(`[data-dish-id="${dishId}"]`);
  if (ratingElement) {
    ratingElement.setAttribute('data-average-rating', newRating);
    updateStars(newRating, ratingElement);
  }
}

function updateStars(rating, ratingElement) {
  ratingElement.querySelectorAll("i").forEach((star) => {
    const starRating = parseInt(star.getAttribute("data-rating"));
    star.className = starRating <= rating ? "fa fa-star" : "fa fa-star-o";
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
