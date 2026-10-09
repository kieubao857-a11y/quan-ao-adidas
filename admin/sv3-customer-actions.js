(function () {
  "use strict";

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("adidasUsers")) || [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem("adidasUsers", JSON.stringify(users));
  }

  function addActions() {
    const rows = document.querySelectorAll("#customerRows tr");

    rows.forEach(function (row) {
      // Không xử lý dòng "Chưa có khách hàng"
      if (!row.querySelector("td")) return;

      const cells = row.querySelectorAll("td");
      if (cells.length < 5) return;

      // Nếu đã thêm rồi thì bỏ qua
      if (row.dataset.sv3Actions === "1") return;

      const email = cells[1].textContent.trim();
      const name = cells[0].textContent.trim();

      const users = getUsers();
      const user = users.find(function (u) {
        return u.email === email;
      });

      if (!user) return;

      // Ẩn nút Xem cũ
      const oldViewButton = row.querySelector(".sv3-customer-view");

      if (oldViewButton) {
        oldViewButton.style.display = "none";
      }

      // Tạo khu vực nút mới
      const actionBox = document.createElement("div");

      actionBox.style.display = "flex";
      actionBox.style.flexWrap = "wrap";
      actionBox.style.gap = "6px";

      // Nút sửa
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "✏️ Sửa";
      editBtn.className = "btn";

      editBtn.onclick = function () {
        editCustomer(user.id);
      };

      // Nút khóa
      const lockBtn = document.createElement("button");
      lockBtn.type = "button";

      if (user.status === "locked") {
        lockBtn.textContent = "🔓 Mở khóa";
      } else {
        lockBtn.textContent = "🔒 Khóa";
      }

      lockBtn.className = "btn";

      lockBtn.onclick = function () {
        toggleCustomerLock(user.id);
      };

      // Nút đơn hàng
      const orderBtn = document.createElement("button");
      orderBtn.type = "button";
      orderBtn.textContent = "📦 Đơn hàng";
      orderBtn.className = "btn";

      orderBtn.onclick = function () {
        viewCustomerOrders(user);
      };

      // Nút xóa
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "🗑️ Xóa";
      deleteBtn.className = "btn";

      deleteBtn.style.color = "#d00000";

      deleteBtn.onclick = function () {
        deleteCustomer(user.id);
      };

      actionBox.appendChild(editBtn);
      actionBox.appendChild(lockBtn);
      actionBox.appendChild(orderBtn);
      actionBox.appendChild(deleteBtn);

      cells[4].appendChild(actionBox);

      row.dataset.sv3Actions = "1";
    });
  }

  // =========================
  // SỬA KHÁCH HÀNG
  // =========================
  function editCustomer(userId) {
    const users = getUsers();

    const index = users.findIndex(function (u) {
      return u.id === userId;
    });

    if (index === -1) {
      alert("Không tìm thấy khách hàng.");
      return;
    }

    const user = users[index];

    const newName = prompt("Nhập họ tên mới:", user.name || "");

    if (newName === null) return;

    const newEmail = prompt("Nhập email mới:", user.email || "");

    if (newEmail === null) return;

    const emailExists = users.some(function (u, i) {
      return i !== index && u.email.toLowerCase() === newEmail.toLowerCase();
    });

    if (emailExists) {
      alert("Email này đã được sử dụng.");
      return;
    }

    users[index].name = newName.trim();
    users[index].email = newEmail.trim();

    saveUsers(users);

    alert("Đã cập nhật thông tin khách hàng.");

    location.reload();
  }

  // =========================
  // KHÓA / MỞ KHÓA
  // =========================
  function toggleCustomerLock(userId) {
    const users = getUsers();

    const index = users.findIndex(function (u) {
      return u.id === userId;
    });

    if (index === -1) return;

    const user = users[index];

    if (user.status === "locked") {
      const ok = confirm(
        "Mở khóa tài khoản:\n\n" +
          user.name +
          "\n" +
          user.email +
          "\n\n" +
          "Bạn có chắc muốn mở khóa?",
      );

      if (!ok) return;

      users[index].status = "active";
      saveUsers(users);

      alert("Đã mở khóa tài khoản.");
    } else {
      const ok = confirm(
        "Khóa tài khoản:\n\n" +
          user.name +
          "\n" +
          user.email +
          "\n\n" +
          "Bạn có chắc muốn khóa tài khoản?",
      );

      if (!ok) return;

      users[index].status = "locked";
      saveUsers(users);

      alert("Đã khóa tài khoản.");
    }

    location.reload();
  }

  // =========================
  // XEM ĐƠN HÀNG
  // =========================
  function viewCustomerOrders(user) {
    let orders = [];

    try {
      orders = JSON.parse(localStorage.getItem("orders")) || [];
    } catch (e) {
      orders = [];
    }

    const customerOrders = orders.filter(function (order) {
      if (order.customer) {
        if (order.customer.email && order.customer.email === user.email) {
          return true;
        }

        if (order.customer.userId && order.customer.userId === user.id) {
          return true;
        }

        if (order.customer.name && order.customer.name === user.name) {
          return true;
        }
      }

      return false;
    });

    if (customerOrders.length === 0) {
      alert(
        "KHÁCH HÀNG\n\n" +
          "Tên: " +
          user.name +
          "\n" +
          "Email: " +
          user.email +
          "\n\n" +
          "Khách hàng chưa có đơn hàng.",
      );
      return;
    }

    let text =
      "ĐƠN HÀNG CỦA KHÁCH HÀNG\n\n" +
      "Khách hàng: " +
      user.name +
      "\n" +
      "Email: " +
      user.email +
      "\n\n";

    customerOrders.forEach(function (order, index) {
      text +=
        "-------------------------\n" +
        "Đơn hàng #" +
        (index + 1) +
        "\n" +
        "Mã: " +
        (order.id || "N/A") +
        "\n" +
        "Tổng: " +
        Number(order.total || 0).toLocaleString("vi-VN") +
        " đ\n" +
        "Trạng thái: " +
        (order.status || "Chưa xác định") +
        "\n";
    });

    alert(text);
  }

  // =========================
  // XÓA KHÁCH HÀNG
  // =========================
  function deleteCustomer(userId) {
    const users = getUsers();

    const index = users.findIndex(function (u) {
      return u.id === userId;
    });

    if (index === -1) return;

    const user = users[index];

    const ok = confirm(
      "⚠️ XÓA KHÁCH HÀNG\n\n" +
        "Tên: " +
        user.name +
        "\n" +
        "Email: " +
        user.email +
        "\n\n" +
        "Hành động này sẽ xóa tài khoản khỏi danh sách khách hàng.\n\n" +
        "Bạn có chắc chắn muốn xóa?",
    );

    if (!ok) return;

    users.splice(index, 1);

    saveUsers(users);

    alert("Đã xóa khách hàng.");

    location.reload();
  }

  // Theo dõi tbody vì sv3-customers.js có thể render lại bảng
  function startObserver() {
    addActions();

    const tbody = document.getElementById("customerRows");

    if (!tbody) return;

    const observer = new MutationObserver(function () {
      addActions();
    });

    observer.observe(tbody, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
