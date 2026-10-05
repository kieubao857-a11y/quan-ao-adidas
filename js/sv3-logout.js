document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Tìm khu vực tài khoản trên header
  const accountArea =
    document.querySelector("#sv3Account") ||
    document.querySelector(".account") ||
    document.querySelector("[data-account]");

  if (!accountArea) return;

  // Nếu chưa đăng nhập
  if (!currentUser) {
    accountArea.innerHTML = `
            <a href="./login.html" class="sv3-login-link">
                Đăng nhập
            </a>
        `;
    return;
  }

  // Nếu đã đăng nhập
  const avatar = currentUser.picture
    ? currentUser.picture
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        currentUser.name || currentUser.email || "User",
      )}&background=111&color=fff`;

  accountArea.innerHTML = `
        <div class="sv3-user-box">
            <img 
                src="${avatar}" 
                class="sv3-avatar"
                alt="Avatar"
            >

            <span class="sv3-user-name">
                ${currentUser.name || currentUser.email}
            </span>

            <button type="button" id="sv3LogoutBtn" class="sv3-logout-btn">
                Đăng xuất
            </button>
        </div>
    `;

  document.querySelector("#sv3LogoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("currentUser");

    // Nếu có thông tin đăng nhập Google
    if (window.google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }

    window.location.href = "./login.html";
  });
});
