
  // サムネイルリスト
  var thumbnails = document.querySelectorAll('.thumb');
  var currentIndex = 0;

  // サムネイルをクリックした時に動画を切り替える処理
  thumbnails.forEach(function(thumb, index) {
    thumb.addEventListener('click', function() {
      currentIndex = index;
      changeVideo(currentIndex);
    });
  });

  // 次の動画に移動する関数
  function nextVideo() {
    currentIndex = (currentIndex + 1) % thumbnails.length; // インデックスをループさせる
    changeVideo(currentIndex);
  }

  // 前の動画に移動する関数
  function prevVideo() {
    currentIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length; // インデックスをループさせる
    changeVideo(currentIndex);
  }

  // 動画を切り替える共通の処理
  function changeVideo(index) {
    var videoId = thumbnails[index].getAttribute('data-video');
    var iframe = document.getElementById('main-video');
    iframe.src = 'https://www.youtube.com/embed/' + videoId;
  }

  // ボタンにイベントリスナーを追加
  document.getElementById('next-btn').addEventListener('click', nextVideo);
  document.getElementById('prev-btn').addEventListener('click', prevVideo);



// パスワードをチェックするための変数
const correctPassword = "白湯のお湯割り！！"; // 正しいパスワードを設定

// 現在のアクションを記憶する変数
let currentAction = '';

//パスワード確認
function FanboxPass(action) {
    const userInput = prompt('パスワードを入力してください:');

    if (userInput === correctPassword) {
        // パスワードが正しい場合のみ、次のイベントループでアクションを実行
        setTimeout(() => {
            currentAction = action;  // 押されたボタンの名前（アクション）を保存
            document.getElementById('imageUpload').click();  // 非表示のファイル入力をクリックしてファイル選択ダイアログを表示
        }, 0);
    } else {
        alert('パスワードが正しくありません。');
    }
}


// ボタンが押されたときに、アクションを設定してファイル選択をトリガーする
function setActionAndTriggerFileUpload(action) {
    currentAction = action;  // 押されたボタンの名前（アクション）を保存
    document.getElementById('imageUpload').click();  // 非表示のファイル入力をクリックしてファイル選択ダイアログを表示
}

// ファイルが選択されたら自動的に画像処理を開始する
document.getElementById('imageUpload').addEventListener('change', function () {
    if (this.files.length > 0) {
        processImage(currentAction);  // 保存しておいたアクションを使って処理を実行
    }
});


//画像関連
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