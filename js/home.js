const productContainer = document.getElementById("featuredProducts");

function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + " ₫";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function renderFeaturedProducts(products) {
    if (!productContainer) return;

    if (!Array.isArray(products) || products.length === 0) {
        productContainer.innerHTML =
            '<p class="error-message">Chưa có sản phẩm để hiển thị.</p>';
        return;
    }

    productContainer.innerHTML = products.slice(0, 8).map(product => {
        const id = encodeURIComponent(product.id);
        const name = escapeHTML(product.name || "Sản phẩm Adidas");
        const category = escapeHTML(product.category || "Thể thao");
        const image = escapeHTML(product.image || "");
        const price = formatPrice(product.price);

        return `
            <article class="product">
                <a href="detail.html?id=${id}" aria-label="Xem ${name}">
                    <img
                        src="${image}"
                        alt="${name}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='https://placehold.co/500x500/f5f5f5/222?text=Adidas';"
                    >
                </a>

                <div class="product-info">
                    <span class="product-category">${category}</span>
                    <h3 class="product-name">${name}</h3>
                    <p class="product-price">${price}</p>
                    <a class="detail-link" href="detail.html?id=${id}">
                        XEM CHI TIẾT
                    </a>
                </div>
            </article>
        `;
    }).join("");
}

async function loadFeaturedProducts() {
    if (!productContainer) return;

    try {
        const response = await fetch("./data/products.json");

        if (!response.ok) {
            throw new Error("Không thể tải products.json");
        }

        const products = await response.json();
        renderFeaturedProducts(products);
    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);

        productContainer.innerHTML = `
            <p class="error-message">
                Không tải được sản phẩm. Hãy kiểm tra file
                <strong>data/products.json</strong> và chạy website bằng
                Live Server hoặc Vite.
            </p>
        `;
    }
}

loadFeaturedProducts();