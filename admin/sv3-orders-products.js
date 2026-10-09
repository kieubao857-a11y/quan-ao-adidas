(function () {
  "use strict";

  const ORDERS_KEY = "orders";
  const PRODUCTS_KEY = "products";

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function getProducts() {
    try {
      return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  function money(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " VNĐ";
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================
     ĐƠN HÀNG
  ========================= */

  function renderOrders() {
    const tbody = document.getElementById("orderRows");
    const filter = document.getElementById("orderFilter");

    if (!tbody) return;

    let orders = getOrders();
    const selected = filter ? filter.value : "all";

    if (selected !== "all") {
      orders = orders.filter((order) => order.status === selected);
    }

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty">
            Chưa có đơn hàng.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders
      .map((order) => {
        const products = Array.isArray(order.products) ? order.products : [];

        const productHTML = products
          .map(
            (item) => `
        <div style="
          display:flex;
          gap:10px;
          align-items:center;
          margin-bottom:8px;
        ">
          <img
            src="${escapeHTML(item.image || "")}"
            style="
              width:45px;
              height:45px;
              object-fit:cover;
              border-radius:7px;
              border:1px solid #ddd;
            "
          >

          <div>
            <strong>
              ${escapeHTML(item.name || "Sản phẩm")}
            </strong>

            <br>

            <small>
              Size: ${escapeHTML(item.size || "-")}
              |
              Màu: ${escapeHTML(item.color || "-")}
              |
              SL: ${Number(item.quantity || 0)}
            </small>
          </div>
        </div>
      `,
          )
          .join("");

        const status = order.status || "Chờ xử lý";

        return `
        <tr>

          <td>
            <strong>#${escapeHTML(order.id)}</strong>
          </td>

          <td>
            <strong>
              ${escapeHTML(order.customer?.name || "Khách hàng")}
            </strong>

            <br>

            <small>
              ${escapeHTML(order.customer?.phone || "")}
            </small>

            <br>

            <small>
              ${escapeHTML(order.customer?.address || "")}
            </small>
          </td>

          <td>
            ${productHTML || "Không có sản phẩm"}
          </td>

          <td>
            <strong>${money(order.total)}</strong>
          </td>

          <td>
            <select
              class="sv3-order-status"
              data-id="${escapeHTML(order.id)}"
            >
              <option value="Chờ xử lý"
                ${status === "Chờ xử lý" ? "selected" : ""}>
                Chờ xử lý
              </option>

              <option value="Đã xác nhận"
                ${status === "Đã xác nhận" ? "selected" : ""}>
                Đã xác nhận
              </option>

              <option value="Đang giao"
                ${status === "Đang giao" ? "selected" : ""}>
                Đang giao
              </option>

              <option value="Đã giao"
                ${status === "Đã giao" ? "selected" : ""}>
                Đã giao
              </option>

              <option value="Đã hủy"
                ${status === "Đã hủy" ? "selected" : ""}>
                Đã hủy
              </option>
            </select>
          </td>

          <td>
            ${escapeHTML(order.createdAt || "")}
          </td>

          <td>
            <div class="actions">

              <button
                class="btn btn-light sv3-view-order"
                data-id="${escapeHTML(order.id)}"
              >
                Xem
              </button>

              <button
                class="btn btn-danger sv3-delete-order"
                data-id="${escapeHTML(order.id)}"
              >
                Xóa
              </button>

            </div>
          </td>

        </tr>
      `;
      })
      .join("");

    // Đổi trạng thái
    tbody.querySelectorAll(".sv3-order-status").forEach((select) => {
      select.addEventListener("change", function () {
        const id = String(this.dataset.id);

        const orders = getOrders();

        const order = orders.find((item) => String(item.id) === id);

        if (!order) return;

        order.status = this.value;

        saveOrders(orders);

        alert("Đã cập nhật trạng thái đơn hàng!");

        renderOrders();
      });
    });

    // Xem đơn
    tbody.querySelectorAll(".sv3-view-order").forEach((button) => {
      button.addEventListener("click", function () {
        const id = String(this.dataset.id);

        const order = getOrders().find((item) => String(item.id) === id);

        if (!order) return;

        const products = (order.products || [])
          .map(
            (item) => `${item.name || "Sản phẩm"} - SL: ${item.quantity || 0}`,
          )
          .join("\n");

        alert(
          "CHI TIẾT ĐƠN HÀNG\n\n" +
            "Mã đơn: #" +
            order.id +
            "\n" +
            "Khách hàng: " +
            (order.customer?.name || "") +
            "\n" +
            "SĐT: " +
            (order.customer?.phone || "") +
            "\n" +
            "Địa chỉ: " +
            (order.customer?.address || "") +
            "\n" +
            "Thanh toán: " +
            (order.payment || "") +
            "\n" +
            "Trạng thái: " +
            (order.status || "") +
            "\n\n" +
            "SẢN PHẨM:\n" +
            products +
            "\n\n" +
            "Tổng: " +
            money(order.total),
        );
      });
    });

    // Xóa đơn
    tbody.querySelectorAll(".sv3-delete-order").forEach((button) => {
      button.addEventListener("click", function () {
        const id = String(this.dataset.id);

        if (!confirm("Bạn có chắc muốn xóa đơn hàng #" + id + "?")) {
          return;
        }

        const orders = getOrders().filter((order) => String(order.id) !== id);

        saveOrders(orders);

        renderOrders();

        updateDashboard();

        alert("Đã xóa đơn hàng!");
      });
    });
  }

  /* =========================
     SẢN PHẨM
  ========================= */

  function renderProducts() {
    const tbody = document.getElementById("productRows");

    if (!tbody) return;

    const products = getProducts();

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty">
            Chưa có sản phẩm.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products
      .map((product) => {
        const id = product.id ?? product._id ?? "";

        return `
        <tr>

          <td>
            <img
              class="product-img"
              src="${escapeHTML(product.image || "")}"
              alt=""
            >
          </td>

          <td>
            <strong>
              ${escapeHTML(product.name || "Chưa đặt tên")}
            </strong>
          </td>

          <td>
            ${escapeHTML(product.category || "Chưa phân loại")}
          </td>

          <td>
            <strong>
              ${money(product.price)}
            </strong>
          </td>

          <td>

            <div class="actions">

              <button
                class="btn btn-light sv3-edit-product"
                data-id="${escapeHTML(id)}"
              >
                Sửa
              </button>

              <button
                class="btn btn-danger sv3-delete-product"
                data-id="${escapeHTML(id)}"
              >
                Xóa
              </button>

            </div>

          </td>

        </tr>
      `;
      })
      .join("");

    // Sửa
    tbody.querySelectorAll(".sv3-edit-product").forEach((button) => {
      button.addEventListener("click", function () {
        const id = String(this.dataset.id);

        const products = getProducts();

        const product = products.find(
          (item) => String(item.id ?? item._id ?? "") === id,
        );

        if (!product) {
          alert("Không tìm thấy sản phẩm!");
          return;
        }

        openProductForm(product);
      });
    });

    // Xóa
    tbody.querySelectorAll(".sv3-delete-product").forEach((button) => {
      button.addEventListener("click", function () {
        const id = String(this.dataset.id);

        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
          return;
        }

        const products = getProducts().filter(
          (item) => String(item.id ?? item._id ?? "") !== id,
        );

        saveProducts(products);

        renderProducts();

        updateDashboard();

        alert("Đã xóa sản phẩm!");
      });
    });
  }

  /* =========================
     FORM SẢN PHẨM
  ========================= */

  function openProductForm(product = null) {
    const panel = document.getElementById("productFormPanel");

    if (!panel) return;

    panel.style.display = "block";

    document.getElementById("productFormTitle").textContent = product
      ? "Sửa sản phẩm"
      : "Thêm sản phẩm";

    document.getElementById("pId").value = product?.id ?? product?._id ?? "";

    document.getElementById("pName").value = product?.name || "";

    document.getElementById("pCategory").value = product?.category || "Áo";

    document.getElementById("pPrice").value = product?.price || "";

    document.getElementById("pImage").value = product?.image || "";

    document.getElementById("pDescription").value = product?.description || "";

    document.getElementById("pSizes").value = Array.isArray(product?.sizes)
      ? product.sizes.join(",")
      : product?.sizes || "S,M,L,XL";

    document.getElementById("pColors").value = Array.isArray(product?.colors)
      ? product.colors.join(",")
      : product?.colors || "Đen,Trắng";
  }

  function closeProductForm() {
    const panel = document.getElementById("productFormPanel");

    if (panel) {
      panel.style.display = "none";
    }

    const form = document.getElementById("productForm");

    if (form) {
      form.reset();
      document.getElementById("pId").value = "";
    }
  }

  function saveProduct(event) {
    event.preventDefault();

    const id = document.getElementById("pId").value.trim();

    const product = {
      id: id || "product_" + Date.now(),

      name: document.getElementById("pName").value.trim(),

      category: document.getElementById("pCategory").value,

      price: Number(document.getElementById("pPrice").value),

      image: document.getElementById("pImage").value.trim(),

      description: document.getElementById("pDescription").value.trim(),

      sizes: document
        .getElementById("pSizes")
        .value.split(",")
        .map((x) => x.trim())
        .filter(Boolean),

      colors: document
        .getElementById("pColors")
        .value.split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    const products = getProducts();

    const index = products.findIndex(
      (item) => String(item.id ?? item._id ?? "") === String(product.id),
    );

    if (index >= 0) {
      products[index] = {
        ...products[index],
        ...product,
      };
    } else {
      products.push(product);
    }

    saveProducts(products);

    renderProducts();

    updateDashboard();

    closeProductForm();

    alert(index >= 0 ? "Đã cập nhật sản phẩm!" : "Đã thêm sản phẩm!");
  }

  /* =========================
     DASHBOARD
  ========================= */

  function updateDashboard() {
    const users = JSON.parse(localStorage.getItem("adidasUsers")) || [];

    const orders = getOrders();

    const products = getProducts();

    const customers = users.filter((user) => user.role !== "admin");

    const revenue = orders
      .filter((order) => order.status !== "Đã hủy")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    const userEl = document.getElementById("statUsers");

    const orderEl = document.getElementById("statOrders");

    const productEl = document.getElementById("statProducts");

    const revenueEl = document.getElementById("statRevenue");

    if (userEl) {
      userEl.textContent = customers.length;
    }

    if (orderEl) {
      orderEl.textContent = orders.length;
    }

    if (productEl) {
      productEl.textContent = products.length;
    }

    if (revenueEl) {
      revenueEl.textContent = money(revenue);
    }
  }

  /* =========================
     KHỞI TẠO
  ========================= */

  function init() {
    console.log("SV3 ORDERS + PRODUCTS: ĐÃ KHỞI ĐỘNG");

    const orderFilter = document.getElementById("orderFilter");

    if (orderFilter) {
      orderFilter.addEventListener("change", renderOrders);
    }

    const addButton = document.getElementById("addProductBtn");

    if (addButton) {
      addButton.addEventListener("click", function () {
        openProductForm();
      });
    }

    const cancelButton = document.getElementById("cancelProduct");

    if (cancelButton) {
      cancelButton.addEventListener("click", function () {
        closeProductForm();
      });
    }

    const productForm = document.getElementById("productForm");

    if (productForm) {
      productForm.addEventListener("submit", saveProduct);
    }

    renderOrders();
    renderProducts();
    updateDashboard();

    // Khi bấm menu Đơn hàng / Sản phẩm
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", function () {
        const viewName = this.dataset.view;

        if (viewName !== "orders" && viewName !== "products") {
          return;
        }

        setTimeout(function () {
          if (viewName === "orders") {
            renderOrders();
          }

          if (viewName === "products") {
            renderProducts();
          }
        }, 50);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
/* =====================================================
   SV3 - ĐỒNG BỘ SẢN PHẨM JSON VÀO ADMIN
   Không sửa code SV1
===================================================== */

(function () {
  "use strict";

  const SV3_PRODUCTS_KEY = "adidasProducts";
  const PRODUCT_JSON_URL = "../data/products.json";

  async function loadProductsFromJSON() {
    try {
      const response = await fetch(PRODUCT_JSON_URL);

      if (!response.ok) {
        throw new Error("Không thể đọc products.json: HTTP " + response.status);
      }

      const products = await response.json();

      if (!Array.isArray(products)) {
        throw new Error("products.json không phải một mảng sản phẩm");
      }

      // Lấy dữ liệu sản phẩm hiện có trong LocalStorage
      let currentProducts = [];

      try {
        const existing = localStorage.getItem(SV3_PRODUCTS_KEY);

        if (existing) {
          currentProducts = JSON.parse(existing);
        }

        if (!Array.isArray(currentProducts)) {
          currentProducts = [];
        }
      } catch (error) {
        console.warn("SV3: LocalStorage sản phẩm bị lỗi, tạo lại từ JSON.");

        currentProducts = [];
      }

      // Tạo danh sách ID sản phẩm hiện có
      const existingIds = new Set(
        currentProducts.map(function (product) {
          return String(product.id);
        }),
      );

      // Tìm các sản phẩm trong JSON nhưng chưa có trong LocalStorage
      const missingProducts = products.filter(function (product) {
        return !existingIds.has(String(product.id));
      });

      // Bổ sung sản phẩm còn thiếu
      if (missingProducts.length > 0) {
        currentProducts = currentProducts.concat(missingProducts);

        localStorage.setItem(SV3_PRODUCTS_KEY, JSON.stringify(currentProducts));

        console.log(
          "SV3: Đã bổ sung",
          missingProducts.length,
          "sản phẩm từ JSON.",
        );
      } else {
        console.log("SV3: Không có sản phẩm mới cần bổ sung.");
      }

      console.log("SV3: Tổng số sản phẩm trong Admin:", currentProducts.length);

      // Render lại bảng Admin
      if (typeof window.renderProducts === "function") {
        window.renderProducts();
      }
    } catch (error) {
      console.error("SV3: Không đọc được JSON sản phẩm:", error);
    }
  }

  function initProductSync() {
    setTimeout(function () {
      loadProductsFromJSON();
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProductSync);
  } else {
    initProductSync();
  }
})();

/* =====================================================
   SV3 - BỔ SUNG CHI TIẾT TÀI KHOẢN ĐẶT HÀNG
   Thêm ở cuối sv3-orders-products.js
   Không sửa code cũ
===================================================== */

(function () {
  "use strict";

  function sv3FindAccount(order) {
    let users = [];

    try {
      users = JSON.parse(localStorage.getItem("adidasUsers") || "[]");
    } catch (error) {
      users = [];
    }

    const customer = order.customer || {};
    const accountId =
      order.userId || order.customerId || customer.id || customer.userId || "";

    const email = order.email || order.customerEmail || customer.email || "";

    return (
      users.find(function (user) {
        if (accountId && String(user.id) === String(accountId)) {
          return true;
        }

        return Boolean(
          email &&
          user.email &&
          user.email.toLowerCase() === String(email).toLowerCase(),
        );
      }) || null
    );
  }

  function sv3ShowOrderDetails(id) {
    let orders = [];

    try {
      orders = JSON.parse(localStorage.getItem("orders") || "[]");
    } catch (error) {
      alert("Không đọc được dữ liệu đơn hàng.");
      return;
    }

    const order = orders.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!order) {
      alert("Không tìm thấy đơn hàng.");
      return;
    }

    const customer = order.customer || {};
    const account = sv3FindAccount(order);

    const products = Array.isArray(order.products) ? order.products : [];

    const productDetails = products
      .map(function (item, index) {
        return (
          index +
          1 +
          ". " +
          (item.name || "Sản phẩm") +
          "\n   Size: " +
          (item.size || "-") +
          "\n   Màu: " +
          (item.color || "-") +
          "\n   Số lượng: " +
          Number(item.quantity || 0) +
          "\n   Đơn giá: " +
          Number(item.price || 0).toLocaleString("vi-VN") +
          " VNĐ"
        );
      })
      .join("\n\n");

    const details = [
      "CHI TIẾT ĐƠN HÀNG",
      "",
      "Mã đơn: #" + (order.id || "-"),
      "Thời gian: " + (order.createdAt || "-"),
      "Trạng thái: " + (order.status || "Chờ xử lý"),
      "",
      "TÀI KHOẢN ĐẶT HÀNG",
      "Tên tài khoản: " + (account?.name || customer.name || "-"),
      "Email tài khoản: " +
        (account?.email ||
          order.email ||
          customer.email ||
          "Chưa lưu trong đơn hàng"),
      "Mã khách hàng: " +
        (account?.id || order.userId || customer.id || "Chưa lưu"),
      "",
      "THÔNG TIN NGƯỜI NHẬN",
      "Họ tên: " + (customer.name || order.name || "-"),
      "Số điện thoại: " + (customer.phone || order.phone || "-"),
      "Địa chỉ: " + (customer.address || order.address || "-"),
      "",
      "THANH TOÁN",
      "Phương thức: " + (order.payment || order.paymentMethod || "-"),
      "Tổng tiền: " + Number(order.total || 0).toLocaleString("vi-VN") + " VNĐ",
      "",
      "SẢN PHẨM",
      productDetails || "Không có thông tin sản phẩm",
    ].join("\n");

    alert(details);
  }

  document.addEventListener(
    "click",
    function (event) {
      const button = event.target.closest(".sv3-view-order");

      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      sv3ShowOrderDetails(button.dataset.id);
    },
    true,
  );

  console.log("SV3: Đã bổ sung xem chi tiết tài khoản đặt hàng.");
})();
