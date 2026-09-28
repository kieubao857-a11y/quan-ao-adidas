// ==========================================
// HIỂN THỊ VÀ LỌC DANH SÁCH SẢN PHẨM
// ==========================================

// Lấy các phần tử HTML
const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");

// Mảng chứa toàn bộ sản phẩm
let products = [];


// ==========================================
// FORMAT GIÁ TIỀN
// ==========================================

function formatPrice(price) {
    return Number(price).toLocaleString("vi-VN") + " VNĐ";
}


// ==========================================
// HIỂN THỊ SẢN PHẨM
// ==========================================

function renderProducts(list) {

    if (!productList) {
        return;
    }

    // Xóa danh sách cũ
    productList.innerHTML = "";

    // Nếu không có sản phẩm
    if (list.length === 0) {

        productList.innerHTML = `
            <div class="empty-message">
                <h3>Không tìm thấy sản phẩm</h3>
                <p>
                    Hãy thử từ khóa, danh mục hoặc khoảng giá khác.
                </p>
            </div>
        `;

        return;
    }


    // Tạo Fragment để render nhanh hơn
    const fragment = document.createDocumentFragment();


    // Duyệt từng sản phẩm
    list.forEach(product => {

        const card = document.createElement("article");

        card.className = "product-card";


        card.innerHTML = `

            <!-- Hình ảnh sản phẩm -->
            <a
                class="product-image"
                href="detail.html?id=${encodeURIComponent(product.id)}"
            >

                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.src='https://via.placeholder.com/500x500?text=Adidas';
                    "
                >

            </a>


            <!-- Thông tin sản phẩm -->
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
                    class="product-button"
                    href="detail.html?id=${encodeURIComponent(product.id)}"
                >
                    Xem chi tiết
                </a>

            </div>
        `;


        fragment.appendChild(card);

    });


    // Đưa tất cả sản phẩm lên trang
    productList.appendChild(fragment);
}


// ==========================================
// TÌM KIẾM + LỌC SẢN PHẨM
// ==========================================

function filterProducts() {

    // Từ khóa tìm kiếm
    const keyword =
        (searchInput?.value || "")
        .trim()
        .toLowerCase();


    // Danh mục
    const category =
        categoryFilter?.value || "all";


    // Giá thấp nhất
    const minText =
        (minPrice?.value || "").trim();


    // Giá cao nhất
    const maxText =
        (maxPrice?.value || "").trim();


    // Nếu bỏ trống giá thì dùng giá mặc định
    const min =
        minText === ""
            ? 0
            : Number(minText);


    const max =
        maxText === ""
            ? Infinity
            : Number(maxText);


    // Kiểm tra giá nhập vào
    if (
        !Number.isFinite(min) ||
        min < 0 ||
        (!Number.isFinite(max) && max !== Infinity) ||
        max < 0 ||
        min > max
    ) {

        renderProducts([]);

        return;
    }


    // Lọc sản phẩm
    const result = products.filter(product => {

        const name =
            String(product.name || "")
            .toLowerCase();


        const price =
            Number(product.price);


        const matchName =
            name.includes(keyword);


        const matchCategory =
            category === "all" ||
            product.category === category;


        const matchPrice =
            price >= min &&
            price <= max;


        return (
            matchName &&
            matchCategory &&
            matchPrice
        );

    });


    // Hiển thị kết quả
    renderProducts(result);
}


// ==========================================
// ĐỌC FILE products.json
// ==========================================

async function getProducts() {

    if (!productList) {
        return;
    }


    // Hiển thị loading
    productList.innerHTML = `
        <div class="loading-message">
            Đang tải sản phẩm...
        </div>
    `;


    try {

        // Đọc file JSON
        const response = await fetch(
            "./data/products.json",
            {
                cache: "no-store"
            }
        );


        // Kiểm tra lỗi HTTP
        if (!response.ok) {

            throw new Error(
                `Không thể tải products.json (HTTP ${response.status}).`
            );

        }


        // Chuyển JSON thành JavaScript
        const data =
            await response.json();


        // Kiểm tra JSON có phải mảng hay không
        if (!Array.isArray(data)) {

            throw new Error(
                "products.json phải chứa một mảng sản phẩm."
            );

        }


        // Lưu sản phẩm
        products = data;


        // Hiển thị sản phẩm
        renderProducts(products);

    }


    catch (error) {

        console.error(
            "Lỗi tải sản phẩm:",
            error
        );


        productList.innerHTML = `

            <div class="error-message">

                <h3>
                    Không thể tải sản phẩm
                </h3>


                <p>
                    ${error.message}
                </p>


                <p class="error-note">
                    Hãy chạy project bằng Live Server
                    thay vì mở trực tiếp file HTML.
                </p>

            </div>

        `;

    }

}


// ==========================================
// SỰ KIỆN TÌM KIẾM
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterProducts
    );

}


// ==========================================
// SỰ KIỆN LỌC DANH MỤC
// ==========================================

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterProducts
    );

}


// ==========================================
// SỰ KIỆN LỌC GIÁ TỪ
// ==========================================

if (minPrice) {

    minPrice.addEventListener(
        "input",
        filterProducts
    );

}


// ==========================================
// SỰ KIỆN LỌC GIÁ ĐẾN
// ==========================================

if (maxPrice) {

    maxPrice.addEventListener(
        "input",
        filterProducts
    );

}


// ==========================================
// CHẠY CHƯƠNG TRÌNH
// ==========================================

getProducts();