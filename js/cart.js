// LẤY GIỎ HÀNG TỪ LOCALSTORAGE
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartList = document.getElementById("cartList");

// ĐỊNH DẠNG GIÁ TIỀN
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + " đ";
}

// LƯU GIỎ HÀNG
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// HIỂN THỊ GIỎ HÀNG
function renderCart() {
    cartList.innerHTML = "";

    // GIỎ HÀNG TRỐNG
    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛍️</div>

                <h2>Giỏ hàng đang trống</h2>

                <p>
                    Bạn chưa chọn sản phẩm nào.
                    Hãy khám phá các sản phẩm Adidas nhé!
                </p>

                <a href="product.html" class="cart-shop-button">
                    KHÁM PHÁ SẢN PHẨM →
                </a>
            </div>
        `;
        return;
    }

    let total = 0;
    let totalQuantity = 0;

    // HIỂN THỊ TỪNG SẢN PHẨM
    cart.forEach((item, index) => {
        const price = Number(item.price) || 0;
        const quantity = Math.max(1, Number(item.quantity) || 1);

        total += price * quantity;
        totalQuantity += quantity;

        const product = document.createElement("div");
        product.className = "cart-item";

        const image = document.createElement("img");
        image.className = "cart-image";
        image.src = item.image || "";
        image.alt = item.name || "Sản phẩm Adidas";

        image.onerror = function () {
            this.style.display = "none";
        };

        const info = document.createElement("div");
        info.className = "cart-info";

        const name = document.createElement("h3");
        name.className = "cart-product-name";
        name.textContent = item.name || "Sản phẩm Adidas";

        const variants = document.createElement("div");
        variants.className = "cart-product-variant";

        const size = document.createElement("span");
        size.textContent = "Size: " + (item.size || "Chưa chọn");

        const color = document.createElement("span");
        color.textContent = "Màu: " + (item.color || "Chưa chọn");

        variants.append(size, color);

        const priceText = document.createElement("p");
        priceText.className = "cart-product-price";
        priceText.textContent = "Đơn giá: " + formatPrice(price);

        // TĂNG GIẢM SỐ LƯỢNG
        const quantityRow = document.createElement("div");
        quantityRow.className = "cart-quantity-row";

        const quantityLabel = document.createElement("span");
        quantityLabel.className = "cart-quantity-label";
        quantityLabel.textContent = "Số lượng";

        const quantityBox = document.createElement("div");
        quantityBox.className = "cart-quantity-box";

        const decreaseButton = document.createElement("button");
        decreaseButton.type = "button";
        decreaseButton.className = "cart-quantity-btn";
        decreaseButton.textContent = "−";
        decreaseButton.disabled = quantity <= 1;
        decreaseButton.setAttribute("aria-label", "Giảm số lượng");

        decreaseButton.addEventListener("click", function () {
            decreaseQuantity(index);
        });

        const quantityNumber = document.createElement("span");
        quantityNumber.className = "cart-quantity-number";
        quantityNumber.textContent = quantity;

        const increaseButton = document.createElement("button");
        increaseButton.type = "button";
        increaseButton.className = "cart-quantity-btn";
        increaseButton.textContent = "+";
        increaseButton.setAttribute("aria-label", "Tăng số lượng");

        increaseButton.addEventListener("click", function () {
            increaseQuantity(index);
        });

        quantityBox.append(
            decreaseButton,
            quantityNumber,
            increaseButton
        );

        quantityRow.append(quantityLabel, quantityBox);

        // THÀNH TIỀN
        const subtotal = document.createElement("p");
        subtotal.className = "cart-product-subtotal";
        subtotal.textContent =
            "Thành tiền: " + formatPrice(price * quantity);

        // XÓA SẢN PHẨM
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "cart-remove-btn";
        removeButton.textContent = "🗑 Xóa sản phẩm";

        removeButton.addEventListener("click", function () {
            removeItem(index);
        });

        info.append(
            name,
            variants,
            priceText,
            quantityRow,
            subtotal,
            removeButton
        );

        product.append(image, info);
        cartList.appendChild(product);
    });

    // TÓM TẮT ĐƠN HÀNG
    const summary = document.createElement("div");
    summary.className = "cart-total";

    summary.innerHTML = `
        <div class="cart-total-heading">
            <h2>TÓM TẮT ĐƠN HÀNG</h2>
            <span class="cart-total-badge">
                ${totalQuantity} sản phẩm
            </span>
        </div>

        <div class="cart-total-row">
            <span>Tạm tính</span>
            <strong>${formatPrice(total)}</strong>
        </div>

        <div class="cart-total-row">
            <span>Phí vận chuyển</span>
            <span class="cart-shipping-note">
                Tính tại bước thanh toán
            </span>
        </div>

        <div class="cart-total-final">
            <span>TỔNG CỘNG</span>
            <strong>${formatPrice(total)}</strong>
        </div>

        <a href="checkout.html" class="cart-checkout-button">
            TIẾN HÀNH THANH TOÁN <span>→</span>
        </a>

        <p class="cart-payment-note">
            🔒 Vui lòng kiểm tra thông tin trước khi đặt hàng.
        </p>
    `;

    cartList.appendChild(summary);
}

// TĂNG SỐ LƯỢNG
function increaseQuantity(index) {
    if (!cart[index]) return;

    cart[index].quantity =
        Math.max(1, Number(cart[index].quantity) || 1) + 1;

    saveCart();
    renderCart();
}

// GIẢM SỐ LƯỢNG
function decreaseQuantity(index) {
    if (!cart[index]) return;

    const quantity = Math.max(
        1,
        Number(cart[index].quantity) || 1
    );

    if (quantity > 1) {
        cart[index].quantity = quantity - 1;
        saveCart();
        renderCart();
    }
}

// XÓA SẢN PHẨM
function removeItem(index) {
    if (index < 0 || index >= cart.length) return;

    const name = cart[index].name || "sản phẩm này";

    if (!confirm(`Bạn có chắc muốn xóa "${name}" khỏi giỏ hàng?`)) {
        return;
    }

    cart.splice(index, 1);

    saveCart();
    renderCart();
}

// HIỂN THỊ LẦN ĐẦU
renderCart();