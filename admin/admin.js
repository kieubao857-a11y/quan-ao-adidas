(function () {
  "use strict";

  const KEYS = {
    users: "adidasUsers",
    currentUser: "currentUser",
    orders: "orders",
    products: "adidasProducts",
  };

  const $ = (id) => document.getElementById(id);
  let initialized = false;

  function read(key, fallback = []) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }

  function money(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " VNĐ";
  }

  function setMessage(message) {
    const el = $("adminMessage");
    if (el) el.textContent = message;
  }

  // =========================
  // ĐỌC VÀ LƯU DỮ LIỆU
  // =========================

  function getProducts() {
    const primary = read(KEYS.products, []);
    if (Array.isArray(primary) && primary.length) return primary;

    const legacy = read("products", []);
    if (Array.isArray(legacy) && legacy.length) return legacy;

    return [];
  }

  function saveProducts(products) {
    save(KEYS.products, products);
    save("products", products);
  }

  async function loadProductsIfNeeded() {
    if (getProducts().length) {
      renderProducts();
      renderDashboard();
      return;
    }

    try {
      const response = await fetch("../data/products.json");

      if (!response.ok) {
        throw new Error("Không tải được data/products.json");
      }

      const data = await response.json();
      const products = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
          ? data.products
          : [];

      if (!products.length) {
        throw new Error("Không tìm thấy danh sách sản phẩm trong JSON");
      }

      saveProducts(products);
      renderProducts();
      renderDashboard();

      setMessage("Đã tải " + products.length + " sản phẩm.");
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      setMessage(
        "Chưa tải được sản phẩm. Hãy kiểm tra data/products.json và chạy Live Server.",
      );
    }
  }

  function getOrders() {
    const orders = read(KEYS.orders, []);
    return Array.isArray(orders) ? orders : [];
  }

  function saveOrders(orders) {
    save(KEYS.orders, orders);
  }

  function getUsers() {
    const users = read(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }

  // Hỗ trợ nhiều cấu trúc dữ liệu đơn hàng.
  function getCustomer(order) {
    const customer = order.customer || order.user || {};

    return {
      name:
        customer.name ||
        customer.fullName ||
        order.customerName ||
        order.name ||
        "Khách hàng",
      email: customer.email || order.email || "",
      phone:
        customer.phone ||
        customer.phoneNumber ||
        order.phone ||
        order.phoneNumber ||
        "",
      address: customer.address || order.address || order.shippingAddress || "",
    };
  }

  function getOrderProducts(order) {
    const items = order.products || order.items || order.cart || [];
    return Array.isArray(items) ? items : [];
  }

  function getOrderTotal(order) {
    if (order.total != null) return order.total;
    if (order.totalAmount != null) return order.totalAmount;
    if (order.amount != null) return order.amount;

    return getOrderProducts(order).reduce((sum, item) => {
      const price = Number(item.price || item.unitPrice || 0);
      const quantity = Number(item.quantity || item.qty || 1);
      return sum + price * quantity;
    }, 0);
  }

  function getOrderDate(order) {
    return order.createdAt || order.date || order.orderDate || "—";
  }

  // =========================
  // CHUYỂN MỤC QUẢN TRỊ
  // =========================

  function openView(name) {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === name);
    });

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    const target = $("view-" + name);
    if (target) target.classList.add("active");

    const titles = {
      dashboard: "Tổng quan",
      products: "Quản lý sản phẩm",
      orders: "Quản lý đơn hàng",
      customers: "Quản lý khách hàng",
      accounts: "Quản lý tài khoản",
    };

    if ($("pageTitle")) {
      $("pageTitle").textContent = titles[name] || "Quản trị";
    }

    if (name === "dashboard") renderDashboard();
    if (name === "products") renderProducts();
    if (name === "orders") renderOrders();
    if (name === "customers") renderCustomers();
    if (name === "accounts") renderAccounts();
  }

  // =========================
  // TỔNG QUAN
  // =========================

  function renderDashboard() {
    const products = getProducts();
    const orders = getOrders();
    const users = getUsers();
    const customers = users.filter((user) => user.role !== "admin");

    const pending = orders.filter((order) => {
      const status = order.status || "Chờ xử lý";
      return status === "Chờ xử lý" || status === "pending";
    });

    if ($("statProducts")) {
      $("statProducts").textContent = products.length;
    }

    if ($("statOrders")) {
      $("statOrders").textContent = orders.length;
    }

    if ($("statCustomers")) {
      $("statCustomers").textContent = customers.length;
    }

    if ($("statPending")) {
      $("statPending").textContent = pending.length;
    }

    // Hỗ trợ thêm tên ID thống kê ở phiên bản HTML khác.
    if ($("statUsers")) {
      $("statUsers").textContent = customers.length;
    }

    if ($("statRevenue")) {
      const revenue = orders
        .filter(
          (order) => order.status !== "Đã hủy" && order.status !== "cancelled",
        )
        .reduce((sum, order) => sum + Number(getOrderTotal(order) || 0), 0);

      $("statRevenue").textContent = money(revenue);
    }

    const body = $("recentOrdersBody");

    if (body) {
      body.innerHTML =
        orders
          .slice(-5)
          .reverse()
          .map((order) => {
            const customer = getCustomer(order);

            return `
          <tr>
            <td>${escapeHTML(order.id || order.orderId || "—")}</td>
            <td>${escapeHTML(customer.name)}</td>
            <td>${money(getOrderTotal(order))}</td>
            <td>${escapeHTML(order.status || "Chờ xử lý")}</td>
          </tr>
        `;
          })
          .join("") ||
        `
        <tr><td colspan="4">Chưa có đơn hàng.</td></tr>
      `;
    }
  }

  // =========================
  // QUẢN LÝ SẢN PHẨM
  // =========================

  function renderProducts() {
    const body = $("productsBody");
    if (!body) return;

    const search = ($("productSearch")?.value || "").toLowerCase().trim();

    const products = getProducts().filter((product) => {
      const text = [product.name, product.category, product.id]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });

    body.innerHTML =
      products
        .map((product) => {
          const id = product.id ?? product._id ?? "";
          const image =
            product.image || product.imageUrl || product.thumbnail || "";

          return `
        <tr>
          <td>${escapeHTML(id)}</td>
          <td>
            ${
              image
                ? `
              <img src="${escapeHTML(image)}"
                   alt=""
                   width="48"
                   height="48"
                   style="object-fit:cover">
            `
                : ""
            }
            ${escapeHTML(product.name || product.title || "Chưa đặt tên")}
          </td>
          <td>${escapeHTML(product.category || "")}</td>
          <td>${money(product.price)}</td>
          <td>
            <button type="button" data-edit-product="${escapeHTML(id)}">
              Sửa
            </button>
            <button type="button" data-delete-product="${escapeHTML(id)}">
              Xóa
            </button>
          </td>
        </tr>
      `;
        })
        .join("") ||
      `
      <tr><td colspan="5">Không tìm thấy sản phẩm.</td></tr>
    `;
  }

  function resetProductForm() {
    $("productForm")?.reset();

    if ($("productId")) {
      $("productId").value = "";
    }

    const panel = $("productFormPanel");
    if (panel) {
      panel.hidden = true;
      panel.style.display = "";
    }
  }

  function showProductForm(product = null) {
    const panel = $("productFormPanel");

    if (panel) {
      panel.hidden = false;
      panel.style.display = "";
    }

    if ($("productId")) {
      $("productId").value = product?.id ?? product?._id ?? "";
    }

    if ($("productName")) {
      $("productName").value = product?.name || product?.title || "";
    }

    if ($("productPrice")) {
      $("productPrice").value = product?.price ?? "";
    }

    if ($("productCategory")) {
      $("productCategory").value = product?.category || "";
    }

    if ($("productImage")) {
      $("productImage").value =
        product?.image || product?.imageUrl || product?.thumbnail || "";
    }

    if ($("productDescription")) {
      $("productDescription").value = product?.description || "";
    }
  }

  function saveProduct(event) {
    event.preventDefault();

    const id = $("productId")?.value.trim();

    const name = $("productName")?.value.trim() || "";
    const price = Number($("productPrice")?.value || 0);
    const category = $("productCategory")?.value || "";
    const image = $("productImage")?.value.trim() || "";
    const description = $("productDescription")?.value.trim() || "";

    if (!name || !Number.isFinite(price) || price < 0) {
      alert("Vui lòng nhập tên sản phẩm và giá hợp lệ.");
      return;
    }

    const products = getProducts();

    const index = id
      ? products.findIndex(
          (item) => String(item.id ?? item._id ?? "") === String(id),
        )
      : -1;

    if (index >= 0) {
      // Giữ lại các trường dữ liệu cũ khi sửa sản phẩm.
      products[index] = {
        ...products[index],
        name,
        title: products[index].title ? name : products[index].title,
        price,
        category,
        image,
        imageUrl: products[index].imageUrl ? image : products[index].imageUrl,
        description,
      };
    } else {
      products.push({
        id: id || "product-" + Date.now(),
        name,
        price,
        category,
        image,
        description,
      });
    }

    saveProducts(products);
    renderProducts();
    renderDashboard();
    resetProductForm();

    setMessage(index >= 0 ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.");
  }

  // =========================
  // QUẢN LÝ ĐƠN HÀNG
  // =========================

  function renderOrders() {
    const body = $("ordersBody");
    if (!body) return;

    const search = ($("orderSearch")?.value || "").toLowerCase().trim();

    const status = $("orderStatusFilter")?.value || "";

    const orders = getOrders().filter((order) => {
      const customer = getCustomer(order);
      const products = getOrderProducts(order);

      const productNames = products
        .map((item) => item.name || item.title || item.productName || "")
        .join(" ");

      const text = [
        order.id,
        order.orderId,
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        productNames,
      ]
        .join(" ")
        .toLowerCase();

      const orderStatus = order.status || "Chờ xử lý";
      const matchesStatus =
        !status ||
        orderStatus === status ||
        (status === "pending" && orderStatus === "Chờ xử lý") ||
        (status === "processing" && orderStatus === "Đã xác nhận") ||
        (status === "shipping" && orderStatus === "Đang giao") ||
        (status === "completed" && orderStatus === "Đã giao") ||
        (status === "cancelled" && orderStatus === "Đã hủy");

      return text.includes(search) && matchesStatus;
    });

    body.innerHTML =
      orders
        .map((order) => {
          const customer = getCustomer(order);
          const products = getOrderProducts(order);

          const productText = products
            .map((item) => {
              const name =
                item.name || item.title || item.productName || "Sản phẩm";
              const quantity = Number(item.quantity || item.qty || 1);

              return `${name} × ${quantity}`;
            })
            .join(", ");

          const id = order.id || order.orderId || "";
          const currentStatus = order.status || "Chờ xử lý";

          return `
        <tr>
          <td>${escapeHTML(id || "—")}</td>
          <td>
            <strong>${escapeHTML(customer.name)}</strong>
            <br><small>Email: ${escapeHTML(customer.email || "—")}</small>
            <br><small>SĐT: ${escapeHTML(customer.phone || "—")}</small>
            <br><small>Địa chỉ: ${escapeHTML(customer.address || "—")}</small>
            <br><small>Sản phẩm: ${escapeHTML(productText || "Chưa có chi tiết")}</small>
            <br><small>Ngày đặt: ${escapeHTML(getOrderDate(order))}</small>
          </td>
          <td>${money(getOrderTotal(order))}</td>
          <td>
            <select data-order-status="${escapeHTML(id)}">
              ${["Chờ xử lý", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"]
                .map(
                  (value) => `
                  <option value="${value}"
                    ${currentStatus === value ? "selected" : ""}>
                    ${value}
                  </option>
                `,
                )
                .join("")}
            </select>
            <br>
            <button type="button" data-delete-order="${escapeHTML(id)}">
              Xóa đơn
            </button>
          </td>
        </tr>
      `;
        })
        .join("") ||
      `
      <tr><td colspan="4">Chưa có đơn hàng.</td></tr>
    `;
  }

  // =========================
  // QUẢN LÝ KHÁCH HÀNG
  // =========================

  function renderCustomers() {
    const body = $("customersBody");
    if (!body) return;

    const search = ($("customerSearch")?.value || "").toLowerCase().trim();

    const users = getUsers().filter((user) => {
      const text = [user.name, user.fullName, user.email, user.phone]
        .join(" ")
        .toLowerCase();

      return user.role !== "admin" && text.includes(search);
    });

    body.innerHTML =
      users
        .map(
          (user) => `
      <tr>
        <td>${escapeHTML(user.name || user.fullName || "Chưa đặt tên")}</td>
        <td>${escapeHTML(user.email || "")}</td>
        <td>${escapeHTML(user.provider || "local")}</td>
        <td>${escapeHTML(user.role || "customer")}</td>
      </tr>
    `,
        )
        .join("") ||
      `
      <tr><td colspan="4">Chưa có khách hàng.</td></tr>
    `;
  }

  // =========================
  // QUẢN LÝ TÀI KHOẢN
  // =========================

  function renderAccounts() {
    const body = $("accountsBody");
    if (!body) return;

    const search = ($("accountSearch")?.value || "").toLowerCase().trim();

    const role = $("accountRoleFilter")?.value || "";

    const users = getUsers().filter((user) => {
      const text = [user.name, user.fullName, user.email]
        .join(" ")
        .toLowerCase();

      return (
        text.includes(search) && (!role || (user.role || "customer") === role)
      );
    });

    body.innerHTML =
      users
        .map(
          (user) => `
      <tr>
        <td>${escapeHTML(user.name || user.fullName || "Chưa đặt tên")}</td>
        <td>${escapeHTML(user.email || "")}</td>
        <td>${escapeHTML(user.provider || "local")}</td>
        <td>${escapeHTML(user.role || "customer")}</td>
        <td>
          ${
            user.role === "admin"
              ? "Quản trị viên"
              : `<button type="button"
                data-promote="${escapeHTML(user.email)}">
                Cấp quyền Admin
              </button>`
          }
        </td>
      </tr>
    `,
        )
        .join("") ||
      `
      <tr><td colspan="5">Không tìm thấy tài khoản.</td></tr>
    `;
  }

  function promoteAccount(email) {
    if (!confirm("Cấp quyền Admin cho tài khoản " + email + "?")) {
      return;
    }

    const users = getUsers();

    const user = users.find(
      (item) =>
        String(item.email || "").toLowerCase() ===
        String(email || "").toLowerCase(),
    );

    if (!user) return;

    user.role = "admin";
    save(KEYS.users, users);

    renderAccounts();
    renderCustomers();
    renderDashboard();

    setMessage("Đã cập nhật quyền tài khoản.");
  }

  // =========================
  // KHỞI TẠO VÀ SỰ KIỆN
  // =========================

  function init() {
    if (initialized) return;
    initialized = true;

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        openView(button.dataset.view);
      });
    });

    $("productSearch")?.addEventListener("input", renderProducts);
    $("orderSearch")?.addEventListener("input", renderOrders);
    $("orderStatusFilter")?.addEventListener("change", renderOrders);
    $("customerSearch")?.addEventListener("input", renderCustomers);
    $("accountSearch")?.addEventListener("input", renderAccounts);
    $("accountRoleFilter")?.addEventListener("change", renderAccounts);

    $("addProductButton")?.addEventListener("click", () => {
      showProductForm();
    });

    $("cancelProductButton")?.addEventListener("click", resetProductForm);
    $("productForm")?.addEventListener("submit", saveProduct);

    $("productsBody")?.addEventListener("click", (event) => {
      const edit = event.target.closest("[data-edit-product]");
      const remove = event.target.closest("[data-delete-product]");

      if (edit) {
        const product = getProducts().find(
          (item) => String(item.id ?? item._id) === edit.dataset.editProduct,
        );

        if (product) showProductForm(product);
      }

      if (remove) {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

        const products = getProducts().filter(
          (item) =>
            String(item.id ?? item._id) !== remove.dataset.deleteProduct,
        );

        saveProducts(products);
        renderProducts();
        renderDashboard();
        setMessage("Đã xóa sản phẩm.");
      }
    });

    $("ordersBody")?.addEventListener("change", (event) => {
      const select = event.target.closest("[data-order-status]");
      if (!select) return;

      const orders = getOrders();

      const order = orders.find(
        (item) =>
          String(item.id || item.orderId || "") === select.dataset.orderStatus,
      );

      if (!order) return;

      order.status = select.value;
      saveOrders(orders);

      renderOrders();
      renderDashboard();
      setMessage("Đã cập nhật trạng thái đơn hàng.");
    });

    $("ordersBody")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-order]");
      if (!button) return;

      if (!confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;

      const id = button.dataset.deleteOrder;

      saveOrders(
        getOrders().filter(
          (order) => String(order.id || order.orderId || "") !== id,
        ),
      );

      renderOrders();
      renderDashboard();
      setMessage("Đã xóa đơn hàng.");
    });

    $("accountsBody")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-promote]");
      if (button) promoteAccount(button.dataset.promote);
    });

    renderDashboard();
    renderProducts();
    renderOrders();
    renderCustomers();
    renderAccounts();

    loadProductsIfNeeded();

    console.log("SV3 Admin đã khởi động.");
  }

  // Hỗ trợ cả sự kiện khởi tạo cũ và trường hợp sự kiện không được phát ra.
  document.addEventListener("sv3-admin-ready", init, { once: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
