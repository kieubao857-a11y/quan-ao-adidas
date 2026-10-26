(function () {
  "use strict";

  const KEYS = ["adidasProducts", "products"];

  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  function getProducts() {
    const first = read(KEYS[0]);
    if (first && first.length) return first;
    return read(KEYS[1]) || [];
  }

  function getId(product) {
    return String(
      product?.id ??
        product?.product_id ??
        product?.productId ??
        product?._id ??
        "",
    );
  }

  function getQuantityInStock(product) {
    const value = product?.stock ?? product?.quantity;
    const number = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      !Number.isFinite(number)
    ) {
      return 0;
    }

    return Math.max(0, Math.floor(number));
  }

  function findProduct(id) {
    return (
      getProducts().find((product) => getId(product) === String(id)) || null
    );
  }

  function getStock(id) {
    const product = findProduct(id);
    return product ? getQuantityInStock(product) : 0;
  }

  function validate(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Giỏ hàng đang trống.");
    }

    const products = getProducts();
    const totals = new Map();

    for (const item of items) {
      const id = String(item?.id ?? item?.product_id ?? item?.productId ?? "");

      const quantity = Number(item?.quantity ?? item?.qty);

      const product = products.find((p) => getId(p) === id);

      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm "${item?.name || id}".`);
      }

      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw new Error(
          `Số lượng sản phẩm "${item?.name || id}" không hợp lệ.`,
        );
      }

      totals.set(id, (totals.get(id) || 0) + quantity);
    }

    for (const [id, quantity] of totals) {
      const product = products.find((p) => getId(p) === id);

      const stock = getQuantityInStock(product);

      if (stock <= 0) {
        throw new Error(`Sản phẩm "${product.name || id}" đã hết hàng.`);
      }

      if (quantity > stock) {
        throw new Error(
          `Sản phẩm "${product.name || id}" chỉ còn ${stock} sản phẩm. Vui lòng giảm số lượng.`,
        );
      }
    }

    return true;
  }

  function saveProducts(products) {
    localStorage.setItem(KEYS[0], JSON.stringify(products));

    localStorage.setItem(KEYS[1], JSON.stringify(products));
  }

  function decreaseStock(items) {
    validate(items);

    const oldA = localStorage.getItem(KEYS[0]);
    const oldB = localStorage.getItem(KEYS[1]);

    const products = getProducts().map((product) => ({ ...product }));

    const totals = new Map();

    for (const item of items) {
      const id = String(item.id ?? item.product_id ?? item.productId);

      totals.set(id, (totals.get(id) || 0) + Number(item.quantity ?? item.qty));
    }

    for (const [id, quantity] of totals) {
      const product = products.find((p) => getId(p) === id);

      if (!product) {
        throw new Error("Không tìm thấy sản phẩm.");
      }

      const stock = getQuantityInStock(product);

      if (quantity > stock) {
        throw new Error(`Sản phẩm "${product.name || id}" không đủ hàng.`);
      }

      product.stock = stock - quantity;
      product.quantity = product.stock;
    }

    try {
      saveProducts(products);
    } catch (error) {
      if (oldA === null) {
        localStorage.removeItem(KEYS[0]);
      } else {
        localStorage.setItem(KEYS[0], oldA);
      }

      if (oldB === null) {
        localStorage.removeItem(KEYS[1]);
      } else {
        localStorage.setItem(KEYS[1], oldB);
      }

      throw new Error(
        "Không cập nhật được tồn kho. Đơn hàng chưa được xác nhận.",
      );
    }
  }

  window.AdidasStock = {
    getProducts,
    getStock,
    findProduct,
    validate,
    decreaseStock,
  };
})();
