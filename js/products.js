let products = [];

const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sortPrice = document.getElementById("sortPrice");


// =====================================
// TẢI SẢN PHẨM
// =====================================

async function loadProducts() {

    try {

        const response = await fetch("./data/products.json");

        if (!response.ok) {
            throw new Error("Không tải được products.json");
        }

        products = await response.json();

        renderProducts(products);

    } catch (error) {

        console.error(error);

        productList.innerHTML = `
            <div class="error-message">
                <h3>Lỗi tải sản phẩm</h3>
                <p>Không thể tải danh sách sản phẩm.</p>
            </div>
        `;

    }

}


// =====================================
// HIỂN THỊ SẢN PHẨM
// =====================================

function renderProducts(list) {

    productList.innerHTML = "";

    if (list.length === 0) {

        productList.innerHTML = `
            <div class="empty-message">
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Hãy thử tìm kiếm với từ khóa khác.</p>
            </div>
        `;

        return;
    }


    list.forEach(function (product) {

        productList.innerHTML += `

            <div class="product-card">

                <a
                    href="detail.html?id=${product.id}"
                    class="product-image"
                >

                    <img
                        src="${product.image}"
                        alt="${product.name}"
                    >

                </a>


                <div class="product-info">

                    <div class="product-category">
                        ${product.category}
                    </div>


                    <h3 class="product-name">
                        ${product.name}
                    </h3>


                    <p class="product-price">
                        ${Number(product.price).toLocaleString("vi-VN")} VNĐ
                    </p>


                    <a
                        href="detail.html?id=${product.id}"
                        class="product-button"
                    >
                        XEM CHI TIẾT
                    </a>

                </div>

            </div>

        `;

    });

}


// =====================================
// LỌC + TÌM KIẾM + GIÁ
// =====================================

function applyFilters() {

    // Lấy từ khóa tìm kiếm

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    // Lấy danh mục

    const category =
        categoryFilter.value;


    // Lấy giá từ

    const min =
        minPrice.value === ""
            ? 0
            : Number(minPrice.value);


    // Lấy giá đến

    const max =
        maxPrice.value === ""
            ? Infinity
            : Number(maxPrice.value);


    // Lọc sản phẩm

    let result = products.filter(function (product) {

        const productName =
            String(product.name || "")
                .toLowerCase();


        const productCategory =
            String(product.category || "");


        const productPrice =
            Number(product.price);


        // Tìm kiếm tên sản phẩm

        const matchSearch =
            productName.includes(keyword);


        // Lọc danh mục

        const matchCategory =
            category === "all" ||
            productCategory === category;


        // Lọc giá

        const matchMinPrice =
            productPrice >= min;


        const matchMaxPrice =
            productPrice <= max;


        return (
            matchSearch &&
            matchCategory &&
            matchMinPrice &&
            matchMaxPrice
        );

    });


    // =====================================
    // SẮP XẾP GIÁ
    // =====================================

    if (sortPrice.value === "asc") {

        result.sort(function (a, b) {

            return Number(a.price) - Number(b.price);

        });

    }


    if (sortPrice.value === "desc") {

        result.sort(function (a, b) {

            return Number(b.price) - Number(a.price);

        });

    }


    // Hiển thị

    renderProducts(result);

}


// =====================================
// TÌM KIẾM
// =====================================

searchInput.addEventListener(
    "input",
    applyFilters
);


// =====================================
// DANH MỤC
// =====================================

categoryFilter.addEventListener(
    "change",
    applyFilters
);


// =====================================
// GIÁ TỪ
// =====================================

minPrice.addEventListener(
    "input",
    applyFilters
);


// =====================================
// GIÁ ĐẾN
// =====================================

maxPrice.addEventListener(
    "input",
    applyFilters
);


// =====================================
// SẮP XẾP
// =====================================

sortPrice.addEventListener(
    "change",
    applyFilters
);


// =====================================
// CHẠY
// =====================================

loadProducts();