
// メインのスライダーを初期化
var slider = new Swiper('#slider', {
  nextButton: '.swiper-button-next',  // 次へボタンのセレクタを指定
  prevButton: '.swiper-button-prev'   // 前へボタンのセレクタを指定
});

// サムネイルスライダーを初期化
var thumbs = new Swiper('#thumbs', {
  centeredSlides: true,               // スライドを中央に配置
  spaceBetween: 10,                   // スライド間のスペースを設定
  slidesPerView: "auto",              // 表示されるスライド数を自動調整
  touchRatio: 0.2,                    // スワイプの感度を調整
  slideToClickedSlide: true           // サムネイルクリックでメインスライドに移動
});

// メインスライダーとサムネイルスライダーを同期させる
slider.params.control = thumbs;
thumbs.params.control = slider;




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

                canvas.toBlob(function (blob) {
                    convertToBase64(blob, action, 'image/webp', width, height);
                }, 'image/webp');
            } else {
                convertToBase64(file, action, file.type, img.width, img.height);
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function convertToBase64(fileOrBlob, action, mimeType, imgWidth, imgHeight) {
    const reader = new FileReader();
    reader.onloadend = function () {
        const base64data = reader.result.split(',')[1];
        editAndDownloadSVG(base64data, action, mimeType, imgWidth, imgHeight);
    };
    reader.readAsDataURL(fileOrBlob);
}

function editAndDownloadSVG(base64data, action, mimeType, imgWidth, imgHeight) {
    const svgFilePath = `parts/${action}.svg`;

    fetch(svgFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('SVGファイルの取得に失敗しました。ステータスコード: ' + response.status);
            }
            return response.text();
        })
        .then(svgContent => {
            // hrefにbase64データを埋め込む
            let modifiedSVGContent = svgContent.replace(/(<image\b[^>]*href=")[^"]*(")/, `$1data:${mimeType};base64,${base64data}$2`);

            // 中心を (0, 0) に配置するために、x と y を調整
            const xOffset = -(imgWidth / 2);
            const yOffset = -(imgHeight / 2);

            // x と y 属性を中心に合わせる
            modifiedSVGContent = modifiedSVGContent.replace(/(<image\b[^>]*x=")[^"]*(")/, `$1${xOffset}$2`)
                                                  .replace(/(<image\b[^>]*y=")[^"]*(")/, `$1${yOffset}$2`);

            const svgBlob = new Blob([modifiedSVGContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${action}.svg`;
            downloadLink.click();

            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('エラーが発生しました:', error);
            alert('SVGファイルの読み込みまたは編集中にエラーが発生しました。');
        });
}