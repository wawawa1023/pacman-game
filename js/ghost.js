// ゴーストの状態
const GHOST_STATES = {
    CHASE: 'chase',     // プレイヤーを追跡
    SCATTER: 'scatter', // 散らばる
    FRIGHTENED: 'frightened', // 恐怖状態（パワーペレット後）
    EATEN: 'eaten'      // 食べられた状態
};

// ゴーストの行動パターン
const GHOST_BEHAVIORS = {
    AGGRESSIVE: 'aggressive',   // 積極的に追跡
    AMBUSH: 'ambush',          // 待ち伏せ
    PATROL: 'patrol',          // パトロール
    RANDOM: 'random'           // ランダム移動
};

class Ghost {
    constructor(gameMap, color, startPosition, behavior = GHOST_BEHAVIORS.AGGRESSIVE) {
        this.gameMap = gameMap;
        this.color = color;
        this.startPosition = { ...startPosition };
        this.behavior = behavior;
        
        this.reset();
    }
    
    reset() {
        this.x = this.startPosition.x;
        this.y = this.startPosition.y;
        this.direction = Utils.randomChoice([DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT]);
        this.state = GHOST_STATES.SCATTER;
        this.stateTimer = 0;
        this.speed = CONFIG.GHOST_SPEED;
        
        // 移動タイマー
        this.moveTimer = 0;
        this.moveDelay = this.speed;
        
        // 状態切り替えタイマー
        this.behaviorTimer = 0;
        this.scatterTime = 7000;  // 7秒間散らばる
        this.chaseTime = 20000;   // 20秒間追跡
        
        // 恐怖状態
        this.frightenedTimer = 0;
        this.frightenedDuration = 8000; // 8秒
        
        // 目標位置（散らばる時の目標）
        this.targetCorner = this.getTargetCorner();
    }
    
    /**
     * ゴーストの更新
     */
    update(deltaTime, player) {
        // 状態管理
        this.updateState(deltaTime, player);
        
        // 移動処理
        this.updateMovement(deltaTime, player);
    }
    
    /**
     * 状態更新
     */
    updateState(deltaTime, player) {
        this.stateTimer += deltaTime;
        
        // プレイヤーがパワーモード中の場合
        if (player.isPowerMode() && this.state !== GHOST_STATES.FRIGHTENED && this.state !== GHOST_STATES.EATEN) {
            this.state = GHOST_STATES.FRIGHTENED;
            this.frightenedTimer = this.frightenedDuration;
            this.direction = Utils.oppositeDirection(this.direction); // 方向転換
        }
        
        // 恐怖状態の処理
        if (this.state === GHOST_STATES.FRIGHTENED) {
            this.frightenedTimer -= deltaTime;
            if (this.frightenedTimer <= 0) {
                this.state = GHOST_STATES.CHASE;
                this.stateTimer = 0;
            }
        }
        
        // 通常状態の切り替え（chase ↔ scatter）
        if (this.state === GHOST_STATES.CHASE || this.state === GHOST_STATES.SCATTER) {
            this.behaviorTimer += deltaTime;
            
            if (this.state === GHOST_STATES.SCATTER && this.behaviorTimer >= this.scatterTime) {
                this.state = GHOST_STATES.CHASE;
                this.behaviorTimer = 0;
            } else if (this.state === GHOST_STATES.CHASE && this.behaviorTimer >= this.chaseTime) {
                this.state = GHOST_STATES.SCATTER;
                this.behaviorTimer = 0;
                this.targetCorner = this.getTargetCorner();
            }
        }
    }
    
    /**
     * 移動更新
     */
    updateMovement(deltaTime, player) {
        this.moveTimer += deltaTime;
        
        if (this.moveTimer >= this.moveDelay) {
            this.move(player);
            this.moveTimer = 0;
            
            // 恐怖状態では移動が遅くなる
            this.moveDelay = this.state === GHOST_STATES.FRIGHTENED ? this.speed * 1.5 : this.speed;
        }
    }
    
    /**
     * 移動処理
     */
    move(player) {
        const validDirections = this.gameMap.getValidDirections(this.x, this.y);
        
        // 後退を避ける（行き止まりの場合は除く）
        const forwardDirections = validDirections.filter(dir => 
            dir !== Utils.oppositeDirection(this.direction)
        );
        
        const availableDirections = forwardDirections.length > 0 ? forwardDirections : validDirections;
        
        if (availableDirections.length === 0) return;
        
        let chosenDirection;
        
        switch (this.state) {
            case GHOST_STATES.CHASE:
                chosenDirection = this.chooseChasingDirection(availableDirections, player);
                break;
            case GHOST_STATES.SCATTER:
                chosenDirection = this.chooseScatterDirection(availableDirections);
                break;
            case GHOST_STATES.FRIGHTENED:
                chosenDirection = this.chooseFrightenedDirection(availableDirections, player);
                break;
            default:
                chosenDirection = Utils.randomChoice(availableDirections);
        }
        
        this.direction = chosenDirection;
        const newPos = Utils.getNewPosition(this.x, this.y, this.direction);
        
        if (this.gameMap.canMoveTo(newPos.x, newPos.y)) {
            this.x = newPos.x;
            this.y = newPos.y;
        }
    }
    
    /**
     * 追跡時の方向選択
     */
    chooseChasingDirection(directions, player) {
        const playerPos = player.getPosition();
        let bestDirection = directions[0];
        let shortestDistance = Infinity;
        
        // 行動パターンに基づいて目標位置を決定
        let targetPos = playerPos;
        
        switch (this.behavior) {
            case GHOST_BEHAVIORS.AMBUSH:
                // プレイヤーの前方4マス先を狙う
                targetPos = Utils.getNewPosition(playerPos.x, playerPos.y, player.direction);
                for (let i = 0; i < 3; i++) {
                    targetPos = Utils.getNewPosition(targetPos.x, targetPos.y, player.direction);
                }
                break;
            case GHOST_BEHAVIORS.PATROL:
                // プレイヤーと他のゴーストの中間地点を狙う
                targetPos = { ...playerPos };
                break;
            default:
                // 直接プレイヤーを狙う
                break;
        }
        
        // 最短距離の方向を選択
        directions.forEach(direction => {
            const newPos = Utils.getNewPosition(this.x, this.y, direction);
            const distance = Utils.manhattanDistance(newPos, targetPos);
            
            if (distance < shortestDistance) {
                shortestDistance = distance;
                bestDirection = direction;
            }
        });
        
        return bestDirection;
    }
    
    /**
     * 散らばり時の方向選択
     */
    chooseScatterDirection(directions) {
        let bestDirection = directions[0];
        let shortestDistance = Infinity;
        
        directions.forEach(direction => {
            const newPos = Utils.getNewPosition(this.x, this.y, direction);
            const distance = Utils.manhattanDistance(newPos, this.targetCorner);
            
            if (distance < shortestDistance) {
                shortestDistance = distance;
                bestDirection = direction;
            }
        });
        
        return bestDirection;
    }
    
    /**
     * 恐怖状態時の方向選択
     */
    chooseFrightenedDirection(directions, player) {
        const playerPos = player.getPosition();
        let bestDirection = directions[0];
        let longestDistance = -1;
        
        // プレイヤーから最も遠い方向を選択
        directions.forEach(direction => {
            const newPos = Utils.getNewPosition(this.x, this.y, direction);
            const distance = Utils.manhattanDistance(newPos, playerPos);
            
            if (distance > longestDistance) {
                longestDistance = distance;
                bestDirection = direction;
            }
        });
        
        // ランダム要素を追加（30%の確率でランダム方向）
        if (Math.random() < 0.3) {
            return Utils.randomChoice(directions);
        }
        
        return bestDirection;
    }
    
    /**
     * 目標コーナーを取得
     */
    getTargetCorner() {
        const corners = [
            { x: 1, y: 1 },                                        // 左上
            { x: this.gameMap.cols - 2, y: 1 },                    // 右上
            { x: 1, y: this.gameMap.rows - 2 },                    // 左下
            { x: this.gameMap.cols - 2, y: this.gameMap.rows - 2 }  // 右下
        ];
        
        // 自分の色に基づいてコーナーを決定
        const colorIndex = Object.values(CONFIG.COLORS.GHOSTS).indexOf(this.color);
        return corners[colorIndex % corners.length];
    }
    
    /**
     * ゴーストの描画
     */
    draw(ctx) {
        const pixelPos = Utils.gridToPixel(this.x, this.y);
        const size = CONFIG.CELL_SIZE - 4;
        
        // 恐怖状態の色
        let fillColor = this.color;
        if (this.state === GHOST_STATES.FRIGHTENED) {
            // 恐怖状態では青色、残り時間が少ないと点滅
            const timeRatio = this.frightenedTimer / this.frightenedDuration;
            if (timeRatio < 0.3 && Math.floor(Date.now() / 200) % 2 === 0) {
                fillColor = '#ffffff';
            } else {
                fillColor = '#0000ff';
            }
        }
        
        // ゴーストの本体
        ctx.fillStyle = fillColor;
        ctx.fillRect(
            pixelPos.x - size / 2,
            pixelPos.y - size / 2,
            size,
            size
        );
        
        // 目を描画
        this.drawEyes(ctx, pixelPos.x, pixelPos.y);
        
        // 恐怖状態では口も描画
        if (this.state === GHOST_STATES.FRIGHTENED) {
            this.drawMouth(ctx, pixelPos.x, pixelPos.y);
        }
    }
    
    /**
     * 目の描画
     */
    drawEyes(ctx, x, y) {
        const eyeSize = 4;
        const eyeOffset = 6;
        
        // 白い目
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - eyeOffset, y - 3, eyeSize, eyeSize);
        ctx.fillRect(x + eyeOffset - eyeSize, y - 3, eyeSize, eyeSize);
        
        // 黒い瞳
        ctx.fillStyle = '#000000';
        const pupilOffset = this.getPupilOffset();
        ctx.fillRect(x - eyeOffset + pupilOffset.x, y - 3 + pupilOffset.y, 2, 2);
        ctx.fillRect(x + eyeOffset - eyeSize + pupilOffset.x, y - 3 + pupilOffset.y, 2, 2);
    }
    
    /**
     * 瞳の位置オフセット（移動方向に基づく）
     */
    getPupilOffset() {
        switch (this.direction) {
            case DIRECTIONS.UP:
                return { x: 1, y: 0 };
            case DIRECTIONS.DOWN:
                return { x: 1, y: 2 };
            case DIRECTIONS.LEFT:
                return { x: 0, y: 1 };
            case DIRECTIONS.RIGHT:
                return { x: 2, y: 1 };
            default:
                return { x: 1, y: 1 };
        }
    }
    
    /**
     * 口の描画（恐怖状態用）
     */
    drawMouth(ctx, x, y) {
        ctx.fillStyle = '#000000';
        
        // ジグザグの口
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 4);
        ctx.lineTo(x - 3, y + 7);
        ctx.lineTo(x, y + 4);
        ctx.lineTo(x + 3, y + 7);
        ctx.lineTo(x + 6, y + 4);
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    /**
     * プレイヤーとの衝突チェック
     */
    checkCollisionWithPlayer(player) {
        const playerPos = player.getPosition();
        return Utils.samePosition({ x: this.x, y: this.y }, playerPos);
    }
    
    /**
     * 現在の位置を取得
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    /**
     * 恐怖状態にする
     */
    frighten() {
        if (this.state !== GHOST_STATES.EATEN) {
            this.state = GHOST_STATES.FRIGHTENED;
            this.frightenedTimer = this.frightenedDuration;
            this.direction = Utils.oppositeDirection(this.direction);
        }
    }
    
    /**
     * 食べられた状態にする
     */
    getEaten() {
        this.state = GHOST_STATES.EATEN;
        // スタート位置に戻る処理（簡略化）
        setTimeout(() => {
            this.x = this.startPosition.x;
            this.y = this.startPosition.y;
            this.state = GHOST_STATES.SCATTER;
            this.stateTimer = 0;
        }, 3000);
    }
    
    /**
     * 恐怖状態かどうか
     */
    isFrightened() {
        return this.state === GHOST_STATES.FRIGHTENED;
    }
    
    /**
     * 食べられた状態かどうか
     */
    isEaten() {
        return this.state === GHOST_STATES.EATEN;
    }
}