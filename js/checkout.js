const checkoutForm = document.getElementById("checkoutForm");

checkoutForm.addEventListener("submit", function (event) {

    // Không cho form tự reload trang
    event.preventDefault();

    // Lấy dữ liệu
    const name = document.getElementById("name").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const address = document.getElementById("address").value.trim();

    const payment = document.querySelector(
        'input[name="payment"]:checked'
    );


    // =========================
    // KIỂM TRA HỌ TÊN
    // =========================

    if (name === "") {

        alert("Vui lòng nhập họ và tên!");

        return;
    }


    // =========================
    // KIỂM TRA SỐ ĐIỆN THOẠI
    // =========================

    if (phone === "") {

        alert("Vui lòng nhập số điện thoại!");

        return;
    }


    // Kiểm tra số điện thoại có phải số hay không
    const phoneRegex = /^[0-9]{10,11}$/;

    if (!phoneRegex.test(phone)) {

        alert("Số điện thoại phải có 10 hoặc 11 chữ số!");

        return;
    }


    // =========================
    // KIỂM TRA ĐỊA CHỈ
    // =========================

    if (address === "") {

        alert("Vui lòng nhập địa chỉ!");

        return;
    }


    // =========================
    // KIỂM TRA THANH TOÁN
    // =========================

    if (!payment) {

        alert("Vui lòng chọn phương thức thanh toán!");

        return;
    }


    // =========================
    // ĐẶT HÀNG THÀNH CÔNG
    // =========================

    alert(
        "Đặt hàng thành công!\n\n" +
        "Họ tên: " + name + "\n" +
        "Số điện thoại: " + phone + "\n" +
        "Địa chỉ: " + address + "\n" +
        "Phương thức thanh toán: " +
        (payment.value === "cod"
            ? "Thanh toán khi nhận hàng"
            : "Chuyển khoản ngân hàng")
    );


    // Xóa giỏ hàng sau khi đặt hàng
    localStorage.removeItem("cart");


    // Quay về trang sản phẩm
    window.location.href = "product.html";

});