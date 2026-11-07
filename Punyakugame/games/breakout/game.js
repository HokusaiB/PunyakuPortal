
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const startButton = document.getElementById("startButton");

// ===================================
// 1. ゲーム画面の設定
// ===================================

const GAME_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

canvas.width = GAME_WIDTH;
canvas.height = DEFAULT_HEIGHT;

// ===================================
// 2. 背景画像
// ===================================

const backgroundImage = new Image();
let backgroundLoaded = false;

backgroundImage.onload = () => {
    backgroundLoaded = true;

    // 背景画像の縦横比を取得
    const aspectRatio =
        backgroundImage.naturalWidth /
        backgroundImage.naturalHeight;

    // Canvasのサイズを画像に合わせる
    canvas.width = GAME_WIDTH;
    canvas.height = Math.round(GAME_WIDTH / aspectRatio);

    // 画面サイズに合わせて配置を更新
    resetPositions();
    createBricks();

    draw();
};

backgroundImage.onerror = () => {
    console.error("背景画像を読み込めませんでした。");
    draw();
};

// 画像ファイルの指定
backgroundImage.src = "images/background.png";

// ===================================
// 3. ボールとパドル
// ===================================

const ball = {
    x: 400,
    y: 400,
    radius: 8,
    dx: 4,
    dy: -4
};

const paddle = {
    x: 350,
    y: 560,
    width: 100,
    height: 12
};

// 画面サイズに応じて位置を調整
function resetPositions() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height * 0.8;

    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - 40;
}

// ===================================
// 4. ブロックの設定
// ===================================

const brickConfig = {
    rows: 20,
    columns: 12,
    height: 22,
    padding: 0,
    offsetTop: 320
};

let bricks = [];

function createBricks() {
    bricks = [];

    // 画面幅いっぱいにブロックを配置
    const brickWidth =
        canvas.width / brickConfig.columns;

    for (let row = 0; row < brickConfig.rows; row++) {
        for (let col = 0; col < brickConfig.columns; col++) {

            bricks.push({
                x: col * brickWidth,
                y: brickConfig.offsetTop +
                    row * (brickConfig.height + brickConfig.padding),

                width: brickWidth,
                height: brickConfig.height,
                active: true
            });
        }
    }
}

// ===================================
// 5. ゲーム状態
// ===================================

let score = 0;
let running = false;
let gameOver = false;
let animationId = null;

// ===================================
// 6. 描画処理
// ===================================

// 背景
function drawBackground() {
    const backgroundColor = "#252d45";
    const backgroundHeight = canvas.height * (2 / 3);

    // 画面全体を背景色で塗る
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (backgroundLoaded) {
        // 上半分の領域
        const areaWidth = canvas.width;
        const areaHeight = backgroundHeight;

        // 画像の縦横比を維持して、領域内に収める
        const scale = Math.min(
            areaWidth / backgroundImage.naturalWidth,
            areaHeight / backgroundImage.naturalHeight
        );

        const imageWidth = backgroundImage.naturalWidth * scale;
        const imageHeight = backgroundImage.naturalHeight * scale;

        // 画像を中央に配置
        const imageX = (areaWidth - imageWidth) / 2;
        const imageY = (areaHeight - imageHeight) / 2;

        ctx.drawImage(
            backgroundImage,
            imageX,
            imageY,
            imageWidth,
            imageHeight
        );
    }
}

// ボール
function drawBall() {
    ctx.beginPath();
    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
}

// パドル
function drawPaddle() {
    ctx.fillStyle = "#42a5f5";

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );
}

// ブロック
function drawBricks() {
    bricks.forEach(brick => {
        if (!brick.active) return;

        // ブロック本体
        ctx.fillStyle = "#ff84ea";

        ctx.fillRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );

        // 境界線
        ctx.strokeStyle = "#e633bc";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );
    });
}

// 全体描画
function draw() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
}

// ===================================
// 7. スコア
// ===================================

function updateScore() {
    score++;
    scoreElement.textContent = score;
}

// ===================================
// 8. 衝突判定・ゲーム更新
// ===================================

function update() {

    ball.x += ball.dx;
    ball.y += ball.dy;

    // 左右の壁
    if (
        ball.x + ball.radius > canvas.width ||
        ball.x - ball.radius < 0
    ) {
        ball.dx *= -1;
    }

    // 上の壁
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // パドルとの衝突
    if (
        ball.dy > 0 &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        ball.dy = -Math.abs(ball.dy);

        const hitPosition =
            (ball.x - (paddle.x + paddle.width / 2)) /
            (paddle.width / 2);

        ball.dx = hitPosition * 5;
    }

    // ブロックとの衝突
    for (const brick of bricks) {
        if (!brick.active) continue;

        if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
        ) {
            brick.active = false;
            ball.dy *= -1;
            updateScore();

            break;
        }
    }

    // 全ブロック破壊
    if (bricks.every(brick => !brick.active)) {
        endGame("CLEAR!");
        return;
    }

    // ボールを落とした場合
    if (ball.y - ball.radius > canvas.height) {
        endGame("GAME OVER");
    }
}

// ===================================
// 9. ゲーム終了
// ===================================

function endGame(message) {
    running = false;
    gameOver = true;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    draw();

    alert(message + " SCORE: " + score);
}

// ===================================
// 10. ゲームループ
// ===================================

function gameLoop() {
    if (!running) return;

    update();

    if (!running) return;

    draw();

    animationId = requestAnimationFrame(gameLoop);
}

// ===================================
// 11. マウス操作
// ===================================

canvas.addEventListener("mousemove", event => {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;

    const mouseX =
        (event.clientX - rect.left) * scaleX;

    paddle.x = mouseX - paddle.width / 2;

    paddle.x = Math.max(
        0,
        Math.min(
            canvas.width - paddle.width,
            paddle.x
        )
    );

    if (!running) {
        draw();
    }
});

// ===================================
// 12. ゲーム開始・再スタート
// ===================================

function startGame() {

    // 前のゲームループを停止
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // 初期化
    resetPositions();

    ball.dx = 4;
    ball.dy = -4;

    score = 0;
    scoreElement.textContent = score;

    gameOver = false;
    running = true;

    createBricks();

    draw();
    gameLoop();
}

startButton.addEventListener("click", startGame);

// ===================================
// 13. 初期画面
// ===================================

resetPositions();
createBricks();
draw();
