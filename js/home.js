// ====================================
// FORMAT GIÁ
// ====================================

function formatPrice(price) {
    return price.toLocaleString("vi-VN") + " ₫";
}


// ====================================
// TẠO CARD SẢN PHẨM
// ====================================

function createProductCard(product) {

    return `
        <div class="product">

            <a href="detail.html?id=${product.id}">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    onerror="this.src='https://placehold.co/600x600?text=No+Image'"
                >
            </a>

            <div class="product-info">

                <p class="product-category">
                    ${product.category}
                </p>

                <h3 class="product-name">
                    ${product.name}
                </h3>

                <p class="product-price">
                    ${formatPrice(product.price)}
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
}


// ====================================
// LẤY DỮ LIỆU TỪ JSON
// ====================================

async function loadProducts() {

    try {

        const response =
            await fetch("./data/products.json");

        if (!response.ok) {
            throw new Error("Không tìm thấy products.json");
        }

        const products =
            await response.json();


        // ====================================
        // HIỂN THỊ SẢN PHẨM NỔI BẬT
        // ====================================

        const featuredProducts =
            document.getElementById("featuredProducts");

        if (featuredProducts) {

            const featured =
                products.slice(0, 6);

            featuredProducts.innerHTML =
                featured
                    .map(product => createProductCard(product))
                    .join("");
        }


    } catch (error) {

        console.error(error);

        const featuredProducts =
            document.getElementById("featuredProducts");

        if (featuredProducts) {

            featuredProducts.innerHTML = `
                <p>
                    Không thể tải sản phẩm.
                </p>
            `;
        }
    }
}


// ====================================
// TÌM KIẾM TỪ TRANG CHỦ
// ====================================

const searchButton =
    document.getElementById("homeSearchBtn");

const searchInput =
    document.getElementById("homeSearch");


if (searchButton && searchInput) {

    searchButton.addEventListener("click", function () {

        const keyword =
            searchInput.value.trim();

        if (keyword === "") {

            window.location.href =
                "product.html";

            return;
        }

        window.location.href =
            "product.html?search=" +
            encodeURIComponent(keyword);
    });


    // ====================================
    // NHẤN ENTER ĐỂ TÌM KIẾM
    // ====================================

    searchInput.addEventListener(
        "keypress",
        function (event) {

            if (event.key === "Enter") {

                searchButton.click();

            }

        }
    );
}


// ====================================
// CHẠY
// ====================================

loadProducts();