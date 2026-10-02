let orders = JSON.parse(localStorage.getItem("orders")) || [];

const orderList = document.getElementById("orderList");


// HIỂN THỊ ĐƠN HÀNG
function renderOrders() {

    orderList.innerHTML = "";

    if (orders.length === 0) {

        orderList.innerHTML = `
            <div class="empty-order">
                <h2>Chưa có đơn hàng</h2>

                <a href="product.html">
                    Tiếp tục mua hàng
                </a>
            </div>
        `;

        return;
    }


    orders.forEach(function (order, index) {

        let productsHTML = "";


        // HIỂN THỊ SẢN PHẨM
        order.products.forEach(function (item) {

            productsHTML += `
                <div class="order-product">

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                    >

                    <div>

                        <h3>${item.name}</h3>

                        <p>Size: ${item.size}</p>

                        <p>Màu: ${item.color}</p>

                        <p>Số lượng: ${item.quantity}</p>

                        <p>
                            Giá:
                            ${item.price.toLocaleString("vi-VN")}
                            VNĐ
                        </p>

                    </div>

                </div>
            `;
        });


        // NÚT HỦY ĐƠN
        let cancelButton = "";

        if (order.status === "Chờ xử lý") {

            cancelButton = `
                <button
                    type="button"
                    class="cancel-order-btn"
                    onclick="cancelOrder(${index})"
                >
                    HỦY ĐƠN HÀNG
                </button>
            `;
        }


        // NÚT XÓA ĐƠN ĐÃ HỦY
        let deleteButton = "";

        if (order.status === "Đã hủy") {

            deleteButton = `
                <button
                    type="button"
                    class="delete-order-btn"
                    onclick="deleteOrder(${index})"
                >
                    XÓA ĐƠN HÀNG
                </button>
            `;
        }


        // LÝ DO HỦY
        let cancelReasonHTML = "";

        if (order.cancelReason) {

            cancelReasonHTML = `
                <p>
                    Lý do hủy:
                    ${order.cancelReason}
                </p>
            `;
        }


        // HIỂN THỊ ĐƠN
        orderList.innerHTML += `

            <div class="order-item">

                <h2>
                    Đơn hàng #${order.id}
                </h2>

                <p>
                    Ngày đặt:
                    ${order.createdAt}
                </p>

                <h3>
                    Thông tin người nhận
                </h3>

                <p>
                    Họ tên:
                    ${order.customer.name}
                </p>

                <p>
                    Số điện thoại:
                    ${order.customer.phone}
                </p>

                <p>
                    Địa chỉ:
                    ${order.customer.address}
                </p>

                <p>
                    Thanh toán:
                    ${order.payment}
                </p>

                <h3>
                    Sản phẩm
                </h3>

                ${productsHTML}

                <h2>
                    Tổng tiền:
                    ${order.total.toLocaleString("vi-VN")}
                    VNĐ
                </h2>

                <p>
                    Trạng thái:
                    <strong>
                        ${order.status}
                    </strong>
                </p>

                ${cancelReasonHTML}

                ${cancelButton}

                ${deleteButton}

            </div>
        `;
    });
}


// MỞ POPUP HỦY ĐƠN
function cancelOrder(index) {

    const modal = document.getElementById("cancelModal");

    modal.style.display = "flex";

    modal.dataset.orderIndex = index;


    document
        .querySelectorAll(".cancel-reason")
        .forEach(function (button) {

            button.classList.remove("selected");

        });


    document.getElementById("otherReason").value = "";
}


// XÓA ĐƠN HÀNG ĐÃ HỦY
function deleteOrder(index) {

    const confirmDelete = confirm(
        "Bạn có chắc muốn xóa đơn hàng này không?"
    );

    if (!confirmDelete) {
        return;
    }


    orders.splice(index, 1);


    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    renderOrders();
}


// CHỌN LÝ DO
document
    .querySelectorAll(".cancel-reason")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(".cancel-reason")
                    .forEach(function (item) {

                        item.classList.remove("selected");

                    });

                this.classList.add("selected");
            }
        );

    });


// ĐÓNG POPUP - NÚT X
document
    .getElementById("closeCancelModal")
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "cancelModal"
            ).style.display = "none";

        }
    );


// ĐÓNG POPUP - NÚT QUAY LẠI
document
    .getElementById("cancelBack")
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "cancelModal"
            ).style.display = "none";

        }
    );


// XÁC NHẬN HỦY
document
    .getElementById("confirmCancel")
    .addEventListener(
        "click",
        function () {

            const modal =
                document.getElementById("cancelModal");

            const selectedReason =
                document.querySelector(
                    ".cancel-reason.selected"
                );

            const otherReason =
                document
                    .getElementById("otherReason")
                    .value
                    .trim();

            let reason = "";


            if (selectedReason) {

                reason =
                    selectedReason.dataset.reason;

            } else if (otherReason !== "") {

                reason = otherReason;

            } else {

                alert(
                    "Vui lòng chọn lý do hủy đơn hàng!"
                );

                return;
            }


            const index =
                Number(
                    modal.dataset.orderIndex
                );


            orders[index].status = "Đã hủy";

            orders[index].cancelReason = reason;


            localStorage.setItem(
                "orders",
                JSON.stringify(orders)
            );


            modal.style.display = "none";

            renderOrders();

        }
    );


// CHẠY KHI MỞ TRANG
renderOrders();