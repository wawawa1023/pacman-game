class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // ゲーム状態
        this.gameState = GAME_STATES.MENU;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // タイマー
        this.lastTime = 0;
        this.gameLoopId = null;
        
        // ゲームオブジェクト
        this.gameMap = null;
        this.player = null;
        this.ghosts = [];
        this.inputManager = null;
        this.soundManager = null;
        this.animationManager = null;
        
        // UI要素
        this.scoreElement = document.getElementById('score');
        this.dotsLeftElement = document.getElementById('dotsLeft');
        this.livesElement = document.getElementById('lives');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.init();
    }
    
    /**
     * ゲーム初期化
     */
    init() {
        // マネージャーの初期化
        this.inputManager = new InputManager();
        this.soundManager = new SoundManager();
        this.animationManager = new AnimationManager();
        
        // ゲームオブジェクトの初期化
        this.gameMap = new GameMap(this.canvas);
        this.player = new Player(this.gameMap, this.inputManager);
        this.createGhosts();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // ゲーム開始
        this.startGame();
    }
    
    /**
     * ゴーストを作成
     */
    createGhosts() {
        const ghostStartPositions = this.gameMap.getGhostStartPositions();
        const ghostColors = Object.values(CONFIG.COLORS.GHOSTS);
        const ghostBehaviors = [
            GHOST_BEHAVIORS.AGGRESSIVE,
            GHOST_BEHAVIORS.AMBUSH,
            GHOST_BEHAVIORS.PATROL
        ];
        
        this.ghosts = [];
        for (let i = 0; i < Math.min(ghostStartPositions.length, ghostColors.length); i++) {
            const ghost = new Ghost(
                this.gameMap,
                ghostColors[i],
                ghostStartPositions[i],
                ghostBehaviors[i % ghostBehaviors.length]
            );
            this.ghosts.push(ghost);
        }
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // リスタートボタン
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // リセットボタン
        document.getElementById('resetButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 一時停止ボタン
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });
        
        // キーボードショートカット
        this.inputManager.setupEventListeners();
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') { // スペースキーで一時停止
                this.togglePause();
            } else if (e.key === 'r' || e.key === 'R') { // Rキーでリスタート
                this.restartGame();
            }
        });
    }
    
    /**
     * ゲーム開始
     */
    startGame() {
        this.gameState = GAME_STATES.PLAYING;
        this.lastTime = performance.now();
        this.gameLoop();
        this.updateUI();
    }
    
    /**
     * ゲームループ
     */
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === GAME_STATES.PLAYING) {
            this.update(deltaTime);
        }
        
        this.draw();
        
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * ゲーム更新
     */
    update(deltaTime) {
        // プレイヤー更新
        this.player.update(deltaTime);
        
        // アイテム収集
        const itemScore = this.player.collectItems();
        this.score += itemScore;
        
        // ゴースト更新
        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime, this.player);
        });
        
        // 衝突判定
        this.checkCollisions();
        
        // アニメーション更新
        this.animationManager.update();
        
        // 勝利条件チェック
        if (this.gameMap.allDotsCollected()) {
            this.levelComplete();
        }
        
        // UI更新
        this.updateUI();
    }
    
    /**
     * 衝突判定
     */
    checkCollisions() {
        this.ghosts.forEach(ghost => {
            if (ghost.checkCollisionWithPlayer(this.player)) {
                if (ghost.isFrightened()) {
                    // ゴーストを食べる
                    this.eatGhost(ghost);
                } else if (!ghost.isEaten()) {
                    // プレイヤーが死亡
                    this.playerDeath();
                }
            }
        });
    }
    
    /**
     * ゴーストを食べる
     */
    eatGhost(ghost) {
        this.score += CONFIG.SCORES.GHOST;
        ghost.getEaten();
        this.soundManager.playSound('eatGhost');
        
        // 食べたエフェクトを表示
        this.showScoreEffect(ghost.getPosition(), CONFIG.SCORES.GHOST);
    }
    
    /**
     * プレイヤー死亡処理
     */
    playerDeath() {
        this.lives--;
        this.soundManager.playSound('death');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPositions();
        }
    }
    
    /**
     * 位置をリセット
     */
    resetPositions() {
        this.player.reset();
        this.ghosts.forEach(ghost => ghost.reset());
        
        // 短時間一時停止
        this.gameState = GAME_STATES.PAUSED;
        setTimeout(() => {
            if (this.gameState === GAME_STATES.PAUSED) {
                this.gameState = GAME_STATES.PLAYING;
            }
        }, 2000);
    }
    
    /**
     * レベル完了
     */
    levelComplete() {
        this.level++;
        this.score += 1000; // ボーナス
        this.soundManager.playSound('levelComplete');
        
        // 次のレベルの準備
        this.gameMap.reset();
        this.player.reset();
        this.ghosts.forEach(ghost => ghost.reset());
        
        // レベル完了メッセージを表示
        this.showLevelCompleteMessage();
    }
    
    /**
     * ゲームオーバー
     */
    gameOver() {
        this.gameState = GAME_STATES.GAME_OVER;
        this.soundManager.playSound('gameOver');
        this.showGameOverScreen('ゲームオーバー', `最終スコア: ${this.score}`);
    }
    
    /**
     * ゲームリスタート
     */
    restartGame() {
        // ゲーム状態をリセット
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // オブジェクトをリセット
        this.gameMap.reset();
        this.player.reset();
        this.ghosts.forEach(ghost => ghost.reset());
        
        // アニメーションをクリア
        this.animationManager.clear();
        
        // 入力をクリア
        this.inputManager.clearQueue();
        
        // UI を隠す
        this.hideGameOverScreen();
        
        // ゲーム再開
        this.startGame();
    }
    
    /**
     * 一時停止切り替え
     */
    togglePause() {
        if (this.gameState === GAME_STATES.PLAYING) {
            this.gameState = GAME_STATES.PAUSED;
            document.getElementById('pauseButton').textContent = '再開';
        } else if (this.gameState === GAME_STATES.PAUSED) {
            this.gameState = GAME_STATES.PLAYING;
            this.lastTime = performance.now(); // 時間をリセット
            document.getElementById('pauseButton').textContent = '一時停止';
        }
    }
    
    /**
     * 描画処理
     */
    draw() {
        // 背景をクリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // マップを描画
        this.gameMap.draw();
        
        // プレイヤーを描画
        this.player.draw(this.ctx);
        
        // ゴーストを描画
        this.ghosts.forEach(ghost => {
            if (!ghost.isEaten()) {
                ghost.draw(this.ctx);
            }
        });
        
        // 一時停止オーバーレイ
        if (this.gameState === GAME_STATES.PAUSED) {
            this.drawPauseOverlay();
        }
    }
    
    /**
     * 一時停止オーバーレイの描画
     */
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('一時停止', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('スペースキーで再開', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    /**
     * UI更新
     */
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.dotsLeftElement.textContent = this.gameMap.getRemainingItems();
        this.livesElement.textContent = this.lives;
    }
    
    /**
     * ゲームオーバー画面を表示
     */
    showGameOverScreen(title, message) {
        this.gameOverTitle.textContent = title;
        this.gameOverMessage.innerHTML = message;
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.style.display = 'flex';
    }
    
    /**
     * ゲームオーバー画面を隠す
     */
    hideGameOverScreen() {
        this.gameOverScreen.style.display = 'none';
    }
    
    /**
     * レベル完了メッセージを表示
     */
    showLevelCompleteMessage() {
        this.showGameOverScreen(
            `レベル ${this.level - 1} クリア！`,
            `ボーナス: 1000点<br>総スコア: ${this.score}`
        );
        
        // 3秒後に自動的に次のレベルを開始
        setTimeout(() => {
            this.hideGameOverScreen();
        }, 3000);
    }
    
    /**
     * スコアエフェクトを表示
     */
    showScoreEffect(position, points) {
        const pixelPos = Utils.gridToPixel(position.x, position.y);
        
        this.animationManager.add('scoreEffect_' + Date.now(), {
            duration: 1000,
            onUpdate: (progress) => {
                this.ctx.save();
                this.ctx.fillStyle = `rgba(255, 255, 0, ${1 - progress})`;
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    `+${points}`,
                    pixelPos.x,
                    pixelPos.y - progress * 30
                );
                this.ctx.restore();
            }
        });
    }
    
    /**
     * ゲームを停止
     */
    destroy() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    const game = new PacmanGame();
    
    // ページを離れる時にゲームを停止
    window.addEventListener('beforeunload', () => {
        game.destroy();
    });
});