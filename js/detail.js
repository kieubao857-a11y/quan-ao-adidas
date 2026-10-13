
(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const state = {
        product: null,
        selectedSize: "",
        selectedColor: "",
        quantity: 1,
        images: [],
        currentImage: "",
        toastTimer: null
    };

    const el = {
        loading: $("detailLoading"),
        error: $("detailError"),
        errorMessage: $("detailErrorMessage"),
        productDetail: $("productDetail"),

        breadcrumbName: $("detailBreadcrumbName"),
        image: $("detailImage"),
        badge: $("detailBadge"),
        thumbnails: $("detailThumbnails"),

        brand: $("detailBrand"),
        name: $("detailName"),
        price: $("detailPrice"),
        oldPrice: $("detailOldPrice"),
        discount: $("detailDiscount"),
        description: $("detailDescription"),

        colors: $("detailColors"),
        selectedColorLabel: $("selectedColorLabel"),
        sizes: $("detailSizes"),
        validation: $("detailValidation"),

        quantity: $("detailQuantity"),
        quantityMinus: $("detailQuantityMinus"),
        quantityPlus: $("detailQuantityPlus"),

        addToCart: $("detailAddToCart"),
        buyNow: $("detailBuyNow"),
        cartCount: $("detailCartCount"),

        toast: $("detailToast"),
        sizeGuide: $("detailSizeGuide"),
        sizeModal: $("detailSizeModal"),

        imageExpand: $("detailImageExpand"),
        imageModal: $("detailImageModal"),
        largeImage: $("detailLargeImage"),
        imageModalClose: $("detailImageModalClose")
    };

    // QUAN TRỌNG: Dùng chung khóa với cart.js và checkout.js.
    const CART_KEY = "cart";

    function text(value, fallback = "") {
        if (value === null || value === undefined) {
            return fallback;
        }

        return String(value);
    }

    function firstValue(object, keys, fallback = "") {
        for (const key of keys) {
            const value = object && object[key];

            if (value !== undefined && value !== null && value !== "") {
                return value;
            }
        }

        return fallback;
    }

    function formatPrice(value) {
        const price = Number(value);

        if (!Number.isFinite(price)) {
            return "Liên hệ";
        }

        return new Intl.NumberFormat("vi-VN", {
            maximumFractionDigits: 0
        }).format(price) + " ₫";
    }

    function getProductId() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    function normalizeOptions(value, fallback) {
        if (Array.isArray(value)) {
            const result = value
                .map((item) => {
                    if (typeof item === "object" && item !== null) {
                        return text(
                            firstValue(item, ["name", "label", "value"], "")
                        ).trim();
                    }

                    return text(item).trim();
                })
                .filter(Boolean);

            return result.length ? [...new Set(result)] : fallback;
        }

        if (typeof value === "string" && value.trim()) {
            return [...new Set(
                value.split(/[,;|]/)
                    .map((item) => item.trim())
                    .filter(Boolean)
            )];
        }

        return fallback;
    }

    function normalizeProduct(raw) {
        const product = { ...raw };

        product.id = firstValue(product, ["id", "product_id"], "");

        product.name = firstValue(
            product,
            ["name", "title", "product_name"],
            "Sản phẩm Adidas"
        );

        product.brand = firstValue(
            product,
            ["brand", "manufacturer"],
            "Adidas Sportswear"
        );

        product.description = firstValue(
            product,
            ["description", "detail", "content"],
            "Sản phẩm thời trang thể thao dành cho phong cách năng động."
        );

        product.price = Number(
            firstValue(product, ["price", "sale_price", "gia"], 0)
        );

        product.oldPrice = Number(
            firstValue(
                product,
                ["old_price", "original_price", "list_price"],
                0
            )
        );

        product.image = firstValue(
            product,
            ["image", "image_url", "thumbnail", "photo", "img"],
            ""
        );

        if (product.image && !Array.isArray(product.image)) {
            product.image = text(product.image).trim();
        }

        product.images = Array.isArray(product.images)
            ? product.images
            : [];

        product.sizes = normalizeOptions(
            firstValue(product, ["sizes", "size"], ["S", "M", "L", "XL"]),
            ["S", "M", "L", "XL"]
        );

        product.colors = normalizeOptions(
            firstValue(product, ["colors", "color", "colours"], [
                "Đen",
                "Trắng"
            ]),
            ["Đen", "Trắng"]
        );

        return product;
    }

    function normalizeImagePath(path) {
        if (!path) return "";

        const value = text(path).trim();

        if (
            value.startsWith("https://") ||
            value.startsWith("http://") ||
            value.startsWith("data:") ||
            value.startsWith("blob:") ||
            value.startsWith("/")
        ) {
            return value;
        }

        return value.replace(/^\.\//, "");
    }

    function getProductImages(product) {
        const images = [];

        if (Array.isArray(product.image)) {
            images.push(...product.image);
        } else if (product.image) {
            images.push(product.image);
        }

        images.push(...product.images);

        for (const key of ["image2", "image3", "image_2", "image_3"]) {
            if (product[key]) {
                images.push(product[key]);
            }
        }

        return [...new Set(
            images.map(normalizeImagePath).filter(Boolean)
        )];
    }

    // Đọc giỏ hàng. Hỗ trợ lấy dữ liệu cũ từ adidas_cart nếu cart chưa có.
    function readCart() {
        try {
            const current = JSON.parse(
                localStorage.getItem(CART_KEY) || "null"
            );

            if (Array.isArray(current)) {
                return current;
            }

            const oldCart = JSON.parse(
                localStorage.getItem("adidas_cart") || "[]"
            );

            return Array.isArray(oldCart) ? oldCart : [];
        } catch (error) {
            console.error("Không đọc được giỏ hàng:", error);
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));

            // Đồng bộ khóa cũ để tương thích với code cũ nếu còn sử dụng.
            localStorage.setItem("adidas_cart", JSON.stringify(cart));

            updateCartCount();
            return true;
        } catch (error) {
            console.error("Không lưu được giỏ hàng:", error);
            showToast("Không thể lưu giỏ hàng. Vui lòng thử lại.", true);
            return false;
        }
    }

    function getCartItemQuantity(item) {
        const quantity = Number(item.quantity ?? item.qty ?? 1);

        return Number.isFinite(quantity) && quantity > 0
            ? quantity
            : 1;
    }

    function updateCartCount() {
        const cart = readCart();

        const total = cart.reduce((sum, item) => {
            return sum + getCartItemQuantity(item);
        }, 0);

        if (el.cartCount) {
            el.cartCount.textContent = total > 99
                ? "99+"
                : String(total);
        }
    }

    function showToast(message, isError = false) {
        if (!el.toast) return;

        clearTimeout(state.toastTimer);

        el.toast.textContent = message;
        el.toast.classList.toggle("error", isError);
        el.toast.classList.add("show");

        state.toastTimer = setTimeout(() => {
            el.toast.classList.remove("show");
        }, 2800);
    }

    function showError(message) {
        el.loading.hidden = true;
        el.productDetail.hidden = true;
        el.error.hidden = false;
        el.errorMessage.textContent = message;
    }

    function getColorHex(color) {
        const normalized = text(color).toLowerCase().trim();

        const colors = {
            "đen": "#111111",
            "den": "#111111",
            "black": "#111111",
            "trắng": "#ffffff",
            "trang": "#ffffff",
            "white": "#ffffff",
            "đỏ": "#d71920",
            "do": "#d71920",
            "red": "#d71920",
            "xanh": "#2877bd",
            "xanh dương": "#2877bd",
            "blue": "#2877bd",
            "xanh lá": "#32834a",
            "green": "#32834a",
            "xám": "#999999",
            "gray": "#999999",
            "grey": "#999999",
            "vàng": "#f2cb36",
            "yellow": "#f2cb36",
            "hồng": "#e6a1b2",
            "pink": "#e6a1b2",
            "be": "#d7c5a5",
            "nâu": "#795548",
            "brown": "#795548"
        };

        return colors[normalized] || "#dddddd";
    }

    function renderImages() {
        el.thumbnails.replaceChildren();

        if (!state.images.length) {
            el.image.removeAttribute("src");
            el.image.alt = "Chưa có hình ảnh sản phẩm";
            el.image.style.visibility = "hidden";
            el.imageExpand.hidden = true;
            return;
        }

        el.image.style.visibility = "visible";
        el.imageExpand.hidden = false;

        state.currentImage = state.images[0];
        el.image.src = state.currentImage;
        el.image.alt = state.product.name;

        state.images.forEach((image, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "detail-thumbnail";
            button.classList.toggle("active", index === 0);
            button.setAttribute(
                "aria-label",
                "Xem hình ảnh " + (index + 1)
            );

            const thumbnail = document.createElement("img");
            thumbnail.src = image;
            thumbnail.alt = state.product.name + " - ảnh " + (index + 1);
            thumbnail.loading = "lazy";

            thumbnail.addEventListener("error", () => {
                button.hidden = true;
            });

            button.appendChild(thumbnail);

            button.addEventListener("click", () => {
                state.currentImage = image;
                el.image.src = image;

                el.thumbnails
                    .querySelectorAll(".detail-thumbnail")
                    .forEach((item) => {
                        item.classList.toggle("active", item === button);
                    });
            });

            el.thumbnails.appendChild(button);
        });

        el.image.onerror = () => {
            el.image.style.visibility = "hidden";
            showToast("Không tải được ảnh. Hãy kiểm tra đường dẫn ảnh.", true);
        };
    }

    function renderColors() {
        el.colors.replaceChildren();
        state.selectedColor = "";

        state.product.colors.forEach((color) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "detail-color-option";
            button.setAttribute("aria-pressed", "false");

            const swatch = document.createElement("span");
            swatch.className = "detail-color-swatch";
            swatch.style.backgroundColor = getColorHex(color);

            if (getColorHex(color).toLowerCase() === "#ffffff") {
                swatch.style.borderColor = "#aaa";
            }

            const label = document.createElement("span");
            label.textContent = color;

            button.append(swatch, label);

            button.addEventListener("click", () => {
                state.selectedColor = color;

                el.colors
                    .querySelectorAll(".detail-color-option")
                    .forEach((item) => {
                        const active = item === button;

                        item.classList.toggle("active", active);
                        item.setAttribute("aria-pressed", String(active));
                    });

                el.selectedColorLabel.textContent = color;
                clearValidation();
            });

            el.colors.appendChild(button);
        });

        el.selectedColorLabel.textContent = "Chưa chọn";
    }

    function renderSizes() {
        el.sizes.replaceChildren();
        state.selectedSize = "";

        state.product.sizes.forEach((size) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "detail-size-option";
            button.textContent = size;
            button.setAttribute("aria-pressed", "false");

            button.addEventListener("click", () => {
                state.selectedSize = size;

                el.sizes
                    .querySelectorAll(".detail-size-option")
                    .forEach((item) => {
                        const active = item === button;

                        item.classList.toggle("active", active);
                        item.setAttribute("aria-pressed", String(active));
                    });

                clearValidation();
            });

            el.sizes.appendChild(button);
        });
    }

    function renderProduct(product) {
        state.product = product;
        state.images = getProductImages(product);

        document.title = product.name + " | Adidas Shop";

        el.breadcrumbName.textContent = product.name;
        el.brand.textContent = product.brand;
        el.name.textContent = product.name;
        el.price.textContent = formatPrice(product.price);
        el.description.textContent = product.description;

        if (product.oldPrice > product.price && product.price > 0) {
            el.oldPrice.textContent = formatPrice(product.oldPrice);
            el.oldPrice.hidden = false;

            const percent = Math.round(
                (1 - product.price / product.oldPrice) * 100
            );

            el.discount.textContent = "-" + percent + "%";
            el.discount.hidden = false;
        } else {
            el.oldPrice.hidden = true;
            el.discount.hidden = true;
        }

        const hasBadge = Boolean(
            product.badge || product.is_new || product.isNew
        );

        if (hasBadge) {
            el.badge.textContent = product.badge
                ? text(product.badge)
                : "SẢN PHẨM MỚI";
            el.badge.hidden = false;
        } else {
            el.badge.hidden = true;
        }

        renderImages();
        renderColors();
        renderSizes();

        el.quantity.value = "1";
        state.quantity = 1;

        el.loading.hidden = true;
        el.error.hidden = true;
        el.productDetail.hidden = false;
    }

    async function loadProduct() {
        const productId = getProductId();

        if (!productId) {
            showError(
                "Đường dẫn thiếu mã sản phẩm. Vui lòng mở sản phẩm từ cửa hàng."
            );
            return;
        }

        try {
            const response = await fetch("./data/products.json", {
                cache: "no-cache"
            });

            if (!response.ok) {
                throw new Error(
                    "Không thể tải products.json (HTTP " +
                    response.status + ")."
                );
            }

            const data = await response.json();

            let products;

            if (Array.isArray(data)) {
                products = data;
            } else if (data && Array.isArray(data.products)) {
                products = data.products;
            } else if (data && Array.isArray(data.data)) {
                products = data.data;
            } else {
                throw new Error(
                    "Dữ liệu JSON phải là một mảng sản phẩm hoặc có thuộc tính products."
                );
            }

            const rawProduct = products.find((item) => {
                const id = firstValue(item, ["id", "product_id"], "");
                return String(id) === String(productId);
            });

            if (!rawProduct) {
                showError("Không tìm thấy sản phẩm có mã " + productId + ".");
                return;
            }

            renderProduct(normalizeProduct(rawProduct));
        } catch (error) {
            console.error("Lỗi tải sản phẩm:", error);

            showError(
                "Không tải được dữ liệu sản phẩm. Hãy kiểm tra đường dẫn " +
                "data/products.json và định dạng dữ liệu JSON."
            );
        }
    }

    function clearValidation() {
        el.validation.hidden = true;
        el.validation.textContent = "";
    }

    function validateSelection() {
        if (!state.selectedColor) {
            el.validation.textContent = "Vui lòng chọn màu sắc.";
            el.validation.hidden = false;
            return false;
        }

        if (!state.selectedSize) {
            el.validation.textContent = "Vui lòng chọn kích cỡ.";
            el.validation.hidden = false;
            return false;
        }

        const quantity = Number(el.quantity.value);

        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 99
        ) {
            el.validation.textContent = "Số lượng phải từ 1 đến 99.";
            el.validation.hidden = false;
            return false;
        }

        state.quantity = quantity;
        clearValidation();

        return true;
    }

    function getSelectedCartItem() {
        const product = state.product;

        return {
            id: product.id,
            product_id: product.id,
            name: product.name,
            image: state.currentImage || product.image || "",
            price: Number(product.price),
            size: state.selectedSize,
            color: state.selectedColor,
            quantity: state.quantity
        };
    }

    // Lưu sản phẩm vào giỏ, cộng số lượng nếu trùng ID, size và màu.
    function addProductToCart() {
        const newItem = getSelectedCartItem();
        const cart = readCart();

        const existingItem = cart.find((item) => {
            const existingId = firstValue(
                item,
                ["product_id", "id"],
                ""
            );

            return String(existingId) === String(newItem.id) &&
                text(item.size) === newItem.size &&
                text(item.color) === newItem.color;
        });

        if (existingItem) {
            existingItem.id = newItem.id;
            existingItem.product_id = newItem.id;
            existingItem.name = newItem.name;
            existingItem.image = newItem.image;
            existingItem.price = newItem.price;
            existingItem.size = newItem.size;
            existingItem.color = newItem.color;
            existingItem.quantity =
                getCartItemQuantity(existingItem) + newItem.quantity;
        } else {
            cart.push(newItem);
        }

        return saveCart(cart);
    }

    function handleAddToCart() {
        if (!state.product || !validateSelection()) {
            return;
        }

        if (addProductToCart()) {
            window.location.href = "./cart.html";
        }
    }

    function handleBuyNow() {
        if (!state.product || !validateSelection()) {
            return;
        }

        if (addProductToCart()) {
            window.location.href = "./checkout.html";
        }
    }

    function changeQuantity(amount) {
        let quantity = Number(el.quantity.value);

        if (!Number.isFinite(quantity)) {
            quantity = 1;
        }

        quantity = Math.max(
            1,
            Math.min(99, Math.floor(quantity + amount))
        );

        el.quantity.value = String(quantity);
        state.quantity = quantity;
    }

    function openSizeModal() {
        el.sizeModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeSizeModal() {
        el.sizeModal.hidden = true;

        if (el.imageModal.hidden) {
            document.body.style.overflow = "";
        }
    }

    function openImageModal() {
        if (!state.currentImage) {
            showToast("Sản phẩm chưa có hình ảnh.", true);
            return;
        }

        el.largeImage.src = state.currentImage;
        el.imageModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeImageModal() {
        el.imageModal.hidden = true;

        if (el.sizeModal.hidden) {
            document.body.style.overflow = "";
        }
    }

    function bindEvents() {
        el.quantityMinus.addEventListener("click", () => {
            changeQuantity(-1);
        });

        el.quantityPlus.addEventListener("click", () => {
            changeQuantity(1);
        });

        el.quantity.addEventListener("change", () => {
            let value = Number(el.quantity.value);

            if (!Number.isFinite(value)) value = 1;

            value = Math.max(1, Math.min(99, Math.floor(value)));

            el.quantity.value = String(value);
            state.quantity = value;
        });

        // Thêm vào giỏ hàng và mở cart.html
        el.addToCart.addEventListener("click", handleAddToCart);

        // Mua ngay và chuyển đến checkout.html
        el.buyNow.addEventListener("click", handleBuyNow);

        el.sizeGuide.addEventListener("click", openSizeModal);

        el.sizeModal.querySelectorAll("[data-close-size-modal]")
            .forEach((button) => {
                button.addEventListener("click", closeSizeModal);
            });

        el.imageExpand.addEventListener("click", openImageModal);
        el.imageModalClose.addEventListener("click", closeImageModal);

        el.imageModal.addEventListener("click", (event) => {
            if (event.target === el.imageModal) {
                closeImageModal();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeSizeModal();
                closeImageModal();
            }
        });

        window.addEventListener("storage", (event) => {
            if (event.key === CART_KEY || event.key === "adidas_cart") {
                updateCartCount();
            }
        });
    }

    function init() {
        bindEvents();
        updateCartCount();
        loadProduct();
    }

    init();
})();
