async function loadSportProducts() {

    const response = await fetch(
        "./data/products.json"
    );

    const products = await response.json();

    const productList =
        document.getElementById("productList");


    // Lọc sản phẩm thể thao
    const sportProducts = products.filter(
        function (product) {

            return product.gender === "Thể thao";

        }
    );


    // Không có sản phẩm
    if (sportProducts.length === 0) {

        productList.innerHTML = `
            <h2>
                Chưa có sản phẩm thể thao
            </h2>
        `;

        return;
    }


    // Hiển thị sản phẩm
    sportProducts.forEach(function (product) {

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

loadSportProducts();