/* =====================================================
   QUẢN LÝ ĐƠN HÀNG ADIDAS
   - Khách chỉ xem đơn của tài khoản mình.
   - Admin có thể xem toàn bộ đơn.
   - Chỉ hủy đơn đang Chờ xử lý.
   - Không xóa đơn hàng.
   - Giữ nguyên đơn của các tài khoản khác.
===================================================== */

(function () {
  "use strict";

  const ORDERS_KEY = "orders";
  const CURRENT_USER_KEY = "currentUser";

  const orderList = document.getElementById("orderList");
  const ordersSummary = document.getElementById("ordersSummary");
  const orderNotice = document.getElementById("orderNotice");

  const cancelModal = document.getElementById("cancelModal");
  const otherReasonInput = document.getElementById("otherReason");

  let orders = [];
  let selectedOrderId = null;
  let noticeTimer = null;

  // =====================================================
  // TÀI KHOẢN HIỆN TẠI
  // =====================================================

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
    } catch (error) {
      console.error("Không đọc được tài khoản:", error);
      return null;
    }
  }

  function getCurrentEmail() {
    const user = getCurrentUser();

    return String(user?.email || "")
      .trim()
      .toLowerCase();
  }

  function isAdminUser(user) {
    return Boolean(
      user &&
      (String(user.role || "").toLowerCase() === "admin" ||
        String(user.email || "")
          .trim()
          .toLowerCase() === "admin@gmail.com"),
    );
  }

  function getOrderOwnerEmail(order) {
    // Chỉ sử dụng email tài khoản đặt hàng.
    // Không lấy email người nhận làm chủ sở hữu đơn.
    return String(order?.ownerEmail || "")
      .trim()
      .toLowerCase();
  }

  // =====================================================
  // ĐỌC VÀ LƯU DỮ LIỆU
  // =====================================================

  function readAllOrders() {
    try {
      const data = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Không thể đọc đơn hàng:", error);
      return [];
    }
  }

  function loadOrders() {
    const user = getCurrentUser();
    const email = getCurrentEmail();

    if (!user || !email) {
      orders = [];
      return;
    }

    const allOrders = readAllOrders();

    if (isAdminUser(user)) {
      orders = allOrders;
      return;
    }

    // Khách chỉ xem đơn được gắn đúng email tài khoản.
    orders = allOrders.filter(function (order) {
      return getOrderOwnerEmail(order) === email;
    });
  }

  function saveOrders() {
    try {
      const user = getCurrentUser();
      const email = getCurrentEmail();

      if (!user || !email) {
        alert("Vui lòng đăng nhập để thực hiện thao tác này.");
        return false;
      }

      const allOrders = readAllOrders();

      // Admin được lưu danh sách đơn mà trang admin đang quản lý.
      if (isAdminUser(user)) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

        return true;
      }

      // Chỉ cập nhật đơn của tài khoản đang đăng nhập.
      const updates = new Map();

      orders.forEach(function (order) {
        if (getOrderOwnerEmail(order) === email) {
          updates.set(String(order.id), order);
        }
      });

      const mergedOrders = allOrders.map(function (savedOrder) {
        if (getOrderOwnerEmail(savedOrder) !== email) {
          return savedOrder;
        }

        const id = String(savedOrder.id);

        if (updates.has(id)) {
          const updatedOrder = updates.get(id);
          updates.delete(id);
          return updatedOrder;
        }

        // Không tự xóa đơn nếu đơn không có trong danh sách.
        return savedOrder;
      });

      // Bổ sung đơn của người dùng chưa có trong dữ liệu đã lưu.
      updates.forEach(function (order) {
        mergedOrders.push(order);
      });

      localStorage.setItem(ORDERS_KEY, JSON.stringify(mergedOrders));

      return true;
    } catch (error) {
      console.error("Không thể lưu đơn hàng:", error);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
      return false;
    }
  }

  // =====================================================
  // HÀM HỖ TRỢ
  // =====================================================

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[char];
    });
  }

  function formatPrice(price) {
    return (Number(price) || 0).toLocaleString("vi-VN") + " VNĐ";
  }

  function getOrderStatus(order) {
    return String(order?.status || "Chờ xử lý");
  }

  function getStatusClass(status) {
    const normalized = status.toLowerCase();

    if (normalized.includes("hủy")) {
      return "status-cancelled";
    }

    if (normalized.includes("hoàn thành") || normalized.includes("đã giao")) {
      return "status-completed";
    }

    if (normalized.includes("chờ") || normalized.includes("xử lý")) {
      return "status-pending";
    }

    return "status-other";
  }

  function getOrderProducts(order) {
    return Array.isArray(order?.products) ? order.products : [];
  }

  function getOrderId(order, index) {
    return String(order?.id ?? `legacy-${index}`);
  }

  function findOrderById(orderId) {
    return orders.find(function (order, index) {
      return getOrderId(order, index) === String(orderId);
    });
  }

  function showNotice(message) {
    if (!orderNotice) return;

    orderNotice.textContent = message;
    orderNotice.hidden = false;

    if (noticeTimer) {
      clearTimeout(noticeTimer);
    }

    noticeTimer = setTimeout(function () {
      orderNotice.hidden = true;
    }, 4000);
  }

  // =====================================================
  // THỐNG KÊ ĐƠN HÀNG
  // =====================================================

  function renderSummary() {
    if (!ordersSummary) return;

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(function (order) {
      return getOrderStatus(order) === "Chờ xử lý";
    }).length;

    const cancelledOrders = orders.filter(function (order) {
      return getOrderStatus(order) === "Đã hủy";
    }).length;

    ordersSummary.innerHTML = `
            <div class="summary-card">
                <span>Tổng số đơn hàng</span>
                <strong>${totalOrders}</strong>
            </div>

            <div class="summary-card">
                <span>Đơn đang xử lý</span>
                <strong>${pendingOrders}</strong>
            </div>

            <div class="summary-card">
                <span>Đơn đã hủy</span>
                <strong>${cancelledOrders}</strong>
            </div>
        `;
  }

  // =====================================================
  // HIỂN THỊ SẢN PHẨM TRONG ĐƠN
  // =====================================================

  function renderProducts(products) {
    if (!products.length) {
      return "<p>Đơn hàng chưa có thông tin sản phẩm.</p>";
    }

    return products
      .map(function (item) {
        const name = escapeHTML(item.name || "Sản phẩm Adidas");
        const image = escapeHTML(item.image || "");
        const size = escapeHTML(item.size || "Không có");
        const color = escapeHTML(item.color || "Không có");
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const price = Number(item.price) || 0;

        return `
                <div class="order-product">
                    <img
                        src="${image}"
                        alt="${name}"
                        loading="lazy"
                        onerror="this.style.display='none'"
                    >

                    <div class="order-product-info">
                        <h4>${name}</h4>

                        <div class="product-detail-line">
                            <span>Size: ${size}</span>
                            <span>Màu: ${color}</span>
                            <span>Số lượng: ${quantity}</span>
                        </div>

                        <div class="product-price">
                            ${formatPrice(price)}
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // =====================================================
  // HIỂN THỊ DANH SÁCH ĐƠN HÀNG
  // =====================================================

  function renderOrders() {
    if (!orderList || !ordersSummary) {
      console.error(
        "Thiếu phần tử orderList hoặc ordersSummary trong orders.html.",
      );
      return;
    }

    loadOrders();
    renderSummary();

    const user = getCurrentUser();

    if (!user || !getCurrentEmail()) {
      orderList.innerHTML = `
                <div class="empty-order">
                    <div class="empty-icon">🔐</div>
                    <h2>Vui lòng đăng nhập</h2>
                    <p>Bạn cần đăng nhập để xem lịch sử đơn hàng.</p>
                    <a href="login.html">ĐĂNG NHẬP</a>
                </div>
            `;

      return;
    }

    if (orders.length === 0) {
      orderList.innerHTML = `
                <div class="empty-order">
                    <div class="empty-icon">📦</div>
                    <h2>Bạn chưa có đơn hàng nào</h2>
                    <p>
                        Những đơn hàng bạn đặt sẽ xuất hiện tại đây.
                    </p>
                    <a href="product.html">KHÁM PHÁ SẢN PHẨM</a>
                </div>
            `;

      return;
    }

    const sortedOrders = orders
      .map(function (order, index) {
        return {
          order: order,
          originalIndex: index,
        };
      })
      .reverse();

    orderList.innerHTML = sortedOrders
      .map(function (entry) {
        const order = entry.order;
        const index = entry.originalIndex;

        const orderId = getOrderId(order, index);
        const status = getOrderStatus(order);
        const statusClass = getStatusClass(status);

        const customer = order.customer || {};
        const products = getOrderProducts(order);

        const orderCode = escapeHTML(order.id ?? orderId);
        const createdAt = escapeHTML(order.createdAt || "Không có thông tin");

        const customerName = escapeHTML(customer.name || "Chưa cập nhật");

        const customerPhone = escapeHTML(customer.phone || "Chưa cập nhật");

        const customerAddress = escapeHTML(customer.address || "Chưa cập nhật");

        const payment = escapeHTML(order.payment || "Chưa cập nhật");

        const total = Number(order.total) || 0;
        const canCancel = status === "Chờ xử lý";

        let cancelReasonHTML = "";

        if (order.cancelReason) {
          cancelReasonHTML = `
                    <div class="cancel-reason-display">
                        <strong>Lý do hủy:</strong>
                        ${escapeHTML(order.cancelReason)}
                    </div>
                `;
        }

        let actionsHTML = "";

        if (canCancel) {
          actionsHTML = `
                    <button
                        type="button"
                        class="cancel-order-btn"
                        data-action="cancel"
                        data-order-id="${escapeHTML(orderId)}"
                    >
                        HỦY ĐƠN HÀNG
                    </button>
                `;
        }

        return `
                <article class="order-item">
                    <div class="order-top">
                        <div>
                            <h2 class="order-code">
                                ĐƠN HÀNG #${orderCode}
                            </h2>

                            <p class="order-date">
                                Ngày đặt: ${createdAt}
                            </p>
                        </div>

                        <span class="order-status ${statusClass}">
                            ● ${escapeHTML(status)}
                        </span>
                    </div>

                    <div class="order-body">
                        <h3 class="order-section-title">
                            THÔNG TIN NGƯỜI NHẬN
                        </h3>

                        <div class="customer-info">
                            <div class="customer-field">
                                <span>Họ và tên</span>
                                <strong>${customerName}</strong>
                            </div>

                            <div class="customer-field">
                                <span>Số điện thoại</span>
                                <strong>${customerPhone}</strong>
                            </div>

                            <div class="customer-field">
                                <span>Địa chỉ giao hàng</span>
                                <strong>${customerAddress}</strong>
                            </div>

                            <div class="customer-field">
                                <span>Phương thức thanh toán</span>
                                <strong>${payment}</strong>
                            </div>
                        </div>

                        <h3 class="order-section-title">
                            SẢN PHẨM ĐÃ ĐẶT
                        </h3>

                        <div class="order-products">
                            ${renderProducts(products)}
                        </div>

                        <div class="order-bottom">
                            <div class="order-payment">
                                Phương thức thanh toán:
                                <strong>${payment}</strong>
                            </div>

                            <div class="order-total">
                                <span>Tổng thanh toán</span>
                                <strong>${formatPrice(total)}</strong>
                            </div>
                        </div>

                        ${cancelReasonHTML}

                        <div class="order-actions">
                            ${actionsHTML}
                        </div>
                    </div>
                </article>
            `;
      })
      .join("");
  }

  // =====================================================
  // POPUP HỦY ĐƠN
  // =====================================================

  function closeCancelModal() {
    if (!cancelModal) return;

    cancelModal.style.display = "none";
    selectedOrderId = null;

    document.querySelectorAll(".cancel-reason").forEach(function (button) {
      button.classList.remove("selected");
    });

    if (otherReasonInput) {
      otherReasonInput.value = "";
    }
  }

  function cancelOrder(orderId) {
    loadOrders();

    const order = findOrderById(orderId);

    if (!order) {
      alert("Không tìm thấy đơn hàng của tài khoản hiện tại.");
      renderOrders();
      return;
    }

    if (getOrderStatus(order) !== "Chờ xử lý") {
      alert("Chỉ có thể hủy đơn hàng đang chờ xử lý.");
      renderOrders();
      return;
    }

    selectedOrderId = String(orderId);

    document.querySelectorAll(".cancel-reason").forEach(function (button) {
      button.classList.remove("selected");
    });

    if (otherReasonInput) {
      otherReasonInput.value = "";
    }

    if (cancelModal) {
      cancelModal.style.display = "flex";
    }
  }

  // =====================================================
  // GẮN SỰ KIỆN POPUP
  // =====================================================

  const closeButton = document.getElementById("closeCancelModal");
  const backButton = document.getElementById("cancelBack");
  const confirmButton = document.getElementById("confirmCancel");

  if (closeButton) {
    closeButton.addEventListener("click", closeCancelModal);
  }

  if (backButton) {
    backButton.addEventListener("click", closeCancelModal);
  }

  if (cancelModal) {
    cancelModal.addEventListener("click", function (event) {
      if (event.target === cancelModal) {
        closeCancelModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      cancelModal &&
      cancelModal.style.display === "flex"
    ) {
      closeCancelModal();
    }
  });

  document.querySelectorAll(".cancel-reason").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".cancel-reason").forEach(function (item) {
        item.classList.remove("selected");
      });

      this.classList.add("selected");

      if (otherReasonInput) {
        otherReasonInput.value = "";
      }
    });
  });

  // =====================================================
  // XÁC NHẬN HỦY ĐƠN
  // =====================================================

  if (confirmButton) {
    confirmButton.addEventListener("click", function () {
      if (selectedOrderId === null) {
        alert("Không xác định được đơn hàng cần hủy.");
        return;
      }

      // Đọc dữ liệu mới nhất trước khi thay đổi trạng thái.
      loadOrders();

      const order = findOrderById(selectedOrderId);

      if (!order) {
        alert("Không tìm thấy đơn hàng của tài khoản hiện tại.");
        closeCancelModal();
        renderOrders();
        return;
      }

      if (getOrderStatus(order) !== "Chờ xử lý") {
        alert("Đơn hàng này không thể hủy.");
        closeCancelModal();
        renderOrders();
        return;
      }

      const selectedReason = document.querySelector(".cancel-reason.selected");

      const otherReason = otherReasonInput ? otherReasonInput.value.trim() : "";

      let reason = "";

      if (otherReason) {
        reason = otherReason;
      } else if (selectedReason) {
        reason = selectedReason.dataset.reason || "";
      }

      if (!reason) {
        alert("Vui lòng chọn hoặc nhập lý do hủy đơn hàng.");
        return;
      }

      const oldStatus = order.status;
      const oldReason = order.cancelReason;
      const oldCancelledAt = order.cancelledAt;

      order.status = "Đã hủy";
      order.cancelReason = reason;
      order.cancelledAt = new Date().toLocaleString("vi-VN");

      if (!saveOrders()) {
        order.status = oldStatus;
        order.cancelReason = oldReason;
        order.cancelledAt = oldCancelledAt;
        return;
      }

      closeCancelModal();
      renderOrders();

      showNotice("Đơn hàng đã được hủy thành công.");
    });
  }

  // =====================================================
  // NÚT HỦY ĐƠN TRÊN DANH SÁCH
  // =====================================================

  if (orderList) {
    orderList.addEventListener("click", function (event) {
      const button = event.target.closest('button[data-action="cancel"]');

      if (!button) return;

      cancelOrder(button.dataset.orderId);
    });
  }

  // =====================================================
  // KHỞI CHẠY
  // =====================================================

  renderOrders();
})();
