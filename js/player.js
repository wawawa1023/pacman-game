class Player {
    constructor(gameMap, inputManager) {
        this.gameMap = gameMap;
        this.inputManager = inputManager;
        
        this.reset();
    }
    
    reset() {
        const startPos = this.gameMap.getPlayerStartPosition();
        this.x = startPos.x;
        this.y = startPos.y;
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = null;
        
        // 移動タイミング制御
        this.lastMoveTime = 0;
        this.moveInterval = CONFIG.GAME_SPEED; // 移動間隔（ミリ秒）
        
        // アニメーション用
        this.animationTime = 0;
        this.mouthOpen = true;
        
        // パワーアップ状態
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.powerModeDuration = 10000; // 10秒
    }
    
    /**
     * プレイヤーの更新
     */
    update(deltaTime) {
        // 入力処理
        this.handleInput();
        
        // 移動タイミング制御
        this.lastMoveTime += deltaTime;
        if (this.lastMoveTime >= this.moveInterval) {
            this.move();
            this.lastMoveTime = 0;
        }
        
        // アニメーション更新
        this.updateAnimation(deltaTime);
        
        // パワーモード更新
        this.updatePowerMode(deltaTime);
    }
    
    /**
     * 入力処理
     */
    handleInput() {
        const queuedDirection = this.inputManager.getQueuedDirection();
        if (queuedDirection) {
            this.nextDirection = queuedDirection;
        }
    }
    
    /**
     * 移動処理
     */
    move() {
        // 次の方向が設定されていて移動可能なら方向転換
        if (this.nextDirection) {
            const nextPos = Utils.getNewPosition(this.x, this.y, this.nextDirection);
            if (this.gameMap.canMoveTo(nextPos.x, nextPos.y)) {
                this.direction = this.nextDirection;
                this.nextDirection = null;
            }
        }
        
        // 現在の方向に移動
        const newPos = Utils.getNewPosition(this.x, this.y, this.direction);
        
        // 壁に衝突しない場合のみ移動
        if (this.gameMap.canMoveTo(newPos.x, newPos.y)) {
            this.x = newPos.x;
            this.y = newPos.y;
        }
    }
    
    /**
     * アニメーション更新
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // 口の開閉アニメーション（500msごと）
        if (this.animationTime >= 500) {
            this.mouthOpen = !this.mouthOpen;
            this.animationTime = 0;
        }
    }
    
    /**
     * パワーモード更新
     */
    updatePowerMode(deltaTime) {
        if (this.powerMode) {
            this.powerModeTimer -= deltaTime;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
                this.powerModeTimer = 0;
            }
        }
    }
    
    /**
     * アイテム収集処理
     */
    collectItems() {
        let score = 0;
        
        // ドット収集
        const dotScore = this.gameMap.collectDot(this.x, this.y);
        score += dotScore;
        
        // パワーペレット収集
        const pelletScore = this.gameMap.collectPowerPellet(this.x, this.y);
        if (pelletScore > 0) {
            score += pelletScore;
            this.activatePowerMode();
        }
        
        return score;
    }
    
    /**
     * パワーモード発動
     */
    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTimer = this.powerModeDuration;
    }
    
    /**
     * プレイヤーの描画
     */
    draw(ctx) {
        const pixelPos = Utils.gridToPixel(this.x, this.y);
        const radius = CONFIG.CELL_SIZE / 2 - 2;
        
        // パワーモード時の色変更
        ctx.fillStyle = this.powerMode ? '#ffffff' : CONFIG.COLORS.PLAYER;
        
        // パックマンの本体を描画
        ctx.beginPath();
        ctx.arc(pixelPos.x, pixelPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 口の部分を描画
        if (this.mouthOpen) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            
            const mouthAngle = Utils.directionToAngle(this.direction);
            ctx.arc(
                pixelPos.x,
                pixelPos.y,
                radius,
                mouthAngle - Math.PI / 4,
                mouthAngle + Math.PI / 4
            );
            ctx.lineTo(pixelPos.x, pixelPos.y);
            ctx.fill();
        }
        
        // パワーモード時の効果
        if (this.powerMode) {
            this.drawPowerModeEffect(ctx, pixelPos.x, pixelPos.y);
        }
    }
    
    /**
     * パワーモード効果の描画
     */
    drawPowerModeEffect(ctx, x, y) {
        const timeLeft = this.powerModeTimer / this.powerModeDuration;
        
        // 点滅効果（残り時間が少ない時）
        if (timeLeft < 0.3 && Math.floor(Date.now() / 200) % 2 === 0) {
            return;
        }
        
        // オーラ効果
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, CONFIG.CELL_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * 現在の位置を取得
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    /**
     * パワーモード中かどうか
     */
    isPowerMode() {
        return this.powerMode;
    }
    
    /**
     * パワーモードの残り時間割合（0-1）
     */
    getPowerModeTimeRatio() {
        if (!this.powerMode) return 0;
        return this.powerModeTimer / this.powerModeDuration;
    }
    
    /**
     * 移動可能な方向を取得
     */
    getValidDirections() {
        return this.gameMap.getValidDirections(this.x, this.y);
    }
    
    /**
     * 指定方向に移動可能かチェック
     */
    canMoveInDirection(direction) {
        const newPos = Utils.getNewPosition(this.x, this.y, direction);
        return this.gameMap.canMoveTo(newPos.x, newPos.y);
    }
}