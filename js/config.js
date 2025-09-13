// js/config.js
const GAME_STATES = {
    MENU: "menu",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "game_over",
};

const CONFIG = {
    // キャンバス設定
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    CELL_SIZE: 20,
    
    // スコア設定
    SCORES: {
        DOT: 10,
        POWER_PELLET: 50,
        GHOST: 200,
    },
    
    // 色設定
    COLORS: {
        PLAYER: "yellow",
        GHOSTS: {
            RED: "red",
            PINK: "pink",
            CYAN: "cyan",
            ORANGE: "orange",
        },
    },
};
