const spinButton = document.getElementById("spinButton");
const voucherResult = document.getElementById("voucherResult");
const wheelGroup = document.getElementById("wheelGroup");

const vouchers = [
    {
        code: "ADIDAS10",
        text: "Giảm 10%"
    },
    {
        code: "ADIDAS15",
        text: "Giảm 15%"
    },
    {
        code: "ADIDAS20",
        text: "Giảm 20%"
    },
    {
        code: "ADIDAS25",
        text: "Giảm 25%"
    },
    {
        code: "FREESHIP",
        text: "Miễn phí vận chuyển"
    },
    {
        code: "ADIDAS10",
        text: "Giảm 10%"
    },
    {
        code: "ADIDAS15",
        text: "Giảm 15%"
    },
    {
        code: "ADIDAS20",
        text: "Giảm 20%"
    }
];

let currentRotation = 0;
let spinning = false;


spinButton.addEventListener("click", function () {

    if (spinning) {
        return;
    }

    spinning = true;

    spinButton.disabled = true;
    spinButton.innerText = "⏳ ĐANG QUAY...";

    voucherResult.innerHTML = "";


    const randomIndex =
        Math.floor(Math.random() * vouchers.length);

    const voucher = vouchers[randomIndex];


    const targetRotation =
        360 - (22.5 + randomIndex * 45);

    const currentMod =
        ((currentRotation % 360) + 360) % 360;

    const delta =
        (targetRotation - currentMod + 360) % 360;

    currentRotation += 360 * 5 + delta;


    wheelGroup.style.transition =
        "transform 5s cubic-bezier(0.15, 0.8, 0.2, 1)";

    wheelGroup.setAttribute(
        "transform",
        "rotate(" + currentRotation + " 250 250)"
    );


    setTimeout(function () {

        // Lưu mã giảm giá
        localStorage.setItem(
            "voucherCode",
            voucher.code
        );

        localStorage.setItem(
            "voucherText",
            voucher.text
        );


        voucherResult.innerHTML = `
            <div class="voucher-popup" id="voucherPopup">

                <div class="voucher-popup-content">

                    <div class="voucher-big-title">
                        🎉 CHÚC MỪNG BẠN! 🎉
                    </div>

                    <div class="voucher-popup-text">
                        Bạn nhận được:
                    </div>

                    <div class="voucher-big-code">
                        ${voucher.code}
                    </div>

                    <div class="voucher-discount">
                        ${voucher.text}
                    </div>

                    <button
                        id="copyVoucherButton"
                        class="voucher-copy">
                        📋 SAO CHÉP MÃ
                    </button>

                    <button
                        id="closeVoucherButton"
                        class="voucher-close">
                        ĐÓNG
                    </button>

                </div>

            </div>
        `;


        const copyButton =
            document.getElementById("copyVoucherButton");

        copyButton.addEventListener(
            "click",
            function () {

                navigator.clipboard.writeText(
                    voucher.code
                );

                copyButton.innerText =
                    "✅ ĐÃ SAO CHÉP";

            }
        );


        const closeButton =
            document.getElementById("closeVoucherButton");

        closeButton.addEventListener(
            "click",
            function () {

                const popup =
                    document.getElementById("voucherPopup");

                if (popup) {
                    popup.remove();
                }

            }
        );


        spinButton.disabled = false;
        spinButton.innerText = "🎯 QUAY LẠI";

        spinning = false;

    }, 5200);

});