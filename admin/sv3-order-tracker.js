// ==========================================
// SV3 - THEO DÕI ĐƠN HÀNG
// Không thay thế checkout.js
// Chỉ bổ sung xử lý sau khi đơn đã được tạo
// ==========================================

(function () {
  // Chỉ chạy khi đang ở trang checkout
  const checkoutForm = document.getElementById("checkoutForm");

  if (!checkoutForm) {
    return;
  }

  // Lưu lại hàm chuyển trang gốc
  const originalLocation = window.location;

  // Theo dõi sự thay đổi localStorage
  window.addEventListener("storage", function () {
    updateOrderInfo();
  });

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem("orders")) || [];
    } catch (error) {
      console.error("Không thể đọc danh sách đơn hàng:", error);

      return [];
    }
  }

  // Lấy đơn hàng mới nhất
  function getLatestOrder() {
    const orders = getOrders();

    if (orders.length === 0) {
      return null;
    }

    return orders[orders.length - 1];
  }

  // Hiển thị thông tin đơn mới nhất
  function updateOrderInfo() {
    const order = getLatestOrder();

    if (!order) {
      return;
    }

    console.log("Đơn hàng gần nhất:", order);
  }

  // ==========================================
  // THEO DÕI SUBMIT
  // ==========================================

  checkoutForm.addEventListener(
    "submit",
    function () {
      /*
       * checkout.js sẽ xử lý việc:
       * - kiểm tra dữ liệu
       * - tạo đơn
       * - lưu localStorage
       * - xóa cart
       * - chuyển sang orders.html
       *
       * Vì vậy SV3 KHÔNG xử lý submit lại.
       */

      setTimeout(function () {
        const order = getLatestOrder();

        if (!order) {
          return;
        }

        console.log("SV3 - Đặt hàng thành công");

        console.log("Mã đơn hàng:", order.id);

        console.log("Khách hàng:", order.customer?.name);

        console.log(
          "Tổng tiền:",
          Number(order.total).toLocaleString("vi-VN") + " VNĐ",
        );
      }, 100);
    },
    true,
  );

  // ==========================================
  // KHỞI CHẠY
  // ==========================================

  updateOrderInfo();
})();
