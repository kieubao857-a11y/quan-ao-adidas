
(function () {
    "use strict";

    // ==========================================
    // 1. CẤU HÌNH VÀ CÁC PHẦN TỬ HTML
    // ==========================================

    const $ = (id) => document.getElementById(id);
    const form = $("checkoutForm");

    if (!form) {
        console.error("Không tìm thấy form checkoutForm.");
        return;
    }

    const CART_KEY = "cart";
    const LEGACY_CART_KEY = "adidas_cart";
    const ORDERS_KEY = "orders";

    let submitting = false;
    let locating = false;

    function findElement(ids) {
        for (const id of ids) {
            const element = $(id);
            if (element) return element;
        }

        return null;
    }

    const nameInput = findElement([
        "name",
        "fullName",
        "customerName"
    ]);

    const phoneInput = findElement([
        "phone",
        "customerPhone"
    ]);

    const emailInput = findElement([
        "email",
        "customerEmail"
    ]);

    const provinceInput = findElement([
        "province",
        "city",
        "provinceId",
        "provinceSelect",
        "citySelect"
    ]);

    const wardInput = findElement([
        "ward",
        "commune",
        "wardId",
        "wardSelect",
        "communeSelect"
    ]);

    const streetInput = findElement([
        "streetAddress",
        "street",
        "detailAddress",
        "addressDetail",
        "houseNumber",
        "address"
    ]);

    const bankInfo = $("bankInfo");
    const bankQR = $("bankQR");
    const qrAmount = $("qrAmount");

    const paymentMethods = form.querySelectorAll(
        'input[name="payment"]'
    );

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    // ==========================================
    // 2. XỬ LÝ GIỎ HÀNG
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
    }

    // ==========================================
    // 3. THÔNG BÁO TRÊN GIAO DIỆN
    // ==========================================

    function showLocationMessage(message, isError = false) {
        let box = $("locationMessage");

        if (!box) {
            box = document.createElement("p");
            box.id = "locationMessage";
            box.setAttribute("role", "status");
            box.setAttribute("aria-live", "polite");

            const button = $("getCurrentLocation");

            if (button) {
                button.insertAdjacentElement("afterend", box);
            } else if (streetInput) {
                streetInput.insertAdjacentElement("afterend", box);
            } else {
                form.appendChild(box);
            }
        }

        box.textContent = message;

        box.style.cssText =
            "font-size:13px;" +
            "line-height:1.5;" +
            "margin:8px 0;" +
            "color:" + (isError ? "#b42318" : "#333") + ";";
    }

    // ==========================================
    // 4. NÚT LẤY ĐỊA CHỈ GPS
    // ==========================================

    function installLocationButton() {
        let button = $("getCurrentLocation");

        if (!button) {
            button = document.createElement("button");
            button.type = "button";
            button.id = "getCurrentLocation";
            button.textContent = "📍 Lấy địa chỉ hiện tại";

            button.style.cssText =
                "display:block;" +
                "margin:10px 0;" +
                "padding:12px 16px;" +
                "border:1px solid #111;" +
                "border-radius:5px;" +
                "background:#111;" +
                "color:#fff;" +
                "cursor:pointer;" +
                "font-weight:600;";

            const target = provinceInput || streetInput;

            if (target) {
                target.insertAdjacentElement("afterend", button);
            } else {
                form.prepend(button);
            }
        }

        button.type = "button";

        if (button.dataset.locationBound !== "true") {
            button.dataset.locationBound = "true";

            button.addEventListener("click", function (event) {
                event.preventDefault();
                getCurrentLocation();
            });
        }
    }

    // ==========================================
    // 5. CHUẨN HÓA TÊN ĐỊA CHỈ
    // ==========================================

    function normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .toLowerCase()
            .replace(
                /^(tinh|thanh pho|phuong|xa|quan|huyen|thi xa|thi tran)\s+/,
                ""
            )
            .trim();
    }

    function setSelectValue(select, possibleValues) {
        if (!select || select.tagName !== "SELECT") {
            return false;
        }

        const options = Array.from(select.options);

        for (const value of possibleValues.filter(Boolean)) {
            const wanted = normalizeText(value);

            const option = options.find(function (item) {
                const text = normalizeText(item.textContent);

                return item.value &&
                    text &&
                    (
                        text === wanted ||
                        text.includes(wanted) ||
                        wanted.includes(text)
                    );
            });

            if (option) {
                select.value = option.value;

                select.dispatchEvent(
                    new Event("change", { bubbles: true })
                );

                return true;
            }
        }

        return false;
    }

    function setInputValue(element, value) {
        if (!element || !value) return;

        element.value = value;

        element.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        element.dispatchEvent(
            new Event("change", { bubbles: true })
        );
    }

    function waitFor(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    // ==========================================
    // 6. TRA CỨU ĐỊA CHỈ TỪ TỌA ĐỘ GPS
    // ==========================================

    async function reverseGeocode(latitude, longitude) {
        const endpoints = [
            {
                name: "Photon",
                url: "https://photon.komoot.io/reverse",
                params: {
                    lat: latitude,
                    lon: longitude,
                    lang: "en"
                }
            },
            {
                name: "Nominatim",
                url: "https://nominatim.openstreetmap.org/reverse",
                params: {
                    format: "jsonv2",
                    lat: latitude,
                    lon: longitude,
                    addressdetails: "1",
                    "accept-language": "vi"
                }
            }
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const url = new URL(endpoint.url);

                url.search = new URLSearchParams(
                    Object.entries(endpoint.params).map(
                        ([key, value]) => [key, String(value)]
                    )
                ).toString();

                const response = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    },
                    signal: AbortSignal.timeout(12000)
                });

                if (!response.ok) {
                    throw new Error(
                        endpoint.name +
                        " trả về lỗi HTTP " +
                        response.status
                    );
                }

                const data = await response.json();

                if (endpoint.name === "Photon") {
                    const feature = data.features &&
                        data.features[0];

                    if (!feature || !feature.properties) {
                        throw new Error(
                            "Không tìm thấy địa chỉ từ Photon."
                        );
                    }

                    const p = feature.properties;

                    return {
                        display_name: [
                            p.housenumber,
                            p.street,
                            p.district,
                            p.city,
                            p.state,
                            p.country
                        ].filter(Boolean).join(", "),

                        address: {
                            house_number: p.housenumber || "",
                            road: p.street || "",
                            suburb: p.district || p.suburb || "",
                            city_district: p.district || "",
                            city: p.city || p.locality || "",
                            town: p.town || "",
                            village: p.village || "",
                            state: p.state || "",
                            province: p.province || "",
                            country: p.country || ""
                        }
                    };
                }

                if (!data || !data.address) {
                    throw new Error(
                        "Không tìm thấy địa chỉ từ Nominatim."
                    );
                }

                return data;

            } catch (error) {
                lastError = error;

                console.warn(
                    "Tra cứu bằng " + endpoint.name + " thất bại:",
                    error
                );

                await waitFor(500);
            }
        }

        throw new Error(
            "Không thể tra cứu địa chỉ. " +
            "Vui lòng kiểm tra kết nối mạng hoặc nhập địa chỉ thủ công." +
            (
                lastError && lastError.name === "TimeoutError"
                    ? " Yêu cầu đã hết thời gian chờ."
                    : ""
            )
        );
    }

    // ==========================================
    // 7. LẤY GPS VÀ TỰ ĐIỀN ĐỊA CHỈ
    // ==========================================

    async function getCurrentLocation() {
        if (locating) return;

        locating = true;

        const button = $("getCurrentLocation");

        if (button) {
            button.disabled = true;
            button.textContent = "Đang lấy vị trí...";
            button.style.opacity = "0.7";
        }

        try {
            if (!navigator.geolocation) {
                throw new Error(
                    "Trình duyệt không hỗ trợ định vị. " +
                    "Vui lòng nhập địa chỉ thủ công."
                );
            }

            showLocationMessage("Đang xác định vị trí GPS...");

            const position = await new Promise(function (resolve, reject) {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 60000
                    }
                );
            });

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            showLocationMessage(
                "Đã xác định vị trí. Đang tra cứu địa chỉ..."
            );

            const result = await reverseGeocode(
                latitude,
                longitude
            );

            const a = result.address || {};

            const provinceValues = [
                a.state,
                a.province,
                a.city,
                a.town
            ].filter(Boolean);

            const wardValues = [
                a.suburb,
                a.quarter,
                a.city_district,
                a.district,
                a.ward,
                a.town,
                a.village,
                a.hamlet,
                a.neighbourhood
            ].filter(Boolean);

            const street = [
                a.house_number,
                a.road || a.pedestrian || a.residential
            ].filter(Boolean).join(" ");

            const provinceMatched = setSelectValue(
                provinceInput,
                provinceValues
            );

            // Chờ danh sách phường/xã cập nhật nếu phụ thuộc tỉnh.
            if (provinceMatched && wardInput) {
                await waitFor(1000);
            }

            const wardMatched = setSelectValue(
                wardInput,
                wardValues
            );

            if (streetInput) {
                setInputValue(
                    streetInput,
                    street || result.display_name || ""
                );
            }

            if (!provinceMatched || !wardMatched) {
                showLocationMessage(
                    "Đã tìm thấy vị trí nhưng chưa khớp danh sách " +
                    "tỉnh/thành phố hoặc phường/xã. " +
                    "Vui lòng kiểm tra và chọn lại thủ công."
                );
            } else {
                showLocationMessage(
                    "Đã điền địa chỉ gần nhất. " +
                    "Vui lòng kiểm tra trước khi đặt hàng."
                );
            }

        } catch (error) {
            console.error("Lỗi định vị:", error);

            let message = error.message ||
                "Không thể lấy địa chỉ. Vui lòng thử lại.";

            if (typeof error.code === "number") {
                if (error.code === 1) {
                    message =
                        "Bạn chưa cấp quyền định vị. " +
                        "Hãy cho phép website truy cập vị trí.";
                } else if (error.code === 2) {
                    message =
                        "Không xác định được vị trí. " +
                        "Hãy bật GPS hoặc kiểm tra kết nối mạng.";
                } else if (error.code === 3) {
                    message =
                        "Lấy vị trí quá lâu. Vui lòng thử lại.";
                }
            }

            showLocationMessage(message, true);

        } finally {
            locating = false;

            if (button) {
                button.disabled = false;
                button.textContent = "📍 Lấy địa chỉ hiện tại";
                button.style.opacity = "1";
            }
        }
    }

    // ==========================================
    // 8. ĐỊA CHỈ KHÁCH HÀNG
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
    // 9. QR CHUYỂN KHOẢN
    // ==========================================

    function updateBankQR() {
        const selectedPayment = form.querySelector(
            'input[name="payment"]:checked'
        );

        const total = calculateTotal(getCart());

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

    paymentMethods.forEach(function (method) {
        method.addEventListener("change", updateBankQR);
    });

    if (phoneInput) {
        phoneInput.addEventListener("input", updateBankQR);
    }

    // ==========================================
    // 10. KIỂM TRA THÔNG TIN KHÁCH HÀNG
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
            alert("Vui lòng chọn hoặc nhập phường/xã.");

            if (wardInput) wardInput.focus();

            return null;
        }

        if (!address.province) {
            alert("Vui lòng chọn hoặc nhập tỉnh/thành phố.");

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
    // 11. TẠO VÀ LƯU ĐƠN HÀNG
    // ==========================================

    function saveOrderLocally(payload) {
        const orders = readStorageArray(ORDERS_KEY);

        const order = {
            id: String(Date.now()),
            customer: payload.customer,
            payment: payload.payment,
            paymentCode: payload.paymentCode,
            products: payload.products,
            total: payload.total,
            status: "Chờ xử lý",
            note: "",
            createdAt: new Date().toLocaleString("vi-VN")
        };

        orders.push(order);

        // Nếu lưu thất bại, localStorage sẽ ném lỗi.
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
                total: payload.total,
                note: ""
            });

            if (!order || order.id === undefined || order.id === null) {
                throw new Error(
                    "CheckoutModel.createOrder() không trả về mã đơn hàng hợp lệ."
                );
            }

            return order;
        }

        return saveOrderLocally(payload);
    }

    // ==========================================
    // 12. KHÓA / MỞ NÚT ĐẶT HÀNG
    // ==========================================

    function setSubmittingState(isSubmitting) {
        if (!submitButton) return;

        submitButton.disabled = isSubmitting;

        if (
            submitButton.tagName === "BUTTON" ||
            submitButton.tagName === "INPUT"
        ) {
            if (!submitButton.dataset.originalText) {
                submitButton.dataset.originalText =
                    submitButton.tagName === "INPUT"
                        ? submitButton.value
                        : submitButton.textContent;
            }

            const originalText = submitButton.dataset.originalText;

            if (submitButton.tagName === "INPUT") {
                submitButton.value = isSubmitting
                    ? "ĐANG TẠO ĐƠN HÀNG..."
                    : originalText;
            } else {
                submitButton.textContent = isSubmitting
                    ? "ĐANG TẠO ĐƠN HÀNG..."
                    : originalText;
            }
        }
    }

    // ==========================================
    // 13. XỬ LÝ ĐẶT HÀNG
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

        const total = calculateTotal(cart);

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
            total: total
        };

        submitting = true;
        setSubmittingState(true);

        try {
            const order = await createOrder(payload);

            // Chỉ xóa giỏ hàng sau khi tạo đơn thành công.
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
    // 14. KHỞI TẠO TRANG CHECKOUT
    // ==========================================

    installLocationButton();
    updateBankQR();

    // Cập nhật QR nếu giỏ hàng thay đổi ở tab khác.
    window.addEventListener("storage", function (event) {
        if (
            event.key === CART_KEY ||
            event.key === LEGACY_CART_KEY
        ) {
            updateBankQR();
        }
    });

})();