
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("checkoutForm");

  if (!form) {
    console.error("Không tìm thấy checkoutForm.");
    return;
  }

  const CART_KEY = "cart";
  const LEGACY_CART_KEY = "adidas_cart";
  const ORDERS_KEY = "orders";
  const PRODUCT_KEYS = ["adidasProducts", "products"];

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
    'button[type="submit"], input[type="submit"]',
  );

  // VOUCHER CŨ: GIỮ NGUYÊN MÃ VÀ ĐIỀU KIỆN
  const VOUCHERS = {
    ADIDAS10: { type: "percent", value: 10, min: 1000000 },
    ADIDAS15: { type: "percent", value: 15, min: 2000000 },
    ADIDAS20: { type: "percent", value: 20, min: 3000000 },
    FREESHIP: { type: "fixed", value: 30000, min: 1000000 },
  };

  function readStorageArray(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Không đọc được dữ liệu:", key, error);
      return [];
    }
  }

  function normalizeCartItem(item) {
    if (!item || typeof item !== "object") return null;

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
          item._id ??
          item.name ??
          "",
      ),
      name: String(item.name || "Sản phẩm"),
      image: String(item.image || ""),
      price,
      quantity,
      size: item.size ?? "",
      color: item.color ?? "",
    };
  }

  function getCart() {
    const cart = readStorageArray(CART_KEY)
      .map(normalizeCartItem)
      .filter(Boolean);

    if (cart.length) return cart;

    return readStorageArray(LEGACY_CART_KEY)
      .map(normalizeCartItem)
      .filter(Boolean);
  }

  function calculateTotal(cart) {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function formatCurrency(amount) {
    return Number(amount).toLocaleString("vi-VN") + " VNĐ";
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(LEGACY_CART_KEY);
    localStorage.removeItem("checkoutCart");
  }

  // =========================================================
  // KIỂM TRA TỒN KHO
  // =========================================================

  function getStoredProducts() {
    for (const key of PRODUCT_KEYS) {
      const products = readStorageArray(key);
      if (products.length) return products;
    }

    return [];
  }

  function getProductId(product) {
    return String(
      product?.id ??
        product?.product_id ??
        product?.productId ??
        product?._id ??
        "",
    );
  }

  function findStoredProduct(products, cartItem) {
    const cartId = String(cartItem.id || "");

<<<<<<< HEAD
    let product = products.find((item) => getProductId(item) === cartId);

    // Dự phòng trường hợp dữ liệu giỏ hàng thiếu ID
    if (!product && cartItem.name) {
      product = products.find(
        (item) =>
          String(item.name || item.title || "")
=======
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
            price,
            quantity,
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

    function getTotalQuantity(cart) {
        return cart.reduce(function (total, item) {
            return total + Number(item.quantity || 0);
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

    function getVoucherDiscount(subtotal, cart = getCart()) {
        const voucher = VOUCHERS[activeVoucherCode];

        // Voucher yêu cầu ít nhất 2 sản phẩm.
        if (getTotalQuantity(cart) < 2) {
            return 0;
        }

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
        const discount = getVoucherDiscount(subtotal, cart);

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

        if (activeVoucherCode && getTotalQuantity(cart) < 2) {
            activeVoucherCode = "";

            if (voucherInput) {
                voucherInput.value = "";
            }

            showVoucherMessage(
                "Voucher đã được gỡ vì đơn hàng cần tối thiểu 2 sản phẩm.",
                true
            );
        }

        const discount = getVoucherDiscount(subtotal, cart);
        const finalTotal = Math.max(0, subtotal - discount);

        if (subtotalElement) {
            subtotalElement.textContent = formatCurrency(subtotal);
        }

        if (discountElement) {
            discountElement.textContent = "-" + formatCurrency(discount);
        }

        if (totalElement) {
            totalElement.textContent = formatCurrency(finalTotal);
        }

        if (removeVoucherButton) {
            removeVoucherButton.hidden = !activeVoucherCode;
        }

        updateBankQR();
    }

    function applyVoucher(code) {
        const normalizedCode = String(code || "")
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b
            .trim()
            .toLowerCase() === String(cartItem.name).trim().toLowerCase(),
      );
    }

<<<<<<< HEAD
    return product || null;
  }
=======
        const voucher = VOUCHERS[normalizedCode];
        const cart = getCart();
        const subtotal = calculateTotal(cart);
        const totalQuantity = getTotalQuantity(cart);
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b

  function getStockField(product) {
    if (!product) return null;

    for (const field of ["stock", "inventory", "quantity"]) {
      if (
        Object.prototype.hasOwnProperty.call(product, field) &&
        product[field] !== "" &&
        product[field] !== null &&
        product[field] !== undefined
      ) {
        const stock = Number(product[field]);

        if (Number.isFinite(stock) && stock >= 0) {
          return { field, stock };
        }

        return null;
      }
    }

    return null;
  }

  function validateCartStock(cart) {
    const products = getStoredProducts();

<<<<<<< HEAD
    if (!products.length) {
      return "Chưa tìm thấy dữ liệu sản phẩm và tồn kho trong trình duyệt. Vui lòng kiểm tra dữ liệu sản phẩm ở trang quản trị.";
    }
=======
        if (totalQuantity < 2) {
            activeVoucherCode = "";

            showVoucherMessage(
                "Bạn cần mua tối thiểu 2 sản phẩm để sử dụng mã giảm giá.",
                true
            );

            refreshVoucherSummary();
            return;
        }

        if (subtotal < voucher.min) {
            activeVoucherCode = "";
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b

    // Gộp số lượng các dòng cùng sản phẩm để tránh vượt kho
    const quantitiesByProduct = new Map();

    for (const item of cart) {
      const product = findStoredProduct(products, item);

<<<<<<< HEAD
      if (!product) {
        return (
          'Không tìm thấy dữ liệu tồn kho của sản phẩm "' +
          item.name +
          '". Vui lòng tải lại giỏ hàng.'
=======
        activeVoucherCode = normalizedCode;

        if (voucherInput) {
            voucherInput.value = normalizedCode;
        }

        showVoucherMessage(
            "Áp dụng " + normalizedCode +
            " thành công! Bạn được giảm " +
            formatCurrency(getVoucherDiscount(subtotal, cart)) + "."
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b
        );
      }

      const stockInfo = getStockField(product);

      if (!stockInfo) {
        return (
          'Sản phẩm "' +
          item.name +
          '" chưa có số lượng tồn kho hợp lệ trong trang quản trị.'
        );
      }

      const productId = getProductId(product);
      const key = productId || String(product.name || item.name);

      const previous = quantitiesByProduct.get(key);

      if (previous) {
        previous.quantity += item.quantity;
      } else {
        quantitiesByProduct.set(key, {
          name: item.name,
          quantity: item.quantity,
          stock: stockInfo.stock,
        });
      }
    }

<<<<<<< HEAD
    for (const item of quantitiesByProduct.values()) {
      if (item.stock <= 0) {
        return (
          'Sản phẩm "' +
          item.name +
          '" đã hết hàng. Vui lòng quay lại giỏ hàng.'
        );
      }

      if (item.quantity > item.stock) {
        return (
          'Sản phẩm "' +
          item.name +
          '" chỉ còn ' +
          item.stock +
          " sản phẩm trong kho. Vui lòng giảm số lượng."
        );
      }
=======
    // ==========================================
    // 5. HỎI KHÁCH CÓ MUỐN DÙNG VOUCHER KHÔNG
    // ==========================================

    function askToUseLuckyVoucher() {
        const code = String(
            localStorage.getItem("adidasSelectedVoucher") || ""
        ).trim().toUpperCase();

        if (!code || !VOUCHERS[code]) return;

        const choiceKey = "checkoutVoucherChoice:" + code;
        const previousChoice = sessionStorage.getItem(choiceKey);

        if (previousChoice === "use") {
            applyVoucher(code);
            return;
        }

        if (previousChoice === "skip") return;

        let prize = null;

        try {
            const resultRaw = localStorage.getItem("adidasLuckySpinResult");
            prize = resultRaw ? JSON.parse(resultRaw) : null;
        } catch (error) {
            console.warn("Không đọc được kết quả vòng quay:", error);
        }

        const voucher = VOUCHERS[code];

        const discountText = voucher.type === "percent"
            ? `Giảm ${voucher.value}%`
            : `Giảm ${formatCurrency(voucher.value)}`;

        const modal = document.createElement("div");
        modal.id = "checkoutVoucherConfirmModal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "checkoutVoucherTitle");

        modal.innerHTML = `
            <div class="checkout-voucher-dialog">
                <button type="button"
                    class="checkout-voucher-close"
                    aria-label="Đóng">&times;</button>

                <div class="checkout-voucher-icon">🎟️</div>

                <p class="checkout-voucher-eyebrow">
                    ADIDAS STORE REWARDS
                </p>

                <h2 id="checkoutVoucherTitle">
                    Bạn có muốn sử dụng voucher?
                </h2>

                <p class="checkout-voucher-description">
                    ${prize && prize.description
                        ? prize.description
                        : "Bạn có một mã ưu đãi từ vòng quay may mắn."}
                </p>

                <div class="checkout-voucher-code">
                    <span>MÃ ƯU ĐÃI CỦA BẠN</span>
                    <strong>${code}</strong>
                    <small>${discountText}</small>
                </div>

                <p class="checkout-voucher-condition">
                    Điều kiện: tối thiểu 2 sản phẩm trong giỏ và đơn hàng
                    đạt từ ${formatCurrency(voucher.min)}.
                </p>

                <div class="checkout-voucher-actions">
                    <button type="button"
                        class="checkout-voucher-accept">
                        SỬ DỤNG VOUCHER
                    </button>

                    <button type="button"
                        class="checkout-voucher-decline">
                        Không, cảm ơn
                    </button>
                </div>
            </div>
        `;

        const style = document.createElement("style");

        style.textContent = `
            #checkoutVoucherConfirmModal {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(0, 0, 0, .72);
            }

            .checkout-voucher-dialog {
                position: relative;
                width: 100%;
                max-width: 440px;
                padding: 32px 26px;
                border-top: 5px solid #e30613;
                background: #fff;
                color: #111;
                text-align: center;
                box-shadow: 0 20px 70px #0005;
                font-family: Arial, sans-serif;
            }

            .checkout-voucher-close {
                position: absolute;
                top: 8px;
                right: 13px;
                border: 0;
                background: transparent;
                font-size: 28px;
                cursor: pointer;
            }

            .checkout-voucher-icon {
                font-size: 36px;
            }

            .checkout-voucher-eyebrow {
                margin: 10px 0;
                color: #e30613;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 2px;
            }

            .checkout-voucher-dialog h2 {
                margin: 12px 0;
                font-size: 23px;
            }

            .checkout-voucher-description {
                color: #666;
                font-size: 13px;
                line-height: 1.7;
            }

            .checkout-voucher-code {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin: 20px 0 12px;
                padding: 17px;
                border: 1px dashed #e30613;
                background: #fff7f7;
            }

            .checkout-voucher-code span {
                color: #777;
                font-size: 10px;
                letter-spacing: 1px;
            }

            .checkout-voucher-code strong {
                color: #e30613;
                font-size: 27px;
                letter-spacing: 2px;
            }

            .checkout-voucher-code small,
            .checkout-voucher-condition {
                color: #666;
                font-size: 11px;
                line-height: 1.7;
            }

            .checkout-voucher-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 20px;
            }

            .checkout-voucher-actions button {
                min-height: 45px;
                padding: 12px;
                font-size: 11px;
                font-weight: 800;
                cursor: pointer;
            }

            .checkout-voucher-accept {
                border: 1px solid #e30613;
                background: #e30613;
                color: #fff;
            }

            .checkout-voucher-decline {
                border: 1px solid #ddd;
                background: #fff;
                color: #111;
            }

            @media (max-width: 480px) {
                .checkout-voucher-dialog {
                    padding: 30px 18px;
                }

                .checkout-voucher-dialog h2 {
                    font-size: 20px;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        function closeModal(choice) {
            sessionStorage.setItem(choiceKey, choice);

            modal.remove();
            style.remove();

            if (choice === "use") {
                applyVoucher(code);
            } else {
                activeVoucherCode = "";

                if (voucherInput) {
                    voucherInput.value = "";
                }

                showVoucherMessage(
                    "Bạn đã chọn không sử dụng voucher. " +
                    "Bạn vẫn có thể nhập mã khác nếu muốn."
                );

                refreshVoucherSummary();
            }
        }

        modal.querySelector(".checkout-voucher-accept")
            .addEventListener("click", function () {
                closeModal("use");
            });

        modal.querySelector(".checkout-voucher-decline")
            .addEventListener("click", function () {
                closeModal("skip");
            });

        modal.querySelector(".checkout-voucher-close")
            .addEventListener("click", function () {
                closeModal("skip");
            });

        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeModal("skip");
            }
        });
    }

    // ==========================================
    // 6. SỰ KIỆN VOUCHER
    // ==========================================

    if (applyVoucherButton) {
        applyVoucherButton.addEventListener("click", function () {
            applyVoucher(voucherInput ? voucherInput.value : "");
        });
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b
    }

    return "";
  }

  // Chỉ gọi sau khi tạo đơn hàng thành công.
  // Cập nhật cả hai khóa để tương thích với trang quản trị hiện tại.
  function decreaseStockAfterOrder(cart) {
    const products = getStoredProducts();

    if (!products.length) {
      throw new Error("Không tìm thấy dữ liệu tồn kho để cập nhật.");
    }

    // Gom số lượng theo ID sản phẩm
    const quantitiesByProduct = new Map();

    for (const item of cart) {
      const product = findStoredProduct(products, item);

      if (!product) {
        throw new Error(
          'Không tìm thấy sản phẩm "' + item.name + '" trong kho.',
        );
      }

      const productId = getProductId(product);
      const key = productId || String(product.name || item.name);
      const previous = quantitiesByProduct.get(key);

      if (previous) {
        previous.quantity += item.quantity;
      } else {
        quantitiesByProduct.set(key, {
          product,
          quantity: item.quantity,
          name: item.name,
        });
      }
    }

    // Kiểm tra lại tất cả sản phẩm trước khi thay đổi kho
    for (const entry of quantitiesByProduct.values()) {
      const stockInfo = getStockField(entry.product);

      if (!stockInfo) {
        throw new Error(
          'Tồn kho của sản phẩm "' + entry.name + '" không hợp lệ.',
        );
      }

      if (stockInfo.stock < entry.quantity) {
        throw new Error(
          'Sản phẩm "' +
            entry.name +
            '" không còn đủ hàng. Vui lòng kiểm tra lại đơn hàng.',
        );
      }
    }

    // Tạo bản sao để tránh cập nhật một phần nếu dữ liệu lỗi
    const updatedProducts = products.map((product) => ({
      ...product,
    }));

    for (const entry of quantitiesByProduct.values()) {
      const productId = getProductId(entry.product);
      const target = updatedProducts.find(
        (item) =>
          getProductId(item) === productId &&
          (productId || item.name === entry.product.name),
      );

      if (!target) {
        throw new Error("Không xác định được sản phẩm cần cập nhật kho.");
      }

      const stockInfo = getStockField(target);

      if (!stockInfo) {
        throw new Error(
          'Tồn kho của sản phẩm "' + entry.name + '" không hợp lệ.',
        );
      }

      target[stockInfo.field] = stockInfo.stock - entry.quantity;
    }

    // Lưu đồng bộ hai khóa; khôi phục nếu thao tác lưu gặp lỗi
    const oldAdidasProducts = localStorage.getItem("adidasProducts");
    const oldProducts = localStorage.getItem("products");

    try {
      const serialized = JSON.stringify(updatedProducts);

      localStorage.setItem("adidasProducts", serialized);
      localStorage.setItem("products", serialized);
    } catch (error) {
      try {
        if (oldAdidasProducts === null) {
          localStorage.removeItem("adidasProducts");
        } else {
          localStorage.setItem("adidasProducts", oldAdidasProducts);
        }

        if (oldProducts === null) {
          localStorage.removeItem("products");
        } else {
          localStorage.setItem("products", oldProducts);
        }
      } catch (restoreError) {
        console.error("Không thể khôi phục dữ liệu tồn kho:", restoreError);
      }

      throw new Error("Không lưu được tồn kho. Vui lòng thử lại.");
    }
  }

  // ĐỌC VOUCHER DO ADMIN TẠO
  // Định dạng adidasPromotions:
  // { code, type, value, minimum, expiry, active }
  function getAdminVoucher(code) {
    return (
      readStorageArray("adidasPromotions").find(
        (item) =>
          String(item.code || "")
            .trim()
            .toUpperCase() === code,
      ) || null
    );
  }

  function getVoucherInfo(code) {
    if (VOUCHERS[code]) {
      const old = VOUCHERS[code];

      return {
        code,
        type: old.type,
        value: old.value,
        minimum: old.min,
        active: true,
        legacy: true,
      };
    }

    const voucher = getAdminVoucher(code);
    if (!voucher) return null;

    return {
      ...voucher,
      code,
      minimum: Math.max(0, Number(voucher.minimum) || 0),
      value: Number(voucher.value),
      legacy: false,
    };
  }

  function getVoucherError(voucher, subtotal) {
    if (!voucher) return "Mã giảm giá không tồn tại.";

    if (voucher.active === false) {
      return "Mã giảm giá đã bị tắt.";
    }

    if (voucher.expiry) {
      const expiry = new Date(
        String(voucher.expiry).slice(0, 10) + "T23:59:59",
      );

      if (!Number.isNaN(expiry.getTime()) && expiry < new Date()) {
        return "Mã giảm giá đã hết hạn.";
      }
    }

    if (subtotal < voucher.minimum) {
      return (
        "Đơn hàng phải đạt tối thiểu " + formatCurrency(voucher.minimum) + "."
      );
    }

    if (
      !Number.isFinite(voucher.value) ||
      voucher.value <= 0 ||
      !["percent", "fixed"].includes(voucher.type) ||
      (voucher.type === "percent" && voucher.value > 100)
    ) {
      return "Thông tin mã giảm giá không hợp lệ.";
    }

    return "";
  }

  function getVoucherDiscount(subtotal) {
    if (!activeVoucherCode) return 0;

    const voucher = getVoucherInfo(activeVoucherCode);
    if (!voucher || getVoucherError(voucher, subtotal)) return 0;

    if (voucher.type === "percent") {
      return Math.min(subtotal, Math.round((subtotal * voucher.value) / 100));
    }

    return Math.min(subtotal, voucher.value);
  }

  function getFinalTotal(cart) {
    const subtotal = calculateTotal(cart);
    return Math.max(0, subtotal - getVoucherDiscount(subtotal));
  }

  function showVoucherMessage(message, isError = false) {
    if (!voucherMessage) return;

    voucherMessage.textContent = message;
    voucherMessage.style.color = isError ? "#b42318" : "#18723a";
  }

  function refreshVoucherSummary() {
    const subtotal = calculateTotal(getCart());
    const discount = getVoucherDiscount(subtotal);

    if (subtotalElement) {
      subtotalElement.textContent = formatCurrency(subtotal);
    }

    if (discountElement) {
      discountElement.textContent = "-" + formatCurrency(discount);
    }

    if (totalElement) {
      totalElement.textContent = formatCurrency(
        Math.max(0, subtotal - discount),
      );
    }

    if (removeVoucherButton) {
      removeVoucherButton.hidden = !activeVoucherCode;
    }

<<<<<<< HEAD
    updateBankQR();
  }
=======
    // ==========================================
    // 7. THÔNG BÁO ĐỊA CHỈ
    // ==========================================
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b

  function applyVoucher(code) {
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      showVoucherMessage("Vui lòng nhập hoặc chọn mã voucher.", true);
      return;
    }

    const voucher = getVoucherInfo(normalizedCode);
    const subtotal = calculateTotal(getCart());
    const error = getVoucherError(voucher, subtotal);

    if (error) {
      activeVoucherCode = "";
      showVoucherMessage(error, true);
      refreshVoucherSummary();
      return;
    }

<<<<<<< HEAD
    activeVoucherCode = normalizedCode;
=======
    // ==========================================
    // 8. LẤY ĐỊA CHỈ KHÁCH HÀNG
    // ==========================================
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b

    if (voucherInput) {
      voucherInput.value = normalizedCode;
    }

    showVoucherMessage(
      "Áp dụng " +
        normalizedCode +
        " thành công! Bạn được giảm " +
        formatCurrency(getVoucherDiscount(subtotal)) +
        ".",
    );

<<<<<<< HEAD
    refreshVoucherSummary();
  }
=======
        return {
            province,
            ward,
            streetAddress: street,
            address: [street, ward, province]
                .filter(Boolean)
                .join(", ")
        };
    }

    // ==========================================
    // 9. CẬP NHẬT QR NGÂN HÀNG
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
    // 10. KIỂM TRA THÔNG TIN KHÁCH HÀNG
    // ==========================================

    function validateCustomer() {
        const name = nameInput ? nameInput.value.trim() : "";
        const phone = phoneInput ? phoneInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
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
            name,
            phone,
            email,
            address,
            paymentCode: selectedPayment.value,
            payment: selectedPayment.value === "cod"
                ? "Thanh toán khi nhận hàng"
                : "Chuyển khoản ngân hàng"
        };
    }

    // ==========================================
    // 11. LƯU ĐƠN HÀNG VÀO LOCAL STORAGE
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

        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        localStorage.setItem("lastOrderId", String(order.id));

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
                throw new Error("Không nhận được mã đơn hàng hợp lệ.");
            }

            return order;
        }

        return saveOrderLocally(payload);
    }

    // ==========================================
    // 12. KHÓA NÚT ĐẶT HÀNG KHI ĐANG XỬ LÝ
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

        const subtotal = calculateTotal(cart);
        const discount = getVoucherDiscount(subtotal, cart);
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
            customer,
            payment: customerInfo.payment,
            paymentCode: customerInfo.paymentCode,
            products: cart,
            subtotal,
            discount,
            voucherCode: activeVoucherCode,
            total
        };

        submitting = true;
        setSubmittingState(true);

        try {
            const order = await createOrder(payload);

            clearCart();

            localStorage.setItem("lastOrderId", String(order.id));

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
    // 14. KHỞI TẠO TRANG
    // ==========================================

    installLocationButton();
    refreshVoucherSummary();
    askToUseLuckyVoucher();
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b

  if (applyVoucherButton) {
    applyVoucherButton.addEventListener("click", () => {
      applyVoucher(voucherInput ? voucherInput.value : "");
    });
<<<<<<< HEAD
  }

  if (voucherInput) {
    voucherInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyVoucher(voucherInput.value);
      }
    });
  }

  document.querySelectorAll("[data-voucher]").forEach((button) => {
    button.addEventListener("click", () => {
      applyVoucher(button.dataset.voucher);
    });
  });

  if (removeVoucherButton) {
    removeVoucherButton.addEventListener("click", () => {
      activeVoucherCode = "";
      if (voucherInput) voucherInput.value = "";

      showVoucherMessage("Đã gỡ mã giảm giá.");
      refreshVoucherSummary();
    });
  }

  // THÔNG BÁO ĐỊA CHỈ
  function showLocationMessage(message, isError = false) {
    const box = $("addressStatus") || $("locationMessage");
    if (!box) return;

    box.textContent = message;
    box.style.color = isError ? "#b42318" : "#333";
  }

  // HTML ĐÃ CÓ XỬ LÝ GPS VÀ BẢN ĐỒ.
  // Không gắn thêm sự kiện GPS lần thứ hai.

  function getFieldValue(element) {
    if (!element) return "";

    if (element.tagName === "SELECT" && element.selectedOptions.length) {
      return element.selectedOptions[0].textContent.trim();
    }

    return String(element.value || "").trim();
  }

  function getCustomerAddress() {
    const province = getFieldValue(provinceInput);
    const ward = getFieldValue(wardInput);
    const street = getFieldValue(streetInput);

    return {
      province,
      ward,
      streetAddress: street,
      address: [street, ward, province].filter(Boolean).join(", "),
    };
  }

  // QR NGÂN HÀNG
  function updateBankQR() {
    const selectedPayment = form.querySelector('input[name="payment"]:checked');

    const total = getFinalTotal(getCart());
    const isBank = selectedPayment && selectedPayment.value === "bank";

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

    const phone = phoneInput ? phoneInput.value.trim() : "";

    const params = new URLSearchParams({
      amount: String(Math.round(total)),
      addInfo: ("ADIDAS " + (phone || "DONHANG")).slice(0, 50),
      accountName: "NGUYEN CONG DUC ANH",
    });

    bankQR.src =
      "https://img.vietqr.io/image/VCB-0778366446-compact2.png?" +
      params.toString();
  }

  form.querySelectorAll('input[name="payment"]').forEach((method) => {
    method.addEventListener("change", updateBankQR);
  });

  if (phoneInput) {
    phoneInput.addEventListener("input", updateBankQR);
  }

  // KIỂM TRA THÔNG TIN KHÁCH HÀNG
  function validateCustomer() {
    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const address = getCustomerAddress();

    const selectedPayment = form.querySelector('input[name="payment"]:checked');

    if (name.length < 2) {
      alert("Vui lòng nhập họ và tên hợp lệ!");
      nameInput?.focus();
      return null;
    }

    const normalizedPhone = phone.replace(/[\s.-]/g, "");

    if (!/^(0\d{9}|\+84\d{9})$/.test(normalizedPhone)) {
      alert("Vui lòng nhập số điện thoại hợp lệ.");
      phoneInput?.focus();
      return null;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Vui lòng nhập email hợp lệ.");
      emailInput?.focus();
      return null;
    }

    if (!address.streetAddress) {
      alert("Vui lòng nhập số nhà và tên đường.");
      streetInput?.focus();
      return null;
    }

    if (!address.ward) {
      alert("Vui lòng chọn phường/xã.");
      wardInput?.focus();
      return null;
    }

    if (!address.province) {
      alert("Vui lòng chọn tỉnh/thành phố.");
      provinceInput?.focus();
      return null;
    }

    if (!selectedPayment) {
      alert("Vui lòng chọn phương thức thanh toán.");
      return null;
    }

    return {
      name,
      phone,
      email,
      address,
      paymentCode: selectedPayment.value,
      payment:
        selectedPayment.value === "cod"
          ? "Thanh toán khi nhận hàng"
          : "Chuyển khoản ngân hàng",
    };
  }

  // LƯU ĐƠN HÀNG LOCALSTORAGE
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
      createdAt: new Date().toLocaleString("vi-VN"),
    };

    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    localStorage.setItem("lastOrderId", String(order.id));

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
        note: "",
      });

      if (!order || order.id == null) {
        throw new Error("Không nhận được mã đơn hàng hợp lệ.");
      }

      return order;
    }

    return saveOrderLocally(payload);
  }

  // KHÓA NÚT ĐẶT HÀNG
  function setSubmittingState(isSubmitting) {
    if (!submitButton) return;

    submitButton.disabled = isSubmitting;

    if (!submitButton.dataset.originalText) {
      submitButton.dataset.originalText =
        submitButton.tagName === "INPUT"
          ? submitButton.value
          : submitButton.textContent;
    }

    const text = isSubmitting
      ? "ĐANG TẠO ĐƠN HÀNG..."
      : submitButton.dataset.originalText;

    if (submitButton.tagName === "INPUT") {
      submitButton.value = text;
    } else {
      submitButton.textContent = text;
    }
  }

  // ĐẶT HÀNG
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitting) return;

    const cart = getCart();

    if (!cart.length) {
      alert("Giỏ hàng đang trống! Vui lòng thêm sản phẩm trước.");
      return;
    }

    // Kiểm tra tồn kho ngay trước khi tạo đơn
    const stockError = validateCartStock(cart);

    if (stockError) {
      alert(stockError);
      return;
    }

    const customerInfo = validateCustomer();
    if (!customerInfo) return;

    const subtotal = calculateTotal(cart);

    // Kiểm tra lại voucher tại thời điểm đặt hàng
    if (activeVoucherCode) {
      const voucher = getVoucherInfo(activeVoucherCode);
      const error = getVoucherError(voucher, subtotal);

      if (error) {
        activeVoucherCode = "";

        if (voucherInput) {
          voucherInput.value = "";
        }

        showVoucherMessage(error, true);
        refreshVoucherSummary();
      }
    }

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
      province: customerInfo.address.province,
    };

    const payload = {
      customer,
      payment: customerInfo.payment,
      paymentCode: customerInfo.paymentCode,
      products: cart,
      subtotal,
      discount,
      voucherCode: activeVoucherCode,
      total,
    };

    submitting = true;
    setSubmittingState(true);

    try {
      // Kiểm tra lại trước khi ghi nhận đơn hàng
      const finalStockError = validateCartStock(cart);

      if (finalStockError) {
        throw new Error(finalStockError);
      }

      const order = await createOrder(payload);

      // Trừ kho sau khi tạo đơn thành công
      // Nếu cập nhật kho thất bại, giữ nguyên giỏ hàng để người dùng xử lý.
      decreaseStockAfterOrder(cart);

      clearCart();

      localStorage.setItem("lastOrderId", String(order.id));

      window.location.href =
        "./thankyou.html?orderId=" + encodeURIComponent(order.id);
    } catch (error) {
      console.error("Lỗi tạo đơn hàng hoặc cập nhật tồn kho:", error);

      alert(
        error && error.message
          ? error.message
          : "Đặt hàng thất bại. Vui lòng thử lại.",
      );

      submitting = false;
      setSubmittingState(false);
    }
  });

  // KHỞI TẠO
  refreshVoucherSummary();

  window.addEventListener("storage", (event) => {
    if (
      event.key === CART_KEY ||
      event.key === LEGACY_CART_KEY ||
      event.key === "adidasPromotions" ||
      event.key === "adidasProducts" ||
      event.key === "products"
    ) {
      refreshVoucherSummary();
    }
  });
=======
>>>>>>> ac58545156f4f1a2fcfbf4be8012e9fb5b7ca22b
})();
