async function loadNamProducts() {

    const response = await fetch(
        "./data/products.json"
    );

    const products = await response.json();

    const productList =
        document.getElementById("productList");

    // Sản phẩm dành cho nam
    const namProducts = products.filter(
        function (product) {
            return product.gender === "Nam";
        }
    );


    if (namProducts.length === 0) {

        productList.innerHTML = `
            <h2>
                Chưa có sản phẩm Nam
            </h2>
        `;

        return;
    }


    namProducts.forEach(function (product) {

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

loadNamProducts();