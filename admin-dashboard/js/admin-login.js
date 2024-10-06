$(document).ready(function () {
  $("#adminLoginForm").submit(function (e) {
    e.preventDefault();

    const username = $("#username").val();
    const password = $("#password").val();

    $.ajax({
      url: "https://grublanerestaurant.com/api/admin/login",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        username: username,
        password: password,
      }),
      success: function (response) {
        // Store the JWT token in local storage
        localStorage.setItem("token", response.token);
        localStorage.setItem("username", response.username);
        // localStorage.setItem("role", response.role);

        // Redirect to the admin dashboard
        window.location.href = "home.html";
      },
      error: function (xhr) {
        if (xhr.status === 401) {
          $("#error-message").text(
            "Invalid username or password. Please try again."
          );
        } else {
          $("#error-message").text(
            "An error occurred. Please try again later."
          );
        }
      },
    });
  });
});
