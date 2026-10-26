(function () {
    "use strict";

    const CART_KEY = "cart";
    const LEGACY_CART_KEY = "adidas_cart";
    const CHECKOUT_CART_KEY = "adidas_checkout_cart";

    const $ = (id) => document.getElementById(id);

    const cartList = $("cartList");
    const cartSubtotal = $("cartSubtotal");
    const cartTotal = $("cartTotal");
    const cartItemCount = $("cartItemCount");
    const checkoutButton = $("checkoutButton");
    const headerCartCount = $("headerCartCount");

    let cart = [];
    let selectedKeys = new Set();

    function readCart(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Lỗi đọc giỏ hàng:", error);
            return [];
        }
    }

    function saveCart() {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(cart));
    }

    function money(value) {
        return Number(value || 0).toLocaleString("vi-VN") + " ₫";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function getName(item) {
        return String(item.name || item.title || "Sản phẩm Adidas");
    }

    function getImage(item) {
        return String(item.image || item.img || "");
    }

    function getProductId(item) {
        return String(
            item.productId ??
            item.product_id ??
            item.id ??
            item.name ??
            "product"
        );
    }

    // Định danh riêng cho từng lựa chọn size/màu trong giỏ.
    function variantKey(item, index) {
        return [
            getProductId(item),
            getName(item),
            item.size || "",
            item.color || "",
            item.price || 0,
            getImage(item),
            index
        ].join("::");
    }

    // Gom theo tên và ảnh để các size/màu cùng mẫu nằm chung một thẻ.
    function groupKey(item) {
        return (
            getName(item).trim().toLowerCase() +
            "::" +
            getImage(item).trim()
        );
    }

    function normalizeItem(item) {
        return {
            ...item,
            name: getName(item),
            image: getImage(item),
            price: Math.max(0, Number(item.price) || 0),
            quantity: Math.max(
                1,
                Math.floor(Number(item.quantity) || 1)
            ),
            size: String(item.size ?? ""),
            color: String(item.color ?? "")
        };
    }

    function loadCart() {
        let items = readCart(CART_KEY);

        if (items.length === 0) {
            items = readCart(LEGACY_CART_KEY);
        }

        cart = items.map(normalizeItem);

        // Mặc định chọn tất cả sản phẩm khi mở giỏ hàng.
        selectedKeys = new Set(
            cart.map((item, index) => variantKey(item, index))
        );

        saveCart();
    }

    function getGroups() {
        const groups = new Map();

        cart.forEach(function (item, index) {
            const key = groupKey(item);

            if (!groups.has(key)) {
                groups.set(key, {
                    key: key,
                    name: getName(item),
                    image: getImage(item),
                    variants: []
                });
            }

            groups.get(key).variants.push({
                item: item,
                index: index,
                key: variantKey(item, index)
            });
        });

        return Array.from(groups.values());
    }

    // Lấy các biến thể thuộc những mẫu sản phẩm đang được chọn.
    function getSelectedItems() {
        return cart.filter(function (item, index) {
            return selectedKeys.has(variantKey(item, index));
        });
    }

    function isGroupSelected(group) {
        return group.variants.length > 0 &&
            group.variants.every(function (variant) {
                return selectedKeys.has(variant.key);
            });
    }

    function renderCart() {
        if (!cartList) {
            console.error("Không tìm thấy phần tử cartList trong cart.html");
            return;
        }

        if (cart.length === 0) {
            cartList.innerHTML = `
                <div class="simple-cart-empty">
                    <div class="simple-cart-empty-icon">🛒</div>
                    <h3>Giỏ hàng đang trống</h3>
                    <p>Hãy chọn sản phẩm Adidas mà bạn yêu thích.</p>
                    <a href="./product.html">Tiếp tục mua sắm</a>
                </div>
            `;

            updateSummary();
            return;
        }

        const groups = getGroups();

        cartList.innerHTML = `
            <div class="simple-cart-select-all">
                <label>
                    <input
                        type="checkbox"
                        id="selectAllCart"
                        ${selectedKeys.size === cart.length ? "checked" : ""}
                    >
                    <span>Chọn tất cả sản phẩm</span>
                </label>
            </div>

            <div class="simple-cart-groups">
                ${groups.map(function (group) {
                    const groupTotal = group.variants.reduce(
                        function (sum, variant) {
                            return sum +
                                variant.item.price *
                                variant.item.quantity;
                        },
                        0
                    );

                    const totalQuantity = group.variants.reduce(
                        function (sum, variant) {
                            return sum + variant.item.quantity;
                        },
                        0
                    );

                    return `
                        <article class="simple-cart-card">

                            <div class="simple-cart-product">

                                <label class="simple-product-checkbox">
                                    <input
                                        type="checkbox"
                                        class="simple-product-select"
                                        data-group="${escapeHTML(group.key)}"
                                        ${isGroupSelected(group) ? "checked" : ""}
                                    >
                                </label>

                                <img
                                    class="simple-cart-image"
                                    src="${escapeHTML(group.image)}"
                                    alt="${escapeHTML(group.name)}"
                                    onerror="this.style.visibility='hidden'"
                                >

                                <div class="simple-cart-info">

                                    <h3>${escapeHTML(group.name)}</h3>

                                    <div class="simple-cart-variants">
                                        ${group.variants.map(function (variant) {
                                            const item = variant.item;

                                            return `
                                                <div class="simple-cart-variant">

                                                    <div class="simple-cart-variant-text">
                                                        Size ${escapeHTML(item.size || "Chưa chọn")}
                                                        · Màu ${escapeHTML(item.color || "Chưa chọn")}:
                                                        ${item.quantity} áo
                                                    </div>

                                                    <div class="simple-cart-variant-actions">

                                                        <span class="simple-cart-unit-price">
                                                            ${money(item.price)} / áo
                                                        </span>

                                                        <div class="simple-cart-quantity">
                                                            <button
                                                                type="button"
                                                                data-action="minus"
                                                                data-index="${variant.index}"
                                                                aria-label="Giảm số lượng"
                                                            >−</button>

                                                            <span>${item.quantity}</span>

                                                            <button
                                                                type="button"
                                                                data-action="plus"
                                                                data-index="${variant.index}"
                                                                aria-label="Tăng số lượng"
                                                            >+</button>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            class="simple-cart-remove"
                                                            data-action="remove"
                                                            data-index="${variant.index}"
                                                        >Xóa</button>

                                                    </div>
                                                </div>
                                            `;
                                        }).join("")}
                                    </div>

                                    <div class="simple-cart-price-line">
                                        <span>
                                            ${money(group.variants[0].item.price)}
                                            × ${totalQuantity}
                                        </span>

                                       
                                    </div>

                                </div>
                            </div>

                            <div class="simple-cart-note">
                                Một sản phẩm · ${group.variants.length} lựa chọn size/màu ·
                                Không tách thành hai sản phẩm
                            </div>

                        </article>
                    `;
                }).join("")}
            </div>
        `;

        updateSummary();
    }

    function updateSummary() {
        const selected = getSelectedItems();

        const total = selected.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);

        const quantity = selected.reduce(function (sum, item) {
            return sum + item.quantity;
        }, 0);

        if (cartSubtotal) {
            cartSubtotal.textContent = money(total);
        }

        if (cartTotal) {
            cartTotal.textContent = money(total);
        }

        if (cartItemCount) {
            cartItemCount.textContent = cart.length + " biến thể";
        }

        if (headerCartCount) {
            headerCartCount.textContent = cart.reduce(
                function (sum, item) {
                    return sum + item.quantity;
                },
                0
            );
        }

        if (checkoutButton) {
            const disabled = selected.length === 0;

            checkoutButton.classList.toggle("is-disabled", disabled);
            checkoutButton.setAttribute(
                "aria-disabled",
                String(disabled)
            );

            checkoutButton.href = disabled
                ? "javascript:void(0)"
                : "./checkout.html";

            const buttonText = checkoutButton.querySelector("span");

            if (buttonText) {
                buttonText.textContent = disabled
                    ? "CHỌN SẢN PHẨM ĐỂ THANH TOÁN"
                    : "THANH TOÁN (" + quantity + " sản phẩm)";
            }
        }

        const selectAll = $("selectAllCart");

        if (selectAll) {
            selectAll.checked =
                cart.length > 0 &&
                selectedKeys.size === cart.length;

            selectAll.indeterminate =
                selectedKeys.size > 0 &&
                selectedKeys.size < cart.length;
        }
    }

    // Chọn hoặc bỏ chọn toàn bộ biến thể của một mẫu sản phẩm.
    function toggleGroup(groupKeyValue, checked) {
        const group = getGroups().find(function (item) {
            return item.key === groupKeyValue;
        });

        if (!group) return;

        group.variants.forEach(function (variant) {
            if (checked) {
                selectedKeys.add(variant.key);
            } else {
                selectedKeys.delete(variant.key);
            }
        });

        renderCart();
    }

    function changeQuantity(index, amount) {
        const item = cart[index];

        if (!item) return;

        item.quantity += amount;

        if (item.quantity < 1) {
            item.quantity = 1;
        }

        saveCart();
        renderCart();
    }

    function removeItem(index) {
        if (!cart[index]) return;

        cart.splice(index, 1);

        // Tạo lại mã chọn sau khi xóa để tránh lệch chỉ số.
        selectedKeys = new Set(
            cart.map(function (item, i) {
                return variantKey(item, i);
            })
        );

        saveCart();
        renderCart();
    }

    if (cartList) {
        cartList.addEventListener("change", function (event) {
            const target = event.target;

            if (target.id === "selectAllCart") {
                selectedKeys.clear();

                if (target.checked) {
                    cart.forEach(function (item, index) {
                        selectedKeys.add(variantKey(item, index));
                    });
                }

                renderCart();
                return;
            }

            if (target.classList.contains("simple-product-select")) {
                toggleGroup(target.dataset.group, target.checked);
            }
        });

        cartList.addEventListener("click", function (event) {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            const index = Number(button.dataset.index);
            const action = button.dataset.action;

            if (action === "minus") {
                changeQuantity(index, -1);
            } else if (action === "plus") {
                changeQuantity(index, 1);
            } else if (action === "remove") {
                removeItem(index);
            }
        });
    }

    // Chỉ gửi các sản phẩm đã chọn sang trang thanh toán.
    if (checkoutButton) {
        checkoutButton.addEventListener("click", function (event) {
            const selected = getSelectedItems();

            if (selected.length === 0) {
                event.preventDefault();
                alert("Vui lòng tích chọn ít nhất một sản phẩm để thanh toán.");
                return;
            }

            event.preventDefault();

            sessionStorage.setItem(
                CHECKOUT_CART_KEY,
                JSON.stringify(selected)
            );

            window.location.href = "./checkout.html";
        });
    }

    // CSS riêng cho giao diện giỏ hàng.
    const style = document.createElement("style");

    style.textContent = `
        .simple-cart-select-all {
            padding: 14px 0;
            border-bottom: 1px solid #e3e3e3;
            margin-bottom: 14px;
        }

        .simple-cart-select-all label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
        }

        .simple-cart-select-all input,
        .simple-product-checkbox input {
            width: 18px;
            height: 18px;
            accent-color: #111;
            cursor: pointer;
            flex-shrink: 0;
        }

        .simple-cart-card {
            width: 100%;
            box-sizing: border-box;
            padding: 16px;
            margin-bottom: 18px;
            border: 1px solid #dedede;
            border-radius: 15px;
            background: #fff;
        }

        .simple-cart-product {
            display: flex;
            align-items: flex-start;
            gap: 14px;
        }

        .simple-product-checkbox {
            display: flex;
            align-items: flex-start;
            padding-top: 4px;
            cursor: pointer;
        }

        .simple-cart-image {
            width: 124px;
            height: 124px;
            flex-shrink: 0;
            object-fit: contain;
            border: 1px solid #ededed;
            border-radius: 16px;
            background: #fff;
        }

        .simple-cart-info {
            flex: 1;
            min-width: 0;
        }

        .simple-cart-info h3 {
            margin: 6px 0 12px;
            color: #111;
            font-size: 20px;
            font-weight: 600;
        }

        .simple-cart-variant {
            margin-bottom: 10px;
        }

        .simple-cart-variant-text {
            color: #666;
            font-size: 15px;
            line-height: 1.6;
        }

        .simple-cart-variant-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            margin-top: 7px;
        }

        .simple-cart-unit-price {
            color: #555;
            font-size: 13px;
        }

        .simple-cart-quantity {
            display: inline-flex;
            align-items: center;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        .simple-cart-quantity button {
            width: 30px;
            height: 28px;
            border: 0;
            background: #fff;
            font-size: 18px;
            cursor: pointer;
        }

        .simple-cart-quantity button:hover {
            background: #f2f2f2;
        }

        .simple-cart-quantity span {
            min-width: 24px;
            text-align: center;
            font-size: 13px;
        }

        .simple-cart-remove {
            padding: 3px 0;
            border: 0;
            border-bottom: 1px solid #888;
            background: transparent;
            color: #666;
            cursor: pointer;
        }

        .simple-cart-remove:hover {
            color: #c00;
            border-color: #c00;
        }

        .simple-cart-price-line {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px 18px;
            margin-top: 14px;
            color: #111;
        }

        .simple-cart-price-line > span {
            font-size: 15px;
        }

        .simple-cart-price-line strong {
            font-size: 18px;
            font-weight: 700;
        }

        .simple-cart-note {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #dedede;
            color: #00a84f;
            font-size: 14px;
            font-weight: 600;
        }

        .simple-cart-empty {
            padding: 45px 15px;
            text-align: center;
        }

        .simple-cart-empty-icon {
            font-size: 42px;
        }

        .simple-cart-empty h3 {
            margin: 12px 0 8px;
        }

        .simple-cart-empty p {
            margin-bottom: 18px;
            color: #666;
        }

        .simple-cart-empty a {
            display: inline-block;
            padding: 12px 20px;
            background: #111;
            color: #fff;
            text-decoration: none;
        }

        @media (max-width: 600px) {
            .simple-cart-card {
                padding: 12px;
            }

            .simple-cart-product {
                gap: 9px;
            }

            .simple-cart-image {
                width: 78px;
                height: 92px;
            }

            .simple-cart-info h3 {
                margin-top: 3px;
                font-size: 16px;
            }

            .simple-cart-variant-text {
                font-size: 13px;
            }

            .simple-cart-variant-actions {
                gap: 8px;
            }

            .simple-cart-price-line strong {
                font-size: 16px;
            }
        }
    `;

    document.head.appendChild(style);

    loadCart();
    renderCart();
})();