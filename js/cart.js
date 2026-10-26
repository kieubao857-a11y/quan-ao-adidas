"use strict";

/* ==========================================
   ADIDAS SHOP - CART WITH STOCK VALIDATION
========================================== */

const CART_STORAGE_KEY = "cart";
const DETAIL_CART_KEY = "adidas_cart";
const PRODUCT_STORAGE_KEY = "adidasProducts";
const LEGACY_PRODUCT_KEY = "products";
const MAX_QUANTITY = 99;

const $ = (id) => document.getElementById(id);

const cartList = $("cartList");
const cartItemCount = $("cartItemCount");
const cartSubtotal = $("cartSubtotal");
const cartTotal = $("cartTotal");
const checkoutButton = $("checkoutButton");
const headerCartCount = $("headerCartCount");

let cart = [];
let stockErrors = new Map();

/* ĐỌC LOCALSTORAGE AN TOÀN */

function readStorage(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key));

    return value ?? fallback;
  } catch (error) {
    console.error(`Không đọc được ${key}:`, error);
    return fallback;
  }
}

/* LẤY DANH SÁCH SẢN PHẨM TỪ TRANG QUẢN TRỊ */

function getStoredProducts() {
  const primary = readStorage(PRODUCT_STORAGE_KEY, null);

  if (Array.isArray(primary) && primary.length > 0) {
    return primary;
  }

  const legacy = readStorage(LEGACY_PRODUCT_KEY, null);

  return Array.isArray(legacy) ? legacy : [];
}

/* TÌM SẢN PHẨM VÀ TỒN KHO */

function getStockInfo(productId) {
  const products = getStoredProducts();

  const product = products.find((item) => {
    const id = item.id ?? item._id ?? item.product_id ?? item.productId;

    return String(id) === String(productId);
  });

  if (!product) {
    return {
      found: false,
      stock: 0,
      message: "Không tìm thấy dữ liệu tồn kho.",
    };
  }

  const rawStock = product.stock ?? product.quantity ?? product.inventory;

  if (
    rawStock === undefined ||
    rawStock === null ||
    rawStock === "" ||
    !Number.isFinite(Number(rawStock))
  ) {
    return {
      found: false,
      stock: 0,
      message: "Sản phẩm chưa có số lượng tồn kho hợp lệ.",
    };
  }

  const stock = Number(rawStock);

  if (stock < 0) {
    return {
      found: false,
      stock: 0,
      message: "Số lượng tồn kho không hợp lệ.",
    };
  }

  return {
    found: true,
    stock: Math.floor(stock),
    product,
  };
}

/* CHUẨN HÓA SẢN PHẨM TRONG GIỎ */

function normalizeItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = String(
    item.name || item.title || item.productName || "Sản phẩm Adidas",
  );

  const rawPrice = item.price ?? item.sale_price ?? item.unitPrice ?? 0;

  const price = Number(
    typeof rawPrice === "string" ? rawPrice.replace(/[^\d.-]/g, "") : rawPrice,
  );

  const rawQuantity = Number(item.quantity ?? item.qty ?? 1);

  return {
    ...item,

    id: String(item.id ?? item.productId ?? item.product_id ?? name),

    name,

    price: Number.isFinite(price) && price >= 0 ? price : 0,

    quantity: Number.isFinite(rawQuantity)
      ? Math.max(1, Math.min(MAX_QUANTITY, Math.floor(rawQuantity)))
      : 1,

    image: String(
      item.image || item.image_url || item.thumbnail || item.img || "",
    ),

    size: String(item.size ?? item.selectedSize ?? ""),
    color: String(item.color ?? item.selectedColor ?? ""),
  };
}

/* GỘP CÁC SẢN PHẨM CÙNG BIẾN THỂ */

function mergeItems(items) {
  const result = [];

  items.forEach((rawItem) => {
    const item = normalizeItem(rawItem);

    if (!item) return;

    const existing = result.find(
      (product) =>
        product.id === item.id &&
        product.size === item.size &&
        product.color === item.color,
    );

    if (existing) {
      existing.quantity = Math.min(
        MAX_QUANTITY,
        existing.quantity + item.quantity,
      );
    } else {
      result.push(item);
    }
  });

  return result;
}

/* TẢI GIỎ HÀNG */

function loadCart() {
  const mainCart = readStorage(CART_STORAGE_KEY, []);
  const detailCart = readStorage(DETAIL_CART_KEY, []);

  const source = mainCart.length > 0 ? mainCart : detailCart;

  cart = mergeItems(source);
}

/* LƯU ĐỒNG BỘ HAI KHÓA */

function saveCart() {
  try {
    const value = JSON.stringify(cart);

    localStorage.setItem(CART_STORAGE_KEY, value);
    localStorage.setItem(DETAIL_CART_KEY, value);

    return true;
  } catch (error) {
    console.error("Không thể lưu giỏ hàng:", error);

    alert("Không thể lưu giỏ hàng. Vui lòng kiểm tra dung lượng trình duyệt.");

    return false;
  }
}

/* TIỀN TỆ */

function formatPrice(price) {
  return Math.round(Number(price) || 0).toLocaleString("vi-VN") + " ₫";
}

/* TẠO PHẦN TỬ HTML AN TOÀN */

function createElement(tag, className, content) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (content !== undefined && content !== null) {
    element.textContent = String(content);
  }

  return element;
}

/* KIỂM TRA TỒN KHO TOÀN BỘ GIỎ HÀNG */

function validateCartStock() {
  stockErrors = new Map();

  cart.forEach((item, index) => {
    const info = getStockInfo(item.id);

    if (!info.found) {
      stockErrors.set(index, info.message || "Không xác định được tồn kho.");
      return;
    }

    if (info.stock <= 0) {
      stockErrors.set(index, "Sản phẩm đã hết hàng.");
      return;
    }

    if (item.quantity > info.stock) {
      stockErrors.set(
        index,
        `Kho chỉ còn ${info.stock} sản phẩm. Hãy giảm số lượng.`,
      );
    }
  });

  return stockErrors.size === 0;
}

/* CẬP NHẬT TỔNG TIỀN VÀ NÚT THANH TOÁN */

function updateSummary() {
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartItemCount) {
    cartItemCount.textContent = `${quantity} sản phẩm`;
  }

  if (cartSubtotal) {
    cartSubtotal.textContent = formatPrice(total);
  }

  if (cartTotal) {
    cartTotal.textContent = formatPrice(total);
  }

  if (headerCartCount) {
    headerCartCount.textContent = quantity > 99 ? "99+" : String(quantity);
  }

  if (checkoutButton) {
    const isEmpty = cart.length === 0;
    const hasStockError = !validateCartStock();
    const disabled = isEmpty || hasStockError;

    checkoutButton.classList.toggle("is-disabled", disabled);
    checkoutButton.setAttribute("aria-disabled", String(disabled));

    checkoutButton.href = disabled ? "product.html" : "checkout.html";

    checkoutButton.tabIndex = disabled ? -1 : 0;

    if (isEmpty) {
      checkoutButton.title = "Giỏ hàng đang trống.";
    } else if (hasStockError) {
      checkoutButton.title =
        "Vui lòng xử lý sản phẩm hết hàng hoặc vượt tồn kho.";
    } else {
      checkoutButton.title = "";
    }
  }
}

/* TẠO ẢNH */

function createProductImage(item) {
  const image = createElement("img", "cart-image");

  image.alt = item.name;
  image.loading = "lazy";
  image.decoding = "async";

  if (!item.image) {
    image.hidden = true;
    return image;
  }

  image.src = item.image;

  image.addEventListener(
    "error",
    () => {
      image.hidden = true;
    },
    { once: true },
  );

  return image;
}

/* THÔNG BÁO TỒN KHO */

function showStockMessage(message) {
  alert(message);
}

/* TĂNG SỐ LƯỢNG - KIỂM TRA TỒN KHO TRƯỚC */

function increaseQuantity(index) {
  const item = cart[index];

  if (!item) return;

  const info = getStockInfo(item.id);

  if (!info.found) {
    showStockMessage(info.message || "Không thể xác nhận tồn kho sản phẩm.");
    renderCart();
    return;
  }

  if (info.stock <= 0) {
    showStockMessage("Sản phẩm đã hết hàng.");
    renderCart();
    return;
  }

  if (item.quantity >= info.stock) {
    showStockMessage(`Trong kho chỉ còn ${info.stock} sản phẩm.`);
    return;
  }

  if (item.quantity >= MAX_QUANTITY) {
    showStockMessage(`Số lượng tối đa là ${MAX_QUANTITY}.`);
    return;
  }

  item.quantity += 1;

  if (saveCart()) {
    renderCart();
  }
}

/* GIẢM SỐ LƯỢNG */

function decreaseQuantity(index) {
  const item = cart[index];

  if (!item || item.quantity <= 1) return;

  item.quantity -= 1;

  if (saveCart()) {
    renderCart();
  }
}

/* XÓA SẢN PHẨM */

function removeItem(index) {
  const item = cart[index];

  if (!item) return;

  const confirmed = confirm(
    `Bạn có chắc muốn xóa "${item.name}" khỏi giỏ hàng không?`,
  );

  if (!confirmed) return;

  const removed = cart.splice(index, 1)[0];

  if (!saveCart()) {
    cart.splice(index, 0, removed);
    renderCart();
    return;
  }

  renderCart();
}

/* TẠO MỘT DÒNG SẢN PHẨM */

function createCartItem(item, index) {
  const product = createElement("article", "cart-item");

  const image = createProductImage(item);
  const info = createElement("div", "cart-info");

  const name = createElement("h3", "cart-product-name", item.name);

  const variants = createElement("div", "cart-product-variant");

  const size = createElement("span", "", `Size: ${item.size || "Chưa chọn"}`);

  const color = createElement("span", "", `Màu: ${item.color || "Chưa chọn"}`);

  variants.append(size, color);

  const price = createElement(
    "p",
    "cart-product-price",
    `Đơn giá: ${formatPrice(item.price)}`,
  );

  /* HIỂN THỊ TÌNH TRẠNG TỒN KHO */

  const stockInfo = getStockInfo(item.id);

  const stockStatus = createElement("p", "cart-stock-status");

  if (!stockInfo.found) {
    stockStatus.textContent =
      stockInfo.message || "Chưa xác định được tồn kho.";
    stockStatus.style.color = "#b42318";
  } else if (stockInfo.stock <= 0) {
    stockStatus.textContent = "Sản phẩm đã hết hàng.";
    stockStatus.style.color = "#b42318";
  } else if (item.quantity > stockInfo.stock) {
    stockStatus.textContent = `Kho chỉ còn ${stockInfo.stock} sản phẩm. Hãy giảm số lượng.`;
    stockStatus.style.color = "#b42318";
  } else {
    stockStatus.textContent = `Còn ${stockInfo.stock} sản phẩm trong kho.`;
    stockStatus.style.color = "#237a3b";
  }

  /* SỐ LƯỢNG */

  const quantityRow = createElement("div", "cart-quantity-row");

  const quantityLabel = createElement(
    "span",
    "cart-quantity-label",
    "Số lượng",
  );

  const quantityBox = createElement("div", "cart-quantity-box");

  const decrease = createElement("button", "cart-quantity-btn", "−");

  decrease.type = "button";
  decrease.disabled = item.quantity <= 1;
  decrease.setAttribute("aria-label", `Giảm số lượng ${item.name}`);

  decrease.addEventListener("click", () => {
    decreaseQuantity(index);
  });

  const number = createElement("span", "cart-quantity-number", item.quantity);

  const increase = createElement("button", "cart-quantity-btn", "+");

  increase.type = "button";
  increase.disabled =
    !stockInfo.found ||
    stockInfo.stock <= 0 ||
    item.quantity >= stockInfo.stock ||
    item.quantity >= MAX_QUANTITY;

  increase.setAttribute("aria-label", `Tăng số lượng ${item.name}`);

  increase.addEventListener("click", () => {
    increaseQuantity(index);
  });

  quantityBox.append(decrease, number, increase);
  quantityRow.append(quantityLabel, quantityBox);

  /* THÀNH TIỀN */

  const subtotal = createElement(
    "p",
    "cart-product-subtotal",
    `Thành tiền: ${formatPrice(item.price * item.quantity)}`,
  );

  /* XÓA */

  const remove = createElement("button", "cart-remove-btn", "Xóa sản phẩm");

  remove.type = "button";

  remove.addEventListener("click", () => {
    removeItem(index);
  });

  info.append(
    name,
    variants,
    price,
    stockStatus,
    quantityRow,
    subtotal,
    remove,
  );

  product.append(image, info);

  return product;
}

/* GIỎ HÀNG TRỐNG */

function renderEmptyCart() {
  const empty = createElement("div", "cart-empty");

  const icon = createElement("div", "cart-empty-icon", "🛍️");

  const title = createElement("h2", "", "Giỏ hàng đang trống");

  const description = createElement(
    "p",
    "",
    "Bạn chưa chọn sản phẩm nào. Hãy khám phá bộ sưu tập Adidas và chọn món đồ yêu thích.",
  );

  const button = createElement("a", "cart-shop-button", "KHÁM PHÁ SẢN PHẨM →");

  button.href = "product.html";

  empty.append(icon, title, description, button);
  cartList.appendChild(empty);
}

/* HIỂN THỊ GIỎ HÀNG */

function renderCart() {
  if (!cartList) {
    console.error("Không tìm thấy #cartList trong cart.html.");
    return;
  }

  cartList.replaceChildren();

  if (cart.length === 0) {
    renderEmptyCart();
  } else {
    const fragment = document.createDocumentFragment();

    cart.forEach((item, index) => {
      fragment.appendChild(createCartItem(item, index));
    });

    cartList.appendChild(fragment);
  }

  updateSummary();

  cartList.setAttribute("aria-busy", "false");
}

/* CHẶN THANH TOÁN NẾU GIỎ TRỐNG / SAI TỒN KHO */

if (checkoutButton) {
  checkoutButton.addEventListener("click", (event) => {
    loadCart();

    if (cart.length === 0) {
      event.preventDefault();

      alert("Giỏ hàng đang trống. Vui lòng chọn sản phẩm trước.");

      return;
    }

    if (!validateCartStock()) {
      event.preventDefault();
      renderCart();

      alert(
        "Giỏ hàng có sản phẩm hết hàng, thiếu dữ liệu tồn kho " +
          "hoặc số lượng vượt quá tồn kho. Vui lòng kiểm tra lại.",
      );

      return;
    }

    // Chỉ chuyển sang thanh toán khi kiểm tra tồn kho đạt.
  });
}

/* ĐỒNG BỘ KHI DỮ LIỆU Ở TAB KHÁC THAY ĐỔI */

window.addEventListener("storage", (event) => {
  if (
    event.key === CART_STORAGE_KEY ||
    event.key === DETAIL_CART_KEY ||
    event.key === PRODUCT_STORAGE_KEY ||
    event.key === LEGACY_PRODUCT_KEY ||
    event.key === null
  ) {
    loadCart();
    renderCart();
  }
});

/* KHỞI TẠO */

loadCart();
renderCart();
