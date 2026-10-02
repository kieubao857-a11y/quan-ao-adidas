async function loadSaleProducts() {

    const response = await fetch(
        "./data/products.json"
    );

    const products = await response.json();

    const productList =
        document.getElementById("productList");


    // Lọc sản phẩm Sale
    const saleProducts = products.filter(
        function (product) {

            return product.sale === true;

        }
    );


    // Không có sản phẩm Sale
    if (saleProducts.length === 0) {

        productList.innerHTML = `
            <h2>
                Hiện chưa có sản phẩm Sale
            </h2>
        `;

        return;
    }


    // Hiển thị sản phẩm
    saleProducts.forEach(function (product) {

        productList.innerHTML += `

            <div class="product-card">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <h3>
                    ${product.name}
                </h3>

                <div class="sale-price">

    <span class="old-price">
        ${product.oldPrice.toLocaleString("vi-VN")} VNĐ
    </span>

    <span class="new-price">
        ${product.price.toLocaleString("vi-VN")} VNĐ
    </span>

</div>

                <p class="sale-text">
                    ĐANG SALE
                </p>

                <a
                    href="detail.html?id=${product.id}"
                    class="btn"
                >
                    Xem sản phẩm
                </a>

            </div>

        `;

    });

}

loadSaleProducts();