(function () {
    "use strict";

    console.log("SV3 ADMIN TABS: ĐÃ CHẠY");

    function showView(viewId) {
        const target = document.getElementById(viewId);

        if (!target) {
            console.error("Không tìm thấy:", viewId);
            return;
        }

        // Ẩn tất cả view
        document.querySelectorAll(".view").forEach(function (view) {
            view.style.display = "none";
        });

        // Hiện view được chọn
        target.style.display = "block";

        console.log("SV3 chuyển sang:", viewId);

        // Render lại dữ liệu khi mở tab
        if (viewId === "view-orders") {
            if (typeof window.renderOrders === "function") {
                window.renderOrders();
            }
        }

        if (viewId === "view-products") {
            if (typeof window.renderProducts === "function") {
                window.renderProducts();
            }
        }

        if (viewId === "view-customers") {
            if (typeof window.renderCustomers === "function") {
                window.renderCustomers();
            }
        }
    }

    function bindMenu() {

        // Đơn hàng
        document.querySelectorAll('[data-view="orders"]').forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                showView("view-orders");
            });
        });

        // Sản phẩm
        document.querySelectorAll('[data-view="products"]').forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                showView("view-products");
            });
        });

        // Khách hàng
        document.querySelectorAll('[data-view="customers"]').forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                showView("view-customers");
            });
        });

        // Tổng quan
        document.querySelectorAll('[data-view="dashboard"]').forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                showView("view-dashboard");
            });
        });

        console.log("SV3 ADMIN TABS: Đã gắn menu");
    }

    function init() {
        bindMenu();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();