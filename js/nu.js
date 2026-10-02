async function loadNuProducts() {

    const response = await fetch(
        "./data/products.json"
    );

    const products = await response.json();

    const productList =
        document.getElementById("productList");


    // Lọc sản phẩm Nữ
    const nuProducts = products.filter(
        function (product) {

            return product.gender === "Nữ";

        }
    );


    // Không có sản phẩm
    if (nuProducts.length === 0) {

        productList.innerHTML = `
            <h2>
                Chưa có sản phẩm Nữ
            </h2>
        `;

        return;
    }


    // Hiển thị sản phẩm
    nuProducts.forEach(function (product) {

        productList.innerHTML += `

            <div class="product-card">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <h3>
                    ${product.name}
                </h3>

                <p>
                    ${product.price.toLocaleString("vi-VN")}
                    VNĐ
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

loadNuProducts();