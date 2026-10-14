(function () {
    "use strict";

    // ==========================================
    // 1. CẤU HÌNH
    // ==========================================

    const $ = id => document.getElementById(id);
    const form = $("checkoutForm");

    if (!form) {
        console.error("Không tìm thấy checkoutForm.");
        return;
    }

    const CART_KEY = "cart";
    const LEGACY_CART_KEY = "adidas_cart";
    const ORDERS_KEY = "orders";

    let submitting = false;
    let activeVoucherCode = "";

    const nameInput = $("name");
    const phoneInput = $("phone");
    const emailInput = $("email");
    const provinceInput = $("province");
    const wardInput = $("ward");
    const streetInput = $("streetAddress");

    const bankInfo = $("bankInfo");
    const bankQR = $("bankQR");
    const qrAmount = $("qrAmount");

    const voucherInput = $("voucherCode");
    const applyVoucherButton = $("applyVoucher");
    const removeVoucherButton = $("removeVoucher");
    const voucherMessage = $("voucherMessage");

    const subtotalElement = $("checkoutSubtotal");
    const discountElement = $("checkoutDiscount");
    const totalElement = $("checkoutTotal");

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    // ==========================================
    // 2. DANH SÁCH VOUCHER
    // ==========================================

    const VOUCHERS = {
        ADIDAS10: {
            type: "percent",
            value: 10,
            min: 1000000
        },

        ADIDAS15: {
            type: "percent",
            value: 15,
            min: 2000000
        },

        ADIDAS20: {
            type: "percent",
            value: 20,
            min: 3000000
        },

        FREESHIP: {
            type: "fixed",
            value: 30000,
            min: 1000000
        }
    };

    // ==========================================
    // 3. ĐỌC DỮ LIỆU LOCAL STORAGE
    // ==========================================

    function readStorageArray(key) {
        try {
            const raw = localStorage.getItem(key);

            if (!raw) return [];

            const data = JSON.parse(raw);

            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Không đọc được dữ liệu:", key, error);
            return [];
        }
    }

    function normalizeCartItem(item) {
        if (!item || typeof item !== "object") {
            return null;
        }

        const price = Number(item.price);
        const quantity = Number(item.quantity);

        if (
            !Number.isFinite(price) ||
            price < 0 ||
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            return null;
        }

        return {
            ...item,

            id: String(
                item.id ??
                item.product_id ??
                item.productId ??
                item.name ??
                ""
            ),

            name: String(item.name || "Sản phẩm"),
            image: String(item.image || ""),
            price: price,
            quantity: quantity,
            size: item.size ?? "",
            color: item.color ?? ""
        };
    }

    function getCart() {
        const mainCart = readStorageArray(CART_KEY)
            .map(normalizeCartItem)
            .filter(Boolean);

        if (mainCart.length > 0) {
            return mainCart;
        }

        return readStorageArray(LEGACY_CART_KEY)
            .map(normalizeCartItem)
            .filter(Boolean);
    }

    function calculateTotal(cart) {
        return cart.reduce(function (total, item) {
            return total + item.price * item.quantity;
        }, 0);
    }

    function formatCurrency(amount) {
        return Number(amount).toLocaleString("vi-VN") + " VNĐ";
    }

    function clearCart() {
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(LEGACY_CART_KEY);
        localStorage.removeItem("checkoutCart");
    }

    // ==========================================
    // 4. TÍNH TIỀN VOUCHER
    // ==========================================

    function getVoucherDiscount(subtotal) {
        const voucher = VOUCHERS[activeVoucherCode];

        if (!voucher || subtotal < voucher.min) {
            return 0;
        }

        if (voucher.type === "percent") {
            return Math.min(
                subtotal,
                Math.round(subtotal * voucher.value / 100)
            );
        }

        return Math.min(subtotal, voucher.value);
    }

    function getFinalTotal(cart) {
        const subtotal = calculateTotal(cart);
        const discount = getVoucherDiscount(subtotal);

        return Math.max(0, subtotal - discount);
    }

    function showVoucherMessage(message, isError = false) {
        if (!voucherMessage) return;

        voucherMessage.textContent = message;

        voucherMessage.style.color = isError
            ? "#b42318"
            : "#18723a";
    }

    function refreshVoucherSummary() {
        const cart = getCart();
        const subtotal = calculateTotal(cart);
        const discount = getVoucherDiscount(subtotal);
        const finalTotal = Math.max(0, subtotal - discount);

        if (subtotalElement) {
            subtotalElement.textContent =
                formatCurrency(subtotal);
        }

        if (discountElement) {
            discountElement.textContent =
                "-" + formatCurrency(discount);
        }

        if (totalElement) {
            totalElement.textContent =
                formatCurrency(finalTotal);
        }

        if (removeVoucherButton) {
            removeVoucherButton.hidden = !activeVoucherCode;
        }

        updateBankQR();
    }

    function applyVoucher(code) {
        const normalizedCode = String(code || "")
            .trim()
            .toUpperCase();

        const voucher = VOUCHERS[normalizedCode];
        const subtotal = calculateTotal(getCart());

        if (!normalizedCode) {
            showVoucherMessage(
                "Vui lòng nhập hoặc chọn mã voucher.",
                true
            );
            return;
        }

        if (!voucher) {
            activeVoucherCode = "";

            showVoucherMessage(
                "Mã voucher không hợp lệ. Vui lòng kiểm tra lại.",
                true
            );

            refreshVoucherSummary();
            return;
        }

        if (subtotal < voucher.min) {
            activeVoucherCode = "";

            showVoucherMessage(
                "Đơn hàng phải đạt tối thiểu " +
                formatCurrency(voucher.min) +
                " để sử dụng mã này.",
                true
            );

            refreshVoucherSummary();
            return;
        }

        activeVoucherCode = normalizedCode;

        if (voucherInput) {
            voucherInput.value = normalizedCode;
        }

        showVoucherMessage(
            "Áp dụng " + normalizedCode +
            " thành công! Bạn được giảm " +
            formatCurrency(getVoucherDiscount(subtotal)) + "."
        );

        refreshVoucherSummary();
    }

    if (applyVoucherButton) {
        applyVoucherButton.addEventListener("click", function () {
            applyVoucher(
                voucherInput ? voucherInput.value : ""
            );
        });
    }

    if (voucherInput) {
        voucherInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                applyVoucher(voucherInput.value);
            }
        });
    }

    document.querySelectorAll("[data-voucher]").forEach(function (button) {
        button.addEventListener("click", function () {
            applyVoucher(button.dataset.voucher);
        });
    });

    if (removeVoucherButton) {
        removeVoucherButton.addEventListener("click", function () {
            activeVoucherCode = "";

            if (voucherInput) {
                voucherInput.value = "";
            }

            showVoucherMessage("Đã gỡ mã giảm giá.");
            refreshVoucherSummary();
        });
    }

    // ==========================================
    // 5. THÔNG BÁO ĐỊA CHỈ
    // ==========================================

    function showLocationMessage(message, isError = false) {
        let box = $("locationMessage");

        if (!box) {
            box = document.createElement("p");
            box.id = "locationMessage";
            box.setAttribute("role", "status");

            const target = $("getCurrentLocation") || streetInput;

            if (target) {
                target.insertAdjacentElement("afterend", box);
            } else {
                form.prepend(box);
            }
        }

        box.textContent = message;

        box.style.cssText =
            "font-size:13px;" +
            "line-height:1.5;" +
            "margin:8px 0;" +
            "color:" + (isError ? "#b42318" : "#333") + ";";
    }

    // Không gắn thêm GPS nếu checkout.html đã xử lý nút này.
    function installLocationButton() {
        const button = $("getCurrentLocation");

        if (!button) return;

        button.type = "button";

        if (button.dataset.locationBound === "true") {
            return;
        }

        button.dataset.locationBound = "true";

        button.addEventListener("click", function () {
            if (!navigator.geolocation) {
                showLocationMessage(
                    "Trình duyệt không hỗ trợ GPS.",
                    true
                );
                return;
            }

            button.disabled = true;

            navigator.geolocation.getCurrentPosition(
                function () {
                    button.disabled = false;

                    showLocationMessage(
                        "Đã xác định vị trí. Vui lòng kiểm tra địa chỉ."
                    );
                },

                function (error) {
                    button.disabled = false;

                    const messages = {
                        1: "Bạn chưa cấp quyền định vị.",
                        2: "Không xác định được vị trí GPS.",
                        3: "Lấy vị trí quá lâu. Hãy thử lại."
                    };

                    showLocationMessage(
                        messages[error.code] || "Không lấy được GPS.",
                        true
                    );
                },

                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 60000
                }
            );
        });
    }

    // ==========================================
    // 6. LẤY ĐỊA CHỈ KHÁCH HÀNG
    // ==========================================

    function getFieldValue(element) {
        if (!element) return "";

        if (
            element.tagName === "SELECT" &&
            element.selectedOptions.length > 0
        ) {
            return element.selectedOptions[0].textContent.trim();
        }

        return String(element.value || "").trim();
    }

    function getCustomerAddress() {
        const province = getFieldValue(provinceInput);
        const ward = getFieldValue(wardInput);
        const street = getFieldValue(streetInput);

        return {
            province: province,
            ward: ward,
            streetAddress: street,

            address: [street, ward, province]
                .filter(Boolean)
                .join(", ")
        };
    }

    // ==========================================
    // 7. CẬP NHẬT QR NGÂN HÀNG
    // ==========================================

    function updateBankQR() {
        const selectedPayment = form.querySelector(
            'input[name="payment"]:checked'
        );

        const total = getFinalTotal(getCart());

        const isBank = selectedPayment &&
            selectedPayment.value === "bank";

        if (bankInfo) {
            bankInfo.style.display = isBank ? "block" : "none";
        }

        if (qrAmount) {
            qrAmount.textContent = formatCurrency(total);
        }

        if (!bankQR) return;

        if (!isBank) {
            bankQR.removeAttribute("src");
            return;
        }

        const phone = phoneInput
            ? phoneInput.value.trim()
            : "";

        const params = new URLSearchParams({
            amount: String(Math.round(total)),
            addInfo: ("ADIDAS " + (phone || "DONHANG")).slice(0, 50),
            accountName: "NGUYEN CONG DUC ANH"
        });

        bankQR.src =
            "https://img.vietqr.io/image/VCB-0778366446-compact2.png?" +
            params.toString();
    }

    form.querySelectorAll('input[name="payment"]').forEach(function (method) {
        method.addEventListener("change", updateBankQR);
    });

    if (phoneInput) {
        phoneInput.addEventListener("input", updateBankQR);
    }

    // ==========================================
    // 8. KIỂM TRA THÔNG TIN KHÁCH HÀNG
    // ==========================================

    function validateCustomer() {
        const name = nameInput
            ? nameInput.value.trim()
            : "";

        const phone = phoneInput
            ? phoneInput.value.trim()
            : "";

        const email = emailInput
            ? emailInput.value.trim()
            : "";

        const address = getCustomerAddress();

        const selectedPayment = form.querySelector(
            'input[name="payment"]:checked'
        );

        if (name.length < 2) {
            alert("Vui lòng nhập họ và tên hợp lệ!");

            if (nameInput) nameInput.focus();

            return null;
        }

        const normalizedPhone = phone.replace(/[\s.-]/g, "");

        if (!/^(0\d{9}|\+84\d{9})$/.test(normalizedPhone)) {
            alert(
                "Vui lòng nhập số điện thoại hợp lệ " +
                "(10 số bắt đầu bằng 0 hoặc mã +84)."
            );

            if (phoneInput) phoneInput.focus();

            return null;
        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            alert("Vui lòng nhập địa chỉ email hợp lệ.");

            if (emailInput) emailInput.focus();

            return null;
        }

        if (!address.streetAddress) {
            alert("Vui lòng nhập số nhà và tên đường.");

            if (streetInput) streetInput.focus();

            return null;
        }

        if (!address.ward) {
            alert("Vui lòng chọn phường/xã.");

            if (wardInput) wardInput.focus();

            return null;
        }

        if (!address.province) {
            alert("Vui lòng chọn tỉnh/thành phố.");

            if (provinceInput) provinceInput.focus();

            return null;
        }

        if (!selectedPayment) {
            alert("Vui lòng chọn phương thức thanh toán.");
            return null;
        }

        return {
            name: name,
            phone: phone,
            email: email,
            address: address,

            paymentCode: selectedPayment.value,

            payment: selectedPayment.value === "cod"
                ? "Thanh toán khi nhận hàng"
                : "Chuyển khoản ngân hàng"
        };
    }

    // ==========================================
    // 9. LƯU ĐƠN HÀNG
    // ==========================================

    function saveOrderLocally(payload) {
        const orders = readStorageArray(ORDERS_KEY);

        const order = {
            id: String(Date.now()),

            customer: payload.customer,
            payment: payload.payment,
            paymentCode: payload.paymentCode,

            products: payload.products,

            subtotal: payload.subtotal,
            discount: payload.discount,
            voucherCode: payload.voucherCode,
            total: payload.total,

            status: "Chờ xử lý",
            note: "",
            createdAt: new Date().toLocaleString("vi-VN")
        };

        orders.push(order);

        localStorage.setItem(
            ORDERS_KEY,
            JSON.stringify(orders)
        );

        localStorage.setItem(
            "lastOrderId",
            String(order.id)
        );

        return order;
    }

    async function createOrder(payload) {
        const model = window.CheckoutModel;

        if (model && typeof model.createOrder === "function") {
            const order = await model.createOrder({
                customer: payload.customer,
                payment: payload.payment,
                paymentCode: payload.paymentCode,
                products: payload.products,

                subtotal: payload.subtotal,
                discount: payload.discount,
                voucherCode: payload.voucherCode,
                total: payload.total,

                note: ""
            });

            if (!order || order.id == null) {
                throw new Error(
                    "Không nhận được mã đơn hàng hợp lệ."
                );
            }

            return order;
        }

        return saveOrderLocally(payload);
    }

    // ==========================================
    // 10. KHÓA NÚT ĐẶT HÀNG
    // ==========================================

    function setSubmittingState(isSubmitting) {
        if (!submitButton) return;

        submitButton.disabled = isSubmitting;

        if (
            submitButton.tagName !== "BUTTON" &&
            submitButton.tagName !== "INPUT"
        ) {
            return;
        }

        if (!submitButton.dataset.originalText) {
            submitButton.dataset.originalText =
                submitButton.tagName === "INPUT"
                    ? submitButton.value
                    : submitButton.textContent;
        }

        const originalText = submitButton.dataset.originalText;
        const text = isSubmitting
            ? "ĐANG TẠO ĐƠN HÀNG..."
            : originalText;

        if (submitButton.tagName === "INPUT") {
            submitButton.value = text;
        } else {
            submitButton.textContent = text;
        }
    }

    // ==========================================
    // 11. XỬ LÝ ĐẶT HÀNG
    // ==========================================

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (submitting) return;

        const cart = getCart();

        if (cart.length === 0) {
            alert("Giỏ hàng đang trống! Vui lòng thêm sản phẩm trước.");
            return;
        }

        const customerInfo = validateCustomer();

        if (!customerInfo) return;

        const subtotal = calculateTotal(cart);
        const discount = getVoucherDiscount(subtotal);
        const total = Math.max(0, subtotal - discount);

        if (!Number.isFinite(total) || total < 0) {
            alert("Tổng tiền đơn hàng không hợp lệ.");
            return;
        }

        const customer = {
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email,

            address: customerInfo.address.address,
            streetAddress: customerInfo.address.streetAddress,
            ward: customerInfo.address.ward,
            province: customerInfo.address.province
        };

        const payload = {
            customer: customer,

            payment: customerInfo.payment,
            paymentCode: customerInfo.paymentCode,

            products: cart,

            subtotal: subtotal,
            discount: discount,
            voucherCode: activeVoucherCode,
            total: total
        };

        submitting = true;
        setSubmittingState(true);

        try {
            const order = await createOrder(payload);

            clearCart();

            localStorage.setItem(
                "lastOrderId",
                String(order.id)
            );

            window.location.href =
                "./thankyou.html?orderId=" +
                encodeURIComponent(order.id);

        } catch (error) {
            console.error("Lỗi tạo đơn hàng:", error);

            alert(
                error && error.message
                    ? error.message
                    : "Đặt hàng thất bại. Vui lòng thử lại."
            );

            submitting = false;
            setSubmittingState(false);
        }
    });

    // ==========================================
    // 12. KHỞI TẠO TRANG
    // ==========================================

    installLocationButton();
    refreshVoucherSummary();

    window.addEventListener("storage", function (event) {
        if (
            event.key === CART_KEY ||
            event.key === LEGACY_CART_KEY
        ) {
            refreshVoucherSummary();
        }
    });
})();