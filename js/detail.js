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

            <div class="options">
                ${product.sizes.map(size => `
                    <button>${size}</button>
                `).join("")}
            </div>

            <h3>Màu sắc</h3>

            <div class="options">
                ${product.colors.map(color => `
                    <button>${color}</button>
                `).join("")}
            </div>

            <button class="btn">
                THÊM VÀO GIỎ HÀNG
            </button>

        </div>
    `;
}

getProduct();