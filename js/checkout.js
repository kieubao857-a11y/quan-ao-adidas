const checkoutForm = document.getElementById("checkoutForm");

checkoutForm.addEventListener("submit", function (event) {

    event.preventDefault();

    // =========================
    // LẤY THÔNG TIN KHÁCH HÀNG
    // =========================

    const name = document.getElementById("name").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const address = document.getElementById("address").value.trim();

    const payment = document.querySelector(
        'input[name="payment"]:checked'
    );


    // =========================
    // VALIDATION
    // =========================

    if (name === "") {
        alert("Vui lòng nhập họ và tên!");
        return;
    }

    if (phone === "") {
        alert("Vui lòng nhập số điện thoại!");
        return;
    }

    const phoneRegex = /^[0-9]{10,11}$/;

    if (!phoneRegex.test(phone)) {
        alert("Số điện thoại phải có 10 hoặc 11 chữ số!");
        return;
    }

    if (address === "") {
        alert("Vui lòng nhập địa chỉ!");
        return;
    }

    if (!payment) {
        alert("Vui lòng chọn phương thức thanh toán!");
        return;
    }


    // =========================
    // LẤY GIỎ HÀNG
    // =========================

    const cart = JSON.parse(
        localStorage.getItem("cart")
    ) || [];


    // Kiểm tra giỏ hàng
    if (cart.length === 0) {

        alert("Giỏ hàng đang trống!");

        return;
    }


    // =========================
    // TÍNH TỔNG TIỀN
    // =========================

    let total = 0;

    cart.forEach(function (item) {

        total += item.price * item.quantity;

    });


    // =========================
    // TẠO ĐƠN HÀNG
    // =========================

    const order = {

        id: Date.now(),

        customer: {
            name: name,
            phone: phone,
            address: address
        },

        payment:
            payment.value === "cod"
                ? "Thanh toán khi nhận hàng"
                : "Chuyển khoản ngân hàng",

        products: cart,

        total: total,

        status: "Chờ xử lý",

        cancelReason: "",

        createdAt: new Date().toLocaleString("vi-VN")

    };


    // =========================
    // LẤY CÁC ĐƠN HÀNG CŨ
    // =========================

    let orders = JSON.parse(
        localStorage.getItem("orders")
    ) || [];


    // Thêm đơn hàng mới
    orders.push(order);


    // Lưu danh sách đơn hàng
    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    // =========================
    // XÓA GIỎ HÀNG
    // =========================

    localStorage.removeItem("cart");


    // =========================
    // THÔNG BÁO
    // =========================

    alert("Đặt hàng thành công!");


    // =========================
    // CHUYỂN SANG TRANG ĐƠN HÀNG
    // =========================

    window.location.href = "orders.html";

});