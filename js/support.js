(() => {
  // Tránh tạo khung hỗ trợ nhiều lần
  if (document.getElementById("adidas-support")) return;

  // =========================
  // 1. GIAO DIỆN HỖ TRỢ
  // =========================
  const style = document.createElement("style");

  style.textContent = `
    #adidas-support {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 99999;
      font-family: Arial, sans-serif;
    }

    #adidas-support-toggle {
      width: 60px;
      height: 60px;
      border: none;
      border-radius: 50%;
      background: #111;
      color: #fff;
      font-size: 27px;
      cursor: pointer;
      box-shadow: 0 4px 15px #0003;
      transition: transform .2s;
    }

    #adidas-support-toggle:hover {
      transform: scale(1.06);
    }

    #adidas-support-panel {
      display: none;
      width: 340px;
      max-width: calc(100vw - 32px);
      height: 460px;
      max-height: calc(100vh - 110px);
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 25px #0003;
      margin-bottom: 12px;
    }

    #adidas-support-panel.open {
      display: flex;
      flex-direction: column;
    }

    .support-head {
      background: #111;
      color: #fff;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .support-head strong {
      font-size: 16px;
    }

    .support-head small {
      display: block;
      margin-top: 4px;
      color: #ddd;
    }

    .support-head button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 25px;
      cursor: pointer;
    }

    .support-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background: #f6f6f6;
    }

    .support-msg {
      background: #fff;
      border: 1px solid #eee;
      border-radius: 10px;
      padding: 11px;
      margin-bottom: 10px;
      font-size: 14px;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .support-msg p {
      margin: 8px 0;
    }

    .support-msg a {
      color: #075dcc;
      text-decoration: underline;
      overflow-wrap: anywhere;
    }

    .support-questions {
      padding: 9px 12px;
      display: grid;
      gap: 7px;
      border-top: 1px solid #eee;
      background: #fff;
    }

    .support-questions button {
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 9px 10px;
      text-align: left;
      font-size: 13px;
      cursor: pointer;
      transition: background .2s;
    }

    .support-questions button:hover {
      background: #f0f0f0;
    }

    .support-contact {
      padding: 10px;
      border-top: 1px solid #eee;
      font-size: 12px;
      text-align: center;
      background: #fff;
    }

    @media (max-width: 400px) {
      #adidas-support {
        right: 12px;
        bottom: 12px;
      }

      #adidas-support-panel {
        width: calc(100vw - 24px);
      }
    }
  `;

  document.head.appendChild(style);

  // =========================
  // 2. TẠO KHUNG HỖ TRỢ
  // =========================
  const root = document.createElement("div");
  root.id = "adidas-support";

  root.innerHTML = `
    <section
      id="adidas-support-panel"
      aria-label="Hỗ trợ khách hàng"
    >
      <div class="support-head">
        <div>
          <strong>Hỗ trợ khách hàng</strong>
          <small>Adidas Store</small>
        </div>
        <button
          id="support-close"
          type="button"
          aria-label="Đóng hỗ trợ"
        >×</button>
      </div>

      <div
        class="support-messages"
        id="support-messages"
        aria-live="polite"
      >
        <div class="support-msg">
          Xin chào! 👋<br>
          Chào mừng bạn đến với Adidas Store.
          Bạn cần hỗ trợ vấn đề gì? Hãy chọn một mục bên dưới nhé.
        </div>
      </div>

      <div class="support-questions">
        <button type="button" data-question="orders">
          📦 Tra cứu đơn hàng
        </button>

        <button type="button" data-question="checkout">
          🛒 Hướng dẫn đặt hàng
        </button>

        <button type="button" data-question="products">
          👟 Tư vấn sản phẩm
        </button>

        <button type="button" id="support-contact-btn">
          💬 Liên hệ nhân viên
        </button>
      </div>

      <div class="support-contact">
        Adidas Store · Hỗ trợ khách hàng
      </div>
    </section>

    <button
      id="adidas-support-toggle"
      type="button"
      aria-label="Mở hỗ trợ khách hàng"
      title="Hỗ trợ khách hàng"
    >💬</button>
  `;

  document.body.appendChild(root);

  const panel = root.querySelector("#adidas-support-panel");
  const toggle = root.querySelector("#adidas-support-toggle");
  const closeButton = root.querySelector("#support-close");
  const messages = root.querySelector("#support-messages");

  // =========================
  // 3. MỞ / ĐÓNG KHUNG HỖ TRỢ
  // =========================
  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  closeButton.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // Hàm thêm tin nhắn an toàn
  function addMessage(content, isHTML = false) {
    const message = document.createElement("div");
    message.className = "support-msg";

    if (isHTML) {
      message.innerHTML = content;
    } else {
      message.textContent = content;
    }

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  // =========================
  // 4. CÂU HỎI THƯỜNG GẶP
  // =========================
  const answers = {
    orders:
      "Bạn hãy đăng nhập tài khoản, sau đó vào mục Đơn hàng để xem thông tin đơn hàng của mình.",

    checkout:
      "Bạn hãy chọn sản phẩm, kích cỡ và số lượng, thêm vào giỏ hàng rồi mở giỏ hàng để tiến hành thanh toán.",

    products:
      "Bạn hãy xem thông tin mô tả, kích cỡ và giá sản phẩm trên trang chi tiết trước khi đặt hàng.",
  };

  root.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.question;
      const answer = answers[key];

      if (!answer) return;

      addMessage(button.textContent.trim());
      addMessage(answer);
    });
  });

  // =========================
  // 5. LIÊN HỆ NHÂN VIÊN
  // =========================
  root.querySelector("#support-contact-btn").addEventListener("click", () => {
    addMessage("💬 Liên hệ nhân viên");

    const contact = document.createElement("div");
    contact.className = "support-msg";

    const heading = document.createElement("strong");
    heading.textContent = "Thông tin liên hệ nhân viên";

    const intro = document.createElement("p");
    intro.textContent = "Bạn có thể liên hệ với chúng tôi qua các kênh sau:";

    const emailRow = document.createElement("p");
    emailRow.append("📧 Email: ");

    const emailLink = document.createElement("a");
    emailLink.href = "mailto:anhbin04122006@gmail.com";
    emailLink.textContent = "anhbin04122006@gmail.com";
    emailRow.appendChild(emailLink);

    const phoneRow = document.createElement("p");
    phoneRow.append("📞 Điện thoại: ");

    const phoneLink = document.createElement("a");
    phoneLink.href = "tel:0334956261";
    phoneLink.textContent = "0334956261";
    phoneRow.appendChild(phoneLink);

    const facebookRow = document.createElement("p");
    facebookRow.append("🔵 Facebook: ");

    const facebookLink = document.createElement("a");
    facebookLink.href = "https://www.facebook.com/Ngocanhxinktrai";
    facebookLink.textContent = "Nhắn tin qua Facebook";
    facebookLink.target = "_blank";
    facebookLink.rel = "noopener noreferrer";
    facebookRow.appendChild(facebookLink);

    contact.append(heading, intro, emailRow, phoneRow, facebookRow);

    messages.appendChild(contact);
    messages.scrollTop = messages.scrollHeight;
  });
})();
