(function () {
  "use strict";

  const ORDERS_KEY = "orders";
  const CURRENT_USER_KEY = "currentUser";

  function getData(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("checkoutForm");

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      function () {
        /*
         * checkout.js cũ đã lưu đơn hàng.
         * Ta chờ nó lưu xong rồi bổ sung
         * thông tin tài khoản vào đơn cuối.
         */

        setTimeout(function () {
          const currentUser = getData(CURRENT_USER_KEY, null);

          if (!currentUser) {
            return;
          }

          const orders = getData(ORDERS_KEY, []);

          if (!orders.length) {
            return;
          }

          const lastOrder = orders[orders.length - 1];

          if (!lastOrder.customer) {
            lastOrder.customer = {};
          }

          lastOrder.customer.userId = currentUser.id || "";

          lastOrder.customer.email = currentUser.email || "";

          lastOrder.customer.accountName = currentUser.name || "";

          saveData(ORDERS_KEY, orders);
        }, 100);
      },
      false,
    );
  });
})();
