(function () {
  "use strict";

  const CURRENT_KEY = "currentUser";
  const USERS_KEY = "adidasUsers";
  const LOGIN_URL = "/admin/login.html";

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function getUser() {
    const user = readJSON(CURRENT_KEY, null);

    return user && typeof user.email === "string" && user.email.trim()
      ? user
      : null;
  }

  function isAdmin(user) {
    if (!user) return false;

    const users = readJSON(USERS_KEY, []);
    if (!Array.isArray(users)) return false;

    const email = String(user.email || "")
      .trim()
      .toLowerCase();

    const storedUser = users.find(function (item) {
      return (
        item &&
        String(item.email || "")
          .trim()
          .toLowerCase() === email
      );
    });

    return (
      !!storedUser && String(storedUser.role || "").toLowerCase() === "admin"
    );
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
        justify-content: center;
        min-width: 38px;
        min-height: 38px;
        padding: 5px 8px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
      }

      .account-auth-trigger:hover {
        background: #eee;
      }

      .account-auth-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 255px;
        max-width: calc(100vw - 24px);
        padding: 10px;
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        background: #fff;
        color: #111;
        box-shadow: 0 10px 30px #0002;
        display: none;
        text-align: left;
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
    `;

    document.head.appendChild(style);
  }

  function setupHeader() {
    const headerRight = document.querySelector(".header-right");
    if (!headerRight) return;

    let wrap = headerRight.querySelector(".account-auth-wrap");

    if (!wrap) {
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
      trigger.setAttribute("title", "Tài khoản");
      trigger.setAttribute("aria-expanded", "false");
      trigger.textContent = "♙";
      wrap.appendChild(trigger);
    }

    if (!menu) {
      menu = document.createElement("div");
      menu.className = "account-auth-menu";
      wrap.appendChild(menu);
    }

    function closeMenu() {
      menu.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }

    function renderMenu() {
      const user = getUser();

      trigger.textContent = "♙";

      if (!user) {
        menu.innerHTML = "";
        trigger.setAttribute("aria-label", "Đăng nhập tài khoản");
        closeMenu();
        return;
      }

      trigger.setAttribute("aria-label", "Mở menu tài khoản");

      const adminLink = isAdmin(user)
        ? '<a href="/admin/admin.html">🛠 Quản trị viên</a>'
        : "";

      menu.innerHTML = `
        <div class="account-auth-user">
          <strong>${escapeHTML(user.name || "Khách hàng")}</strong>
          <small>${escapeHTML(user.email)}</small>
        </div>

        <a href="/orders.html">📦 Đơn hàng của tôi</a>
        ${adminLink}
        <button type="button" class="logout">Đăng xuất</button>
      `;

      closeMenu();
    }

    if (wrap.dataset.authEvents !== "1") {
      trigger.addEventListener("click", function () {
        if (!getUser()) {
          window.location.href = LOGIN_URL;
          return;
        }

        const isOpen = menu.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(isOpen));
      });

      menu.addEventListener("click", function (event) {
        const logoutButton = event.target.closest(".logout");
        if (!logoutButton) return;

        event.preventDefault();
        event.stopPropagation();

        // Chỉ xóa phiên đăng nhập, giữ nguyên dữ liệu khác.
        localStorage.removeItem(CURRENT_KEY);

        window.location.replace(LOGIN_URL);
      });

      document.addEventListener("click", function (event) {
        if (!wrap.contains(event.target)) {
          closeMenu();
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeMenu();
      });

      wrap.dataset.authEvents = "1";
    }

    renderMenu();
  }

  function requireLoginForCheckout() {
    const isCheckout = /\/checkout\.html$/i.test(window.location.pathname);

    if (!isCheckout || getUser()) return;

    const loginURL = new URL(LOGIN_URL, window.location.origin);
    loginURL.searchParams.set("next", "checkout.html");
    loginURL.searchParams.set("reason", "checkout");

    window.location.replace(loginURL.href);
  }

  function init() {
    addStyles();
    setupHeader();
    requireLoginForCheckout();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("storage", function (event) {
    if (event.key === CURRENT_KEY || event.key === USERS_KEY) {
      setupHeader();
    }
  });
})();
