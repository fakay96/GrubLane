const API_FETCH_URL = "https://grublanerestaurant.com/api/dish/getDishes";
const API_CREATE_URL = "https://grublanerestaurant.com/api/dish/createDish";
const API_UPDATE_URL = "https://grublanerestaurant.com/api/dish/updateDish";
const API_DELETE_URL = "https://grublanerestaurant.com/api/dish/deleteDish";
const API_MENU_URL = "https://grublanerestaurant.com/api/menu/getMenus"; // For fetching menu IDs

let meals = []; // Original meals fetched from API
let filteredMeals = []; // Meals after applying search and filters
let currentPage = 1;
const mealsPerPage = 10; // Number of meals to show per page

// Function to fetch menu ID from the backend
async function fetchMenuId() {
  try {
    const response = await fetch(API_MENU_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch menu ID: ${response.status}`);
    }

    const menus = await response.json();

    if (menus && menus.length > 0) {
      menuId = menus[0].id;
    } else {
      throw new Error("No menus found.");
    }
  } catch (error) {
    console.error("Error fetching menu ID:", error);
  }
}

// Function to fetch meals from the API and display them
async function fetchMeals() {
  try {
    const response = await fetch(API_FETCH_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.dishes && Array.isArray(data.dishes)) {
      meals = data.dishes;
      filteredMeals = [...meals]; // Set filteredMeals to all meals initially
      displayMeals(); // Display meals after fetching
    } else {
      throw new Error("Invalid data format: Expected an array of meals");
    }
  } catch (error) {
    document.getElementById("mealsTableBody").innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          Failed to load meals. Please try again later.
        </td>
      </tr>`;
    console.error("Error fetching meals:", error);
  }
}

// Function to display meals in the table
function displayMeals() {
  const tableBody = document.getElementById("mealsTableBody");
  tableBody.innerHTML = "";

  // Calculate start and end indexes based on current page and mealsPerPage
  const startIndex = (currentPage - 1) * mealsPerPage;
  const endIndex = startIndex + mealsPerPage;
  const paginatedMeals = filteredMeals.slice(startIndex, endIndex);

  paginatedMeals.forEach((meal) => {
    const row = `
      <tr>
          <td>${meal.name}</td>
          <td>${meal.description || ""}</td>
          <td>₦${meal.price.toFixed(2)}</td>
          <td>${meal.servicetype}</td>
          <td>${meal.subcategory || ""}</td>
          <td>
              <button class="btn btn-sm btn-primary" onclick="editMeal(${
                meal.id
              })">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteMeal(${
                meal.id
              })">Delete</button>
          </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });

  displayPagination(filteredMeals.length); // Call pagination function based on filtered meals
}

// Function to display pagination controls
function displayPagination(totalMeals) {
  const paginationControls = document.getElementById("paginationControls");
  paginationControls.innerHTML = "";

  const totalPages = Math.ceil(totalMeals / mealsPerPage);

  // Create Previous button
  const prevButton = document.createElement("button");
  prevButton.classList.add("btn", "btn-secondary");
  prevButton.innerText = "Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayMeals();
    }
  };
  paginationControls.appendChild(prevButton);

  // Create page number buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.classList.add("btn", "btn-secondary");
    pageButton.innerText = i;
    pageButton.disabled = i === currentPage;
    pageButton.onclick = () => {
      currentPage = i;
      displayMeals();
    };
    paginationControls.appendChild(pageButton);
  }

  // Create Next button
  const nextButton = document.createElement("button");
  nextButton.classList.add("btn", "btn-secondary");
  nextButton.innerText = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayMeals();
    }
  };
  paginationControls.appendChild(nextButton);
}

// Function to filter and search meals
function filterAndSearchMeals() {
  const serviceType = document
    .getElementById("filterServiceType")
    .value.toLowerCase()
    .trim();
  const subcategory = document
    .getElementById("filterCategory")
    .value.toLowerCase()
    .trim();
  const searchQuery = document
    .getElementById("searchMeal")
    .value.toLowerCase()
    .trim();

  // Filter meals based on serviceType, subcategory, and searchQuery
  filteredMeals = meals.filter((meal) => {
    const matchesServiceType =
      !serviceType || meal.servicetype.toLowerCase().includes(serviceType);
    const matchesSubcategory =
      !subcategory ||
      (meal.subcategory &&
        meal.subcategory.toLowerCase().includes(subcategory));
    const matchesSearch =
      !searchQuery ||
      meal.name.toLowerCase().includes(searchQuery) ||
      (meal.description &&
        meal.description.toLowerCase().includes(searchQuery));

    return matchesServiceType && matchesSubcategory && matchesSearch;
  });

  currentPage = 1; // Reset page to 1 after filtering or searching
  displayMeals(); // Display filtered meals
}

// Event listeners for filter and search
document.addEventListener("DOMContentLoaded", () => {
  fetchMenuId().then(() => {
    fetchMeals();
  });
  document.getElementById("addMealForm").addEventListener("submit", addMeal);
  document
    .getElementById("saveEditMeal")
    .addEventListener("click", saveMealEdit);
  document
    .getElementById("filterServiceType")
    .addEventListener("change", filterAndSearchMeals);
  document
    .getElementById("filterCategory")
    .addEventListener("change", filterAndSearchMeals);
  document
    .getElementById("searchMeal")
    .addEventListener("input", filterAndSearchMeals);
});

// Function to add a new meal
async function addMeal(event) {
  event.preventDefault();

  const newMeal = {
    name: document.getElementById("mealName").value,
    description: document.getElementById("mealDescription").value,
    price: parseFloat(document.getElementById("mealPrice").value),
    serviceType: document.getElementById("mealServiceType").value,
    subcategory: document.getElementById("mealCategory").value,
  };

  try {
    const response = await fetch(API_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMeal),
    });

    if (response.ok) {
      const createdMeal = await response.json();
      meals.push(createdMeal);
      filteredMeals.push(createdMeal); // Add to filteredMeals as well
      displayMeals(); // Re-display meals after adding a new one
      document.getElementById("addMealForm").reset();
      $("#addMealFormCollapse").collapse("hide");
      $("#manageMealsCollapse").collapse("show");
    }
  } catch (error) {
    console.error("Error adding meal:", error);
  }
}

// Function to edit a meal
function editMeal(id) {
  const meal = meals.find((m) => m.id === id);
  if (meal) {
    document.getElementById("editMealId").value = meal.id;
    document.getElementById("editMealName").value = meal.name;
    document.getElementById("editMealDescription").value =
      meal.description || "";
    document.getElementById("editMealPrice").value = meal.price;
    document.getElementById("editMealServiceType").value = meal.servicetype;
    document.getElementById("editMealCategory").value = meal.subcategory || "";
    $("#editMealModal").modal("show");
  }
}

// Function to save changes to a meal after editing
async function saveMealEdit() {
  const id = parseInt(document.getElementById("editMealId").value);
  const updatedMeal = {
    id: id,
    name: document.getElementById("editMealName").value,
    description: document.getElementById("editMealDescription").value,
    price: parseFloat(document.getElementById("editMealPrice").value),
    servicetype: document.getElementById("editMealServiceType").value,
    subcategory: document.getElementById("editMealCategory").value,
  };

  try {
    const response = await fetch(`${API_UPDATE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(updatedMeal),
    });

    if (response.ok) {
      const mealIndex = meals.findIndex((m) => m.id === id);
      if (mealIndex !== -1) {
        meals[mealIndex] = updatedMeal;
        filteredMeals[mealIndex] = updatedMeal; // Update filteredMeals
        displayMeals();
        $("#editMealModal").modal("hide");
      }
    } else {
      console.error("Error updating meal:", await response.json());
    }
  } catch (error) {
    console.error("Error updating meal:", error);
  }
}

// Function to delete a meal
async function deleteMeal(id) {
  if (confirm("Are you sure you want to delete this meal?")) {
    try {
      const response = await fetch(`${API_DELETE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        meals = meals.filter((meal) => meal.id !== id);
        filteredMeals = filteredMeals.filter((meal) => meal.id !== id); // Remove from filteredMeals
        displayMeals();
      } else {
        console.error("Error deleting meal:", await response.json());
      }
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  }
}
