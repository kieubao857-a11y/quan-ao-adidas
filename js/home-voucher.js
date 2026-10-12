document.addEventListener("DOMContentLoaded", function () {
    // TÌM KIẾM SẢN PHẨM
    const searchForm = document.getElementById("homeSearchForm");
    const searchInput = document.getElementById("homeSearch");

    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const keyword = searchInput.value.trim();

            if (!keyword) {
                window.location.href = "product.html";
                return;
            }

            window.location.href =
                "product.html?search=" + encodeURIComponent(keyword);
        });
    }

    // SAO CHÉP MÃ VOUCHER
    document.querySelectorAll(".copy-voucher").forEach(function (button) {
        button.addEventListener("click", async function () {
            const code = button.dataset.code;

            if (!code) return;

            try {
                await navigator.clipboard.writeText(code);
                showCopyMessage(button, "Đã sao chép!");
            } catch (error) {
                // Dự phòng nếu trình duyệt không cho phép clipboard
                const textArea = document.createElement("textarea");
                textArea.value = code;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";

                document.body.appendChild(textArea);
                textArea.select();

                const copied = document.execCommand("copy");
                textArea.remove();

                if (copied) {
                    showCopyMessage(button, "Đã sao chép!");
                } else {
                    window.prompt("Hãy sao chép mã voucher:", code);
                }
            }
        });
    });

    function showCopyMessage(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.disabled = true;

        window.setTimeout(function () {
            button.textContent = originalText;
            button.disabled = false;
        }, 1500);
    }
});