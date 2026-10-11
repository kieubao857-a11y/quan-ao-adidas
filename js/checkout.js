(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);
    const form = $("checkoutForm");

    if (!form) {
        console.error("Không tìm thấy form checkoutForm.");
        return;
    }

    function findElement(ids) {
        for (const id of ids) {
            const element = $(id);
            if (element) return element;
        }
        return null;
    }

    const nameInput = findElement(["name", "fullName", "customerName"]);
    const phoneInput = findElement(["phone", "customerPhone"]);
    const emailInput = findElement(["email", "customerEmail"]);

    const provinceInput = findElement([
        "province", "city", "provinceId",
        "provinceSelect", "citySelect"
    ]);

    const wardInput = findElement([
        "ward", "commune", "wardId",
        "wardSelect", "communeSelect"
    ]);

    const streetInput = findElement([
        "streetAddress", "street", "detailAddress",
        "addressDetail", "houseNumber", "address"
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

    let submitting = false;
    let locating = false;

    // =========================
    // GIỎ HÀNG
    // =========================

    function getCart() {
        try {
            const cart = JSON.parse(
                localStorage.getItem("cart") || "[]"
            );

            if (!Array.isArray(cart)) return [];

            return cart.filter(function (item) {
                return item &&
                    Number.isFinite(Number(item.price)) &&
                    Number(item.price) >= 0 &&
                    Number.isInteger(Number(item.quantity)) &&
                    Number(item.quantity) > 0;
            });
        } catch (error) {
            console.error("Lỗi đọc giỏ hàng:", error);
            return [];
        }
    }

    function calculateTotal(cart) {
        return cart.reduce(function (total, item) {
            return total +
                Number(item.price) * Number(item.quantity);
        }, 0);
    }

    // =========================
    // THÔNG BÁO ĐỊA CHỈ
    // =========================

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
            "font-size:13px;line-height:1.5;margin:8px 0;" +
            "color:" + (isError ? "#b42318" : "#333") + ";";
    }

    // =========================
    // NÚT LẤY ĐỊA CHỈ GPS
    // =========================

    function installLocationButton() {
        let button = $("getCurrentLocation");

        if (!button) {
            button = document.createElement("button");
            button.type = "button";
            button.id = "getCurrentLocation";
            button.textContent = "📍 Lấy địa chỉ hiện tại";

            button.style.cssText =
                "display:block;margin:10px 0;padding:12px 16px;" +
                "border:1px solid #111;border-radius:5px;" +
                "background:#111;color:#fff;cursor:pointer;" +
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
                event.stopPropagation();
                getCurrentLocation();
            });
        }
    }

    // =========================
    // CHUẨN HÓA TÊN ĐỊA CHỈ
    // =========================

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

    // =========================
    // CHỌN GIÁ TRỊ DROPDOWN
    // =========================

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

    // =========================
    // TRA CỨU ĐỊA CHỈ TỪ GPS
    // =========================

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
                    Object.fromEntries(
                        Object.entries(endpoint.params).map(
                            ([key, value]) => [key, String(value)]
                        )
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

                // Photon trả về GeoJSON.
                if (endpoint.name === "Photon") {
                    const feature = data.features &&
                        data.features[0];

                    if (!feature || !feature.properties) {
                        throw new Error(
                            "Photon không tìm thấy địa chỉ."
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

                // Nominatim trả về đối tượng có address.
                if (!data || !data.address) {
                    throw new Error(
                        "Nominatim không tìm thấy địa chỉ."
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
            "Không thể kết nối dịch vụ bản đồ. " +
            "Hãy kiểm tra mạng và thử lại. " +
            (lastError && lastError.name === "TimeoutError"
                ? "Yêu cầu tra cứu đã hết thời gian chờ."
                : "")
        );
    }

    // =========================
    // LẤY GPS VÀ ĐIỀN ĐỊA CHỈ
    // =========================

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

            const a = result.address;

            const province = [
                a.state,
                a.province,
                a.city,
                a.town
            ].filter(Boolean);

            const ward = [
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

            // Điền tỉnh/thành phố.
            const provinceMatched = setSelectValue(
                provinceInput,
                province
            );

            // Chờ dropdown phường/xã cập nhật theo tỉnh.
            if (provinceMatched && wardInput) {
                await waitFor(1000);
            }

            // Điền phường/xã.
            const wardMatched = setSelectValue(
                wardInput,
                ward
            );

            // Điền số nhà và tên đường.
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
                    "Vui lòng chọn lại các mục này thủ công."
                );
            } else {
                showLocationMessage(
                    "Đã điền địa chỉ gần nhất. " +
                    "Vui lòng kiểm tra lại trước khi đặt hàng."
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
                        "Hãy bật GPS hoặc Wi-Fi.";
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

    // =========================
    // QR CHUYỂN KHOẢN
    // =========================

    function updateBankQR() {
        const selectedPayment = form.querySelector(
            'input[name="payment"]:checked'
        );

        if (!selectedPayment) return;

        const total = calculateTotal(getCart());
        const isBank = selectedPayment.value === "bank";

        if (bankInfo) {
            bankInfo.style.display = isBank ? "block" : "none";
        }

        if (qrAmount) {
            qrAmount.textContent =
                total.toLocaleString("vi-VN") + " VNĐ";
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

    // =========================
    // LẤY ĐỊA CHỈ KHÁCH HÀNG
    // =========================

    function getCustomerAddress() {
        const province = provinceInput
            ? (
                provinceInput.tagName === "SELECT"
                    ? provinceInput.selectedOptions[0]?.textContent.trim() || ""
                    : provinceInput.value.trim()
            )
            : "";

        const ward = wardInput
            ? (
                wardInput.tagName === "SELECT"
                    ? wardInput.selectedOptions[0]?.textContent.trim() || ""
                    : wardInput.value.trim()
            )
            : "";

        const street = streetInput
            ? streetInput.value.trim()
            : "";

        return {
            province: province,
            ward: ward,
            streetAddress: street,
            address: [street, ward, province]
                .filter(Boolean)
                .join(", ")
        };
    }

    // =========================
    // ĐẶT HÀNG
    // =========================

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (submitting) return;

        const cart = getCart();

        if (cart.length === 0) {
            alert("Giỏ hàng đang trống!");
            return;
        }

        const name = nameInput
            ? nameInput.value.trim()
            : "";

        const phone = phoneInput
            ? phoneInput.value.trim()
            : "";

        const email = emailInput
            ? emailInput.value.trim()
            : "";

        const customerAddress = getCustomerAddress();

        const selectedPayment = form.querySelector(
            'input[name="payment"]:checked'
        );

        if (name.length < 2) {
            alert("Vui lòng nhập họ và tên hợp lệ!");
            if (nameInput) nameInput.focus();
            return;
        }

        const normalizedPhone = phone.replace(/[\s.-]/g, "");

        if (!/^(0\d{9}|\+84\d{9})$/.test(normalizedPhone)) {
            alert("Vui lòng nhập số điện thoại hợp lệ.");
            if (phoneInput) phoneInput.focus();
            return;
        }

        if (
            !customerAddress.address ||
            customerAddress.address.length < 5
        ) {
            alert("Vui lòng nhập đầy đủ địa chỉ nhận hàng.");
            if (streetInput) streetInput.focus();
            return;
        }

        if (!selectedPayment) {
            alert("Vui lòng chọn phương thức thanh toán!");
            return;
        }

        const payment = selectedPayment.value === "cod"
            ? "Thanh toán khi nhận hàng"
            : "Chuyển khoản ngân hàng";

        const customer = {
            name: name,
            phone: phone,
            email: email,
            address: customerAddress.address,
            streetAddress: customerAddress.streetAddress,
            ward: customerAddress.ward,
            province: customerAddress.province
        };

        submitting = true;

        if (submitButton) {
            submitButton.disabled = true;

            if (submitButton.tagName === "BUTTON") {
                submitButton.textContent = "ĐANG TẠO ĐƠN HÀNG...";
            }
        }

        try {
            const model = window.CheckoutModel;
            let order;

            if (model && typeof model.createOrder === "function") {
                order = model.createOrder({
                    customer: customer,
                    payment: payment,
                    paymentCode: selectedPayment.value,
                    note: ""
                });
            } else {
                const orders = JSON.parse(
                    localStorage.getItem("orders") || "[]"
                );

                order = {
                    id: String(Date.now()),
                    customer: customer,
                    payment: payment,
                    paymentCode: selectedPayment.value,
                    products: cart,
                    total: calculateTotal(cart),
                    status: "Chờ xử lý",
                    note: "",
                    createdAt: new Date().toLocaleString("vi-VN")
                };

                orders.push(order);

                localStorage.setItem(
                    "orders",
                    JSON.stringify(orders)
                );

                localStorage.setItem(
                    "lastOrderId",
                    String(order.id)
                );

                localStorage.removeItem("cart");
            }

            window.location.href =
                "thankyou.html?orderId=" +
                encodeURIComponent(order.id);

        } catch (error) {
            console.error("Lỗi tạo đơn hàng:", error);

            alert(
                error.message ||
                "Đặt hàng thất bại. Vui lòng thử lại."
            );

            submitting = false;

            if (submitButton) {
                submitButton.disabled = false;

                if (submitButton.tagName === "BUTTON") {
                    submitButton.textContent = "ĐẶT HÀNG";
                }
            }
        }
    });

    // =========================
    // KHỞI TẠO
    // =========================

    installLocationButton();
    updateBankQR();

})();