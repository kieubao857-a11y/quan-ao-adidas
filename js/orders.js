// =====================================
// QUẢN LÝ ĐƠN HÀNG ADIDAS
// =====================================

const orderList = document.getElementById("orderList");
const ordersSummary = document.getElementById("ordersSummary");
const orderNotice = document.getElementById("orderNotice");

const cancelModal = document.getElementById("cancelModal");
const otherReasonInput = document.getElementById("otherReason");

let orders = [];
let selectedOrderId = null;
let noticeTimer;


// =====================================
// ĐỌC DỮ LIỆU
// =====================================

function loadOrders() {
    try {
        const savedOrders = JSON.parse(
            localStorage.getItem("orders") || "[]"
        );

        orders = Array.isArray(savedOrders) ? savedOrders : [];
    } catch (error) {
        console.error("Không thể đọc đơn hàng:", error);
        orders = [];
    }
}


// =====================================
// LƯU DỮ LIỆU
// =====================================

function saveOrders() {
    try {
        localStorage.setItem("orders", JSON.stringify(orders));
        return true;
    } catch (error) {
        console.error("Không thể lưu đơn hàng:", error);
        alert("Không thể lưu thay đổi. Vui lòng thử lại.");
        return false;
    }
}


// =====================================
// HÀM HỖ TRỢ
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}


function formatPrice(price) {
    return (Number(price) || 0).toLocaleString("vi-VN") + " VNĐ";
}


function getOrderStatus(order) {
    return String(order.status || "Chờ xử lý");
}


function getStatusClass(status) {
    const normalized = status.toLowerCase();

    if (normalized.includes("hủy")) {
        return "status-cancelled";
    }

    if (
        normalized.includes("hoàn thành") ||
        normalized.includes("đã giao")
    ) {
        return "status-completed";
    }

    if (
        normalized.includes("chờ") ||
        normalized.includes("xử lý")
    ) {
        return "status-pending";
    }

    return "status-other";
}


function getOrderProducts(order) {
    return Array.isArray(order.products) ? order.products : [];
}


function getOrderId(order, index) {
    return String(order.id ?? `legacy-${index}`);
}


function findOrderById(orderId) {
    return orders.find(function (order, index) {
        return getOrderId(order, index) === String(orderId);
    });
}


function showNotice(message) {
    orderNotice.textContent = message;
    orderNotice.hidden = false;

    clearTimeout(noticeTimer);

    noticeTimer = setTimeout(function () {
        orderNotice.hidden = true;
    }, 4000);
}


// =====================================
// THỐNG KÊ
// =====================================

function renderSummary() {
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


// =====================================
// HIỂN THỊ SẢN PHẨM
// =====================================

function renderProducts(products) {
    if (products.length === 0) {
        return `<p>Đơn hàng chưa có thông tin sản phẩm.</p>`;
    }

    return products.map(function (item) {
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
    }).join("");
}


// =====================================
// HIỂN THỊ DANH SÁCH ĐƠN HÀNG
// =====================================

function renderOrders() {
    loadOrders();
    renderSummary();

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

    // Đơn mới nhất hiển thị trước.
    const sortedOrders = orders.map(function (order, index) {
        return {
            order: order,
            originalIndex: index
        };
    }).reverse();

    orderList.innerHTML = sortedOrders.map(function (entry) {
        const order = entry.order;
        const index = entry.originalIndex;

        const orderId = getOrderId(order, index);
        const status = getOrderStatus(order);
        const statusClass = getStatusClass(status);

        const customer = order.customer || {};
        const products = getOrderProducts(order);

        const orderCode = escapeHTML(order.id ?? orderId);
        const createdAt = escapeHTML(
            order.createdAt || "Không có thông tin"
        );

        const customerName = escapeHTML(
            customer.name || "Chưa cập nhật"
        );

        const customerPhone = escapeHTML(
            customer.phone || "Chưa cập nhật"
        );

        const customerAddress = escapeHTML(
            customer.address || "Chưa cập nhật"
        );

        const payment = escapeHTML(
            order.payment || "Chưa cập nhật"
        );

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

        // Chỉ hiện nút hủy nếu đơn đang chờ xử lý.
        // Không còn nút xóa đơn hàng.
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
    }).join("");
}


// =====================================
// MỞ POPUP HỦY ĐƠN
// =====================================

function cancelOrder(orderId) {
    const order = findOrderById(orderId);

    if (!order) {
        alert("Không tìm thấy đơn hàng.");
        renderOrders();
        return;
    }

    if (getOrderStatus(order) !== "Chờ xử lý") {
        alert("Đơn hàng này không còn ở trạng thái chờ xử lý.");
        renderOrders();
        return;
    }

    selectedOrderId = String(orderId);

    document.querySelectorAll(".cancel-reason").forEach(function (button) {
        button.classList.remove("selected");
    });

    otherReasonInput.value = "";
    cancelModal.style.display = "flex";
}


// =====================================
// ĐÓNG POPUP
// =====================================

function closeCancelModal() {
    cancelModal.style.display = "none";
    selectedOrderId = null;

    document.querySelectorAll(".cancel-reason").forEach(function (button) {
        button.classList.remove("selected");
    });

    otherReasonInput.value = "";
}


document.getElementById("closeCancelModal").addEventListener(
    "click",
    closeCancelModal
);

document.getElementById("cancelBack").addEventListener(
    "click",
    closeCancelModal
);


cancelModal.addEventListener("click", function (event) {
    if (event.target === cancelModal) {
        closeCancelModal();
    }
});


document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        cancelModal.style.display === "flex"
    ) {
        closeCancelModal();
    }
});


// =====================================
// CHỌN LÝ DO HỦY
// =====================================

document.querySelectorAll(".cancel-reason").forEach(function (button) {
    button.addEventListener("click", function () {
        document.querySelectorAll(".cancel-reason").forEach(function (item) {
            item.classList.remove("selected");
        });

        this.classList.add("selected");

        otherReasonInput.value = "";
    });
});


// =====================================
// XÁC NHẬN HỦY ĐƠN
// =====================================

document.getElementById("confirmCancel").addEventListener(
    "click",
    function () {
        if (selectedOrderId === null) {
            alert("Không xác định được đơn hàng cần hủy.");
            return;
        }

        const order = findOrderById(selectedOrderId);

        if (!order) {
            alert("Đơn hàng không còn tồn tại.");
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

        const selectedReason = document.querySelector(
            ".cancel-reason.selected"
        );

        const otherReason = otherReasonInput.value.trim();

        let reason = "";

        if (otherReason !== "") {
            reason = otherReason;
        } else if (selectedReason) {
            reason = selectedReason.dataset.reason;
        }

        if (!reason) {
            alert("Vui lòng chọn hoặc nhập lý do hủy đơn hàng.");
            return;
        }

        const oldStatus = order.status;
        const oldReason = order.cancelReason;
        const oldCancelledAt = order.cancelledAt;

        // Giữ đơn hàng cũ, chỉ đổi trạng thái.
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
    }
);


// =====================================
// BẮT SỰ KIỆN NÚT HỦY ĐƠN
// =====================================

orderList.addEventListener("click", function (event) {
    const button = event.target.closest(
        'button[data-action="cancel"]'
    );

    if (!button) {
        return;
    }

    cancelOrder(button.dataset.orderId);
});


// =====================================
// KHỞI TẠO
// =====================================

renderOrders();