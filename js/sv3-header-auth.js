document.addEventListener("DOMContentLoaded", function () {
  const headerRight = document.querySelector(".header-right");

  if (!headerRight) {
    console.log("Không tìm thấy .header-right");
    return;
  }

  // Lấy tài khoản đang đăng nhập
  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser"));
  } catch (error) {
    currentUser = null;
  }

  // Tìm icon người
  const accountIcon = headerRight.querySelector('a.icon:not([href*="cart"])');

  if (!accountIcon) {
    console.log("Không tìm thấy icon tài khoản");
    return;
  }

  // ==============================
  // CSS
  // ==============================

  const style = document.createElement("style");

  style.textContent = `
        .sv3-account-wrapper {
            position: relative;
            display: inline-block;
        }

        .sv3-account-menu {
            position: absolute;
            right: 0;
            top: 42px;
            width: 230px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,.15);
            padding: 8px;
            z-index: 99999;
            display: none;
        }

        .sv3-account-menu.active {
            display: block;
        }

        .sv3-user-info {
            padding: 12px;
            border-bottom: 1px solid #eee;
            margin-bottom: 5px;
        }

        .sv3-user-name {
            font-weight: 700;
            color: #111;
            margin-bottom: 4px;
        }

        .sv3-user-email {
            font-size: 12px;
            color: #777;
            word-break: break-word;
        }

        .sv3-account-menu a,
        .sv3-account-menu button {
            width: 100%;
            display: block;
            border: 0;
            background: transparent;
            text-decoration: none;
            text-align: left;
            padding: 11px 12px;
            border-radius: 9px;
            color: #222;
            font-size: 14px;
            cursor: pointer;
            box-sizing: border-box;
        }

        .sv3-account-menu a:hover,
        .sv3-account-menu button:hover {
            background: #f3f3f3;
        }

        .sv3-logout {
            color: #d00000 !important;
        }
    `;

  document.head.appendChild(style);

  // ==============================
  // CHƯA ĐĂNG NHẬP
  // ==============================

  if (!currentUser) {
    accountIcon.onclick = function (event) {
      event.preventDefault();

      window.location.href = "admin/login.html";
    };

    return;
  }

  // ==============================
  // ĐÃ ĐĂNG NHẬP
  // ==============================

  const wrapper = document.createElement("div");

  wrapper.className = "sv3-account-wrapper";

  // Đưa icon người vào wrapper
  accountIcon.parentNode.insertBefore(wrapper, accountIcon);

  wrapper.appendChild(accountIcon);

  accountIcon.href = "#";
  accountIcon.style.cursor = "pointer";

  // ==============================
  // MENU
  // ==============================

  const menu = document.createElement("div");

  menu.className = "sv3-account-menu";

  const userName = currentUser.name || currentUser.email || "Tài khoản";

  const userEmail = currentUser.email || "";

  menu.innerHTML = `
        <div class="sv3-user-info">
            <div class="sv3-user-name">
                👤 ${escapeHTML(userName)}
            </div>

            <div class="sv3-user-email">
                ${escapeHTML(userEmail)}
            </div>
        </div>

        <a href="orders.html">
            📦 Đơn hàng của tôi
        </a>

        ${
          currentUser.role === "admin"
            ? `
                    <a href="admin/admin.html">
                        ⚙️ Quản trị viên
                    </a>
                `
            : ""
        }

        <button class="sv3-logout" id="sv3Logout">
            🚪 Đăng xuất
        </button>
    `;

  wrapper.appendChild(menu);

  // ==============================
  // BẤM ICON NGƯỜI
  // ==============================

  accountIcon.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    menu.classList.toggle("active");
  });

  // ==============================
  // ĐĂNG XUẤT
  // ==============================

  document.getElementById("sv3Logout").addEventListener("click", function () {
    localStorage.removeItem("currentUser");

    window.location.href = "admin/login.html";
  });

  // ==============================
  // CLICK RA NGOÀI
  // ==============================

  document.addEventListener("click", function (event) {
    if (!wrapper.contains(event.target)) {
      menu.classList.remove("active");
    }
  });
});

// ==============================
// CHỐNG HTML
// ==============================

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
