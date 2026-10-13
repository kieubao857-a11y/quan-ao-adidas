"use strict";

async function loadSaleProducts() {
    const productList = document.getElementById("productList");

    if (!productList) {
        console.error("Không tìm thấy phần tử productList.");
        return;
    }

    // Hiển thị trạng thái tải
    productList.innerHTML = `
        <p class="sale-status">Đang tải sản phẩm Sale...</p>
    `;

    try {
        const response = await fetch("./data/products.json");

        if (!response.ok) {
            throw new Error(
                `Không thể tải products.json. HTTP ${response.status}`
            );
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("Dữ liệu sản phẩm phải là một mảng JSON.");
        }

        // Lọc các sản phẩm đang Sale
        const saleProducts = products.filter(function (product) {
            return product.sale === true || product.sale === "true";
        });

        // Không có sản phẩm Sale
        if (saleProducts.length === 0) {
            productList.innerHTML = `
                <div class="sale-status">
                    <h2>Hiện chưa có sản phẩm Sale</h2>
                    <p>Vui lòng quay lại sau để xem các ưu đãi mới.</p>
                </div>
            `;
            return;
        }

        // Xóa nội dung cũ trước khi render
        productList.replaceChildren();

        saleProducts.forEach(function (product) {
            const card = document.createElement("article");
            card.className = "product-card";

            // Ảnh sản phẩm
            const image = document.createElement("img");
            image.className = "product-image";
            image.src = product.image || "./images/no-image.png";
            image.alt = product.name || "Sản phẩm Adidas";
            image.loading = "lazy";

            image.addEventListener("error", function () {
                image.onerror = null;
                image.removeAttribute("src");
                image.alt = "Không tải được ảnh sản phẩm";
                image.style.height = "230px";
            });

            // Thông tin sản phẩm
            const info = document.createElement("div");
            info.className = "product-info";

            const name = document.createElement("h3");
            name.className = "product-name";
            name.textContent = product.name || "Sản phẩm Adidas";

            const label = document.createElement("span");
            label.className = "sale-label";
            label.textContent = "ĐANG SALE";

            const priceBox = document.createElement("div");
            priceBox.className = "sale-price";

            const oldPrice = document.createElement("span");
            oldPrice.className = "old-price";

            const newPrice = document.createElement("span");
            newPrice.className = "new-price";

            const formatPrice = function (price) {
                const value = Number(price);

                if (!Number.isFinite(value)) {
                    return "Liên hệ";
                }

                return value.toLocaleString("vi-VN") + " VNĐ";
            };

            oldPrice.textContent = formatPrice(product.oldPrice);
            newPrice.textContent = formatPrice(product.price);

            priceBox.append(oldPrice, newPrice);

            // Nút xem chi tiết
            const detailLink = document.createElement("a");
            detailLink.className = "product-button";
            detailLink.textContent = "Xem sản phẩm";

            const productId = product.id;

            if (productId !== undefined && productId !== null) {
                detailLink.href =
                    "./detail.html?id=" + encodeURIComponent(productId);
            } else {
                detailLink.href = "./product.html";
            }

            info.append(name, label, priceBox, detailLink);
            card.append(image, info);

            productList.appendChild(card);
        });

    } catch (error) {
        console.error("Lỗi tải sản phẩm Sale:", error);

        productList.innerHTML = `
            <div class="sale-status error">
                <h2>Không thể tải sản phẩm Sale</h2>
                <p>Kiểm tra file products.json và thử tải lại trang.</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", loadSaleProducts);