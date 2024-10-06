const { error } = require("console");

function createReservation(userId, numberOfGuests, dateTime, tableNumber) {
  const endpointUrl = `https://grublanerestaurant.com/api/reservations`;
  const reservationData = {
    user_id: userId,
    number_of_guests: numberOfGuests,
    date_time: dateTime,
    table_number: tableNumber,
  };
  
  return fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reservationData),
  })
    .then((response) => {
      if (response.status === 201) {
        return response.json();
      } else if (response.status === 409) {
        return response.json().then((data) => {
          throw new Error(`Reservation conflict: ${data.error || 'Reservation already exists.'}`);
        });
      } else {
        throw new Error("Failed to create reservation.");
      }
    })
    .catch((error) => {
      console.error("Error creating reservation:", error.message);
      return { error: error.message }; 
    });
}

let currentPage = 1;
let nextUrl = null;
let prevUrl = null;
const rowsPerPage = 10;

function fetchReservationCount(url = null) {
  const endpointUrl =
    url ||
    `https://grublanerestaurant.com/api/reservations?page=${currentPage}&pageSize=${rowsPerPage}`;

  const token = localStorage.getItem("token");
  // console.log(token);

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
        throw new Error("Failed to fetch reservations.");
      }
    })
    .then((data) => {
      return data.total;
    })
    .catch((error) => {
      console.error("Error fetching reservations:", error.message);
      return [];
    });
}

function fetchAllReservations(url = null) {
  const endpointUrl =
    url ||
    `https://grublanerestaurant.com/api/reservations?page=${currentPage}&pageSize=${rowsPerPage}`;

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
        throw new Error("Failed to fetch reservations.");
      }
    })
    .then((data) => {
      console.log("API Response:", data);

      nextUrl = data.pagination.nextUrl;
      prevUrl = data.pagination.prevUrl;

      return data.data;
    })
    .catch((error) => {
      console.error("Error fetching reservations:", error.message);
      return [];
    });
}

function populateTable(reservations) {
  const tableBody = document.getElementById("reservation-table-body");
  tableBody.innerHTML = "";

  if (reservations.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='7' class='text-center'>No reservations found.</td></tr>";
  } else {
    reservations.forEach((reservation) => {
      const row = `
                <tr>
                    <td class="text-center">${reservation.id}</td>
                    <td class="text-center">${reservation.user_name}</td>
                    <td class="text-center">${new Date(
                      reservation.date_time
                    ).toLocaleDateString()}</td>
                    <td class="text-center">${new Date(
                      reservation.date_time
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</td>
                    <td class="text-center">${reservation.number_of_guests}</td>
                    
                    <td class="text-center">
                        <button class="btn btn-info btn-sm">View</button>
                    </td>
                </tr>
            `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }
}

function updatePaginationControls() {
  document.getElementById("page-info").textContent = `Page ${currentPage}`;
  document.getElementById("prev-btn").disabled = !prevUrl;
  document.getElementById("next-btn").disabled = !nextUrl;
}

function exportToCSV(data, filename, fields) {
  // Create CSV header row
  let csv = fields.join(",") + "\n";

  // Add data rows
  data.forEach((item) => {
    let row = fields
      .map((field) => {
        let value = item[field];
        // Handle special cases
        if (field.includes("date") || field.includes("time")) {
          value = new Date(value).toLocaleString();
        } else if (typeof value === "number") {
          value = value.toFixed(2);
        }
        // Escape commas and wrap in quotes if necessary
        if (value && value.toString().includes(",")) {
          value = `"${value}"`;
        }
        return value;
      })
      .join(",");
    csv += row + "\n";
  });

  // Create a Blob with the CSV data
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  // Create a download link
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

document.addEventListener("DOMContentLoaded", function () {
  // Fetch and display reservations on page load
  fetchAllReservations().then((reservations) => {
    populateTable(reservations);
    updatePaginationControls();
  });

  // Event listener for the previous page button
  document.getElementById("prev-btn").addEventListener("click", function () {
    if (prevUrl) {
      currentPage--;
      fetchAllReservations(prevUrl).then((reservations) => {
        populateTable(reservations);
        updatePaginationControls();
      });
    }
  });

  // Event listener for the next page button
  document.getElementById("next-btn").addEventListener("click", function () {
    if (nextUrl) {
      currentPage++;
      fetchAllReservations(nextUrl).then((reservations) => {
        populateTable(reservations);
        updatePaginationControls();
      });
    }
  });

  // Event listener for the export to CSV button
  document.getElementById("export-csv").addEventListener("click", function () {
    fetchAllReservations().then((reservations) => {
      const fields = ["id", "user_name", "date_time", "number_of_guests"];
      exportToCSV(reservations, "reservations", fields);
    });
  });
});
