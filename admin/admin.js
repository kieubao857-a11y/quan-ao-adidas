(function () {
  "use strict";

  const KEYS = {
    users: "adidasUsers",
    currentUser: "currentUser",
    orders: "orders",
    products: "adidasProducts",
    legacyProducts: "products",
    promotions: "adidasPromotions",
    messages: "adidasMessages",
    content: "adidasSiteContent",
    settings: "adidasStoreSettings",
  };
  const $ = (id) => document.getElementById(id);
  const PRIMARY_ADMIN_EMAIL = "admin@gmail.com";
  const isPrimaryAdmin = (u) =>
    String(u?.email || "")
      .trim()
      .toLowerCase() === PRIMARY_ADMIN_EMAIL;
  const DEFAULT_SETTINGS = {
    storeName: "Adidas Store",
    storeEmail: "support@adidas-store.local",
    storePhone: "",
    storeAddress: "",
    lowStockThreshold: 5,
  };
  const DEFAULT_CONTENT = {
    bannerTitle: "BỨT PHÁ MỌI GIỚI HẠN",
    bannerButton: "MUA NGAY",
    bannerDescription: "Khám phá bộ sưu tập Adidas mới nhất.",
    bannerImage: "",
  };
  let initialized = false;

  function read(key, fallback = []) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }
  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function money(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " VNĐ";
  }
  function getProducts() {
    let items = read(KEYS.products, null);
    if (Array.isArray(items) && items.length) return items;
    items = read(KEYS.legacyProducts, null);
    return Array.isArray(items) ? items : [];
  }
  function saveProducts(items) {
    save(KEYS.products, items);
    save(KEYS.legacyProducts, items);
  }
  function getOrders() {
    const items = read(KEYS.orders, []);
    return Array.isArray(items) ? items : [];
  }
  function saveOrders(items) {
    save(KEYS.orders, items);
  }
  function getUsers() {
    const items = read(KEYS.users, []);
    return Array.isArray(items) ? items : [];
  }
  function orderId(order) {
    return String(order.id ?? order.orderId ?? "");
  }
  function customerOf(order) {
    const c = order.customer || order.user || {};
    return {
      name:
        c.name ||
        c.fullName ||
        order.customerName ||
        order.name ||
        "Khách hàng",
      email: c.email || order.email || "",
      phone: c.phone || c.phoneNumber || order.phone || order.phoneNumber || "",
      address: c.address || order.address || order.shippingAddress || "",
    };
  }
  function orderTotal(order) {
    if (order.total != null) return Number(order.total) || 0;
    if (order.totalAmount != null) return Number(order.totalAmount) || 0;
    if (order.amount != null) return Number(order.amount) || 0;
    const items = order.products || order.items || order.cart || [];
    return Array.isArray(items)
      ? items.reduce(
          (sum, item) =>
            sum +
            Number(item.price || item.unitPrice || 0) *
              Number(item.quantity || item.qty || 1),
          0,
        )
      : 0;
  }
  function orderDate(order) {
    return order.createdAt || order.date || order.orderDate || "—";
  }
  // Checkout currently saves createdAt with toLocaleString("vi-VN") (dd/mm/yyyy HH:mm:ss).
  // Native Date parsing is inconsistent for that format, so parse it explicitly for reports.
  function parseOrderDate(value) {
    if (value instanceof Date)
      return Number.isNaN(value.getTime()) ? null : value;
    if (value == null || value === "" || value === "—") return null;
    if (typeof value === "number") {
      const numericDate = new Date(value);
      return Number.isNaN(numericDate.getTime()) ? null : numericDate;
    }
    const text = String(value).trim();
    const vi = text.match(
      /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
    );
    if (vi) {
      const [, day, month, year, hour = "0", minute = "0", second = "0"] = vi;
      const parsed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      );
      if (
        parsed.getFullYear() === Number(year) &&
        parsed.getMonth() === Number(month) - 1 &&
        parsed.getDate() === Number(day)
      )
        return parsed;
      return null;
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  function orderStatus(order) {
    return order.status || "Chờ xử lý";
  }
  function isProtectedOrder(order) {
    return ["processing", "shipping", "completed"].includes(
      statusKey(orderStatus(order)),
    );
  }
  function orderBelongsToUser(order, user) {
    const customer = customerOf(order);
    const email = String(user.email || "")
      .trim()
      .toLowerCase();
    const orderEmail = String(customer.email || "")
      .trim()
      .toLowerCase();
    const userId = String(user.id ?? user.userId ?? user._id ?? "");
    const orderUserId = String(
      order.userId ??
        order.customerId ??
        order.user?.id ??
        order.user?._id ??
        order.customer?.id ??
        order.customer?._id ??
        "",
    );
    return (
      (email && orderEmail && email === orderEmail) ||
      (userId && orderUserId && userId === orderUserId)
    );
  }
  function statusKey(status) {
    return (
      {
        "Chờ xử lý": "pending",
        pending: "pending",
        "Đã xác nhận": "processing",
        processing: "processing",
        "Đang giao": "shipping",
        shipping: "shipping",
        "Đã giao": "completed",
        "Đã giao hàng": "completed",
        completed: "completed",
        "Đã hủy": "cancelled",
        cancelled: "cancelled",
      }[status] || "pending"
    );
  }
  function setMessage(message) {
    const el = $("adminMessage");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(setMessage.timer);
    setMessage.timer = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }
  function showView(name) {
    document
      .querySelectorAll("[data-view]")
      .forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    const titles = {
      dashboard: "Tổng quan",
      products: "Quản lý sản phẩm",
      orders: "Quản lý đơn hàng",
      customers: "Quản lý khách hàng",
      inventory: "Kho hàng",
      promotions: "Khuyến mãi & mã giảm giá",
      messages: "Tin nhắn hỗ trợ",
      content: "Nội dung website",
      reports: "Báo cáo doanh thu",
      settings: "Cài đặt cửa hàng",
    };
    if ($("pageTitle")) $("pageTitle").textContent = titles[name] || "Quản trị";
    const renderers = {
      dashboard: renderDashboard,
      products: renderProducts,
      orders: renderOrders,
      customers: renderCustomers,
      inventory: renderInventory,
      promotions: renderPromotions,
      messages: renderMessages,
      content: loadContentForm,
      reports: renderReports,
      settings: loadSettingsForm,
    };
    renderers[name]?.();
  }
  function renderDashboard() {
    const products = getProducts(),
      orders = getOrders(),
      users = getUsers();
    const customers = users.filter((u) => u.role !== "admin");
    const pending = orders.filter((o) =>
      ["pending", "Chờ xử lý"].includes(o.status || "Chờ xử lý"),
    );
    const revenue = orders
      .filter((o) => !["Đã hủy", "cancelled"].includes(o.status))
      .reduce((sum, o) => sum + orderTotal(o), 0);
    const threshold = Number(
      read(KEYS.settings, DEFAULT_SETTINGS).lowStockThreshold ?? 5,
    );
    const lowStock = products.filter(
      (p) => Number(p.stock ?? p.quantity ?? 0) <= threshold,
    ).length;
    if ($("statProducts")) $("statProducts").textContent = products.length;
    if ($("statOrders")) $("statOrders").textContent = orders.length;
    if ($("statCustomers")) $("statCustomers").textContent = customers.length;
    if ($("statPending")) $("statPending").textContent = pending.length;
    if ($("statRevenue")) $("statRevenue").textContent = money(revenue);
    if ($("statLowStock")) $("statLowStock").textContent = lowStock;
    const body = $("recentOrdersBody");
    if (body)
      body.innerHTML =
        orders
          .slice()
          .sort(
            (a, b) =>
              (parseOrderDate(orderDate(b))?.getTime() || 0) -
              (parseOrderDate(orderDate(a))?.getTime() || 0),
          )
          .slice(0, 5)
          .map((o) => {
            const c = customerOf(o);
            return `<tr><td>${escapeHTML(orderId(o) || "—")}</td><td>${escapeHTML(c.name)}</td><td>${escapeHTML(orderDate(o))}</td><td>${money(orderTotal(o))}</td><td><span class="status-pill status-${statusKey(orderStatus(o))}">${escapeHTML(orderStatus(o))}</span></td></tr>`;
          })
          .join("") ||
        `<tr><td colspan="5" class="empty-state">Chưa có đơn hàng.</td></tr>`;
  }
  function renderProducts() {
    const body = $("productsBody");
    if (!body) return;
    const search = ($("productSearch")?.value || "").toLowerCase().trim();
    const products = getProducts().filter((p) =>
      `${p.name || p.title || ""} ${p.category || ""} ${p.id || p._id || ""}`
        .toLowerCase()
        .includes(search),
    );
    body.innerHTML =
      products
        .map((p) => {
          const id = p.id ?? p._id ?? "",
            img = p.image || p.imageUrl || p.thumbnail || "",
            stock = Number(p.stock ?? p.quantity ?? 0);
          return `<tr><td>${escapeHTML(id)}</td><td class="product-cell">${img ? `<img src="${escapeHTML(img)}" alt="" width="48" height="48" loading="lazy">` : ``}<span>${escapeHTML(p.name || p.title || "Chưa đặt tên")}</span></td><td>${money(p.salePrice > 0 ? p.salePrice : p.price)}</td><td>${escapeHTML(p.category || "—")}</td><td>${stock}</td><td><button type="button" class="button button-small" data-edit-product="${escapeHTML(id)}">Sửa</button> <button type="button" class="button button-small button-danger" data-delete-product="${escapeHTML(id)}">Xóa</button></td></tr>`;
        })
        .join("") ||
      `<tr><td colspan="6" class="empty-state">Không tìm thấy sản phẩm.</td></tr>`;
  }
  function resetProductForm() {
    $("productForm")?.reset();
    if ($("productId")) $("productId").value = "";
    if ($("productFormPanel")) $("productFormPanel").hidden = true;
    if ($("productFormTitle"))
      $("productFormTitle").textContent = "Thêm sản phẩm";
  }
  function showProductForm(p = null) {
    const panel = $("productFormPanel");
    if (panel) {
      panel.hidden = false;
      panel.style.display = "";
    }
    if ($("productFormTitle"))
      $("productFormTitle").textContent = p
        ? "Cập nhật sản phẩm"
        : "Thêm sản phẩm";
    const fields = {
      productId: p?.id ?? p?._id ?? "",
      productName: p?.name || p?.title || "",
      productPrice: p?.price ?? "",
      productCategory: p?.category || "",
      productGender: p?.gender || "",
      productImage: p?.image || p?.imageUrl || p?.thumbnail || "",
      productDescription: p?.description || "",
      productSalePrice: p?.salePrice ?? "",
      productStock: p?.stock ?? p?.quantity ?? 0,
      productSizes: Array.isArray(p?.sizes)
        ? p.sizes.join(", ")
        : p?.sizes || "",
      productColors: Array.isArray(p?.colors)
        ? p.colors.join(", ")
        : p?.colors || "",
    };
    Object.entries(fields).forEach(([id, val]) => {
      if ($(id)) $(id).value = val;
    });
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function saveProduct(event) {
    event.preventDefault();
    const id = $("productId")?.value.trim();
    const name = $("productName")?.value.trim() || "";
    const price = Number($("productPrice")?.value);
    const salePrice = Number($("productSalePrice")?.value || 0);
    const stock = Number($("productStock")?.value || 0);
    if (
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      (salePrice > 0 && salePrice > price)
    ) {
      alert("Vui lòng kiểm tra tên, giá, giá khuyến mãi và tồn kho.");
      return;
    }
    const product = {
      id: id || "product-" + Date.now(),
      name,
      price,
      category: $("productCategory")?.value || "",
      gender: $("productGender")?.value || "",
      image: $("productImage")?.value.trim() || "",
      description: $("productDescription")?.value.trim() || "",
      salePrice: salePrice || null,
      stock,
      sizes: ($("productSizes")?.value || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      colors: ($("productColors")?.value || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };
    const items = getProducts(),
      idx = items.findIndex((p) => String(p.id ?? p._id ?? "") === String(id));
    if (idx >= 0) items[idx] = { ...items[idx], ...product };
    else items.push(product);
    saveProducts(items);
    renderProducts();
    renderDashboard();
    renderInventory();
    resetProductForm();
    setMessage(idx >= 0 ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.");
  }
  function renderOrders() {
    const body = $("ordersBody");
    if (!body) return;
    const search = ($("orderSearch")?.value || "").toLowerCase().trim(),
      status = $("orderStatusFilter")?.value || "";
    const orders = getOrders().filter((o) => {
      const c = customerOf(o),
        items = o.products || o.items || o.cart || [];
      const productNames = Array.isArray(items)
        ? items.map((i) => i.name || i.title || i.productName || "").join(" ")
        : "";
      const text = [
        orderId(o),
        c.name,
        c.email,
        c.phone,
        c.address,
        productNames,
      ]
        .join(" ")
        .toLowerCase();
      return (
        text.includes(search) &&
        (!status || statusKey(orderStatus(o)) === status)
      );
    });
    body.innerHTML =
      orders
        .map((o) => {
          const c = customerOf(o),
            id = orderId(o),
            items = o.products || o.items || o.cart || [],
            itemText = Array.isArray(items)
              ? items
                  .map(
                    (i) =>
                      `${i.name || i.title || i.productName || "Sản phẩm"} × ${i.quantity || i.qty || 1}`,
                  )
                  .join(", ")
              : "",
            protectedOrder = isProtectedOrder(o);
          return `<tr><td>${escapeHTML(id || "—")}</td><td><strong>${escapeHTML(c.name)}</strong><br><small>${escapeHTML(c.email)}</small><br><small>${escapeHTML(c.phone)}</small><br><small>${escapeHTML(c.address)}</small><br><small>${escapeHTML(itemText)}</small></td><td>${escapeHTML(orderDate(o))}</td><td>${money(orderTotal(o))}</td><td><select data-order-status="${escapeHTML(id)}" data-current-status="${escapeHTML(statusKey(orderStatus(o)))}">${["Chờ xử lý", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"].map((v) => `<option value="${v}" ${orderStatus(o) === v ? "selected" : ""} ${v === "Đã hủy" && protectedOrder ? "disabled" : ""}>${v}${v === "Đã hủy" && protectedOrder ? " (không khả dụng)" : ""}</option>`).join("")}</select></td><td><button class="button button-small button-danger" type="button" data-delete-order="${escapeHTML(id)}" ${protectedOrder ? 'disabled title="Không thể xóa đơn hàng đã xác nhận, đang giao hoặc đã giao/hoàn thành"' : ""}>${protectedOrder ? "Không thể xóa" : "Xóa"}</button></td></tr>`;
        })
        .join("") ||
      `<tr><td colspan="6" class="empty-state">Chưa có đơn hàng phù hợp.</td></tr>`;
  }
  function memberBalance(u) {
    return Number(u.balance ?? u.walletBalance ?? u.wallet ?? 0) || 0;
  }
  function memberDeposit(u) {
    return (
      Number(
        u.totalDeposit ??
          u.totalDeposited ??
          u.totalTopup ??
          u.totalRecharge ??
          0,
      ) || 0
    );
  }
  function memberStatus(u) {
    return u.status === "locked" ||
      u.status === "blocked" ||
      u.isBlocked === true ||
      u.active === false ||
      u.status === "inactive"
      ? "locked"
      : "active";
  }
  function memberDate(u) {
    return (
      u.lastLogin ||
      u.lastSeen ||
      u.createdAt ||
      u.created_at ||
      u.registeredAt ||
      "—"
    );
  }
  function memberAvatar(u) {
    const name = String(
      u.name || u.fullName || u.username || u.email || "U",
    ).trim();
    return (
      name
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0])
        .join("")
        .toUpperCase() || "U"
    );
  }
  function renderCustomers() {
    const body = $("customersBody");
    if (!body) return;
    const q = ($("customerSearch")?.value || "").toLowerCase().trim(),
      status = $("customerStatusFilter")?.value || "",
      role = $("customerRoleFilter")?.value || "";
    const users = getUsers().filter((u) => {
      const text =
        `${u.name || u.fullName || ""} ${u.username || u.userName || u.account || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase();
      return (
        text.includes(q) &&
        (!status || memberStatus(u) === status) &&
        (!role || (u.role || "customer") === role)
      );
    });
    body.innerHTML =
      users
        .map((u) => {
          const email = String(u.email || ""),
            orders = getOrders().filter((o) => orderBelongsToUser(o, u)),
            hasOrders = orders.length > 0,
            spend = orders
              .filter((o) => !["Đã hủy", "cancelled"].includes(o.status))
              .reduce((sum, o) => sum + orderTotal(o), 0),
            statusKeyValue = memberStatus(u),
            username =
              u.username ||
              u.userName ||
              u.account ||
              email.split("@")[0] ||
              "—",
            stamp = memberDate(u),
            ip = u.lastIp || u.lastIP || u.ipAddress || u.ip || "",
            roleValue = u.role || "customer";
          return `<tr>
      <td><div class="member-user"><span class="member-avatar">${escapeHTML(memberAvatar(u))}</span><div><strong>${escapeHTML(u.name || u.fullName || "Chưa đặt tên")}</strong><small>${escapeHTML(email || "Chưa có email")}</small></div></div></td>
      <td><div class="member-account"><strong>${escapeHTML(username)}</strong><span>Số dư: <b>${money(memberBalance(u))}</b></span><span>Tổng đơn hàng đã mua: <b>${orders.length} đơn</b></span><small>Tổng chi tiêu: ${money(spend)}</small></div></td>
      <td><span class="status-pill ${roleValue === "admin" ? "status-processing" : "status-completed"}">${roleValue === "admin" ? "Quản trị viên" : escapeHTML(u.level || u.membershipLevel || "Thành viên")}</span></td>
      <td><span class="status-pill ${statusKeyValue === "active" ? "status-completed" : "status-cancelled"}">${statusKeyValue === "active" ? "Hoạt động" : "Bị khóa"}</span><small class="member-security">${u.emailVerified === true || u.verified === true ? "Đã xác minh email" : "Tài khoản"}${u.twoFactorEnabled ? " · 2FA" : ""}</small></td>
      <td><span>${escapeHTML(stamp)}</span>${ip ? `<small class="member-ip">${escapeHTML(ip)}</small>` : ""}</td>
      <td><details class="member-actions"><summary>Thao tác <span>▾</span></summary><div class="member-menu"><button type="button" data-member-detail="${escapeHTML(email)}">◉ &nbsp; Xem chi tiết</button><button type="button" data-member-balance="${escapeHTML(email)}">✎ &nbsp; Cộng/trừ tiền</button><button type="button" data-member-history="${escapeHTML(email)}">🛒 &nbsp; Lịch sử GD</button><button type="button" data-member-status="${escapeHTML(email)}" ${isPrimaryAdmin(u) || (statusKeyValue === "active" && hasOrders) ? 'disabled title="Tài khoản Admin chính được bảo vệ hoặc khách hàng đang có đơn hàng"' : ""}>${isPrimaryAdmin(u) ? "🛡 Admin chính (được bảo vệ)" : statusKeyValue === "active" ? (hasOrders ? "⊘  Không thể khóa (có đơn)" : "⊘  Khóa tài khoản") : "✓  Mở khóa tài khoản"}</button>${roleValue === "admin" ? `<button type="button" data-demote="${escapeHTML(email)}" ${isPrimaryAdmin(u) ? 'disabled title="Không thể hạ quyền Admin chính"' : ""}>${isPrimaryAdmin(u) ? "🛡 Admin chính (không thể hạ quyền)" : "↓ &nbsp; Hạ quyền Admin"}</button>` : `<button type="button" data-promote="${escapeHTML(email)}">↑ &nbsp; Cấp quyền Admin</button>`}${roleValue !== "admin" ? `<button type="button" class="danger-text" data-delete-member="${escapeHTML(email)}">🗑 &nbsp; Xóa khách hàng</button>` : ""}</div></details></td>
    </tr>`;
        })
        .join("") ||
      `<tr><td colspan="6" class="empty-state">Không tìm thấy thành viên phù hợp.</td></tr>`;
  }
  function memberByEmail(email) {
    return getUsers().find(
      (u) =>
        String(u.email || "").toLowerCase() ===
        String(email || "").toLowerCase(),
    );
  }
  function showMemberDetail(email) {
    const u = memberByEmail(email);
    if (!u) return;
    const orders = getOrders().filter(
      (o) => customerOf(o).email.toLowerCase() === String(email).toLowerCase(),
    );
    const lines = [
      `Tên: ${u.name || u.fullName || "Chưa đặt tên"}`,
      `Email: ${u.email || "—"}`,
      `Tên tài khoản: ${u.username || u.userName || u.account || "—"}`,
      `Số điện thoại: ${u.phone || "—"}`,
      `Vai trò: ${u.role || "customer"}`,
      `Cấp bậc: ${u.level || u.membershipLevel || "Thành viên"}`,
      `Trạng thái: ${memberStatus(u) === "active" ? "Hoạt động" : "Bị khóa"}`,
      `Số dư: ${money(memberBalance(u))}`,
      `Tổng đơn hàng đã mua: ${orders.length} đơn`,
      `Tổng chi tiêu: ${money(orders.filter((o) => !["Đã hủy", "cancelled"].includes(o.status)).reduce((sum, o) => sum + orderTotal(o), 0))}`,
      `Ngày tạo: ${u.createdAt || u.created_at || "—"}`,
      `Lần hoạt động: ${memberDate(u)}`,
      `IP: ${u.lastIp || u.lastIP || u.ipAddress || u.ip || "—"}`,
      `Số đơn hàng: ${orders.length}`,
    ];
    alert(lines.join("\n"));
  }
  function adjustMemberBalance(email) {
    const users = getUsers(),
      u = users.find(
        (x) =>
          String(x.email || "").toLowerCase() ===
          String(email || "").toLowerCase(),
      );
    if (!u) return;
    const amountText = prompt(
      `Số dư hiện tại: ${money(memberBalance(u))}\nNhập số tiền cần điều chỉnh (ví dụ 50000 hoặc -20000):`,
    );
    if (amountText === null) return;
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount === 0) {
      alert("Vui lòng nhập số tiền khác 0 hợp lệ.");
      return;
    }
    const next = memberBalance(u) + amount;
    if (next < 0) {
      alert("Số dư sau điều chỉnh không thể âm.");
      return;
    }
    u.balance = next;
    u.transactions = Array.isArray(u.transactions) ? u.transactions : [];
    u.transactions.unshift({
      type: amount > 0 ? "admin_credit" : "admin_debit",
      amount,
      createdAt: new Date().toISOString(),
      note: "Điều chỉnh bởi quản trị viên",
    });
    save(KEYS.users, users);
    renderCustomers();
    setMessage(
      `Đã ${amount > 0 ? "cộng" : "trừ"} ${money(Math.abs(amount))} cho ${email}.`,
    );
  }
  function showMemberHistory(email) {
    const u = memberByEmail(email);
    if (!u) return;
    const orders = getOrders().filter(
      (o) => customerOf(o).email.toLowerCase() === String(email).toLowerCase(),
    );
    const tx = Array.isArray(u.transactions) ? u.transactions : [];
    const lines = [
      `LỊCH SỬ GIAO DỊCH — ${email}`,
      "",
      ...orders.map(
        (o) =>
          `${orderDate(o)} | Đơn ${orderId(o) || "—"} | ${money(orderTotal(o))} | ${orderStatus(o)}`,
      ),
      ...tx.map(
        (t) =>
          `${t.createdAt || t.date || "—"} | ${t.type || "Giao dịch"} | ${Number(t.amount) >= 0 ? "+" : ""}${money(t.amount)} | ${t.note || ""}`,
      ),
    ];
    alert(
      lines.length > 2
        ? lines.join("\n")
        : "Chưa có lịch sử đơn hàng hoặc giao dịch cho thành viên này.",
    );
  }
  function toggleMemberStatus(email) {
    const users = getUsers(),
      u = users.find(
        (x) =>
          String(x.email || "").toLowerCase() ===
          String(email || "").toLowerCase(),
      );
    if (!u) return;
    if (isPrimaryAdmin(u)) {
      alert(
        "Không được phép khóa hoặc thay đổi trạng thái tài khoản Admin chính (admin@gmail.com).",
      );
      return;
    }
    const next = memberStatus(u) === "active" ? "locked" : "active";
    if (next === "locked") {
      const related = getOrders().filter((order) =>
        orderBelongsToUser(order, u),
      );
      if (related.length) {
        alert(
          `Không thể khóa tài khoản ${email} vì khách hàng đang có ${related.length} đơn hàng trong hệ thống. Hãy xử lý các đơn hàng trước khi khóa tài khoản.`,
        );
        return;
      }
    }
    if (
      !confirm(`${next === "locked" ? "Khóa" : "Mở khóa"} tài khoản ${email}?`)
    )
      return;
    u.status = next;
    u.active = next === "active";
    u.isBlocked = next === "locked";
    save(KEYS.users, users);
    renderCustomers();
    renderDashboard();
    setMessage(
      `Đã ${next === "locked" ? "khóa" : "mở khóa"} tài khoản ${email}.`,
    );
  }
  function deleteCustomer(email) {
    const users = getUsers(),
      user = users.find(
        (u) =>
          String(u.email || "").toLowerCase() ===
          String(email || "").toLowerCase(),
      );
    if (!user) return;
    if (user.role === "admin") {
      alert("Không thể xóa tài khoản quản trị viên tại mục khách hàng.");
      return;
    }
    const related = getOrders().filter((order) =>
      orderBelongsToUser(order, user),
    );
    if (related.length) {
      alert(
        `Không thể xóa khách hàng ${email} vì khách hàng đang có ${related.length} đơn hàng trong hệ thống. Hãy giữ lại tài khoản để bảo toàn lịch sử đơn hàng.`,
      );
      return;
    }
    if (
      !confirm(
        `Bạn có chắc muốn xóa khách hàng ${email}? Thao tác này không thể hoàn tác.`,
      )
    )
      return;
    save(
      KEYS.users,
      users.filter(
        (u) =>
          String(u.email || "").toLowerCase() !==
          String(email || "").toLowerCase(),
      ),
    );
    renderCustomers();
    renderDashboard();
    setMessage(`Đã xóa khách hàng ${email}.`);
  }
  function exportCustomers() {
    const rows = [
      [
        "Ten",
        "Email",
        "Ten tai khoan",
        "Vai tro",
        "Trang thai",
        "So du",
        "Tong don hang da mua",
        "Ngay tao",
        "Lan hoat dong",
        "IP",
      ],
      ...getUsers().map((u) => [
        u.name || u.fullName,
        u.email,
        u.username || u.userName || u.account,
        u.role || "customer",
        memberStatus(u),
        memberBalance(u),
        getOrders().filter((o) => orderBelongsToUser(o, u)).length,
        u.createdAt || u.created_at,
        memberDate(u),
        u.lastIp || u.lastIP || u.ipAddress || u.ip,
      ]),
    ];
    downloadFile(
      "adidas-khach-hang.csv",
      rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
    );
  }
  function changeRole(email, role) {
    const users = getUsers(),
      u = users.find(
        (x) =>
          String(x.email || "").toLowerCase() ===
          String(email || "").toLowerCase(),
      );
    if (!u) return;
    if (isPrimaryAdmin(u) && role !== "admin") {
      alert(
        "Không được phép hạ quyền tài khoản Admin chính (admin@gmail.com).",
      );
      return;
    }
    const current = window.SV3AdminAuth?.getCurrentUser?.();
    if (
      current &&
      String(current.email).toLowerCase() === String(email).toLowerCase() &&
      role !== u.role
    ) {
      alert("Không thể thay đổi quyền của tài khoản đang đăng nhập.");
      return;
    }
    const label = role === "admin" ? "cấp quyền Admin" : "hạ quyền quản trị";
    if (!confirm(`Bạn có chắc muốn ${label} cho ${email}?`)) return;
    u.role = role;
    save(KEYS.users, users);
    renderCustomers();
    renderDashboard();
    setMessage("Đã cập nhật vai trò tài khoản.");
  }
  function renderInventory() {
    const body = $("inventoryBody");
    if (!body) return;
    const q = ($("inventorySearch")?.value || "").toLowerCase().trim(),
      filter = $("inventoryFilter")?.value || "",
      threshold = Number(
        read(KEYS.settings, DEFAULT_SETTINGS).lowStockThreshold ?? 5,
      );
    const list = getProducts().filter((p) => {
      const stock = Number(p.stock ?? p.quantity ?? 0),
        match = `${p.name || p.title || ""} ${p.category || ""}`
          .toLowerCase()
          .includes(q);
      return (
        match &&
        (!filter ||
          (filter === "low" && stock > 0 && stock <= threshold) ||
          (filter === "out" && stock <= 0) ||
          (filter === "available" && stock > threshold))
      );
    });
    body.innerHTML =
      list
        .map((p) => {
          const id = p.id ?? p._id,
            stock = Number(p.stock ?? p.quantity ?? 0),
            label =
              stock <= 0
                ? "Hết hàng"
                : stock <= threshold
                  ? "Sắp hết"
                  : "Còn hàng",
            cls =
              stock <= 0
                ? "status-cancelled"
                : stock <= threshold
                  ? "status-pending"
                  : "status-completed";
          return `<tr><td>${escapeHTML(p.name || p.title || id)}</td><td>${escapeHTML(p.category || "—")}</td><td><strong>${stock}</strong></td><td><div class="stock-editor"><input type="number" min="0" value="${stock}" data-stock-input="${escapeHTML(id)}" aria-label="Tồn kho"/><button class="button button-small" data-save-stock="${escapeHTML(id)}">Lưu</button></div></td><td><span class="status-pill ${cls}">${label}</span></td></tr>`;
        })
        .join("") ||
      `<tr><td colspan="5" class="empty-state">Không có sản phẩm phù hợp.</td></tr>`;
  }
  function renderPromotions() {
    const body = $("promotionsBody");
    if (!body) return;
    const items = read(KEYS.promotions, []);
    body.innerHTML =
      items
        .map((p, i) => {
          const expired =
            p.expiry && new Date(p.expiry + "T23:59:59") < new Date();
          return `<tr><td><strong>${escapeHTML(p.code)}</strong></td><td>${p.type === "percent" ? `${p.value}%` : money(p.value)}</td><td>${money(p.minimum || 0)}</td><td>${escapeHTML(p.expiry || "Không giới hạn")}</td><td><span class="status-pill ${expired ? "status-cancelled" : "status-completed"}">${expired ? "Hết hạn" : p.active === false ? "Đã tắt" : "Đang hoạt động"}</span></td><td><button class="button button-small" data-toggle-promo="${i}">${p.active === false ? "Bật" : "Tắt"}</button> <button class="button button-small button-danger" data-delete-promo="${i}">Xóa</button></td></tr>`;
        })
        .join("") ||
      `<tr><td colspan="6" class="empty-state">Chưa có mã khuyến mãi.</td></tr>`;
  }
  function renderMessages() {
    const body = $("messagesBody");
    if (!body) return;
    const items = read(KEYS.messages, read("supportMessages", []));
    const q = ($("messageSearch")?.value || "").toLowerCase().trim(),
      f = $("messageFilter")?.value || "";
    body.innerHTML =
      items
        .map((m, i) => ({ ...m, _index: i }))
        .filter(
          (m) =>
            `${m.name || m.customerName || ""} ${m.email || ""} ${m.message || m.content || m.subject || ""}`
              .toLowerCase()
              .includes(q) &&
            (!f || (m.status || "new") === f),
        )
        .map(
          (m) =>
            `<tr><td><strong>${escapeHTML(m.name || m.customerName || "Khách hàng")}</strong><br><small>${escapeHTML(m.email || "")}</small></td><td class="message-content">${escapeHTML(m.message || m.content || m.subject || "Không có nội dung")}</td><td>${escapeHTML(m.createdAt || m.date || "—")}</td><td><select data-message-status="${m._index}"><option value="new" ${(m.status || "new") === "new" ? "selected" : ""}>Mới</option><option value="processing" ${m.status === "processing" ? "selected" : ""}>Đang xử lý</option><option value="resolved" ${m.status === "resolved" ? "selected" : ""}>Đã xử lý</option></select></td><td><button class="button button-small button-danger" data-delete-message="${m._index}">Xóa</button></td></tr>`,
        )
        .join("") ||
      `<tr><td colspan="5" class="empty-state">Chưa có tin nhắn. Khi website lưu tin nhắn vào localStorage, dữ liệu sẽ hiển thị tại đây.</td></tr>`;
  }
  function loadContentForm() {
    const c = { ...DEFAULT_CONTENT, ...read(KEYS.content, {}) };
    ["bannerTitle", "bannerButton", "bannerDescription", "bannerImage"].forEach(
      (id) => {
        if ($(id)) $(id).value = c[id] || "";
      },
    );
  }
  function loadSettingsForm() {
    const s = { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
    const map = {
      storeName: "storeName",
      storeEmail: "storeEmail",
      storePhone: "storePhone",
      storeAddress: "storeAddress",
      lowStockThreshold: "lowStockThreshold",
    };
    Object.entries(map).forEach(([id, key]) => {
      if ($(id)) $(id).value = s[key] ?? "";
    });
  }
  function renderReports() {
    const orders = getOrders(),
      valid = orders.filter((o) => !["Đã hủy", "cancelled"].includes(o.status)),
      revenue = valid.reduce((s, o) => s + orderTotal(o), 0),
      completed = orders.filter(
        (o) => statusKey(orderStatus(o)) === "completed",
      ).length,
      cancelled = orders.filter(
        (o) => statusKey(orderStatus(o)) === "cancelled",
      ).length;
    if ($("reportRevenue")) $("reportRevenue").textContent = money(revenue);
    if ($("reportCompleted")) $("reportCompleted").textContent = completed;
    if ($("reportAverage")) $("reportAverage").textContent = orders.length;
    if ($("reportCancelled"))
      $("reportCancelled").textContent =
        (orders.length ? Math.round((cancelled / orders.length) * 100) : 0) +
        "%";
    const chart = $("revenueChart");
    if (!chart) return;
    const months = [];
    const now = new Date();
    for (let n = 5; n >= 0; n--) {
      const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: `T${d.getMonth() + 1}`,
        value: 0,
      });
    }
    valid.forEach((o) => {
      const d = parseOrderDate(orderDate(o));
      if (d) {
        const m = months.find(
          (x) =>
            x.key ===
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        );
        if (m) m.value += orderTotal(o);
      }
    });
    const max = Math.max(1, ...months.map((m) => m.value));
    chart.innerHTML = months
      .map(
        (m) =>
          `<div class="chart-column"><strong>${money(m.value)}</strong><div class="chart-track"><span style="height:${Math.max(4, (m.value / max) * 100)}%"></span></div><small>${m.label}</small></div>`,
      )
      .join("");
  }
  function downloadFile(name, content, type = "text/csv;charset=utf-8;") {
    const blob = new Blob(["\ufeff", content], { type }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }
  function exportOrders() {
    const rows = [
      ["Ma don", "Khach hang", "Email", "Ngay dat", "Tong tien", "Trang thai"],
      ...getOrders().map((o) => {
        const c = customerOf(o);
        return [
          orderId(o),
          c.name,
          c.email,
          orderDate(o),
          orderTotal(o),
          orderStatus(o),
        ];
      }),
    ];
    downloadFile(
      "adidas-don-hang.csv",
      rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
    );
  }
  function exportInventory() {
    const rows = [
      ["ID", "Ten san pham", "Danh muc", "Gia", "Ton kho"],
      ...getProducts().map((p) => [
        p.id ?? p._id,
        p.name || p.title,
        p.category,
        p.price,
        p.stock ?? p.quantity ?? 0,
      ]),
    ];
    downloadFile(
      "adidas-kho-hang.csv",
      rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
    );
  }
  function backupData() {
    const keys = [
      ...Object.values(KEYS),
      "supportMessages",
      "adidas_cart",
      "adidas_cart_v1",
    ];
    const data = { exportedAt: new Date().toISOString(), data: {} };
    [...new Set(keys)].forEach((k) => {
      const v = localStorage.getItem(k);
      if (v !== null) data.data[k] = v;
    });
    downloadFile(
      "adidas-store-backup.json",
      JSON.stringify(data, null, 2),
      "application/json",
    );
  }
  async function restoreData(file) {
    try {
      const data = JSON.parse(await file.text());
      const entries = data.data || data;
      if (!entries || typeof entries !== "object")
        throw new Error("Định dạng không hợp lệ");
      if (
        !confirm(
          "Khôi phục dữ liệu sẽ ghi đè các khóa cùng tên. Bạn có muốn tiếp tục?",
        )
      )
        return;
      Object.entries(entries).forEach(([k, v]) => {
        if (typeof v === "string") {
          try {
            JSON.parse(v);
            localStorage.setItem(k, v);
          } catch {
            localStorage.setItem(k, JSON.stringify(v));
          }
        } else localStorage.setItem(k, JSON.stringify(v));
      });
      alert("Đã khôi phục dữ liệu. Trang sẽ tải lại.");
      location.reload();
    } catch (e) {
      alert("Không thể khôi phục file JSON: " + e.message);
    }
  }
  function init() {
    if (initialized) return;
    initialized = true;
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.addEventListener("click", () => showView(b.dataset.view)),
      );
    document
      .querySelectorAll("[data-go]")
      .forEach((b) =>
        b.addEventListener("click", () => showView(b.dataset.go)),
      );
    $("productSearch")?.addEventListener("input", renderProducts);
    $("orderSearch")?.addEventListener("input", renderOrders);
    $("orderStatusFilter")?.addEventListener("change", renderOrders);
    $("customerSearch")?.addEventListener("input", renderCustomers);
    $("customerStatusFilter")?.addEventListener("change", renderCustomers);
    $("customerRoleFilter")?.addEventListener("change", renderCustomers);
    $("exportCustomersButton")?.addEventListener("click", exportCustomers);
    $("inventorySearch")?.addEventListener("input", renderInventory);
    $("inventoryFilter")?.addEventListener("change", renderInventory);
    $("messageSearch")?.addEventListener("input", renderMessages);
    $("messageFilter")?.addEventListener("change", renderMessages);
    $("addProductButton")?.addEventListener("click", () => showProductForm());
    $("cancelProductButton")?.addEventListener("click", resetProductForm);
    $("productForm")?.addEventListener("submit", saveProduct);
    $("productsBody")?.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit-product]"),
        del = e.target.closest("[data-delete-product]");
      if (edit) {
        const p = getProducts().find(
          (x) => String(x.id ?? x._id) === edit.dataset.editProduct,
        );
        if (p) showProductForm(p);
      }
      if (del) {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        saveProducts(
          getProducts().filter(
            (p) => String(p.id ?? p._id) !== del.dataset.deleteProduct,
          ),
        );
        renderProducts();
        renderDashboard();
        renderInventory();
        setMessage("Đã xóa sản phẩm.");
      }
    });
    $("ordersBody")?.addEventListener("change", (e) => {
      const s = e.target.closest("[data-order-status]");
      if (!s) return;
      const orders = getOrders(),
        o = orders.find((x) => orderId(x) === s.dataset.orderStatus);
      if (!o) return;
      if (s.value === "Đã hủy" && isProtectedOrder(o)) {
        alert(
          "Không thể hủy đơn hàng đã xác nhận, đang giao hoặc đã giao/hoàn thành.",
        );
        renderOrders();
        return;
      }
      o.status = s.value;
      saveOrders(orders);
      renderOrders();
      renderDashboard();
      renderReports();
      setMessage("Đã cập nhật trạng thái đơn hàng.");
    });
    $("ordersBody")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-delete-order]");
      if (!b) return;
      const orders = getOrders(),
        order = orders.find((o) => orderId(o) === b.dataset.deleteOrder);
      if (!order) return;
      if (isProtectedOrder(order)) {
        alert(
          "Không thể xóa đơn hàng đã xác nhận, đang giao hoặc đã giao/hoàn thành.",
        );
        return;
      }
      if (!confirm("Xóa đơn hàng này khỏi dữ liệu trình duyệt?")) return;
      saveOrders(orders.filter((o) => orderId(o) !== b.dataset.deleteOrder));
      renderOrders();
      renderDashboard();
      renderReports();
      setMessage("Đã xóa đơn hàng.");
    });
    $("customersBody")?.addEventListener("click", (e) => {
      const detail = e.target.closest("[data-member-detail]"),
        balance = e.target.closest("[data-member-balance]"),
        history = e.target.closest("[data-member-history]"),
        status = e.target.closest("[data-member-status]"),
        promote = e.target.closest("[data-promote]"),
        demote = e.target.closest("[data-demote]"),
        del = e.target.closest("[data-delete-member]");
      if (detail) showMemberDetail(detail.dataset.memberDetail);
      if (balance) adjustMemberBalance(balance.dataset.memberBalance);
      if (history) showMemberHistory(history.dataset.memberHistory);
      if (status) toggleMemberStatus(status.dataset.memberStatus);
      if (promote) changeRole(promote.dataset.promote, "admin");
      if (demote) changeRole(demote.dataset.demote, "customer");
      if (del) deleteCustomer(del.dataset.deleteMember);
    });
    $("inventoryBody")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-save-stock]");
      if (!b) return;
      const input = document.querySelector(
          `[data-stock-input="${CSS.escape(b.dataset.saveStock)}"]`,
        ),
        stock = Number(input?.value);
      if (!Number.isInteger(stock) || stock < 0) {
        alert("Tồn kho phải là số nguyên không âm.");
        return;
      }
      const products = getProducts(),
        p = products.find((x) => String(x.id ?? x._id) === b.dataset.saveStock);
      if (!p) return;
      p.stock = stock;
      saveProducts(products);
      renderInventory();
      renderDashboard();
      renderProducts();
      setMessage("Đã cập nhật tồn kho.");
    });
    $("exportInventoryButton")?.addEventListener("click", exportInventory);
    $("exportOrdersButton")?.addEventListener("click", exportOrders);
    $("promotionForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = $("promoCode").value.trim().toUpperCase(),
        type = $("promoType").value,
        value = Number($("promoValue").value),
        minimum = Number($("promoMinimum").value || 0),
        expiry = $("promoExpiry").value;
      if (!code || value <= 0 || minimum < 0) {
        alert("Vui lòng nhập thông tin mã hợp lệ.");
        return;
      }
      const list = read(KEYS.promotions, []);
      if (list.some((p) => p.code.toUpperCase() === code)) {
        alert("Mã khuyến mãi đã tồn tại.");
        return;
      }
      list.push({
        code,
        type,
        value,
        minimum,
        expiry,
        active: true,
        createdAt: new Date().toISOString(),
      });
      save(KEYS.promotions, list);
      $("promotionForm").reset();
      renderPromotions();
      setMessage("Đã tạo mã khuyến mãi.");
    });
    $("promotionsBody")?.addEventListener("click", (e) => {
      const t = e.target.closest("[data-toggle-promo]"),
        d = e.target.closest("[data-delete-promo]");
      const list = read(KEYS.promotions, []);
      if (t) {
        const i = Number(t.dataset.togglePromo);
        list[i].active = list[i].active === false;
        save(KEYS.promotions, list);
        renderPromotions();
      }
      if (d) {
        if (!confirm("Xóa mã khuyến mãi này?")) return;
        list.splice(Number(d.dataset.deletePromo), 1);
        save(KEYS.promotions, list);
        renderPromotions();
      }
    });
    $("messagesBody")?.addEventListener("change", (e) => {
      const s = e.target.closest("[data-message-status]");
      if (!s) return;
      const key =
          localStorage.getItem(KEYS.messages) !== null
            ? KEYS.messages
            : "supportMessages",
        list = read(key, []);
      if (list[Number(s.dataset.messageStatus)])
        list[Number(s.dataset.messageStatus)].status = s.value;
      save(key, list);
      renderMessages();
      setMessage("Đã cập nhật trạng thái tin nhắn.");
    });
    $("messagesBody")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-delete-message]");
      if (!b) return;
      if (!confirm("Xóa tin nhắn này?")) return;
      const key =
          localStorage.getItem(KEYS.messages) !== null
            ? KEYS.messages
            : "supportMessages",
        list = read(key, []);
      list.splice(Number(b.dataset.deleteMessage), 1);
      save(key, list);
      renderMessages();
    });
    $("contentForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const c = {
        bannerTitle: $("bannerTitle").value.trim(),
        bannerButton: $("bannerButton").value.trim(),
        bannerDescription: $("bannerDescription").value.trim(),
        bannerImage: $("bannerImage").value.trim(),
      };
      save(KEYS.content, c);
      setMessage("Đã lưu nội dung website.");
    });
    $("resetContentButton")?.addEventListener("click", () => {
      save(KEYS.content, DEFAULT_CONTENT);
      loadContentForm();
      setMessage("Đã khôi phục nội dung mặc định.");
    });
    $("settingsForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const s = {
        storeName: $("storeName").value.trim(),
        storeEmail: $("storeEmail").value.trim(),
        storePhone: $("storePhone").value.trim(),
        storeAddress: $("storeAddress").value.trim(),
        lowStockThreshold: Number($("lowStockThreshold").value || 5),
      };
      save(KEYS.settings, s);
      renderDashboard();
      renderInventory();
      setMessage("Đã lưu cài đặt cửa hàng.");
    });
    $("backupDataButton")?.addEventListener("click", backupData);
    $("restoreDataInput")?.addEventListener("change", (e) => {
      if (e.target.files?.[0]) restoreData(e.target.files[0]);
      e.target.value = "";
    });
    $("clearDemoDataButton")?.addEventListener("click", () => {
      if (
        !confirm(
          "Thao tác này xóa sản phẩm, đơn hàng, khuyến mãi, tin nhắn và cài đặt đã lưu trên trình duyệt. Bạn có chắc không?",
        )
      )
        return;
      [
        KEYS.products,
        KEYS.legacyProducts,
        KEYS.orders,
        KEYS.promotions,
        KEYS.messages,
        "supportMessages",
        KEYS.content,
        KEYS.settings,
      ].forEach((k) => localStorage.removeItem(k));
      setMessage("Đã xóa dữ liệu quản lý trên trình duyệt.");
      renderDashboard();
      renderProducts();
      renderOrders();
      renderInventory();
      renderPromotions();
      renderMessages();
      renderReports();
    });
    renderDashboard();
    renderProducts();
    renderOrders();
    renderCustomers();
    renderInventory();
    renderPromotions();
    renderMessages();
    loadContentForm();
    loadSettingsForm();
    renderReports();
    if (!getProducts().length) {
      fetch("../data/products.json")
        .then((r) => {
          if (!r.ok) throw new Error("Không tải được products.json");
          return r.json();
        })
        .then((data) => {
          const initial = Array.isArray(data)
            ? data
            : Array.isArray(data.products)
              ? data.products
              : [];
          if (initial.length && !getProducts().length) {
            saveProducts(initial);
            renderDashboard();
            renderProducts();
            renderInventory();
            setMessage(
              "Đã nạp " + initial.length + " sản phẩm mẫu từ products.json.",
            );
          }
        })
        .catch((err) => console.warn("Không thể nạp sản phẩm mẫu:", err));
    }
    window.addEventListener("storage", (e) => {
      if (
        [KEYS.products, KEYS.legacyProducts, KEYS.orders, KEYS.users].includes(
          e.key,
        )
      ) {
        renderDashboard();
        renderProducts();
        renderOrders();
        renderCustomers();
        renderInventory();
        renderReports();
      }
    });
    console.log("Adidas Store Admin initialized");
  }
  // defer scripts can execute after DOMContentLoaded; initialize independently of event order.
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  document.addEventListener("sv3-admin-ready", init, { once: true });
})();
