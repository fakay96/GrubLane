$(document).ready(function () {
  $("#adminCreateForm").submit(function (e) {
    e.preventDefault();

    const username = $("#username").val();
    const password = $("#password").val();
    const email = $("#email").val();
    const role = $("#role").val();

    $.ajax({
      url: "https://grublanerestaurant.com/api/admin/createAdmin",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        username: username,
        password: password,
        email: email,
        role: role,
      }),
      success: function (response) {
        alert("Admin created successfully!");
        window.location.href = "index.html";
      },
      error: function (xhr) {
        if (xhr.status === 400) {
          $("#error-message").text("All fields are required.");
        } else {
          $("#error-message").text(
            "An error occurred. Please try again later."
          );
        }
      },
    });
  });
});
