function createOrder(
  userId,
  amountPaid,
  orderNumber,
  date,
  paystackReference = "",
  orderDetails = ""
) {
  const endpointUrl = `https://grublanerestaurant.com/api/orders`;
  const orderData = {
    user_id: userId,
    amount_paid: amountPaid,
    order_number: orderNumber,
    date: date,
    paystack_reference: paystackReference,
    order_details: orderDetails,
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
      } else if (response.status === 409) {
        throw new Error("Order already exists.");
      } else {
        throw new Error("Failed to create order.");
      }
    })
    .then((data) => {
    })
    .catch((error) => {
      console.error("Error creating order:", error.message);
    });
}

let currentPage = 1;
const rowsPerPage = 10;

function fetchAllOrders(page = 1, searchValue = "", filterValue = "") {
  let endpointUrl = `https://grublanerestaurant.com/api/orders`;
  if (searchValue) {
    endpointUrl += `&search=${searchValue}`;
  }
  if (filterValue) {
    endpointUrl += `&status=${filterValue}`;
  }
  const token = localStorage.getItem("token");

  return fetch(endpointUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Failed to fetch orders.");
      }
    })
    .then((data) => {
      console.log("API Response:", data);
      const orders = data.orders || data;
      return orders;
    })
    .catch((error) => {
      console.error("Error fetching orders:", error.message);
      return [];
    });
}

function populateOrderTable(orders) {
  const tableBody = document.getElementById("order-table-body");
  tableBody.innerHTML = "";

  if (orders.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='6' class='text-center'>No orders found.</td></tr>";
  } else {
    orders.forEach((order) => {
      const row = `
        <tr>
            <td class="text-center">${order.id}</td>
            <td class="text-center">${order.user_id}</td>
            <td class="text-center">${new Date(
              order.date
            ).toLocaleDateString()}</td>
            <td class="text-center">${order.order_details}</td>
            <td class="text-center">${order.status || "In Progress"}</td>
            <td class="text-center"><button class="btn btn-info btn-sm">View</button></td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }
}

function updatePaginationControls(currentPage, totalPages) {
  document.getElementById("page-info").textContent = `Page ${currentPage}`;
  document.getElementById("prev-btn").disabled = currentPage === 1;
  document.getElementById("next-btn").disabled = currentPage === totalPages;
}

document.addEventListener("DOMContentLoaded", function () {
  function loadOrders() {
    const searchValue = document.getElementById("search").value.toLowerCase();
    const filterValue = document.getElementById("filter").value.toLowerCase();

    fetchAllOrders(currentPage, searchValue, filterValue).then((orders) => {
      populateOrderTable(orders);
      // Assume totalPages is calculated here based on the response data
      const totalPages = Math.ceil(orders.length / rowsPerPage);
      updatePaginationControls(currentPage, totalPages);
    });
  }

  loadOrders(); // Load orders on page load

  document.getElementById("prev-btn").addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      loadOrders();
    }
  });

  document.getElementById("next-btn").addEventListener("click", function () {
    currentPage++;
    loadOrders();
  });

  document.getElementById("search").addEventListener("keyup", function () {
    currentPage = 1; // Reset to first page on new search
    loadOrders();
  });

  document.getElementById("filter").addEventListener("change", function () {
    currentPage = 1; // Reset to first page on new filter
    loadOrders();
  });

  document.getElementById("export").addEventListener("click", function () {
    fetchAllOrders(1, "", "").then((orders) => {
      const fields = ["id", "user_id", "date", "order_details", "status"];
      exportToCSV(orders, "takeout_orders", fields);
    });
  });
});

function exportToCSV(data, filename, fields) {
  let csv = fields.join(",") + "\n";

  data.forEach((item) => {
    let row = fields
      .map((field) => {
        let value = item[field];
        if (field.includes("date") || field.includes("time")) {
          value = new Date(value).toLocaleString();
        } else if (typeof value === "number") {
          value = value.toFixed(2);
        }
        if (value && value.toString().includes(",")) {
          value = `"${value}"`;
        }
        return value;
      })
      .join(",");
    csv += row + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
