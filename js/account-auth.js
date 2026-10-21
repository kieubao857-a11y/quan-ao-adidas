(function () {
  "use strict";

  const CURRENT_KEY = "currentUser";

  function getUser() {
    try {
      const user = JSON.parse(localStorage.getItem(CURRENT_KEY) || "null");

      return user && typeof user.email === "string" && user.email.trim()
        ? user
        : null;
    } catch (error) {
      return null;
    }
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function addStyles() {
    if (document.getElementById("account-auth-style")) return;

    const style = document.createElement("style");
    style.id = "account-auth-style";
    style.textContent = `
      .account-auth-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        z-index: 9999;
      }

      .account-auth-trigger {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 9px 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #fff;
        color: #111;
        font: inherit;
        cursor: pointer;
      }

      .account-auth-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 255px;
        padding: 10px;
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        background: #fff;
        color: #111;
        box-shadow: 0 10px 30px #0002;
        display: none;
      }

      .account-auth-menu.open {
        display: block;
      }

      .account-auth-user {
        padding: 10px;
        margin-bottom: 6px;
        border-bottom: 1px solid #eee;
        overflow-wrap: anywhere;
      }

      .account-auth-user strong,
      .account-auth-user small {
        display: block;
      }

      .account-auth-user small {
        margin-top: 5px;
        color: #666;
      }

      .account-auth-menu a,
      .account-auth-menu button {
        display: block;
        box-sizing: border-box;
        width: 100%;
        padding: 11px 10px;
        border: 0;
        border-radius: 7px;
        background: #fff;
        color: #111;
        text-align: left;
        text-decoration: none;
        font: inherit;
        cursor: pointer;
      }

      .account-auth-menu a:hover,
      .account-auth-menu button:hover {
        background: #f2f2f2;
      }

      .account-auth-menu .logout {
        color: #c62828;
      }

      .account-auth-notice {
        margin: 15px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #f8f8f8;
      }
    `;

    document.head.appendChild(style);
  }

  function setupHeader() {
    const headerRight = document.querySelector(".header-right");

    // Chỉ chèn vào khu vực tài khoản của header hiện tại.
    if (!headerRight) return;

    let wrap = headerRight.querySelector(".account-auth-wrap");

    if (!wrap) {
      // Tìm nút tài khoản cũ để thay thế, không xóa các nút khác.
      const oldButton = Array.from(
        headerRight.querySelectorAll("a, button"),
      ).find(function (element) {
        if (element.closest(".account-auth-wrap")) return false;

        const text = (
          (element.getAttribute("aria-label") || "") +
          " " +
          (element.getAttribute("title") || "") +
          " " +
          (element.textContent || "")
        ).toLowerCase();

        const href = (element.getAttribute("href") || "").toLowerCase();

        return (
          text.includes("tài khoản") ||
          text.includes("account") ||
          href.endsWith("login.html")
        );
      });

      wrap = document.createElement("div");
      wrap.className = "account-auth-wrap";

      if (oldButton) {
        oldButton.replaceWith(wrap);
      } else {
        headerRight.appendChild(wrap);
      }
    }

    let trigger = wrap.querySelector(".account-auth-trigger");
    let menu = wrap.querySelector(".account-auth-menu");

    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "account-auth-trigger";
      trigger.setAttribute("aria-label", "Tài khoản");
      trigger.setAttribute("aria-expanded", "false");
      wrap.appendChild(trigger);
    }

    if (!menu) {
      menu = document.createElement("div");
      menu.className = "account-auth-menu";
      wrap.appendChild(menu);
    }

    function renderMenu() {
      const user = getUser();

      if (user) {
        trigger.innerHTML = "👤 " + escapeHTML(user.name || "Tài khoản") + " ▾";

        menu.innerHTML = `
          <div class="account-auth-user">
            <strong>${escapeHTML(user.name || "Khách hàng")}</strong>
            <small>${escapeHTML(user.email)}</small>
          </div>
          <a href="orders.html">📦 Đơn hàng của tôi</a>
          <a href="index.html">🏠 Tiếp tục mua sắm</a>
          <button type="button" class="logout">Đăng xuất</button>
        `;
      } else {
        trigger.innerHTML = "👤 Tài khoản ▾";

        menu.innerHTML = `
          <div class="account-auth-user">
            <strong>Chào mừng bạn!</strong>
            <small>Đăng nhập để đặt hàng và theo dõi đơn hàng.</small>
          </div>
          <a href="login.html">Đăng nhập</a>
          <a href="login.html#register">Tạo tài khoản mới</a>
          <a href="orders.html">📦 Đơn hàng của tôi</a>
        `;
      }

      trigger.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
    }

    if (wrap.dataset.authEvents !== "1") {
      trigger.addEventListener("click", function () {
        const isOpen = menu.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(isOpen));
      });

      menu.addEventListener("click", function (event) {
        const logoutButton = event.target.closest(".logout");

        if (!logoutButton) return;

        event.preventDefault();

        // Chỉ xóa phiên đăng nhập, không xóa tài khoản hay đơn hàng.
        localStorage.removeItem(CURRENT_KEY);

        renderMenu();

        window.location.href = "index.html?loggedOut=1";
      });

      document.addEventListener("click", function (event) {
        if (!wrap.contains(event.target)) {
          menu.classList.remove("open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });

      wrap.dataset.authEvents = "1";
    }

    renderMenu();
  }

  function requireLoginForCheckout() {
    const isCheckout = /\/checkout\.html$/i.test(window.location.pathname);

    if (!isCheckout || getUser()) return;

    const loginURL = new URL("login.html", window.location.href);
    loginURL.searchParams.set("next", "checkout.html");
    loginURL.searchParams.set("reason", "checkout");

    window.location.replace(loginURL.href);
  }

  function showLogoutNotice() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("loggedOut") !== "1") return;

    const main = document.querySelector("main");
    if (!main || document.querySelector(".account-auth-notice")) return;

    const notice = document.createElement("div");
    notice.className = "account-auth-notice";
    notice.textContent = "Bạn đã đăng xuất thành công.";

    main.prepend(notice);

    // Xóa tham số thông báo khỏi URL.
    const cleanURL = new URL(window.location.href);
    cleanURL.searchParams.delete("loggedOut");

    window.history.replaceState({}, "", cleanURL.href);
  }

  function init() {
    addStyles();
    setupHeader();
    requireLoginForCheckout();
    showLogoutNotice();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Đồng bộ menu nếu phiên đăng nhập thay đổi ở tab khác.
  window.addEventListener("storage", function (event) {
    if (event.key === CURRENT_KEY) {
      setupHeader();
    }
  });
})();
