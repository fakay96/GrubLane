$(document).ready(function () {
  $("#sidebarCollapse").off("click");

  $("#sidebarCollapse").on("click", function () {
    console.log("Sidebar toggle clicked");
    $("#sidebar").toggleClass("active");
    $("#content").toggleClass("active");

    $(this).toggleClass("hamburger-active");
  });
});
