
"use strict";

async function loadNuProducts() {
    const productList = document.getElementById("productList");
    const productCount = document.getElementById("productCount");

    if (!productList) {
        console.error("Không tìm thấy phần tử productList.");
        return;
    }

    productList.replaceChildren();

    const loading = createElement(
        "p",
        "loading-message",
        "Đang tải sản phẩm Nữ..."
    );

    productList.appendChild(loading);

    if (productCount) {
        productCount.textContent = "Đang tải...";
    }

    try {
        const response = await fetch("./data/products.json", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(
                `Không tải được products.json: HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Dữ liệu products.json phải là một mảng sản phẩm."
            );
        }

        // Hỗ trợ "Nữ", "nu", "nữ" và chữ hoa/chữ thường.
        const nuProducts = data.filter((product) => {
            if (!product || typeof product !== "object") {
                return false;
            }

            const gender = String(product.gender ?? "")
                .trim()
                .toLocaleLowerCase("vi");

            return gender === "nữ" || gender === "nu";
        });

        if (productCount) {
            productCount.textContent =
                `${nuProducts.length} sản phẩm`;
        }

        if (nuProducts.length === 0) {
            showMessage(
                productList,
                "empty-message",
                "Chưa có sản phẩm Nữ",
                "Hãy kiểm tra trường gender trong data/products.json."
            );
            return;
        }

        const fragment = document.createDocumentFragment();

        nuProducts.forEach((product) => {
            fragment.appendChild(createProductCard(product));
        });

        productList.replaceChildren(fragment);

    } catch (error) {
        console.error("Lỗi tải sản phẩm Nữ:", error);

        if (productCount) {
            productCount.textContent = "Không tải được";
        }

        showMessage(
            productList,
            "error-message",
            "Không thể tải sản phẩm",
            "Kiểm tra đường dẫn products.json, định dạng JSON và máy chủ."
        );
    }
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
}

// Hỗ trợ giá dạng số, "850000", "850.000" hoặc "850.000 VNĐ".
function parsePrice(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) && value >= 0
            ? value
            : 0;
    }

    if (typeof value !== "string") {
        return 0;
    }

    const normalized = value
        .trim()
        .replace(/\s/g, "")
        .replace(/VNĐ|VND/gi, "");

    if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
        const price = Number(normalized.replace(/\./g, ""));

        return Number.isFinite(price) ? price : 0;
    }

    const price = Number(normalized);

    return Number.isFinite(price) && price >= 0
        ? price
        : 0;
}

function formatPrice(value) {
    return parsePrice(value).toLocaleString("vi-VN") + " VNĐ";
}

// Lấy ảnh từ các trường phổ biến trong products.json.
function getProductImage(product) {
    const candidates = [
        product.image,
        product.image_url,
        product.thumbnail
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== "string") {
            continue;
        }

        const path = candidate.trim();

        if (!path) {
            continue;
        }

        if (/^(javascript|vbscript):/i.test(path)) {
            continue;
        }

        if (
            /^data:/i.test(path) &&
            !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(path)
        ) {
            continue;
        }

        return path;
    }

    return "";
}

function createImageFallback(productName) {
    const fallback = createElement(
        "div",
        "product-image-fallback"
    );

    const brand = createElement(
        "span",
        "fallback-brand",
        "adidas"
    );

    const label = createElement(
        "span",
        "fallback-label",
        productName || "Sản phẩm Adidas"
    );

    fallback.append(brand, label);

    return fallback;
}

function createDetailLink(product) {
    const link = document.createElement("a");

    if (
        product.id !== undefined &&
        product.id !== null &&
        String(product.id).trim() !== ""
    ) {
        link.href =
            "detail.html?id=" +
            encodeURIComponent(String(product.id));
    } else {
        link.href = "product.html";
    }

    return link;
}

function createProductCard(product) {
    const name = String(
        product.name || "Sản phẩm Adidas"
    );

    const card = createElement("article", "product-card");

    // Ảnh sản phẩm.
    const imageLink = createDetailLink(product);
    imageLink.className = "product-image-link";

    const imagePath = getProductImage(product);

    if (imagePath) {
        const image = document.createElement("img");

        image.className = "product-image";
        image.alt = name;
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", function () {
            if (image.dataset.failed === "true") {
                return;
            }

            image.dataset.failed = "true";
            image.remove();

            imageLink.appendChild(createImageFallback(name));
        });

        image.src = imagePath;

        imageLink.appendChild(image);
    } else {
        imageLink.appendChild(createImageFallback(name));
    }

    // Thông tin sản phẩm.
    const info = createElement("div", "product-info");

    const title = createElement(
        "h3",
        "product-name",
        name
    );

    const price = createElement(
        "p",
        "product-price",
        formatPrice(product.price)
    );

    const actions = createElement(
        "div",
        "product-actions"
    );

    const button = createDetailLink(product);
    button.className = "product-btn";
    button.textContent = "XEM SẢN PHẨM";

    actions.appendChild(button);
    info.append(title, price, actions);
    card.append(imageLink, info);

    return card;
}

function showMessage(container, className, title, description) {
    const message = createElement("div", className);
    const heading = createElement("h3", "", title);
    const detail = createElement("p", "", description);

    message.append(heading, detail);
    container.replaceChildren(message);
}

loadNuProducts();
