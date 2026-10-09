(function () {
  "use strict";

  function getCustomers() {
    try {
      const data = localStorage.getItem("adidasUsers");
      const users = data ? JSON.parse(data) : [];

      return users.filter(function (user) {
        return user.role !== "admin";
      });
    } catch (error) {
      console.error("Lỗi adidasUsers:", error);
      return [];
    }
  }

  function renderCustomers() {
    const tbody = document.getElementById("customerRows");

    if (!tbody) {
      console.error("KHÔNG TÌM THẤY #customerRows");
      return;
    }

    const customers = getCustomers();

    console.log("SV3 CUSTOMER:", customers);

    if (customers.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="
                        text-align:center;
                        padding:30px;
                    ">
                        Chưa có khách hàng
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = "";

    customers.forEach(function (user) {
      const tr = document.createElement("tr");

      const name = user.name || "Chưa cập nhật";
      const email = user.email || "Chưa có email";
      const provider = user.provider || "local";

      let createdAt = "Chưa có";

      if (user.createdAt) {
        const date = new Date(user.createdAt);

        if (!isNaN(date.getTime())) {
          createdAt = date.toLocaleString("vi-VN");
        }
      }

      tr.innerHTML = `
                <td>
                    <strong>${escapeHTML(name)}</strong>
                </td>

                <td>
                    ${escapeHTML(email)}
                </td>

                <td>
                    ${escapeHTML(provider)}
                </td>

                <td>
                    ${escapeHTML(createdAt)}
                </td>

                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
    <button
        type="button"
        class="btn sv3-customer-view">
        Xem
    </button>

    <button
        type="button"
        class="btn sv3-customer-edit">
        Sửa
    </button>

    <button
        type="button"
        class="btn sv3-customer-orders">
        Đơn hàng
    </button>

    <button
        type="button"
        class="btn sv3-customer-lock">
        Khóa
    </button>

    <button
        type="button"
        class="btn sv3-customer-delete"
        style="color:#d00;">
        Xóa
    </button>
</div>
                </td>
            `;

      const viewButton = tr.querySelector(".sv3-customer-view");

      viewButton.addEventListener("click", function () {
        alert(
          "THÔNG TIN KHÁCH HÀNG\n\n" +
            "Họ tên: " +
            name +
            "\n" +
            "Email: " +
            email +
            "\n" +
            "Phương thức: " +
            provider +
            "\n" +
            "Ngày tạo: " +
            createdAt,
        );
      });

      tbody.appendChild(tr);
    });
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openCustomers() {
    const customerView = document.getElementById("view-customers");

    if (!customerView) {
      console.error("KHÔNG TÌM THẤY #view-customers");
      return;
    }

    // Hiện phần khách hàng
    document.querySelectorAll(".view").forEach(function (view) {
      view.style.display = "none";
    });

    customerView.style.display = "block";

    renderCustomers();
  }

  function init() {
    console.log("SV3 CUSTOMER SYSTEM ĐÃ CHẠY");

    renderCustomers();

    /*
     * Bắt tất cả nút có data-view="customers"
     */
    document
      .querySelectorAll('[data-view="customers"]')
      .forEach(function (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();

          openCustomers();
        });
      });

    /*
     * Tìm kiếm khách hàng
     */
    const search = document.getElementById("customerSearch");

    if (search) {
      search.addEventListener("input", function () {
        const keyword = search.value.toLowerCase().trim();

        document.querySelectorAll("#customerRows tr").forEach(function (row) {
          const text = row.textContent.toLowerCase();

          row.style.display = text.includes(keyword) ? "" : "none";
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
