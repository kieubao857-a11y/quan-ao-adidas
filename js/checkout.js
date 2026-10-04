// LẤY GIỎ HÀNG

let cart = JSON.parse(
    localStorage.getItem("cart")
) || [];


// LẤY CÁC PHẦN TỬ

const checkoutForm =
    document.getElementById("checkoutForm");

const nameInput =
    document.getElementById("name");

const phoneInput =
    document.getElementById("phone");

const addressInput =
    document.getElementById("address");

const paymentMethods =
    document.querySelectorAll(
        'input[name="payment"]'
    );

const bankInfo =
    document.getElementById("bankInfo");

const bankQR =
    document.getElementById("bankQR");

const qrAmount =
    document.getElementById("qrAmount");


// TÍNH TỔNG TIỀN

let totalAmount = 0;

cart.forEach(function (item) {

    totalAmount +=
        Number(item.price) *
        Number(item.quantity);

});


// HIỂN THỊ QR NGÂN HÀNG

function updateBankQR() {

    const selectedPayment =
        document.querySelector(
            'input[name="payment"]:checked'
        );


    if (!selectedPayment) {
        return;
    }


    // CHUYỂN KHOẢN

    if (selectedPayment.value === "bank") {

        bankInfo.style.display = "block";


        qrAmount.textContent =
            totalAmount.toLocaleString("vi-VN")
            + " VNĐ";


        // TẠO QR VIETQR

        const qrUrl =
            "https://img.vietqr.io/image/" +
            "VCB-0778366446-compact2.png" +
            "?amount=" +
            totalAmount +
            "&addInfo=" +
            encodeURIComponent(
                "ADIDAS " +
                phoneInput.value
            ) +
            "&accountName=" +
            encodeURIComponent(
                "NGUYEN CONG DUC ANH"
            );


        bankQR.src = qrUrl;

    }


    // THANH TOÁN KHI NHẬN HÀNG

    else {

        bankInfo.style.display = "none";

        bankQR.src = "";

    }

}


// KHI ĐỔI PHƯƠNG THỨC THANH TOÁN

paymentMethods.forEach(function (method) {

    method.addEventListener(
        "change",
        updateBankQR
    );

});


// KHI NHẬP SỐ ĐIỆN THOẠI
// CẬP NHẬT NỘI DUNG QR

phoneInput.addEventListener(
    "input",
    function () {

        const selectedPayment =
            document.querySelector(
                'input[name="payment"]:checked'
            );


        if (
            selectedPayment &&
            selectedPayment.value === "bank"
        ) {

            updateBankQR();

        }

    }
);


// KIỂM TRA GIỎ HÀNG

if (cart.length === 0) {

    alert(
        "Giỏ hàng đang trống!"
    );

    window.location.href =
        "product.html";
}


// ĐẶT HÀNG

checkoutForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        // LẤY THÔNG TIN

        const name =
            nameInput.value.trim();

        const phone =
            phoneInput.value.trim();

        const address =
            addressInput.value.trim();


        const selectedPayment =
            document.querySelector(
                'input[name="payment"]:checked'
            );


        // KIỂM TRA HỌ TÊN

        if (name === "") {

            alert(
                "Vui lòng nhập họ và tên!"
            );

            nameInput.focus();

            return;
        }


        // KIỂM TRA SỐ ĐIỆN THOẠI

        if (phone === "") {

            alert(
                "Vui lòng nhập số điện thoại!"
            );

            phoneInput.focus();

            return;
        }


        // KIỂM TRA ĐỊA CHỈ

        if (address === "") {

            alert(
                "Vui lòng nhập địa chỉ!"
            );

            addressInput.focus();

            return;
        }


        // KIỂM TRA PHƯƠNG THỨC

        if (!selectedPayment) {

            alert(
                "Vui lòng chọn phương thức thanh toán!"
            );

            return;
        }


        // XÁC ĐỊNH PHƯƠNG THỨC THANH TOÁN

        let payment = "";


        if (
            selectedPayment.value === "cod"
        ) {

            payment =
                "Thanh toán khi nhận hàng";

        } else {

            payment =
                "Chuyển khoản ngân hàng";

        }


        // LẤY DANH SÁCH ĐƠN HÀNG CŨ

        let orders = JSON.parse(
            localStorage.getItem("orders")
        ) || [];


        // TẠO ĐƠN HÀNG

        const newOrder = {

            id: Date.now(),

            customer: {

                name: name,

                phone: phone,

                address: address

            },

            payment: payment,

            products: cart,

            total: totalAmount,

            status: "Chờ xử lý",

            cancelReason: "",

            createdAt:
                new Date().toLocaleString(
                    "vi-VN"
                )

        };


        // THÊM ĐƠN HÀNG

        orders.push(newOrder);


        // LƯU ĐƠN HÀNG

        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );


        // XÓA GIỎ HÀNG

        localStorage.removeItem(
            "cart"
        );


        // THÔNG BÁO

        alert(
            "Đặt hàng thành công!"
        );


        // CHUYỂN SANG TRANG ĐƠN HÀNG

        window.location.href =
            "orders.html";

    }
);


// CHẠY KHI MỞ TRANG

updateBankQR();