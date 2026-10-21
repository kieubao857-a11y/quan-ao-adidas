(function () {
  "use strict";

  const USERS_KEY = "adidasUsers";
  const CURRENT_USER_KEY = "currentUser";

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function checkAdmin() {
    const currentUser = readJSON(CURRENT_USER_KEY, null);
    const users = readJSON(USERS_KEY, []);

    if (!currentUser || !Array.isArray(users)) {
      return null;
    }

    const email = String(currentUser.email || "").toLowerCase();

    const storedUser = users.find(
      (user) => String(user.email || "").toLowerCase() === email,
    );

    if (!storedUser || storedUser.role !== "admin") {
      return null;
    }

    return storedUser;
  }

  function logout() {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      return;
    }

    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = "./login.html";
  }

  function init() {
    const admin = checkAdmin();

    if (!admin) {
      alert("Bạn cần đăng nhập bằng tài khoản Admin.");
      window.location.replace("./login.html");
      return;
    }

    const adminName = document.getElementById("adminName");

    if (adminName) {
      adminName.textContent = admin.name || admin.email || "Quản trị viên";
    }

    const logoutButton = document.getElementById("adminLogout");

    if (logoutButton) {
      logoutButton.addEventListener("click", logout);
    }

    window.SV3AdminAuth = {
      getCurrentUser: () => admin,
      logout,
    };

    document.dispatchEvent(new Event("sv3-admin-ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
