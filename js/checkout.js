// ==========================================
// LẤY GIỎ HÀNG
// ==========================================

let cart = JSON.parse(
    localStorage.getItem("cart")
) || [];


// ==========================================
// LẤY CÁC PHẦN TỬ
// ==========================================

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

const voucherInput =
    document.getElementById("voucherInput");

const applyVoucher =
    document.getElementById("applyVoucher");

const voucherMessage =
    document.getElementById("voucherMessage");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const discountRow =
    document.getElementById("discountRow");

const discountAmount =
    document.getElementById("discountAmount");

const finalTotal =
    document.getElementById("finalTotal");


// ==========================================
// DANH SÁCH MÃ GIẢM GIÁ
// ==========================================

const voucherList = {

    ADIDAS10: {
        type: "percent",
        value: 10,
        text: "Giảm 10%"
    },

    ADIDAS15: {
        type: "percent",
        value: 15,
        text: "Giảm 15%"
    },

    ADIDAS20: {
        type: "percent",
        value: 20,
        text: "Giảm 20%"
    },

    ADIDAS25: {
        type: "percent",
        value: 25,
        text: "Giảm 25%"
    },

    FREESHIP: {
        type: "shipping",
        value: 0,
        text: "Miễn phí vận chuyển"
    }

};


// ==========================================
// TÍNH TỔNG TIỀN BAN ĐẦU
// ==========================================

let totalAmount = 0;

cart.forEach(function (item) {

    totalAmount +=
        Number(item.price) *
        Number(item.quantity);

});


// ==========================================
// BIẾN GIẢM GIÁ
// ==========================================

let currentVoucher = "";

let discountValue = 0;

let finalAmount = totalAmount;


// ==========================================
// HIỂN THỊ TỔNG TIỀN
// ==========================================

function updateTotalDisplay() {

    checkoutTotal.textContent =
        totalAmount.toLocaleString("vi-VN")
        + " VNĐ";


    discountAmount.textContent =
        discountValue.toLocaleString("vi-VN")
        + " VNĐ";


    finalTotal.textContent =
        finalAmount.toLocaleString("vi-VN")
        + " VNĐ";


    if (discountValue > 0) {

        discountRow.style.display =
            "block";

    } else {

        discountRow.style.display =
            "none";

    }

}


// ==========================================
// ÁP DỤNG MÃ GIẢM GIÁ
// ==========================================

function applyVoucherCode() {

    if (!voucherInput) {
        return;
    }


    const code =
        voucherInput.value
        .trim()
        .toUpperCase();


    // Không nhập mã

    if (code === "") {

        voucherMessage.textContent =
            "Vui lòng nhập mã giảm giá!";

        voucherMessage.style.color =
            "red";

        return;
    }


    // Mã không tồn tại

    if (!voucherList[code]) {

        voucherMessage.textContent =
            "❌ Mã giảm giá không hợp lệ!";

        voucherMessage.style.color =
            "red";

        discountValue = 0;

        finalAmount = totalAmount;

        currentVoucher = "";

        updateTotalDisplay();

        updateBankQR();

        return;
    }


    const voucher =
        voucherList[code];


    // Mã phần trăm

    if (voucher.type === "percent") {

        discountValue =
            Math.round(
                totalAmount *
                voucher.value /
                100
            );

    }


    // FREESHIP
    // Hiện tại shop chưa tính phí ship
    // nên mã này không trừ tiền sản phẩm

    else {

        discountValue = 0;

    }


    finalAmount =
        totalAmount -
        discountValue;


    currentVoucher =
        code;


    localStorage.setItem(
        "appliedVoucher",
        code
    );


    voucherMessage.textContent =
        "✅ Áp dụng " +
        code +
        " thành công - " +
        voucher.text;

    voucherMessage.style.color =
        "green";


    updateTotalDisplay();

    updateBankQR();

}


// ==========================================
// NÚT ÁP DỤNG
// ==========================================

if (applyVoucher) {

    applyVoucher.addEventListener(
        "click",
        applyVoucherCode
    );

}


// ==========================================
// TỰ ĐIỀN MÃ ĐÃ QUAY
// ==========================================

if (voucherInput) {

    const savedVoucher =
        localStorage.getItem("voucherCode");


    if (
        savedVoucher &&
        voucherList[savedVoucher]
    ) {

        voucherInput.value =
            savedVoucher;

    }

}


// ==========================================
// HIỂN THỊ QR NGÂN HÀNG
// ==========================================

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

        bankInfo.style.display =
            "block";


        qrAmount.textContent =
            finalAmount.toLocaleString("vi-VN")
            + " VNĐ";


        const qrUrl =
            "https://img.vietqr.io/image/" +
            "VCB-0778366446-compact2.png" +
            "?amount=" +
            finalAmount +
            "&addInfo=" +
            encodeURIComponent(
                "ADIDAS " +
                phoneInput.value
            ) +
            "&accountName=" +
            encodeURIComponent(
                "NGUYEN CONG DUC ANH"
            );


        bankQR.src =
            qrUrl;

    }


    // THANH TOÁN KHI NHẬN HÀNG

    else {

        bankInfo.style.display =
            "none";

        bankQR.src =
            "";

    }

}


// ==========================================
// ĐỔI PHƯƠNG THỨC THANH TOÁN
// ==========================================

paymentMethods.forEach(function (method) {

    method.addEventListener(
        "change",
        updateBankQR
    );

});


// ==========================================
// NHẬP SỐ ĐIỆN THOẠI
// ==========================================

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


// ==========================================
// KIỂM TRA GIỎ HÀNG
// ==========================================

if (cart.length === 0) {

    alert(
        "Giỏ hàng đang trống!"
    );

    window.location.href =
        "product.html";
}


// ==========================================
// ĐẶT HÀNG
// ==========================================

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


        // XÁC ĐỊNH PHƯƠNG THỨC

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


        // LẤY ĐƠN HÀNG CŨ

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

            total: finalAmount,

            voucher: currentVoucher,

            discount: discountValue,

            status: "Chờ xử lý",

            cancelReason: "",

            createdAt:
                new Date().toLocaleString(
                    "vi-VN"
                )

        };


        // THÊM ĐƠN HÀNG

        orders.push(
            newOrder
        );


        // LƯU ĐƠN HÀNG

        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );


        // XÓA GIỎ HÀNG

        localStorage.removeItem(
            "cart"
        );


        // XÓA MÃ ĐÃ DÙNG

        localStorage.removeItem(
            "voucherCode"
        );

        localStorage.removeItem(
            "voucherText"
        );

        localStorage.removeItem(
            "appliedVoucher"
        );


        // THÔNG BÁO

        alert(
            "Đặt hàng thành công!"
        );


        // CHUYỂN SANG ĐƠN HÀNG

        window.location.href =
            "orders.html";

    }
);


// ==========================================
// CHẠY KHI MỞ TRANG
// ==========================================

updateTotalDisplay();

updateBankQR();