"use strict";

(() => {
    const $ = (id) => document.getElementById(id);

    const wheel = $("wheel");
    const canvas = $("wheelCanvas");
    const spinButton = $("spinButton");
    const spinStatus = $("spinStatus");
    const rewardSection = $("rewardSection");

    const STORAGE_USED = "adidasLuckySpinUsed";
    const STORAGE_RESULT = "adidasLuckySpinResult";
    const STORAGE_VOUCHER = "adidasSelectedVoucher";

    const ctx = canvas.getContext("2d");

    // Các voucher cần được hỗ trợ tương ứng ở checkout.js.
    const prizes = [
        {
            code: "ADIDAS10",
            title: "Giảm 10%",
            description: "Giảm 10% đơn hàng từ 1.000.000đ",
            minTotal: 1000000,
            type: "percent",
            value: 10
        },
        {
            code: "FREESHIP",
            title: "Giảm 30.000đ",
            description: "Giảm 30.000đ cho đơn từ 1.000.000đ",
            minTotal: 1000000,
            type: "fixed",
            value: 30000
        },
        {
            code: "ADIDAS15",
            title: "Giảm 15%",
            description: "Giảm 15% đơn hàng từ 2.000.000đ",
            minTotal: 2000000,
            type: "percent",
            value: 15
        },
        {
            code: "ADIDAS10",
            title: "Giảm 10%",
            description: "Giảm 10% đơn hàng từ 1.000.000đ",
            minTotal: 1000000,
            type: "percent",
            value: 10
        },
        {
            code: "ADIDAS20",
            title: "Giảm 20%",
            description: "Giảm 20% đơn hàng từ 3.000.000đ",
            minTotal: 3000000,
            type: "percent",
            value: 20
        },
        {
            code: "FREESHIP",
            title: "Giảm 30.000đ",
            description: "Giảm 30.000đ cho đơn từ 1.000.000đ",
            minTotal: 1000000,
            type: "fixed",
            value: 30000
        },
        {
            code: "ADIDAS15",
            title: "Giảm 15%",
            description: "Giảm 15% đơn hàng từ 2.000.000đ",
            minTotal: 2000000,
            type: "percent",
            value: 15
        },
        {
            code: "ADIDAS10",
            title: "Giảm 10%",
            description: "Giảm 10% đơn hàng từ 1.000.000đ",
            minTotal: 1000000,
            type: "percent",
            value: 10
        }
    ];

    const colors = [
        "#e30613",
        "#171717",
        "#f3f3f3",
        "#252525",
        "#e30613",
        "#171717",
        "#f3f3f3",
        "#252525"
    ];

    const segmentCount = prizes.length;
    const segmentAngle = (Math.PI * 2) / segmentCount;

    let isSpinning = false;
    let hasPlayed = false;

    /*
     * Vẽ vòng quay bằng Canvas.
     */
    function drawWheel() {
        const size = canvas.width;
        const center = size / 2;
        const radius = size / 2 - 5;

        ctx.clearRect(0, 0, size, size);

        prizes.forEach((prize, index) => {
            // Mỗi ô được đặt tâm lần lượt ở vị trí 12 giờ,
            // sau đó quay theo chiều kim đồng hồ.
            const startAngle =
                -Math.PI / 2 -
                segmentAngle / 2 +
                index * segmentAngle;

            const endAngle = startAngle + segmentAngle;

            ctx.beginPath();
            ctx.moveTo(center, center);

            ctx.arc(
                center,
                center,
                radius,
                startAngle,
                endAngle
            );

            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.stroke();

            // Vẽ chữ trong từng ô.
            ctx.save();

            ctx.translate(center, center);
            ctx.rotate(startAngle + segmentAngle / 2);

            const textColor =
                colors[index] === "#f3f3f3"
                    ? "#171717"
                    : "#ffffff";

            ctx.fillStyle = textColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.font = "900 27px Arial";

            ctx.fillText(
                prize.title,
                radius * 0.65,
                0
            );

            ctx.font = "bold 15px Arial";

            ctx.fillText(
                "ADIDAS",
                radius * 0.65,
                29
            );

            ctx.restore();
        });

        // Viền ngoài.
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    /*
     * Hiển thị voucher nhận được.
     */
    function showReward(prize, isRestored = false) {
        $("rewardCode").textContent = prize.code;
        $("rewardDescription").textContent = prize.description;

        $("rewardCondition").textContent =
            "Điều kiện: tối thiểu 2 sản phẩm trong giỏ và đơn hàng đạt giá trị quy định.";

        $("rewardMessage").textContent = isRestored
            ? "Bạn đã nhận được mã này ở lượt quay trước."
            : "Chúc mừng! Đây là phần thưởng của bạn.";

        $("copyStatus").textContent = "";

        rewardSection.hidden = false;

        rewardSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /*
     * Khôi phục kết quả đã lưu khi tải lại trang.
     */
    function restorePreviousResult() {
        const used = localStorage.getItem(STORAGE_USED);
        const saved = localStorage.getItem(STORAGE_RESULT);

        if (used !== "true" || !saved) {
            return;
        }

        try {
            const result = JSON.parse(saved);

            if (
                !result ||
                !prizes.some((prize) => prize.code === result.code)
            ) {
                throw new Error("Dữ liệu voucher không hợp lệ.");
            }

            hasPlayed = true;
            spinButton.disabled = true;
            spinButton.innerHTML = "✓ ĐÃ SỬ DỤNG LƯỢT QUAY";

            spinStatus.textContent =
                "Bạn đã sử dụng lượt quay trên trình duyệt này.";

            $("rewardCode").textContent = result.code;
            $("rewardDescription").textContent = result.description;

            $("rewardCondition").textContent =
                "Điều kiện: tối thiểu 2 sản phẩm trong giỏ và đạt giá trị đơn hàng theo mã.";

            $("rewardMessage").textContent =
                "Bạn đã nhận được mã này ở lượt quay trước.";

            rewardSection.hidden = false;
        } catch (error) {
            console.error("Không thể khôi phục voucher:", error);
            spinStatus.textContent =
                "Không thể đọc kết quả đã lưu. Vui lòng kiểm tra dữ liệu trình duyệt.";
        }
    }

    /*
     * Quay vòng quay.
     */
    function spinWheel() {
        if (isSpinning || hasPlayed) {
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;

        spinStatus.textContent = "Vòng quay đang chạy...";

        // Chọn một ô phần thưởng ngẫu nhiên.
        const prizeIndex = Math.floor(
            Math.random() * segmentCount
        );

        const prize = prizes[prizeIndex];

        // Góc quay đưa chính giữa ô được chọn tới kim chỉ.
        const targetAngle =
            (360 - prizeIndex * (360 / segmentCount)) % 360;

        const fullRotations = 5 + Math.floor(Math.random() * 3);

        wheel.style.transition = "none";
        wheel.style.transform = "rotate(0deg)";

        // Buộc trình duyệt cập nhật góc trước khi bắt đầu animation.
        void wheel.offsetWidth;

        wheel.style.transition =
            "transform 5s cubic-bezier(0.12, 0.72, 0.12, 1)";

        wheel.style.transform =
            `rotate(${fullRotations * 360 + targetAngle}deg)`;

        window.setTimeout(() => {
            isSpinning = false;
            hasPlayed = true;

            spinStatus.textContent =
                `Bạn nhận được ${prize.code}!`;

            spinButton.innerHTML = "✓ ĐÃ NHẬN VOUCHER";

            const result = {
                code: prize.code,
                title: prize.title,
                description: prize.description,
                minTotal: prize.minTotal,
                type: prize.type,
                value: prize.value,
                createdAt: new Date().toISOString()
            };

            /*
             * Lưu kết quả trên trình duyệt.
             * Đây không phải cơ chế chống gian lận phía máy chủ.
             */
            localStorage.setItem(STORAGE_USED, "true");

            localStorage.setItem(
                STORAGE_RESULT,
                JSON.stringify(result)
            );

            // Giữ key để trang checkout hiện tại có thể đọc mã.
            localStorage.setItem(
                STORAGE_VOUCHER,
                prize.code
            );

            showReward(prize);
        }, 5200);
    }

    /*
     * Sao chép mã voucher.
     */
    async function copyVoucher() {
        const code = $("rewardCode").textContent;

        if (!code) {
            return;
        }

        try {
            await navigator.clipboard.writeText(code);

            $("copyStatus").textContent =
                `Đã sao chép mã ${code}.`;
        } catch (error) {
            const input = document.createElement("textarea");

            input.value = code;
            input.style.position = "fixed";
            input.style.left = "-9999px";

            document.body.appendChild(input);
            input.select();

            const copied = document.execCommand("copy");

            input.remove();

            $("copyStatus").textContent = copied
                ? `Đã sao chép mã ${code}.`
                : `Mã của bạn: ${code}`;
        }
    }

    /*
     * Điều hướng đến vòng quay.
     */
    $("scrollToWheel").addEventListener("click", () => {
        $("spinSection").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    spinButton.addEventListener("click", spinWheel);

    $("copyCodeButton").addEventListener(
        "click",
        copyVoucher
    );

    drawWheel();
    restorePreviousResult();
})();