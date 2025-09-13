// ゲーム設定定数
const CONFIG = {
    CELL_SIZE: 20,
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    GAME_SPEED: 300, // ミリ秒（プレイヤーの移動間隔）
    GHOST_SPEED: 350, // ミリ秒（ゴーストの移動間隔）

    // スコア設定
    SCORES: {
        DOT: 10,
        POWER_PELLET: 50,
        GHOST: 200
    },

    // 色設定
    COLORS: {
        WALL: '#0000ff',
        DOT: '#ffff00',
        POWER_PELLET: '#ffffff',
        PLAYER: '#ffff00',
        GHOSTS: {
            RED: '#ff0000',
            PINK: '#ff69b4',
            CYAN: '#00ffff',
            ORANGE: '#ffa500'
        }
    }
};

// 方向の定数
const DIRECTIONS = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

// ゲーム状態の定数
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

// ユーティリティクラス
class Utils {
    /**
     * 2つの座標が同じかどうかチェック
     */
    static samePosition(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    /**
     * 方向に基づいて新しい座標を計算
     */
    static getNewPosition(x, y, direction) {
        const newPos = { x, y };

        switch (direction) {
            case DIRECTIONS.UP:
                newPos.y--;
                break;
            case DIRECTIONS.DOWN:
                newPos.y++;
                break;
            case DIRECTIONS.LEFT:
                newPos.x--;
                break;
            case DIRECTIONS.RIGHT:
                newPos.x++;
                break;
        }

        return newPos;
    }

    /**
     * 2点間の距離を計算（マンハッタン距離）
     */
    static manhattanDistance(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    /**
     * 配列からランダムに要素を選択
     */
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * 範囲内の整数をランダムに生成
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 方向を反転
     */
    static oppositeDirection(direction) {
        const opposites = {
            [DIRECTIONS.UP]: DIRECTIONS.DOWN,
            [DIRECTIONS.DOWN]: DIRECTIONS.UP,
            [DIRECTIONS.LEFT]: DIRECTIONS.RIGHT,
            [DIRECTIONS.RIGHT]: DIRECTIONS.LEFT
        };
        return opposites[direction];
    }

    /**
     * 角度を方向に変換（描画用）
     */
    static directionToAngle(direction) {
        const angles = {
            [DIRECTIONS.RIGHT]: 0,
            [DIRECTIONS.DOWN]: Math.PI / 2,
            [DIRECTIONS.LEFT]: Math.PI,
            [DIRECTIONS.UP]: -Math.PI / 2
        };
        return angles[direction] || 0;
    }

    /**
     * Canvas上のピクセル座標をグリッド座標に変換
     */
    static pixelToGrid(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / CONFIG.CELL_SIZE),
            y: Math.floor(pixelY / CONFIG.CELL_SIZE)
        };
    }

    /**
     * グリッド座標をCanvas上のピクセル座標に変換
     */
    static gridToPixel(gridX, gridY) {
        return {
            x: gridX * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
            y: gridY * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
        };
    }

    /**
     * 数値を範囲内に制限
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * 配列をシャッフル
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// キーボード入力管理クラス
class InputManager {
    constructor() {
        this.keys = {};
        this.keyQueue = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.addToQueue(e.key);

            // デフォルトの動作を防ぐ（矢印キーなど）
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    addToQueue(key) {
        this.keyQueue.push(key);
        // キューのサイズを制限
        if (this.keyQueue.length > 3) {
            this.keyQueue.shift();
        }
    }

    isPressed(key) {
        return this.keys[key] || false;
    }

    getQueuedDirection() {
        // キューから方向キーを探す（最新のものから）
        for (let i = this.keyQueue.length - 1; i >= 0; i--) {
            const key = this.keyQueue[i];
            switch (key) {
                case 'ArrowUp':
                    return DIRECTIONS.UP;
                case 'ArrowDown':
                    return DIRECTIONS.DOWN;
                case 'ArrowLeft':
                    return DIRECTIONS.LEFT;
                case 'ArrowRight':
                    return DIRECTIONS.RIGHT;
            }
        }
        return null;
    }

    clearQueue() {
        this.keyQueue = [];
    }
}

// サウンド管理クラス（将来の拡張用）
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }

    // 音声ファイルの読み込み（将来の実装用）
    loadSound(name, src) {
        // 実装時に音声ファイルを読み込む処理を追加
        console.log(`Loading sound: ${name} from ${src}`);
    }

    // 音声再生（将来の実装用）
    playSound(name) {
        if (!this.enabled) return;
        console.log(`Playing sound: ${name}`);
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}

// アニメーション管理クラス
class AnimationManager {
    constructor() {
        this.animations = new Map();
    }

    add(id, animation) {
        this.animations.set(id, {
            ...animation,
            startTime: Date.now(),
            currentTime: 0
        });
    }

    update() {
        const now = Date.now();

        for (const [id, animation] of this.animations.entries()) {
            animation.currentTime = now - animation.startTime;

            if (animation.currentTime >= animation.duration) {
                if (animation.loop) {
                    animation.startTime = now;
                    animation.currentTime = 0;
                } else {
                    this.animations.delete(id);
                    if (animation.onComplete) {
                        animation.onComplete();
                    }
                }
            }

            if (animation.onUpdate) {
                const progress = Math.min(animation.currentTime / animation.duration, 1);
                animation.onUpdate(progress);
            }
        }
    }

    remove(id) {
        this.animations.delete(id);
    }

    clear() {
        this.animations.clear();
    }
}
