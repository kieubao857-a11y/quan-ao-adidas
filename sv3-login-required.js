(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("checkoutForm");

    if (!form) {
      console.log("SV3: Không tìm thấy checkoutForm");
      return;
    }

    console.log("SV3: Đã kích hoạt bắt buộc đăng nhập");

    form.addEventListener(
      "submit",
      function (event) {
        let currentUser = null;

        try {
          const userData = localStorage.getItem("currentUser");

          if (userData) {
            currentUser = JSON.parse(userData);
          }
        } catch (error) {
          currentUser = null;
        }

        console.log("SV3: currentUser =", currentUser);

        // CHƯA ĐĂNG NHẬP
        if (!currentUser) {
          event.preventDefault();
          event.stopImmediatePropagation();

          alert("Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi đặt hàng!");

          window.location.href = "./admin/login.html";

          return false;
        }

        console.log("SV3: Người dùng đã đăng nhập:", currentUser.email);
      },
      true,
    );
  });
})();
