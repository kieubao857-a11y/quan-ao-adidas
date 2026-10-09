(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      const form = document.getElementById("checkoutForm");

      if (!form) {
        console.error("SV3 FINAL: Không tìm thấy checkoutForm");
        return;
      }

      console.log("SV3 FINAL: Đã khóa checkout");

      form.addEventListener(
        "submit",
        function (event) {
          let currentUser = null;

          try {
            const data = localStorage.getItem("currentUser");

            if (data) {
              currentUser = JSON.parse(data);
            }
          } catch (error) {
            currentUser = null;
          }

          console.log("SV3 FINAL currentUser:", currentUser);

          if (!currentUser) {
            event.preventDefault();
            event.stopImmediatePropagation();

            alert(
              "Bạn phải đăng nhập hoặc đăng ký tài khoản trước khi đặt hàng!",
            );

            window.location.href = "./admin/login.html";

            return false;
          }
        },
        true,
      );
    },
    { once: true },
  );
})();
