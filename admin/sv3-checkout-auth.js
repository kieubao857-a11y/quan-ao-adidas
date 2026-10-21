(function () {
  "use strict";

  const CURRENT_USER_KEY = "currentUser";
  const LOGIN_URL = "./admin/login.html?next=checkout.html";

  function getLoggedInUser() {
    try {
      const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");

      if (
        user &&
        typeof user === "object" &&
        typeof user.email === "string" &&
        user.email.trim() !== ""
      ) {
        return user;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  function requireLogin(event) {
    if (getLoggedInUser()) return true;

    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    alert("Bạn cần đăng ký tài khoản và đăng nhập trước khi đặt hàng.");
    window.location.href = LOGIN_URL;
    return false;
  }

  // Chặn truy cập thẳng vào trang thanh toán khi chưa đăng nhập.
  if (!getLoggedInUser()) {
    alert("Vui lòng đăng ký hoặc đăng nhập để tiếp tục đặt hàng.");
    window.location.replace(LOGIN_URL);
    return;
  }

  // Kiểm tra lại khi khách gửi form đặt hàng.
  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;

      if (!(form instanceof HTMLFormElement)) return;

      // Chỉ kiểm tra form có dấu hiệu là form thanh toán/đặt hàng.
      const formText = (
        form.id +
        " " +
        form.className +
        " " +
        form.action
      ).toLowerCase();

      if (
        formText.includes("checkout") ||
        formText.includes("order") ||
        formText.includes("payment")
      ) {
        requireLogin(event);
      }
    },
    true,
  );

  // Chặn nút đặt hàng nếu trang có nút với ID phổ biến.
  document.addEventListener(
    "click",
    function (event) {
      const button = event.target.closest(
        "#placeOrder, #place-order, #checkoutSubmit, #submitOrder",
      );

      if (button && !getLoggedInUser()) {
        requireLogin(event);
      }
    },
    true,
  );
})();
