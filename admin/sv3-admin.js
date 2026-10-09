/* ==========================================
   SV3 ADMIN
   KHÔNG SỬA orders.js
   ĐỌC TRỰC TIẾP localStorage "orders"
========================================== */

const ORDERS_KEY = "orders";
const USERS_KEY = "adidasUsers";
const CURRENT_USER_KEY = "currentUser";

/* ==========================================
   ADMIN ACCOUNT
========================================== */

const ADMIN_EMAIL = "admin@adidas.com";
const ADMIN_PASSWORD = "admin123";

function getData(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));

    return data ?? fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ==========================================
   KIỂM TRA ADMIN
========================================== */

function checkAdmin() {
  const currentUser = getData(CURRENT_USER_KEY, null);

  /*
        Nếu currentUser đã là admin
    */

  if (currentUser && currentUser.role === "admin") {
    return currentUser;
  }

  /*
        Nếu chưa phải admin
        cho phép đăng nhập admin demo
    */

  const email = prompt("Email quản trị viên:", ADMIN_EMAIL);

  if (email === null) {
    window.location.href = "./index.html";

    return null;
  }

  const password = prompt("Mật khẩu quản trị viên:", ADMIN_PASSWORD);

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    alert("Sai tài khoản quản trị viên!");

    window.location.href = "./index.html";

    return null;
  }

  const admin = {
    id: "admin-001",

    name: "Quản trị viên",

    email: ADMIN_EMAIL,

    role: "admin",

    provider: "local",
  };

  saveData(CURRENT_USER_KEY, admin);

  return admin;
}

/* ==========================================
   LẤY ĐƠN HÀNG
========================================== */

function getOrders() {
  return getData(ORDERS_KEY, []);
}

/* ==========================================
   LẤY KHÁCH HÀNG
========================================== */

function getCustomers() {
  return getData(USERS_KEY, []);
}

/* ==========================================
   TIỀN
========================================== */

function money(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " VNĐ";
}

/* ==========================================
   DASHBOARD
========================================== */

function renderDashboard() {
  const orders = getOrders();

  const users = getCustomers();

  document.getElementById("totalCustomers").textContent = users.length;

  document.getElementById("totalOrders").textContent = orders.length;

  const processing = orders.filter(
    (order) => order.status === "Chờ xử lý",
  ).length;

  document.getElementById("processingOrders").textContent = processing;

  const revenue = orders
    .filter((order) => order.status !== "Đã hủy")
    .reduce(function (total, order) {
      return total + Number(order.total || 0);
    }, 0);

  document.getElementById("totalRevenue").textContent = money(revenue);

  renderRecentOrders();
}

/* ==========================================
   ĐƠN HÀNG GẦN ĐÂY
========================================== */

function renderRecentOrders() {
  const container = document.getElementById("recentOrders");

  const orders = getOrders();

  if (orders.length === 0) {
    container.innerHTML = `

            <div class="empty">

                Chưa có đơn hàng.

            </div>

        `;

    return;
  }

  const recent = orders.slice(0, 5);

  container.innerHTML = `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>
                            Mã đơn
                        </th>

                        <th>
                            Khách hàng
                        </th>

                        <th>
                            Tổng tiền
                        </th>

                        <th>
                            Trạng thái
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${recent
                      .map(
                        (order) => `

                                    <tr>

                                        <td>
                                            <strong>
                                                #${order.id}
                                            </strong>
                                        </td>


                                        <td>

                                            ${
                                              order.customer?.name ||
                                              "Khách hàng"
                                            }

                                        </td>


                                        <td>

                                            ${money(order.total)}

                                        </td>


                                        <td>

                                            <span class="status ${
                                              order.status === "Đã hủy"
                                                ? "cancelled"
                                                : ""
                                            }">

                                                ${order.status || "Chờ xử lý"}

                                            </span>

                                        </td>

                                    </tr>

                                `,
                      )
                      .join("")}

                </tbody>

            </table>

        </div>

    `;
}

/* ==========================================
   QUẢN LÝ KHÁCH HÀNG
========================================== */

function renderCustomers() {
  const tbody = document.getElementById("customerList");

  const search = (document.getElementById("customerSearch").value || "")
    .toLowerCase()
    .trim();

  const users = getCustomers();

  const filtered = users.filter((user) => {
    const text = `
                    ${user.name || ""}
                    ${user.email || ""}
                    `.toLowerCase();

    return text.includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >

                    Chưa có khách hàng.

                </td>

            </tr>

        `;

    return;
  }

  tbody.innerHTML = filtered
    .map(
      (user) => `

                    <tr>

                        <td>

                            <strong>
                                ${user.name || "Chưa đặt tên"}
                            </strong>

                        </td>


                        <td>

                            ${user.email || "Không có email"}

                        </td>


                        <td>

                            <span class="status">

                                ${user.provider || "Tài khoản thường"}

                            </span>

                        </td>


                        <td>

                            <button
                                class="btn btn-red"
                                onclick="deleteCustomer('${user.id}')"
                            >

                                Xóa

                            </button>

                        </td>

                    </tr>

                `,
    )
    .join("");
}

/* ==========================================
   XÓA KHÁCH HÀNG
========================================== */

function deleteCustomer(id) {
  const confirmDelete = confirm("Bạn có chắc muốn xóa khách hàng này?");

  if (!confirmDelete) {
    return;
  }

  let users = getCustomers();

  users = users.filter((user) => String(user.id) !== String(id));

  saveData(USERS_KEY, users);

  renderCustomers();

  renderDashboard();

  alert("Đã xóa khách hàng!");
}

/* ==========================================
   HIỂN THỊ ĐƠN HÀNG
========================================== */

function renderAdminOrders() {
  const tbody = document.getElementById("adminOrderList");

  const filter = document.getElementById("statusFilter").value;

  let orders = getOrders();

  if (filter !== "all") {
    orders = orders.filter((order) => order.status === filter);
  }

  if (orders.length === 0) {
    tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty"
                >

                    Không có đơn hàng.

                </td>

            </tr>

        `;

    return;
  }

  tbody.innerHTML = orders
    .map(
      (order) => `

                    <tr>

                        <!-- MÃ ĐƠN -->

                        <td>

                            <strong>
                                #${order.id}
                            </strong>

                        </td>


                        <!-- KHÁCH HÀNG -->

                        <td>

                            <strong>

                                ${order.customer?.name || "Khách hàng"}

                            </strong>

                            <br>

                            <small>

                                ${order.customer?.phone || ""}

                            </small>

                            <br>

                            <small>

                                ${order.customer?.address || ""}

                            </small>

                        </td>


                        <!-- SẢN PHẨM -->

                        <td>

                            ${(order.products || [])
                              .map(
                                (item) => `

                                            <div
                                                class="order-product"
                                            >

                                                <img
                                                    src="${item.image || ""}"
                                                    alt=""
                                                >

                                                <div>

                                                    <strong>

                                                        ${
                                                          item.name ||
                                                          "Sản phẩm"
                                                        }

                                                    </strong>

                                                    <br>

                                                    Size:
                                                    ${item.size || "-"}

                                                    <br>

                                                    Màu:
                                                    ${item.color || "-"}

                                                    <br>

                                                    SL:
                                                    ${item.quantity || 0}

                                                </div>

                                            </div>

                                        `,
                              )
                              .join("")}

                        </td>


                        <!-- TỔNG -->

                        <td>

                            <strong>

                                ${money(order.total)}

                            </strong>

                        </td>


                        <!-- TRẠNG THÁI -->

                        <td>

                            <select
                                onchange="changeOrderStatus(
                                    '${order.id}',
                                    this.value
                                )"
                            >

                                <option
                                    value="Chờ xử lý"
                                    ${
                                      order.status === "Chờ xử lý"
                                        ? "selected"
                                        : ""
                                    }
                                >

                                    Chờ xử lý

                                </option>


                                <option
                                    value="Đã xác nhận"
                                    ${
                                      order.status === "Đã xác nhận"
                                        ? "selected"
                                        : ""
                                    }
                                >

                                    Đã xác nhận

                                </option>


                                <option
                                    value="Đang giao"
                                    ${
                                      order.status === "Đang giao"
                                        ? "selected"
                                        : ""
                                    }
                                >

                                    Đang giao

                                </option>


                                <option
                                    value="Đã giao"
                                    ${
                                      order.status === "Đã giao"
                                        ? "selected"
                                        : ""
                                    }
                                >

                                    Đã giao

                                </option>


                                <option
                                    value="Đã hủy"
                                    ${
                                      order.status === "Đã hủy"
                                        ? "selected"
                                        : ""
                                    }
                                >

                                    Đã hủy

                                </option>

                            </select>

                        </td>


                        <!-- NGÀY -->

                        <td>

                            ${order.createdAt || ""}

                        </td>


                        <!-- THAO TÁC -->

                        <td>

                            <button
                                class="btn btn-red"
                                onclick="deleteAdminOrder('${order.id}')"
                            >

                                Xóa

                            </button>

                        </td>

                    </tr>

                `,
    )
    .join("");
}

/* ==========================================
   ĐỔI TRẠNG THÁI ĐƠN
========================================== */

function changeOrderStatus(orderId, newStatus) {
  const orders = getOrders();

  const order = orders.find((item) => String(item.id) === String(orderId));

  if (!order) {
    return;
  }

  order.status = newStatus;

  saveData(ORDERS_KEY, orders);

  renderAdminOrders();

  renderDashboard();
}

/* ==========================================
   XÓA ĐƠN
========================================== */

function deleteAdminOrder(orderId) {
  const confirmDelete = confirm("Bạn có chắc muốn xóa đơn hàng này?");

  if (!confirmDelete) {
    return;
  }

  let orders = getOrders();

  orders = orders.filter((order) => String(order.id) !== String(orderId));

  saveData(ORDERS_KEY, orders);

  renderAdminOrders();

  renderDashboard();

  alert("Đã xóa đơn hàng!");
}

/* ==========================================
   CHUYỂN MENU
========================================== */

function openView(viewName) {
  document
    .querySelectorAll(".admin-view")
    .forEach((view) => view.classList.remove("active"));

  document
    .querySelectorAll(".admin-menu button")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.view === viewName),
    );

  const target = document.getElementById("view-" + viewName);

  if (target) {
    target.classList.add("active");
  }

  const titles = {
    dashboard: "Tổng quan",

    customers: "Khách hàng",

    orders: "Đơn hàng",
  };

  document.getElementById("pageTitle").textContent =
    titles[viewName] || "Quản trị";
}

/* ==========================================
   MENU EVENTS
========================================== */

document.querySelectorAll(".admin-menu button").forEach((button) => {
  button.addEventListener("click", function () {
    openView(this.dataset.view);
  });
});

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", function () {
    openView(this.dataset.open);
  });
});

/* ==========================================
   SEARCH CUSTOMER
========================================== */

document
  .getElementById("customerSearch")
  .addEventListener("input", renderCustomers);

/* ==========================================
   FILTER ORDER
========================================== */

document
  .getElementById("statusFilter")
  .addEventListener("change", renderAdminOrders);

/* ==========================================
   LOGOUT
========================================== */

document.getElementById("adminLogout").addEventListener("click", function () {
  localStorage.removeItem(CURRENT_USER_KEY);

  window.location.href = "./login.html";
});

/* ==========================================
   START
========================================== */

(function startAdmin() {
  const admin = checkAdmin();

  if (!admin) {
    return;
  }

  document.getElementById("adminAccount").textContent =
    `${admin.name} · ${admin.email}`;

  renderDashboard();

  renderCustomers();

  renderAdminOrders();
})();
