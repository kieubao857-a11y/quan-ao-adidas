const params = new URLSearchParams(window.location.search);

const id = Number(params.get("id"));

async function getProduct() {

    const response = await fetch("./data/products.json");

    const products = await response.json();

    const product = products.find(item => item.id === id);

    if (!product) {
        document.getElementById("productDetail").innerHTML = `
            <h2>Không tìm thấy sản phẩm</h2>
        `;
        return;
    }

    document.getElementById("productDetail").innerHTML = `

        <div class="detail-image">
            <img
                src="${product.image}"
                alt="${product.name}"
            >
        </div>

        <div class="detail-info">

            <h1>
                ${product.name}
            </h1>

            <p class="product-price">
                ${product.price.toLocaleString("vi-VN")} VNĐ
            </p>

            <p>
                ${product.description}
            </p>

            <h3>Size</h3>

            <div class="options" id="sizeOptions">
                ${product.sizes.map(size => `
                    <button type="button" class="size-btn">
                        ${size}
                    </button>
                `).join("")}
            </div>

            <h3>Màu sắc</h3>

            <div class="options" id="colorOptions">
                ${product.colors.map(color => `
                    <button type="button" class="color-btn">
                        ${color}
                    </button>
                `).join("")}
            </div>

            <button class="btn" id="buyButton">
                THÊM VÀO GIỎ HÀNG
            </button>

        </div>
    `;

    // =========================
    // CHỌN SIZE
    // =========================

    let selectedSize = "";

    const sizeButtons = document.querySelectorAll(".size-btn");

    sizeButtons.forEach(button => {

        button.addEventListener("click", function () {

            sizeButtons.forEach(btn => {
                btn.classList.remove("selected");
            });

            this.classList.add("selected");

            selectedSize = this.textContent.trim();

        });

    });


    // =========================
    // CHỌN MÀU
    // =========================

    let selectedColor = "";

    const colorButtons = document.querySelectorAll(".color-btn");

    colorButtons.forEach(button => {

        button.addEventListener("click", function () {

            colorButtons.forEach(btn => {
                btn.classList.remove("selected");
            });

            this.classList.add("selected");

            selectedColor = this.textContent.trim();

        });

    });


    // =========================
    // THÊM VÀO GIỎ HÀNG
    // =========================

    document.getElementById("buyButton").addEventListener("click", function () {

    // Kiểm tra đã chọn size chưa
    if (selectedSize === "") {
        alert("Vui lòng chọn size!");
        return;
    }

    // Kiểm tra đã chọn màu chưa
    if (selectedColor === "") {
        alert("Vui lòng chọn màu sắc!");
        return;
    }

    // Tạo sản phẩm để thêm vào giỏ
   const cartItem = {
    id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    size: selectedSize,
    color: selectedColor,
    quantity: 1
};

// Lấy giỏ hàng cũ từ LocalStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Thêm sản phẩm vào giỏ hàng
cart.push(cartItem);

// Lưu giỏ hàng vào LocalStorage
localStorage.setItem("cart", JSON.stringify(cart));

alert("Đã thêm sản phẩm vào giỏ hàng!");

});

}

getProduct();