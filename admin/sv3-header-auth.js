document.addEventListener("DOMContentLoaded", function () {
  const accountIcon = document.querySelector('.header-right a.icon[href="#"]');

  if (!accountIcon) {
    return;
  }

  // =========================
  // LẤY USER ĐANG ĐĂNG NHẬP
  // =========================

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
      return null;
    }
  }

  const currentUser = getCurrentUser();

  // =========================
  // TẠO CSS
  // =========================

  const style = document.createElement("style");

  style.textContent = `

        .sv3-account {
            position: relative;
            display: inline-flex;
            align-items: center;
        }


        .sv3-account-button {

            border: none;
            background: transparent;

            cursor: pointer;

            font-size: 22px;

            padding: 5px;

            display: flex;
            align-items: center;
            gap: 6px;

        }


        .sv3-account-name {

            font-size: 13px;

            font-weight: 700;

            max-width: 110px;

            overflow: hidden;

            white-space: nowrap;

            text-overflow: ellipsis;

        }


        .sv3-account-menu {

            position: absolute;

            right: 0;

            top: calc(100% + 10px);

            width: 220px;

            background: white;

            border: 1px solid #ddd;

            border-radius: 12px;

            box-shadow:
                0 10px 30px rgba(0,0,0,.12);

            padding: 8px;

            z-index: 9999;

            display: none;

        }


        .sv3-account-menu.show {

            display: block;

        }


        .sv3-account-info {

            padding: 12px;

            border-bottom: 1px solid #eee;

            margin-bottom: 5px;

        }


        .sv3-account-info strong {

            display: block;

            font-size: 14px;

            margin-bottom: 4px;

        }


        .sv3-account-info small {

            color: #777;

            word-break: break-all;

        }


        .sv3-account-menu a,
        .sv3-account-menu button {

            width: 100%;

            display: block;

            border: none;

            background: transparent;

            color: #111;

            text-decoration: none;

            text-align: left;

            padding: 11px 12px;

            border-radius: 8px;

            cursor: pointer;

            font-size: 14px;

        }


        .sv3-account-menu a:hover,
        .sv3-account-menu button:hover {

            background: #f2f2f2;

        }


        .sv3-logout {

            color: #d00 !important;

        }

    `;

  document.head.appendChild(style);

  // =========================
  // TẠO ACCOUNT CONTAINER
  // =========================

  const accountBox = document.createElement("div");

  accountBox.className = "sv3-account";

  // Đưa accountBox thay thế icon cũ

  accountIcon.replaceWith(accountBox);

  // =========================
  // CHƯA ĐĂNG NHẬP
  // =========================

  if (!currentUser) {
    accountBox.innerHTML = `

            <a
                href="./login.html"
                class="sv3-account-button"
                title="Đăng nhập"
            >

                👤

            </a>

        `;

    return;
  }

  // =========================
  // ĐÃ ĐĂNG NHẬP
  // =========================

  const displayName = currentUser.name || currentUser.email || "Tài khoản";

  const email = currentUser.email || "";

  const isAdmin = currentUser.role === "admin";

  accountBox.innerHTML = `

        <button
            type="button"
            class="sv3-account-button"
            id="sv3AccountButton"
            title="Tài khoản"
        >

            👤

            <span class="sv3-account-name">

                ${escapeHTML(displayName)}

            </span>

        </button>


        <div
            class="sv3-account-menu"
            id="sv3AccountMenu"
        >

            <div class="sv3-account-info">

                <strong>

                    ${escapeHTML(displayName)}

                </strong>

                <small>

                    ${escapeHTML(email)}

                </small>

            </div>


            <a href="./orders.html">

                📦 Đơn hàng của tôi

            </a>


            ${
              isAdmin
                ? `
                        <a href="./admin.html">

                            ⚙️ Quản trị viên

                        </a>
                    `
                : ""
            }


            <button
                type="button"
                class="sv3-logout"
                id="sv3Logout"
            >

                🚪 Đăng xuất

            </button>

        </div>

    `;

  // =========================
  // MỞ / ĐÓNG MENU
  // =========================

  const accountButton = document.getElementById("sv3AccountButton");

  const accountMenu = document.getElementById("sv3AccountMenu");

  accountButton.addEventListener("click", function (event) {
    event.stopPropagation();

    accountMenu.classList.toggle("show");
  });

  document.addEventListener("click", function () {
    accountMenu.classList.remove("show");
  });

  // =========================
  // ĐĂNG XUẤT
  // =========================

  const logoutButton = document.getElementById("sv3Logout");

  logoutButton.addEventListener("click", function () {
    const confirmLogout = confirm("Bạn có chắc muốn đăng xuất?");

    if (!confirmLogout) {
      return;
    }

    // Xóa tài khoản đang đăng nhập

    localStorage.removeItem("currentUser");

    // Nếu Google Identity Services tồn tại

    if (window.google && google.accounts && google.accounts.id) {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.log("Google logout:", error);
      }
    }

    // Về trang đăng nhập

    window.location.href = "./login.html";
  });
});

/* ==========================================
   CHỐNG LỖI KHI TÊN CÓ KÝ TỰ ĐẶC BIỆT
========================================== */

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
