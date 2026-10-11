
(function () {
    "use strict";

    const CART_KEY = "cart";
    const ORDERS_KEY = "orders";
    const LAST_ORDER_KEY = "lastOrderId";

    function readArray(key) {
        try {
            const data = JSON.parse(
                localStorage.getItem(key) || "[]"
            );

            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Lỗi đọc dữ liệu:", error);
            return [];
        }
    }

    function getCart() {
        return readArray(CART_KEY).filter(function (item) {
            const price = Number(item && item.price);
            const quantity = Number(item && item.quantity);

            return item &&
                Number.isFinite(price) &&
                price >= 0 &&
                Number.isSafeInteger(quantity) &&
                quantity > 0;
        });
    }

    function calculateTotal(items) {
        if (!Array.isArray(items)) {
            return 0;
        }

        return items.reduce(function (total, item) {
            const price = Number(item && item.price);
            const quantity = Number(item && item.quantity);

            if (
                !Number.isFinite(price) ||
                price < 0 ||
                !Number.isSafeInteger(quantity) ||
                quantity <= 0
            ) {
                return total;
            }

            return total + price * quantity;
        }, 0);
    }

    function getOrders() {
        return readArray(ORDERS_KEY);
    }

    function createOrder(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Thông tin đơn hàng không hợp lệ.");
        }

        const cart = getCart();

        if (cart.length === 0) {
            throw new Error("Giỏ hàng đang trống!");
        }

        if (!data.customer || !data.customer.address) {
            throw new Error("Vui lòng nhập địa chỉ nhận hàng.");
        }

        if (
            data.paymentCode !== "cod" &&
            data.paymentCode !== "bank"
        ) {
            throw new Error("Vui lòng chọn phương thức thanh toán.");
        }

        const orders = getOrders();

        let id;

        do {
            id = String(Date.now()) +
                String(Math.floor(Math.random() * 1000))
                    .padStart(3, "0");
        } while (
            orders.some(function (order) {
                return String(order.id) === id;
            })
        );

        const order = {
            id: id,
            customer: data.customer,
            payment: data.payment ||
                (data.paymentCode === "cod"
                    ? "Thanh toán khi nhận hàng"
                    : "Chuyển khoản ngân hàng"),
            paymentCode: data.paymentCode,
            products: cart.map(function (item) {
                return {
                    ...item,
                    price: Number(item.price),
                    quantity: Number(item.quantity)
                };
            }),
            total: calculateTotal(cart),
            status: "Chờ xử lý",
            cancelReason: "",
            note: data.note || "",
            createdAt: new Date().toLocaleString("vi-VN")
        };

        orders.push(order);

        try {
            localStorage.setItem(
                ORDERS_KEY,
                JSON.stringify(orders)
            );

            localStorage.setItem(
                LAST_ORDER_KEY,
                String(order.id)
            );

            localStorage.removeItem(CART_KEY);

            return order;
        } catch (error) {
            console.error("Lỗi lưu đơn hàng:", error);

            throw new Error(
                "Không thể lưu đơn hàng. Vui lòng thử lại."
            );
        }
    }

    function getOrderById(id) {
        if (id === undefined || id === null || id === "") {
            return null;
        }

        return getOrders().find(function (order) {
            return String(order.id) === String(id);
        }) || null;
    }

    window.CheckoutModel = {
        getCart: getCart,
        calculateTotal: calculateTotal,
        getOrders: getOrders,
        createOrder: createOrder,
        getOrderById: getOrderById
    };
})();
