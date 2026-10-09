(function () {
  "use strict";

  function getCurrentUser() {
    try {
      const data = localStorage.getItem("currentUser");

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // CHẶN NGAY KHI BẤM NÚT ĐẶT HÀNG
  document.addEventListener(
    "click",
    function (event) {
      const button = event.target.closest("button");

      if (!button) {
        return;
      }

      const buttonText = button.textContent.trim().toLowerCase();

      // Chỉ bắt đúng nút ĐẶT HÀNG
      if (!buttonText.includes("đặt hàng")) {
        return;
      }

      const currentUser = getCurrentUser();

      console.log("SV3 CHECK LOGIN:", currentUser);

      // CHƯA ĐĂNG NHẬP
      if (!currentUser) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        alert("Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi đặt hàng!");

        window.location.href = "admin/login.html";

        return false;
      }

      // ĐÃ ĐĂNG NHẬP
      console.log("SV3: Đã đăng nhập, cho phép đặt hàng:", currentUser.email);
    },
    true,
  );

  // BỔ SUNG CHẶN SUBMIT
  document.addEventListener(
    "submit",
    function (event) {
      const currentUser = getCurrentUser();

      console.log("SV3 SUBMIT CHECK:", currentUser);

      if (!currentUser) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        alert("Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi đặt hàng!");

        window.location.href = "admin/login.html";

        return false;
      }
    },
    true,
  );

  console.log("SV3 CHECKOUT LOGIN GUARD: ĐÃ KÍCH HOẠT");
})();
