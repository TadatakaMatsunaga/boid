// 定数
var FPS = 30;                 // フレームレート
var SCREEN_WIDTH = 1280;      // 画像サイズ 横
var SCREEN_HEIGHT = 720;      // 画像サイズ 縦
var NUM_BOIDS = 300;          // ボイドの数
var BOID_SIZE = 10;            // ボイドの大きさ
var MAX_SPEED = 20;            // ボイドの最大速度
var canvas = document.getElementById('world');
var ctx = canvas.getContext('2d');
var boids = [];               // ボイド
// 追加
var mouse = {x: 0, y: 0}; // マウスの座標
var click_mouse = {x: 0, y: 0}; // 最後にクリックした座標
var click_flg = 0;
var MOUSE_AREA = 75;    // マウスを避ける範囲

window.onload = function() {
    /* 初期化 */
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    for (var i=0; i<NUM_BOIDS; ++i) {
        boids[i] = {
            x: Math.random()*SCREEN_WIDTH,     // x座標
            y: Math.random()*SCREEN_HEIGHT,    // y座標
            vx: 0,                             // x方向の速度
            vy: 0,                             // y方向の速度
            r: Math.round(Math.random()*255),  // 色成分R
            g: Math.round(Math.random()*255),  // 色成分G
            b: Math.round(Math.random()*255)   // 色成分B
        }
    }
    /* ループ開始 */
    setInterval(simulate, 1000/FPS);
};

/**
 * 1000/FPS毎に呼び出される。ループの内容。
 */

var simulate = function() {
    draw();   // ボイドの描画
    move();   // ボイドの座標の更新
}

/**
 * ボイドの描画
 */

var draw = function() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // 画面をクリア
    // 全てのボイドの描画
    for (var i=0, len=boids.length; i<len; ++i) {
        ctx.fillStyle = "rgba("+boids[i].r+","+boids[i].g+","+boids[i].b+",0.8)";    //ボイドの色
        ctx.fillRect(boids[i].x-BOID_SIZE/2, boids[i].y-BOID_SIZE/2, BOID_SIZE, BOID_SIZE);
    }
};

/**
 * ボイドの座標の更新
 */

var move = function() {
    for (var i=0, len=boids.length; i<len; ++i) {
        // ルールを適用して速さを変更
        rule1(i);   // 近くの群れの真ん中に向かおうとする
        rule2(i);   // ボイドは他のボイドと距離を取ろうとする
        rule3(i);   // ボイドは他のボイドの平均速度に合わせようとする
        if (click_flg>0) {
            rule5(i);   // ボイドはクリックした位置を目指す
        }
        else {
            rule4(i);   // ボイドはマウスを避けようとする
        }
        // limit speed
        var b = boids[i];
        var speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
        if (speed >= MAX_SPEED) {
            var r = MAX_SPEED / speed;
            b.vx *= r;
            b.vy *= r;
        }

        // 壁の外に出てしまった場合速度を内側に向ける
        if (b.x<0 && b.vx<0 || b.x>SCREEN_WIDTH && b.vx>0) b.vx *= -1;
        if (b.y<0 && b.vy<0 || b.y>SCREEN_HEIGHT && b.vy>0) b.vy *= -1;

        // 座標の更新
        b.x += b.vx;
        b.y += b.vy;
    }

};

/**
 * ルール1：ボイドは近くに存在する群れの中心に向かおうとする
 */

var rule1 = function(index) {
    var c = {x: 0, y:0};    // 自分を除いた群れの真ん中
    for (var i=0,len=boids.length; i<len; ++i) {
        if (i != index) {
            c.x += boids[i].x;
            c.y += boids[i].y;
        }
    }
    c.x /= boids.length - 1;
    c.y /= boids.length - 1;
    boids[index].vx += (c.x-boids[index].x) / 100;
    boids[index].vy += (c.y-boids[index].y) / 100;
};

/**
 * ルール2：ボイドは隣のボイドとちょっとだけ距離をとろうとする
 */

var rule2 = function(index) {
    for (var i=0,len=boids.length; i<len; ++i) {
        if (i != index) {
            var d = getDistance(boids[i], boids[index]);   // ボイド間の距離
            if (d < BOID_SIZE) {
                boids[index].vx -= boids[i].x - boids[index].x;
                boids[index].vy -= boids[i].y - boids[index].y;
            }
        }
    }
};

/**
 * ルール3：ボイドは近くのボイドの平均速度に合わせようとする
 */

var rule3 = function(index) {
    var pv = {x: 0, y: 0};    // 自分を除いた群れの平均速度
    for (var i=0,len=boids.length; i<len; ++i) {
        if (i != index) {
            pv.x += boids[i].vx;
            pv.y += boids[i].vy;
        }
    }
    pv.x /= boids.length - 1;
    pv.y /= boids.length - 1;
    boids[index].vx += (pv.x-boids[index].vx) / 8;
    boids[index].vy += (pv.y-boids[index].vy) / 8;
};


/**
 * 2つのボイド間の距離
 */

var getDistance = function(b1, b2) {
    var x = b1.x - b2.x;
    var y = b1.y - b2.y;
    return Math.sqrt(x*x + y*y);
};


/**
 * マウスが移動するたびに実行されるイベント
 */
document.onmousemove = function (e){
    // InternetExplorer 用
    if(!e) e = window.event;

    // クライアント座標系を基点としたマウスカーソルの座標を取得
    mouse.x = e.clientX;
    mouse.y = e.clientY;
};

/**
 * マウスボタンを押すと実行されるイベント
 */
document.onmousedown = function (e){
    // InternetExplorer 用
    if(!e) e = window.event;

    // クライアント座標系を基点としたマウスカーソルの座標を取得
    click_mouse.x = e.clientX;
    click_mouse.y = e.clientY;
    click_flg = 1;
};


/**
 * マウスボタンを離すと実行されるイベント
 */
document.onmouseup = function (e){
    click_flg = 0;
};

/**
 * ルール4：ボイドはマウスを避けようとする
 */

var rule4 = function(index) {
    var f = getDistance(mouse, boids[index]);   // ボイド間の距離
    if (f < MOUSE_AREA) {
        boids[index].vx -= mouse.x - boids[index].x;
        boids[index].vy -= mouse.y - boids[index].y;
    }
};


/**
 * ルール5：ボイドはクリックした位置を目指す
 */

var rule5 = function(index) {
    boids[index].vx += (click_mouse.x-boids[index].x) / 300;
    boids[index].vy += (click_mouse.y-boids[index].y) / 300;
};
