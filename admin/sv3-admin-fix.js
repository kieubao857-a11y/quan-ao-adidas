(function () {
  "use strict";

  const USERS_KEY = "adidasUsers";
  const CURRENT_USER_KEY = "currentUser";
  const ORDERS_KEY = "orders";
  const PRODUCTS_KEY = "adidasProducts";

  // ==============================
  // HÀM ĐỌC / LƯU LOCALSTORAGE
  // ==============================

  function getData(key, fallback) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return data ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
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

  // ==============================
  // KIỂM TRA ADMIN
  // ==============================

  function getCurrentUser() {
    return getData(CURRENT_USER_KEY, null);
  }

  function ensureAdmin() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      window.location.href = "./login.html";
      return null;
    }

    // Admin mới của nhóm
    if (
      currentUser.email === "admin@gmail.com" &&
      currentUser.provider === "local"
    ) {
      currentUser.role = "admin";

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

      return currentUser;
    }

    if (currentUser.role !== "admin") {
      alert("Bạn không có quyền truy cập trang quản trị.");

      window.location.href = "../index.html";

      return null;
    }

    return currentUser;
  }

  // ==============================
  // KHỞI TẠO PRODUCTS
  // ==============================

  function getProducts() {
    return getData(PRODUCTS_KEY, []);
  }

  // ==============================
  // MENU ADMIN
  // ==============================

  function setupMenu() {
    const buttons = document.querySelectorAll(".nav button[data-view]");

    const views = document.querySelectorAll(".view[data-view]");

    const pageTitle = document.getElementById("pageTitle");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const target = button.dataset.view;

        buttons.forEach(function (item) {
          item.classList.remove("active");
        });

        button.classList.add("active");

        views.forEach(function (view) {
          view.style.display = view.dataset.view === target ? "" : "none";
        });

        const titles = {
          dashboard: "Tổng quan",
          customers: "Khách hàng",
          orders: "Đơn hàng",
          products: "Sản phẩm",
        };

        if (pageTitle) {
          pageTitle.textContent = titles[target] || "Quản trị";
        }

        if (target === "dashboard") {
          renderDashboard();
        }

        if (target === "customers") {
          renderCustomers();
        }

        if (target === "orders") {
          renderOrders();
        }

        if (target === "products") {
          renderProducts();
        }
      });
    });
  }

  // ==============================
  // DASHBOARD
  // ==============================

  function renderDashboard() {
    const users = getData(USERS_KEY, []);
    const orders = getData(ORDERS_KEY, []);
    const products = getProducts();

    const customers = users.filter(function (user) {
      return user.role !== "admin";
    });

    const revenue = orders
      .filter(function (order) {
        return order.status !== "Đã hủy";
      })
      .reduce(function (sum, order) {
        return sum + Number(order.total || 0);
      }, 0);

    const statUsers = document.getElementById("statUsers");

    const statOrders = document.getElementById("statOrders");

    const statProducts = document.getElementById("statProducts");

    const statRevenue = document.getElementById("statRevenue");

    if (statUsers) {
      statUsers.textContent = customers.length;
    }

    if (statOrders) {
      statOrders.textContent = orders.length;
    }

    if (statProducts) {
      statProducts.textContent = products.length;
    }

    if (statRevenue) {
      statRevenue.textContent = money(revenue);
    }

    renderRecentOrders();
  }

  // ==============================
  // ĐƠN HÀNG GẦN ĐÂY
  // ==============================

  function renderRecentOrders() {
    const container = document.getElementById("recentOrders");

    if (!container) {
      return;
    }

    const orders = getData(ORDERS_KEY, []);

    if (orders.length === 0) {
      container.innerHTML = "<p>Chưa có đơn hàng.</p>";

      return;
    }

    const recent = orders.slice().reverse().slice(0, 5);

    container.innerHTML = recent
      .map(function (order) {
        return `
                <div style="
                    padding:12px;
                    border-bottom:1px solid #eee;
                ">

                    <strong>
                        Đơn hàng #${escapeHTML(order.id)}
                    </strong>

                    <div>
                        Khách:
                        ${escapeHTML(order.customer?.name || "Không rõ")}
                    </div>

                    <div>
                        Tổng:
                        ${money(order.total)}
                    </div>

                    <div>
                        Trạng thái:
                        <strong>
                            ${escapeHTML(order.status || "Chờ xử lý")}
                        </strong>
                    </div>

                </div>
            `;
      })
      .join("");
  }

  // ==============================
  // KHÁCH HÀNG
  // ==============================

  function renderCustomers() {
    const tbody = document.getElementById("customerRows");

    if (!tbody) {
      return;
    }

    const searchInput = document.getElementById("customerSearch");

    const keyword = (searchInput?.value || "").trim().toLowerCase();

    const users = getData(USERS_KEY, []);

    const customers = users.filter(function (user) {
      if (user.role === "admin") {
        return false;
      }

      const text = `
                    ${user.name || ""}
                    ${user.email || ""}
                    ${user.provider || ""}
                `.toLowerCase();

      return text.includes(keyword);
    });

    if (customers.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        Chưa có khách hàng
                    </td>
                </tr>
            `;

      return;
    }

    tbody.innerHTML = customers
      .map(function (user) {
        return `
                <tr>

                    <td>
                        ${escapeHTML(user.name || "Chưa đặt tên")}
                    </td>

                    <td>
                        ${escapeHTML(user.email || "")}
                    </td>

                    <td>
                        ${escapeHTML(user.provider || "local")}
                    </td>

                    <td>
                        ${
                          user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : "—"
                        }
                    </td>

                    <td>
                        <button
                            type="button"
                            class="btn"
                            onclick="sv3ViewCustomerOrders('${escapeHTML(user.email || "")}')"
                        >
                            Xem đơn
                        </button>
                    </td>

                </tr>
            `;
      })
      .join("");
  }

  // ==============================
  // ĐƠN HÀNG ADMIN
  // ==============================

  function renderOrders() {
    const tbody = document.getElementById("orderRows");

    if (!tbody) {
      return;
    }

    const filter = document.getElementById("orderFilter")?.value || "";

    let orders = getData(ORDERS_KEY, []);

    if (filter) {
      orders = orders.filter(function (order) {
        return order.status === filter;
      });
    }

    if (orders.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        Không có đơn hàng
                    </td>
                </tr>
            `;

      return;
    }

    tbody.innerHTML = orders
      .slice()
      .reverse()
      .map(function (order) {
        const originalIndex = getData(ORDERS_KEY, []).findIndex(
          (item) => String(item.id) === String(order.id),
        );

        return `
                    <tr>

                        <td>
                            #${escapeHTML(order.id)}
                        </td>

                        <td>
                            ${escapeHTML(order.customer?.name || "Không rõ")}
                        </td>

                        <td>
                            ${escapeHTML(order.customer?.phone || "")}
                        </td>

                        <td>
                            ${money(order.total)}
                        </td>

                        <td>

                            <select
                                onchange="sv3ChangeOrderStatus(
                                    '${escapeHTML(order.id)}',
                                    this.value
                                )"
                            >

                                <option
                                    value="Chờ xử lý"
                                    ${order.status === "Chờ xử lý" ? "selected" : ""}
                                >
                                    Chờ xử lý
                                </option>

                                <option
                                    value="Đang giao"
                                    ${order.status === "Đang giao" ? "selected" : ""}
                                >
                                    Đang giao
                                </option>

                                <option
                                    value="Đã giao"
                                    ${order.status === "Đã giao" ? "selected" : ""}
                                >
                                    Đã giao
                                </option>

                                <option
                                    value="Đã hủy"
                                    ${order.status === "Đã hủy" ? "selected" : ""}
                                >
                                    Đã hủy
                                </option>

                            </select>

                        </td>

                        <td>
                            ${escapeHTML(order.createdAt || "")}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn"
                                onclick="sv3ViewOrder('${escapeHTML(order.id)}')"
                            >
                                Xem
                            </button>

                            <button
                                type="button"
                                class="btn"
                                onclick="sv3DeleteOrder('${escapeHTML(order.id)}')"
                            >
                                Xóa
                            </button>

                        </td>

                    </tr>
                `;
      })
      .join("");
  }

  // ==============================
  // ĐỔI TRẠNG THÁI ĐƠN
  // ==============================

  window.sv3ChangeOrderStatus = function (orderId, newStatus) {
    const orders = getData(ORDERS_KEY, []);

    const order = orders.find(function (item) {
      return String(item.id) === String(orderId);
    });

    if (!order) {
      return;
    }

    order.status = newStatus;

    saveData(ORDERS_KEY, orders);

    renderOrders();
    renderDashboard();

    alert("Đã cập nhật trạng thái đơn hàng.");
  };

  // ==============================
  // XEM ĐƠN
  // ==============================

  window.sv3ViewOrder = function (orderId) {
    const orders = getData(ORDERS_KEY, []);

    const order = orders.find(function (item) {
      return String(item.id) === String(orderId);
    });

    if (!order) {
      alert("Không tìm thấy đơn hàng.");
      return;
    }

    let products = "";

    (order.products || []).forEach(function (item) {
      products += `- ${item.name} | SL: ${item.quantity}\n`;
    });

    alert(
      "ĐƠN HÀNG #" +
        order.id +
        "\n\n" +
        "Khách hàng: " +
        (order.customer?.name || "") +
        "\nSĐT: " +
        (order.customer?.phone || "") +
        "\nEmail: " +
        (order.customer?.email || "") +
        "\nĐịa chỉ: " +
        (order.customer?.address || "") +
        "\nThanh toán: " +
        (order.payment || "") +
        "\nTrạng thái: " +
        (order.status || "") +
        "\nTổng tiền: " +
        money(order.total) +
        "\n\nSản phẩm:\n" +
        products,
    );
  };

  // ==============================
  // XÓA ĐƠN
  // ==============================

  window.sv3DeleteOrder = function (orderId) {
    if (!confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
      return;
    }

    let orders = getData(ORDERS_KEY, []);

    orders = orders.filter(function (order) {
      return String(order.id) !== String(orderId);
    });

    saveData(ORDERS_KEY, orders);

    renderOrders();
    renderDashboard();
  };

  // ==============================
  // XEM ĐƠN CỦA KHÁCH
  // ==============================

  window.sv3ViewCustomerOrders = function (email) {
    const orders = getData(ORDERS_KEY, []);

    const customerOrders = orders.filter(function (order) {
      return order.customer?.email === email;
    });

    if (customerOrders.length === 0) {
      alert("Khách hàng này chưa có đơn hàng.");

      return;
    }

    let text = "ĐƠN HÀNG CỦA: " + email + "\n\n";

    customerOrders.forEach(function (order) {
      text +=
        "#" +
        order.id +
        " - " +
        money(order.total) +
        " - " +
        order.status +
        "\n";
    });

    alert(text);
  };

  // ==============================
  // SẢN PHẨM
  // ==============================

  function renderProducts() {
    const tbody = document.getElementById("productRows");

    if (!tbody) {
      return;
    }

    const products = getProducts();

    if (products.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        Chưa có dữ liệu sản phẩm trong LocalStorage.
                    </td>
                </tr>
            `;

      return;
    }

    tbody.innerHTML = products
      .map(function (product, index) {
        return `
                    <tr>

                        <td>
                            ${escapeHTML(product.id)}
                        </td>

                        <td>
                            <img
                                src="${escapeHTML(product.image || "")}"
                                alt=""
                                style="
                                    width:50px;
                                    height:50px;
                                    object-fit:cover;
                                "
                            >
                        </td>

                        <td>
                            ${escapeHTML(product.name)}
                        </td>

                        <td>
                            ${escapeHTML(product.category || "")}
                        </td>

                        <td>
                            ${money(product.price)}
                        </td>

                        <td>
                            ${product.sale ? "Đang sale" : "Không"}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn"
                                onclick="sv3EditProduct(${index})"
                            >
                                Sửa
                            </button>

                            <button
                                type="button"
                                class="btn"
                                onclick="sv3DeleteProduct(${index})"
                            >
                                Xóa
                            </button>

                        </td>

                    </tr>
                `;
      })
      .join("");
  }

  // ==============================
  // HIỂN THỊ FORM SẢN PHẨM
  // ==============================

  function showProductForm(product) {
    const panel = document.getElementById("productFormPanel");

    if (!panel) {
      return;
    }

    panel.style.display = "";

    const title = document.getElementById("productFormTitle");

    const pId = document.getElementById("pId");

    const pName = document.getElementById("pName");

    const pCategory = document.getElementById("pCategory");

    const pPrice = document.getElementById("pPrice");

    const pImage = document.getElementById("pImage");

    const pDescription = document.getElementById("pDescription");

    const pSizes = document.getElementById("pSizes");

    const pColors = document.getElementById("pColors");

    if (title) {
      title.textContent = product ? "Sửa sản phẩm" : "Thêm sản phẩm";
    }

    if (pId) {
      pId.value = product?.id || "";
    }

    if (pName) {
      pName.value = product?.name || "";
    }

    if (pCategory) {
      pCategory.value = product?.category || "";
    }

    if (pPrice) {
      pPrice.value = product?.price || "";
    }

    if (pImage) {
      pImage.value = product?.image || "";
    }

    if (pDescription) {
      pDescription.value = product?.description || "";
    }

    if (pSizes) {
      pSizes.value = Array.isArray(product?.sizes)
        ? product.sizes.join(", ")
        : "";
    }

    if (pColors) {
      pColors.value = Array.isArray(product?.colors)
        ? product.colors.join(", ")
        : "";
    }
  }

  // ==============================
  // THÊM / SỬA SẢN PHẨM
  // ==============================

  function setupProductForm() {
    const form = document.getElementById("productForm");

    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const products = getProducts();

      const id = document.getElementById("pId")?.value.trim();

      const product = {
        id: id ? Number(id) : Date.now(),

        name: document.getElementById("pName")?.value.trim(),

        category: document.getElementById("pCategory")?.value.trim(),

        price: Number(document.getElementById("pPrice")?.value || 0),

        image: document.getElementById("pImage")?.value.trim(),

        description: document.getElementById("pDescription")?.value.trim(),

        sizes: (document.getElementById("pSizes")?.value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        colors: (document.getElementById("pColors")?.value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (!product.name) {
        alert("Vui lòng nhập tên sản phẩm.");

        return;
      }

      if (product.price <= 0) {
        alert("Giá sản phẩm phải lớn hơn 0.");

        return;
      }

      const oldIndex = products.findIndex(function (item) {
        return String(item.id) === String(id);
      });

      if (oldIndex >= 0) {
        products[oldIndex] = {
          ...products[oldIndex],
          ...product,
        };
      } else {
        products.push(product);
      }

      saveData(PRODUCTS_KEY, products);

      alert(oldIndex >= 0 ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.");

      form.reset();

      const panel = document.getElementById("productFormPanel");

      if (panel) {
        panel.style.display = "none";
      }

      renderProducts();
      renderDashboard();
    });
  }

  // ==============================
  // SỬA SẢN PHẨM
  // ==============================

  window.sv3EditProduct = function (index) {
    const products = getProducts();

    const product = products[index];

    if (!product) {
      return;
    }

    showProductForm(product);
  };

  // ==============================
  // XÓA SẢN PHẨM
  // ==============================

  window.sv3DeleteProduct = function (index) {
    const products = getProducts();

    const product = products[index];

    if (!product) {
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa "${product.name}"?`)) {
      return;
    }

    products.splice(index, 1);

    saveData(PRODUCTS_KEY, products);

    renderProducts();
    renderDashboard();
  };

  // ==============================
  // NÚT THÊM SẢN PHẨM
  // ==============================

  function setupProductButtons() {
    const addButton = document.getElementById("addProductBtn");

    if (addButton) {
      addButton.addEventListener("click", function () {
        showProductForm(null);
      });
    }

    const cancelButton = document.getElementById("cancelProduct");

    if (cancelButton) {
      cancelButton.addEventListener("click", function () {
        const panel = document.getElementById("productFormPanel");

        if (panel) {
          panel.style.display = "none";
        }
      });
    }
  }

  // ==============================
  // LOGOUT
  // ==============================

  function setupLogout() {
    const logout = document.getElementById("adminLogout");

    if (!logout) {
      return;
    }

    logout.addEventListener("click", function () {
      localStorage.removeItem(CURRENT_USER_KEY);

      window.location.href = "./login.html";
    });
  }

  // ==============================
  // SEARCH KHÁCH HÀNG
  // ==============================

  function setupSearch() {
    const input = document.getElementById("customerSearch");

    if (input) {
      input.addEventListener("input", renderCustomers);
    }

    const orderFilter = document.getElementById("orderFilter");

    if (orderFilter) {
      orderFilter.addEventListener("change", renderOrders);
    }
  }

  // ==============================
  // KHỞI ĐỘNG
  // ==============================

  function start() {
    const admin = ensureAdmin();

    if (!admin) {
      return;
    }

    const adminUser = document.getElementById("adminUser");

    if (adminUser) {
      adminUser.textContent = `${admin.name || "Admin"} · ${admin.email}`;
    }

    setupMenu();
    setupLogout();
    setupSearch();

    setupProductForm();
    setupProductButtons();

    // Mặc định mở Dashboard
    document.querySelectorAll(".view[data-view]").forEach(function (view) {
      view.style.display = view.dataset.view === "dashboard" ? "" : "none";
    });

    renderDashboard();
    renderCustomers();
    renderOrders();
    renderProducts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
