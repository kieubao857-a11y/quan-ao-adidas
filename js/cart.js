// Lấy giỏ hàng từ LocalStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartList = document.getElementById("cartList");

// Hàm hiển thị giỏ hàng
function renderCart() {
  cartList.innerHTML = "";

  // Kiểm tra giỏ hàng trống
  if (cart.length === 0) {
    cartList.innerHTML = `
            <h2>Giỏ hàng đang trống</h2>

            <a href="product.html">
                Tiếp tục mua hàng
            </a>
        `;

    return;
  }

  // Hiển thị từng sản phẩm
  cart.forEach((item, index) => {
    cartList.innerHTML += `

            <div class="cart-item">

                <div class="cart-image">

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                        width="150"
                    >

                </div>


                <div class="cart-info">

                    <h2>
                        ${item.name}
                    </h2>

                    <p>
                        Size: ${item.size}
                    </p>

                    <p>
                        Màu: ${item.color}
                    </p>


                    <!-- TĂNG GIẢM SỐ LƯỢNG -->

                    <div class="quantity">

                        <button
                            onclick="decreaseQuantity(${index})"
                        >
                            -
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            onclick="increaseQuantity(${index})"
                        >
                            +
                        </button>

                    </div>


                    <p>
                        Giá:
                        ${item.price.toLocaleString("vi-VN")} VNĐ
                    </p>
<button onclick="removeItem(${index})">
    Xóa
</button>
                </div>

            </div>

        `;
  });
  // Tính tổng tiền
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;
  });

  // Hiển thị tổng tiền
  cartList.innerHTML += `
    <div class="cart-total">
        <h2>
            Tổng tiền:
            ${total.toLocaleString("vi-VN")} VNĐ
        </h2>

    <a href="checkout.html">
    <button type="button">
        TIẾN HÀNH THANH TOÁN
    </button>
</a>
    </div>
`;
}

// Tăng số lượng
function increaseQuantity(index) {
  cart[index].quantity++;

  localStorage.setItem("cart", JSON.stringify(cart));

  renderCart();
}

// Giảm số lượng
function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  renderCart();
}

// Xóa sản phẩm khỏi giỏ hàng
function removeItem(index) {
  cart.splice(index, 1);

  localStorage.setItem("cart", JSON.stringify(cart));

  renderCart();
}

// Hiển thị giỏ hàng lần đầu
renderCart();
