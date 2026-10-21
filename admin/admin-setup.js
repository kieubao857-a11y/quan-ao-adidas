(function () {
  "use strict";

  const USERS_KEY = "adidasUsers";
  const ADMIN_EMAIL = "admin@gmail.com";
  const ADMIN_PASSWORD = "123456";

  function readUsers() {
    try {
      const data = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Không đọc được danh sách tài khoản:", error);
      return [];
    }
  }

  function setupAdmin() {
    const users = readUsers();

    let admin = users.find(
      (user) =>
        String(user.email || "")
          .trim()
          .toLowerCase() === ADMIN_EMAIL,
    );

    if (!admin) {
      admin = {
        id: "admin-default",
        name: "Quản trị viên",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "admin",
        provider: "local",
        picture: "",
        createdAt: new Date().toISOString(),
      };

      users.push(admin);
    } else {
      // Tài khoản demo của đồ án.
      admin.name = admin.name || "Quản trị viên";
      admin.password = ADMIN_PASSWORD;
      admin.role = "admin";
      admin.provider = "local";
    }

    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      console.log("Đã khởi tạo tài khoản Admin demo.");
    } catch (error) {
      console.error("Không thể lưu tài khoản Admin:", error);
    }
  }

  setupAdmin();
})();
