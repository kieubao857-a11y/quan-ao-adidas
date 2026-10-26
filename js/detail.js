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
    toastTimer: null,
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
    imageModalClose: $("detailImageModalClose"),
  };

  const CART_KEY = "cart";
  const CART_LEGACY_KEY = "adidas_cart";
  const PRODUCT_KEY = "adidasProducts";
  const PRODUCT_LEGACY_KEY = "products";

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

    return (
      new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 0,
      }).format(price) + " ₫"
    );
  }

  function getProductId() {
    return new URLSearchParams(window.location.search).get("id");
  }

  function normalizeOptions(value, fallback) {
    if (Array.isArray(value)) {
      const result = value
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return text(
              firstValue(item, ["name", "label", "value"], ""),
            ).trim();
          }

          return text(item).trim();
        })
        .filter(Boolean);

      return result.length ? [...new Set(result)] : fallback;
    }

    if (typeof value === "string" && value.trim()) {
      return [
        ...new Set(
          value
            .split(/[,;|]/)
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ];
    }

    return fallback;
  }

  function normalizeProduct(raw) {
    const product = { ...raw };

    product.id = firstValue(product, ["id", "product_id"], "");

    product.name = firstValue(
      product,
      ["name", "title", "product_name"],
      "Sản phẩm Adidas",
    );

    product.brand = firstValue(
      product,
      ["brand", "manufacturer"],
      "Adidas Sportswear",
    );

    product.description = firstValue(
      product,
      ["description", "detail", "content"],
      "Sản phẩm thời trang thể thao dành cho phong cách năng động.",
    );

    product.price = Number(
      firstValue(product, ["price", "sale_price", "gia"], 0),
    );

    product.oldPrice = Number(
      firstValue(
        product,
        ["old_price", "oldPrice", "original_price", "list_price"],
        0,
      ),
    );

    product.image = firstValue(
      product,
      ["image", "image_url", "thumbnail", "photo", "img"],
      "",
    );

    if (product.image && !Array.isArray(product.image)) {
      product.image = text(product.image).trim();
    }

    product.images = Array.isArray(product.images) ? product.images : [];

    product.sizes = normalizeOptions(
      firstValue(product, ["sizes", "size"], ["S", "M", "L", "XL"]),
      ["S", "M", "L", "XL"],
    );

    product.colors = normalizeOptions(
      firstValue(product, ["colors", "color", "colours"], ["Đen", "Trắng"]),
      ["Đen", "Trắng"],
    );

    const stockValue = firstValue(
      product,
      ["stock", "quantity", "inventory"],
      0,
    );

    const stock = Number(stockValue);

    product.stock = Number.isFinite(stock) ? Math.max(0, stock) : 0;

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

    return [...new Set(images.map(normalizeImagePath).filter(Boolean))];
  }

  function readJSON(key, fallback = null) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (error) {
      console.warn("Không đọc được dữ liệu:", key, error);
      return fallback;
    }
  }

  function getStoredProducts() {
    const primary = readJSON(PRODUCT_KEY, null);

    if (Array.isArray(primary) && primary.length) {
      return primary;
    }

    const legacy = readJSON(PRODUCT_LEGACY_KEY, null);

    if (Array.isArray(legacy) && legacy.length) {
      return legacy;
    }

    return [];
  }

  function findProductById(products, id) {
    return products.find((item) => {
      const itemId = firstValue(item, ["id", "product_id"], "");
      return String(itemId) === String(id);
    });
  }

  function getCurrentStock(productId) {
    const products = getStoredProducts();
    const storedProduct = findProductById(products, productId);

    // Không tìm thấy sản phẩm trong dữ liệu quản trị:
    // không cho mua vì không thể xác nhận tồn kho.
    if (!storedProduct) {
      return {
        found: false,
        stock: 0,
        product: null,
      };
    }

    const rawStock = firstValue(
      storedProduct,
      ["stock", "quantity", "inventory"],
      0,
    );

    const stock = Number(rawStock);

    return {
      found: true,
      stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
      product: storedProduct,
    };
  }

  function readCart() {
    const current = readJSON(CART_KEY, null);

    if (Array.isArray(current)) {
      return current;
    }

    const oldCart = readJSON(CART_LEGACY_KEY, []);

    return Array.isArray(oldCart) ? oldCart : [];
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      localStorage.setItem(CART_LEGACY_KEY, JSON.stringify(cart));

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

    return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  }

  function updateCartCount() {
    const cart = readCart();

    const total = cart.reduce((sum, item) => {
      return sum + getCartItemQuantity(item);
    }, 0);

    if (el.cartCount) {
      el.cartCount.textContent = total > 99 ? "99+" : String(total);
    }
  }

  function showToast(message, isError = false) {
    if (!el.toast) {
      alert(message);
      return;
    }

    clearTimeout(state.toastTimer);

    el.toast.textContent = message;
    el.toast.classList.toggle("error", isError);
    el.toast.classList.add("show");

    state.toastTimer = setTimeout(() => {
      el.toast.classList.remove("show");
    }, 2800);
  }

  function showError(message) {
    if (el.loading) el.loading.hidden = true;
    if (el.productDetail) el.productDetail.hidden = true;
    if (el.error) el.error.hidden = false;
    if (el.errorMessage) el.errorMessage.textContent = message;
  }

  function getColorHex(color) {
    const normalized = text(color).toLowerCase().trim();

    const colors = {
      đen: "#111111",
      den: "#111111",
      black: "#111111",
      trắng: "#ffffff",
      trang: "#ffffff",
      white: "#ffffff",
      đỏ: "#d71920",
      do: "#d71920",
      red: "#d71920",
      xanh: "#2877bd",
      "xanh dương": "#2877bd",
      blue: "#2877bd",
      "xanh lá": "#32834a",
      green: "#32834a",
      xám: "#999999",
      gray: "#999999",
      grey: "#999999",
      vàng: "#f2cb36",
      yellow: "#f2cb36",
      hồng: "#e6a1b2",
      pink: "#e6a1b2",
      be: "#d7c5a5",
      nâu: "#795548",
      brown: "#795548",
    };

    return colors[normalized] || "#dddddd";
  }

  function renderImages() {
    if (!el.thumbnails || !el.image) return;

    el.thumbnails.replaceChildren();

    if (!state.images.length) {
      el.image.removeAttribute("src");
      el.image.alt = "Chưa có hình ảnh sản phẩm";
      el.image.style.visibility = "hidden";

      if (el.imageExpand) el.imageExpand.hidden = true;
      return;
    }

    el.image.style.visibility = "visible";

    if (el.imageExpand) el.imageExpand.hidden = false;

    state.currentImage = state.images[0];
    el.image.src = state.currentImage;
    el.image.alt = state.product.name;

    state.images.forEach((image, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "detail-thumbnail";
      button.classList.toggle("active", index === 0);
      button.setAttribute("aria-label", "Xem hình ảnh " + (index + 1));

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

        el.thumbnails.querySelectorAll(".detail-thumbnail").forEach((item) => {
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
    if (!el.colors) return;

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

        el.colors.querySelectorAll(".detail-color-option").forEach((item) => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        if (el.selectedColorLabel) {
          el.selectedColorLabel.textContent = color;
        }

        clearValidation();
      });

      el.colors.appendChild(button);
    });

    if (el.selectedColorLabel) {
      el.selectedColorLabel.textContent = "Chưa chọn";
    }
  }

  function renderSizes() {
    if (!el.sizes) return;

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

        el.sizes.querySelectorAll(".detail-size-option").forEach((item) => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        clearValidation();
      });

      el.sizes.appendChild(button);
    });
  }

  function setPurchaseButtonsEnabled(enabled) {
    if (el.addToCart) {
      el.addToCart.disabled = !enabled;
      el.addToCart.setAttribute("aria-disabled", String(!enabled));
    }

    if (el.buyNow) {
      el.buyNow.disabled = !enabled;
      el.buyNow.setAttribute("aria-disabled", String(!enabled));
    }

    if (el.quantityPlus) {
      el.quantityPlus.disabled = !enabled;
    }

    if (el.quantityMinus) {
      el.quantityMinus.disabled = !enabled;
    }
  }

  function renderStock(product) {
    const stockInfo = getCurrentStock(product.id);
    product.stock = stockInfo.stock;

    if (product.stock <= 0) {
      setPurchaseButtonsEnabled(false);

      if (el.validation) {
        el.validation.textContent = stockInfo.found
          ? "Sản phẩm đã hết hàng."
          : "Chưa có dữ liệu tồn kho. Vui lòng kiểm tra trang quản trị.";
        el.validation.hidden = false;
      }

      if (el.badge) {
        el.badge.textContent = "HẾT HÀNG";
        el.badge.hidden = false;
      }
    } else {
      setPurchaseButtonsEnabled(true);
      clearValidation();
    }
  }

  function renderProduct(product) {
    state.product = product;
    state.images = getProductImages(product);

    document.title = product.name + " | Adidas Shop";

    if (el.breadcrumbName) el.breadcrumbName.textContent = product.name;
    if (el.brand) el.brand.textContent = product.brand;
    if (el.name) el.name.textContent = product.name;
    if (el.price) el.price.textContent = formatPrice(product.price);
    if (el.description) el.description.textContent = product.description;

    if (product.oldPrice > product.price && product.price > 0) {
      if (el.oldPrice) {
        el.oldPrice.textContent = formatPrice(product.oldPrice);
        el.oldPrice.hidden = false;
      }

      const percent = Math.round((1 - product.price / product.oldPrice) * 100);

      if (el.discount) {
        el.discount.textContent = "-" + percent + "%";
        el.discount.hidden = false;
      }
    } else {
      if (el.oldPrice) el.oldPrice.hidden = true;
      if (el.discount) el.discount.hidden = true;
    }

    const hasBadge = Boolean(product.badge || product.is_new || product.isNew);

    if (el.badge) {
      if (hasBadge) {
        el.badge.textContent = product.badge
          ? text(product.badge)
          : "SẢN PHẨM MỚI";
        el.badge.hidden = false;
      } else {
        el.badge.hidden = true;
      }
    }

    renderImages();
    renderColors();
    renderSizes();

    if (el.quantity) el.quantity.value = "1";
    state.quantity = 1;

    if (el.loading) el.loading.hidden = true;
    if (el.error) el.error.hidden = true;
    if (el.productDetail) el.productDetail.hidden = false;

    renderStock(product);
  }

  async function loadProduct() {
    const productId = getProductId();

    if (!productId) {
      showError(
        "Đường dẫn thiếu mã sản phẩm. Vui lòng mở sản phẩm từ cửa hàng.",
      );
      return;
    }

    try {
      let rawProduct = null;

      // Ưu tiên dữ liệu trong trang quản trị vì ở đó có tồn kho mới nhất.
      const storedProducts = getStoredProducts();
      rawProduct = findProductById(storedProducts, productId);

      // Nếu chưa có dữ liệu LocalStorage thì tải thông tin cơ bản từ JSON.
      if (!rawProduct) {
        const response = await fetch("./data/products.json", {
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error(
            "Không thể tải products.json (HTTP " + response.status + ").",
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
          throw new Error("Dữ liệu JSON không đúng định dạng sản phẩm.");
        }

        rawProduct = findProductById(products, productId);
      }

      if (!rawProduct) {
        showError("Không tìm thấy sản phẩm có mã " + productId + ".");
        return;
      }

      renderProduct(normalizeProduct(rawProduct));
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);

      showError(
        "Không tải được dữ liệu sản phẩm. Hãy kiểm tra " +
          "data/products.json và dữ liệu trong trang quản trị.",
      );
    }
  }

  function clearValidation() {
    if (!el.validation) return;

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

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
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
      quantity: state.quantity,
    };
  }

  function addProductToCart() {
    if (!state.product) {
      showToast("Không tìm thấy sản phẩm.", true);
      return false;
    }

    // Đọc lại tồn kho ngay lúc bấm nút mua.
    const stockInfo = getCurrentStock(state.product.id);

    if (!stockInfo.found) {
      showToast("Chưa tìm thấy dữ liệu tồn kho trong trang quản trị.", true);
      return false;
    }

    const stock = stockInfo.stock;

    if (stock <= 0) {
      showToast("Sản phẩm đã hết hàng.", true);
      renderStock(state.product);
      return false;
    }

    const newItem = getSelectedCartItem();
    const cart = readCart();

    const existingItem = cart.find((item) => {
      const existingId = firstValue(item, ["product_id", "id"], "");

      return (
        String(existingId) === String(newItem.id) &&
        text(item.size) === newItem.size &&
        text(item.color) === newItem.color
      );
    });

    const currentQuantity = existingItem
      ? getCartItemQuantity(existingItem)
      : 0;

    if (currentQuantity + newItem.quantity > stock) {
      showToast(
        "Trong kho chỉ còn " +
          stock +
          " sản phẩm. Giỏ hàng đã có " +
          currentQuantity +
          " sản phẩm cùng loại.",
        true,
      );
      return false;
    }

    if (existingItem) {
      existingItem.id = newItem.id;
      existingItem.product_id = newItem.id;
      existingItem.name = newItem.name;
      existingItem.image = newItem.image;
      existingItem.price = newItem.price;
      existingItem.size = newItem.size;
      existingItem.color = newItem.color;
      existingItem.quantity = currentQuantity + newItem.quantity;
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

    const stockInfo = getCurrentStock(state.product ? state.product.id : "");

    const maxQuantity = stockInfo.found ? Math.min(99, stockInfo.stock) : 1;

    if (maxQuantity <= 0) {
      showToast("Sản phẩm đã hết hàng.", true);
      return;
    }

    quantity = Math.max(
      1,
      Math.min(maxQuantity, Math.floor(quantity + amount)),
    );

    el.quantity.value = String(quantity);
    state.quantity = quantity;
  }

  function openSizeModal() {
    if (!el.sizeModal) return;

    el.sizeModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSizeModal() {
    if (!el.sizeModal) return;

    el.sizeModal.hidden = true;

    if (!el.imageModal || el.imageModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  function openImageModal() {
    if (!state.currentImage) {
      showToast("Sản phẩm chưa có hình ảnh.", true);
      return;
    }

    if (!el.largeImage || !el.imageModal) return;

    el.largeImage.src = state.currentImage;
    el.imageModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeImageModal() {
    if (!el.imageModal) return;

    el.imageModal.hidden = true;

    if (!el.sizeModal || el.sizeModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  function bindEvents() {
    if (el.quantityMinus) {
      el.quantityMinus.addEventListener("click", () => {
        changeQuantity(-1);
      });
    }

    if (el.quantityPlus) {
      el.quantityPlus.addEventListener("click", () => {
        changeQuantity(1);
      });
    }

    if (el.quantity) {
      el.quantity.addEventListener("change", () => {
        let value = Number(el.quantity.value);

        if (!Number.isFinite(value)) value = 1;

        const stockInfo = getCurrentStock(
          state.product ? state.product.id : "",
        );

        const maxQuantity = stockInfo.found ? Math.min(99, stockInfo.stock) : 1;

        if (maxQuantity <= 0) {
          value = 1;
        } else {
          value = Math.max(1, Math.min(maxQuantity, Math.floor(value)));
        }

        el.quantity.value = String(value);
        state.quantity = value;
      });
    }

    if (el.addToCart) {
      el.addToCart.addEventListener("click", handleAddToCart);
    }

    if (el.buyNow) {
      el.buyNow.addEventListener("click", handleBuyNow);
    }

    if (el.sizeGuide) {
      el.sizeGuide.addEventListener("click", openSizeModal);
    }

    if (el.sizeModal) {
      el.sizeModal
        .querySelectorAll("[data-close-size-modal]")
        .forEach((button) => {
          button.addEventListener("click", closeSizeModal);
        });
    }

    if (el.imageExpand) {
      el.imageExpand.addEventListener("click", openImageModal);
    }

    if (el.imageModalClose) {
      el.imageModalClose.addEventListener("click", closeImageModal);
    }

    if (el.imageModal) {
      el.imageModal.addEventListener("click", (event) => {
        if (event.target === el.imageModal) {
          closeImageModal();
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSizeModal();
        closeImageModal();
      }
    });

    window.addEventListener("storage", (event) => {
      if (
        event.key === CART_KEY ||
        event.key === CART_LEGACY_KEY ||
        event.key === PRODUCT_KEY ||
        event.key === PRODUCT_LEGACY_KEY
      ) {
        updateCartCount();

        if (state.product) {
          renderStock(state.product);
        }
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
