$(document).ready(function () {
  $("#logoutButton").click(function () {
    $.ajax({
      url: "https://grublanerestaurant.com/api/admin/logout",
      type: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      success: function (response) {
        // Clear the stored token
        localStorage.removeItem("token");

        // Redirect to the login page
        window.location.href = "index.html";
      },
      error: function (xhr) {
        console.error("Logout failed:", xhr);
        alert("Logout failed. Please try again.");
      },
    });
  });
});
