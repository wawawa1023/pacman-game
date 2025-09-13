// マップの要素タイプ
const MAP_ELEMENTS = {
    WALL: 1,
    EMPTY: 0,
    DOT: 2,
    POWER_PELLET: 3,
    PLAYER_START: 4,
    GHOST_START: 5
};

class GameMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cols = CONFIG.CANVAS_WIDTH / CONFIG.CELL_SIZE;
        this.rows = CONFIG.CANVAS_HEIGHT / CONFIG.CELL_SIZE;
        this.mapData = [];
        this.dots = [];
        this.powerPellets = [];
        this.playerStartPos = { x: 1, y: 1 };
        this.ghostStartPositions = [];
        
        this.init();
    }
    
    init() {
        this.generateMap();
        this.findSpecialPositions();
    }
    
    /**
     * マップを生成
     */
    generateMap() {
        this.mapData = [];
        
        // 基本的なマップ構造を作成
        for (let y = 0; y < this.rows; y++) {
            this.mapData[y] = [];
            for (let x = 0; x < this.cols; x++) {
                // 外壁
                if (x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1) {
                    this.mapData[y][x] = MAP_ELEMENTS.WALL;
                }
                // 内部の壁パターン
                else if (this.shouldPlaceWall(x, y)) {
                    this.mapData[y][x] = MAP_ELEMENTS.WALL;
                }
                // 通路
                else {
                    this.mapData[y][x] = MAP_ELEMENTS.DOT;
                }
            }
        }
        
        // プレイヤー開始位置をクリア
        this.mapData[1][1] = MAP_ELEMENTS.PLAYER_START;
        
        // ゴースト開始位置を設定
        const ghostPositions = [
            { x: this.cols - 2, y: 1 },
            { x: this.cols - 2, y: this.rows - 2 },
            { x: 1, y: this.rows - 2 }
        ];
        
        ghostPositions.forEach(pos => {
            if (this.isValidPosition(pos.x, pos.y)) {
                this.mapData[pos.y][pos.x] = MAP_ELEMENTS.GHOST_START;
            }
        });
        
        // パワーペレットを配置
        this.placePowerPellets();
    }
    
    /**
     * 壁を配置するかどうかの判定
     */
    shouldPlaceWall(x, y) {
        // 格子状の壁パターン
        if ((x % 4 === 0 && y % 4 === 0) && x < this.cols - 2 && y < this.rows - 2) {
            return true;
        }
        
        // 追加の壁パターン
        if ((x % 8 === 4 && y % 4 === 2) || (x % 4 === 2 && y % 8 === 4)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * パワーペレットを配置
     */
    placePowerPellets() {
        const corners = [
            { x: 2, y: 2 },
            { x: this.cols - 3, y: 2 },
            { x: 2, y: this.rows - 3 },
            { x: this.cols - 3, y: this.rows - 3 }
        ];
        
        corners.forEach(pos => {
            if (this.mapData[pos.y] && this.mapData[pos.y][pos.x] === MAP_ELEMENTS.DOT) {
                this.mapData[pos.y][pos.x] = MAP_ELEMENTS.POWER_PELLET;
            }
        });
    }
    
    /**
     * 特殊位置を検索
     */
    findSpecialPositions() {
        this.dots = [];
        this.powerPellets = [];
        this.ghostStartPositions = [];
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                switch (this.mapData[y][x]) {
                    case MAP_ELEMENTS.DOT:
                        this.dots.push({ x, y });
                        break;
                    case MAP_ELEMENTS.POWER_PELLET:
                        this.powerPellets.push({ x, y });
                        break;
                    case MAP_ELEMENTS.PLAYER_START:
                        this.playerStartPos = { x, y };
                        break;
                    case MAP_ELEMENTS.GHOST_START:
                        this.ghostStartPositions.push({ x, y });
                        break;
                }
            }
        }
    }
    
    /**
     * マップを描画
     */
    draw() {
        // 背景をクリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 壁を描画
        this.drawWalls();
        
        // ドットを描画
        this.drawDots();
        
        // パワーペレットを描画
        this.drawPowerPellets();
    }
    
    /**
     * 壁を描画
     */
    drawWalls() {
        this.ctx.fillStyle = CONFIG.COLORS.WALL;
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.mapData[y][x] === MAP_ELEMENTS.WALL) {
                    this.ctx.fillRect(
                        x * CONFIG.CELL_SIZE,
                        y * CONFIG.CELL_SIZE,
                        CONFIG.CELL_SIZE,
                        CONFIG.CELL_SIZE
                    );
                }
            }
        }
    }
    
    /**
     * ドットを描画
     */
    drawDots() {
        this.ctx.fillStyle = CONFIG.COLORS.DOT;
        
        this.dots.forEach(dot => {
            this.ctx.beginPath();
            this.ctx.arc(
                dot.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
                dot.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
                3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }
    
    /**
     * パワーペレットを描画
     */
    drawPowerPellets() {
        this.ctx.fillStyle = CONFIG.COLORS.POWER_PELLET;
        
        this.powerPellets.forEach(pellet => {
            this.ctx.beginPath();
            this.ctx.arc(
                pellet.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
                pellet.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
                8,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }
    
    /**
     * 指定座標が移動可能かチェック
     */
    canMoveTo(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return false;
        }
        return this.mapData[y][x] !== MAP_ELEMENTS.WALL;
    }
    
    /**
     * 有効な座標かチェック
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }
    
    /**
     * ドットを取得
     */
    collectDot(x, y) {
        for (let i = this.dots.length - 1; i >= 0; i--) {
            if (this.dots[i].x === x && this.dots[i].y === y) {
                this.dots.splice(i, 1);
                return CONFIG.SCORES.DOT;
            }
        }
        return 0;
    }
    
    /**
     * パワーペレットを取得
     */
    collectPowerPellet(x, y) {
        for (let i = this.powerPellets.length - 1; i >= 0; i--) {
            if (this.powerPellets[i].x === x && this.powerPellets[i].y === y) {
                this.powerPellets.splice(i, 1);
                return CONFIG.SCORES.POWER_PELLET;
            }
        }
        return 0;
    }
    
    /**
     * すべてのドットが収集されたかチェック
     */
    allDotsCollected() {
        return this.dots.length === 0 && this.powerPellets.length === 0;
    }
    
    /**
     * 指定座標から移動可能な方向を取得
     */
    getValidDirections(x, y) {
        const directions = [];
        const moves = [
            { dir: DIRECTIONS.UP, dx: 0, dy: -1 },
            { dir: DIRECTIONS.DOWN, dx: 0, dy: 1 },
            { dir: DIRECTIONS.LEFT, dx: -1, dy: 0 },
            { dir: DIRECTIONS.RIGHT, dx: 1, dy: 0 }
        ];
        
        moves.forEach(move => {
            if (this.canMoveTo(x + move.dx, y + move.dy)) {
                directions.push(move.dir);
            }
        });
        
        return directions;
    }
    
    /**
     * マップをリセット
     */
    reset() {
        this.init();
    }
    
    /**
     * 残りのドット・パワーペレット数を取得
     */
    getRemainingItems() {
        return this.dots.length + this.powerPellets.length;
    }
    
    /**
     * プレイヤー開始位置を取得
     */
    getPlayerStartPosition() {
        return { ...this.playerStartPos };
    }
    
    /**
     * ゴースト開始位置を取得
     */
    getGhostStartPositions() {
        return this.ghostStartPositions.map(pos => ({ ...pos }));
    }
}