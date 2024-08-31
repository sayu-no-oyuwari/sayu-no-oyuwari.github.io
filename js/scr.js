
document.addEventListener('DOMContentLoaded', function () {
    // サムネイルSwiperの初期化
    var thumbsSwiper = new Swiper('#thumbs', {
        slidesPerView: 3,
        spaceBetween: 10,
        freeMode: true,
        watchSlidesProgress: true,
    });

    // メインのSwiperの初期化
    var mainSwiper = new Swiper('#slider', {
        spaceBetween: 10,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        thumbs: {
            swiper: thumbsSwiper, // サムネイルSwiperとの連携
        },
        // 自動再生オプションを追加（必要に応じて調整）
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        // ループ設定でスライドを無限にループ
        loop: true,
        // キーボードナビゲーションの追加
        keyboard: {
            enabled: true,
        },
    });
});




function processImage(action) {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('画像をアップロードしてください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            if (file.type === 'image/jpeg' || file.type === 'image/png') {
                // JPEGまたはPNGの場合、縮小処理を行う
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxSize = 1440;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // WebPに変換
                canvas.toBlob(function (blob) {
                    convertToBase64(blob, action, 'image/webp');
                }, 'image/webp');
            } else {
                // それ以外（アニメーション画像など）の場合はそのままbase64エンコード
                convertToBase64(file, action, file.type);
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function convertToBase64(fileOrBlob, action, mimeType) {
    const reader = new FileReader();
    reader.onloadend = function () {
        const base64data = reader.result.split(',')[1];
        editAndDownloadSVG(base64data, action, mimeType);
    };
    reader.readAsDataURL(fileOrBlob);
}

function editAndDownloadSVG(base64data, action, mimeType) {
    const svgFilePath = `parts/${action}.svg`;

    fetch(svgFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('SVGファイルの取得に失敗しました。ステータスコード: ' + response.status);
            }
            return response.text();
        })
        .then(svgContent => {
            // SVGの中身を書き換え (href属性にbase64データを埋め込む)
            const modifiedSVGContent = svgContent.replace(/href="[^"]*"/, `href="data:${mimeType};base64,${base64data}"`);

            const svgBlob = new Blob([modifiedSVGContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);

            // 自動的にダウンロードを開始
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${action}.svg`;
            downloadLink.click();

            // ダウンロードが完了した後にURLオブジェクトを解放
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('エラーが発生しました:', error);
            alert('SVGファイルの読み込みまたは編集中にエラーが発生しました。');
        });
}
