(function () {
  "use strict";

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
      return null;
    }
  }

  function isLoggedIn() {
    const user = getCurrentUser();

    return user && user.id && user.email;
  }

  function goLogin() {
    alert("Bạn cần đăng nhập tài khoản trước khi đặt hàng.");

    window.location.href = "admin/login.html";
  }

  function init() {
    const form = document.getElementById("checkoutForm");

    if (!form) {
      console.log("SV3: Không tìm thấy checkoutForm");
      return;
    }

    console.log("SV3 CHECKOUT GUARD ĐÃ CHẠY");

    /*
     * Chặn ngay khi người dùng bấm submit.
     * Dùng capture = true để chạy trước handler cũ.
     */
    form.addEventListener(
      "submit",
      function (event) {
        if (!isLoggedIn()) {
          event.preventDefault();
          event.stopImmediatePropagation();

          goLogin();

          return false;
        }
      },
      true,
    );

    /*
     * Chặn cả trường hợp nút đặt hàng được code
     * bằng onclick thay vì submit.
     */
    const buttons = form.querySelectorAll(
      'button[type="submit"], input[type="submit"]',
    );

    buttons.forEach(function (button) {
      button.addEventListener(
        "click",
        function (event) {
          if (!isLoggedIn()) {
            event.preventDefault();
            event.stopImmediatePropagation();

            goLogin();

            return false;
          }
        },
        true,
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
