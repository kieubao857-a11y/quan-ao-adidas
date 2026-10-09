(function () {
  "use strict";

  function isLoggedIn() {
    const data = localStorage.getItem("currentUser");

    if (!data || data === "null" || data === "undefined") {
      return false;
    }

    try {
      const user = JSON.parse(data);
      return !!(user && user.email);
    } catch (error) {
      return false;
    }
  }

  // Kiểm tra ngay khi trang checkout mở
  if (!isLoggedIn()) {
    alert("Bạn phải đăng nhập hoặc đăng ký tài khoản trước khi đặt hàng!");

    window.location.replace("./admin/login.html");
    return;
  }
})();
