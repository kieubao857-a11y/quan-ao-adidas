(function () {
    "use strict";

    // =========================================
    // 1. LẤY DỮ LIỆU ĐƠN HÀNG
    // =========================================

    const model = window.CheckoutModel;
    const params = new URLSearchParams(window.location.search);

    const orderId =
        params.get("orderId") ||
        localStorage.getItem("lastOrderId");

    const root = document.getElementById("thankyouContent");

    if (!root) {
        console.error("Không tìm thấy vùng hiển thị đơn hàng.");
        return;
    }

    // =========================================
    // 2. HÀM HỖ TRỢ
    // =========================================

    function $(id) {
        return document.getElementById(id);
    }

    function money(amount) {
        return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
    }

    function showError(title, message) {
        root.innerHTML = "";

        const box = document.createElement("div");
        box.className = "thankyou-error";

        const heading = document.createElement("h2");
        heading.textContent = title;

        const description = document.createElement("p");
        description.textContent = message;

        const link = document.createElement("a");
        link.href = "product.html";
        link.className = "thankyou-action-link";
        link.textContent = "Tiếp tục mua sắm";

        link.style.display = "inline-block";
        link.style.marginTop = "15px";
        link.style.padding = "12px 20px";
        link.style.background = "#111";
        link.style.color = "#fff";
        link.style.textDecoration = "none";

        box.append(heading, description, link);
        root.appendChild(box);
    }

    // =========================================
    // 3. KIỂM TRA CHECKOUT MODEL
    // =========================================

    if (!model || typeof model.getOrderById !== "function") {
        showError(
            "Không thể tải đơn hàng",
            "Không tìm thấy dữ liệu CheckoutModel. Vui lòng kiểm tra file checkoutModel.js."
        );

        console.error("CheckoutModel không tồn tại hoặc thiếu getOrderById().");
        return;
    }

    if (!orderId) {
        showError(
            "Không tìm thấy mã đơn hàng",
            "Bạn chưa có mã đơn hàng để xem chi tiết."
        );
        return;
    }

    let order;

    try {
        order = model.getOrderById(orderId);
    } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);

        showError(
            "Không thể tải đơn hàng",
            "Đã xảy ra lỗi khi đọc thông tin đơn hàng."
        );
        return;
    }

    if (!order) {
        showError(
            "Không tìm thấy đơn hàng",
            "Đơn hàng chưa được tạo hoặc dữ liệu đơn hàng đã bị xóa."
        );
        return;
    }

    // =========================================
    // 4. HIỂN THỊ MÃ ĐƠN HÀNG
    // =========================================

    $("orderNumber").textContent =
        "Mã đơn hàng: #" + order.id;

    // =========================================
    // 5. HIỂN THỊ THÔNG TIN KHÁCH HÀNG
    // =========================================

    const customer = order.customer || {};
    const customerDetails = $("customerDetails");

    customerDetails.innerHTML = "";

    const customerFields = [
        ["Họ và tên", customer.name],
        ["Số điện thoại", customer.phone],
        ["Email", customer.email],
        ["Địa chỉ", customer.address],
        ["Ghi chú", order.note]
    ];

    let hasCustomerInfo = false;

    customerFields.forEach(function (field) {
        const label = field[0];
        const value = field[1];

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            return;
        }

        hasCustomerInfo = true;

        const p = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = label + ": ";

        p.append(
            strong,
            document.createTextNode(String(value))
        );

        customerDetails.appendChild(p);
    });

    if (!hasCustomerInfo) {
        const p = document.createElement("p");
        p.textContent = "Chưa có thông tin nhận hàng.";
        customerDetails.appendChild(p);
    }

    // =========================================
    // 6. PHƯƠNG THỨC THANH TOÁN
    // =========================================

    $("paymentDetails").textContent =
        "Phương thức: " +
        (order.payment || "Chưa xác định");

    // =========================================
    // 7. NGÀY ĐẶT HÀNG
    // =========================================

    let formattedDate = "Không xác định";

    if (order.createdAt) {
        const date = new Date(order.createdAt);

        if (!Number.isNaN(date.getTime())) {
            formattedDate = date.toLocaleString("vi-VN");
        } else {
            formattedDate = String(order.createdAt);
        }
    }

    $("orderDate").textContent =
        "Ngày đặt: " + formattedDate;

    // =========================================
    // 8. TRẠNG THÁI ĐƠN HÀNG
    // =========================================

    $("orderStatus").textContent =
        "Trạng thái: " + (order.status || "Chờ xử lý");

    // =========================================
    // 9. HIỂN THỊ SẢN PHẨM
    // =========================================

    const productsBox = $("thankyouProducts");
    productsBox.innerHTML = "";

    const products = Array.isArray(order.products)
        ? order.products
        : [];

    if (products.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Không có sản phẩm trong đơn hàng.";
        productsBox.appendChild(empty);
    }

    products.forEach(function (item) {
        const row = document.createElement("div");
        row.className = "thankyou-product";

        // Ảnh sản phẩm
        const img = document.createElement("img");

        img.src = item.image || "";
        img.alt = item.name || "Sản phẩm";

        img.onerror = function () {
            this.style.display = "none";
        };

        // Thông tin sản phẩm
        const info = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = item.name || "Sản phẩm";

        const meta = document.createElement("small");

        const quantity = Math.max(
            1,
            Number(item.quantity) || 1
        );

        const details = [
            "Số lượng: " + quantity
        ];

        if (item.size) {
            details.push("Size: " + item.size);
        }

        if (item.color) {
            details.push("Màu: " + item.color);
        }

        meta.textContent = details.join(" · ");

        info.append(name, meta);

        // Thành tiền sản phẩm
        const price = document.createElement("strong");

        price.className = "thankyou-product-price";

        price.textContent = money(
            Number(item.price || 0) * quantity
        );

        row.append(img, info, price);
        productsBox.appendChild(row);
    });

    // =========================================
    // 10. TỔNG THANH TOÁN
    // =========================================

    const calculatedTotal = products.reduce(function (sum, item) {
        const quantity = Math.max(
            1,
            Number(item.quantity) || 1
        );

        return sum + Number(item.price || 0) * quantity;
    }, 0);

    const total = order.total !== undefined &&
                  order.total !== null &&
                  order.total !== ""
        ? Number(order.total)
        : calculatedTotal;

    $("thankyouTotal").textContent = money(total);

})();