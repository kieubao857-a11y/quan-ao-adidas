(function () {
  "use strict";

  const CURRENT_USER_KEY = "currentUser";
  const ORDERS_KEY = "orders";

  // Giữ các hàm localStorage gốc để không gọi lặp.
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;

  function getCurrentEmail() {
    try {
      const user = JSON.parse(
        originalGetItem.call(localStorage, CURRENT_USER_KEY) || "null",
      );

      return String(user?.email || "")
        .trim()
        .toLowerCase();
    } catch (error) {
      return "";
    }
  }

  function getOwnerEmail(order) {
    const customer = order?.customer || order?.user || {};

    return String(order?.ownerEmail || customer.email || order?.email || "")
      .trim()
      .toLowerCase();
  }

  function parseOrders(value) {
    try {
      const data = JSON.parse(value || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  // Khi checkout.js lưu đơn, gắn email tài khoản hiện tại.
  Storage.prototype.setItem = function (key, value) {
    if (key !== ORDERS_KEY || this !== localStorage) {
      return originalSetItem.call(this, key, value);
    }

    const email = getCurrentEmail();
    const incomingOrders = parseOrders(value);

    if (!email) {
      return originalSetItem.call(this, key, value);
    }

    const ownedOrders = incomingOrders.map(function (order) {
      // Không tự chuyển quyền sở hữu đơn đã có chủ.
      if (getOwnerEmail(order)) return order;

      return {
        ...order,
        ownerEmail: email,
        customer: {
          ...(order.customer || {}),
          email: order.customer?.email || email,
        },
      };
    });

    // Trên trang Đơn hàng của tôi, chỉ thay đơn của tài khoản hiện tại.
    const isOrdersPage =
      window.location.pathname.toLowerCase().endsWith("/orders.html") ||
      window.location.pathname.toLowerCase() === "orders.html";

    if (isOrdersPage) {
      const allOrders = parseOrders(
        originalGetItem.call(localStorage, ORDERS_KEY),
      );

      const otherUsersOrders = allOrders.filter(function (order) {
        return getOwnerEmail(order) !== email;
      });

      const mergedOrders = otherUsersOrders.concat(
        ownedOrders.filter(function (order) {
          return getOwnerEmail(order) === email;
        }),
      );

      return originalSetItem.call(this, key, JSON.stringify(mergedOrders));
    }

    return originalSetItem.call(this, key, JSON.stringify(ownedOrders));
  };

  // Chỉ cho trang Đơn hàng của tôi đọc đơn thuộc tài khoản đang đăng nhập.
  const originalGetItemWrapper = Storage.prototype.getItem;

  Storage.prototype.getItem = function (key) {
    const value = originalGetItemWrapper.call(this, key);

    const isOrdersPage =
      window.location.pathname.toLowerCase().endsWith("/orders.html") ||
      window.location.pathname.toLowerCase() === "orders.html";

    if (key !== ORDERS_KEY || this !== localStorage || !isOrdersPage) {
      return value;
    }

    const email = getCurrentEmail();

    if (!email) return "[]";

    return JSON.stringify(
      parseOrders(value).filter(function (order) {
        return getOwnerEmail(order) === email;
      }),
    );
  };
})();
