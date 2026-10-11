
(function () {
    "use strict";

    const model = window.CheckoutModel;
    const params = new URLSearchParams(window.location.search);

    const orderId =
        params.get("orderId") ||
        localStorage.getItem("lastOrderId");

    const root = document.getElementById("thankyouContent");

    if (!root || !model) {
        console.error("Không tìm thấy CheckoutModel hoặc vùng hiển thị đơn hàng.");
        return;
    }

    const order = model.getOrderById(orderId);

    if (!order) {
        root.innerHTML = "";

        const title = document.createElement("h2");
        title.textContent = "Không tìm thấy đơn hàng";

        const message = document.createElement("p");
        message.textContent =
            "Đơn hàng chưa được tạo hoặc dữ liệu đã bị xóa.";

        const link = document.createElement("a");
        link.href = "product.html";
        link.textContent = "Tiếp tục mua sắm";

        root.append(title, message, link);
        return;
    }

    function $(id) {
        return document.getElementById(id);
    }

    function money(amount) {
        return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
    }

    $("orderNumber").textContent =
        "Mã đơn hàng: #" + order.id;

    const customer = order.customer || {};
    const customerDetails = $("customerDetails");

    [
        ["Họ và tên", customer.name],
        ["Số điện thoại", customer.phone],
        ["Email", customer.email],
        ["Địa chỉ", customer.address],
        ["Ghi chú", order.note]
    ].forEach(function (item) {
        if (!item[1]) return;

        const p = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = item[0] + ": ";

        p.append(
            strong,
            document.createTextNode(String(item[1]))
        );

        customerDetails.appendChild(p);
    });

    $("paymentDetails").textContent =
        "Phương thức: " + (order.payment || "Chưa xác định");

    $("orderDate").textContent =
        "Ngày đặt: " + (order.createdAt || "Không xác định");

    $("orderStatus").textContent =
        "Trạng thái: " + (order.status || "Chờ xử lý");

    const productsBox = $("thankyouProducts");

    (Array.isArray(order.products) ? order.products : [])
        .forEach(function (item) {
            const row = document.createElement("div");
            row.className = "thankyou-product";

            const img = document.createElement("img");
            img.src = item.image || "";
            img.alt = item.name || "Sản phẩm";

            img.onerror = function () {
                this.style.display = "none";
            };

            const info = document.createElement("div");

            const name = document.createElement("strong");
            name.textContent = item.name || "Sản phẩm";

            const meta = document.createElement("small");
            meta.textContent =
                "Số lượng: " + Number(item.quantity || 0) +
                (item.size ? " · Size: " + item.size : "") +
                (item.color ? " · Màu: " + item.color : "");

            info.append(name, meta);

            const price = document.createElement("strong");
            price.textContent = money(
                Number(item.price || 0) *
                Number(item.quantity || 0)
            );

            row.append(img, info, price);
            productsBox.appendChild(row);
        });

    $("thankyouTotal").textContent = money(order.total);
})();
