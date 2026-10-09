(function () {
  "use strict";

  function checkLoginBeforeCheckout() {
    let currentUser = null;

    try {
      currentUser = JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
      currentUser = null;
    }

    // Chưa đăng nhập
    if (!currentUser) {
      alert("Bạn cần đăng nhập tài khoản trước khi đặt hàng.");

      window.location.href = "admin/login.html";
      return false;
    }

    return true;
  }

  function init() {
    const checkoutForm = document.getElementById("checkoutForm");

    if (!checkoutForm) return;

    checkoutForm.addEventListener(
      "submit",
      function (event) {
        if (!checkLoginBeforeCheckout()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return false;
        }
      },
      true,
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
