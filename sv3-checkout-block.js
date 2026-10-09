(function () {
  "use strict";

  function checkLogin() {
    let currentUser = null;

    try {
      const data = localStorage.getItem("currentUser");

      if (data && data !== "null" && data !== "undefined") {
        currentUser = JSON.parse(data);
      }
    } catch (e) {
      currentUser = null;
    }

    console.log("SV3 CHECKOUT - currentUser:", currentUser);

    // CHƯA ĐĂNG NHẬP
    if (!currentUser) {
      alert("Bạn phải đăng nhập hoặc đăng ký tài khoản trước khi thanh toán.");

      window.location.replace("./admin/login.html");
      return;
    }

    console.log("SV3: Đã đăng nhập:", currentUser.email);
  }

  checkLogin();
})();
