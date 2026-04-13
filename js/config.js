/**
 * config.js - 游戏配置常量
 * 集中管理所有可调参数，便于调整游戏体验
 */

const GameConfig = (() => {
    return {
        // --- 网格尺寸 ---
        BOARD: {
            COLS: 10,          // 列数
            ROWS: 20,          // 行数
            CELL_SIZE: 30,     // 单元格像素大小
        },

        // --- 方块颜色映射（与 CSS 变量对应） ---
        COLORS: {
            I: '#00f0f0',
            O: '#f0f000',
            T: '#a000f0',
            S: '#00f000',
            Z: '#f00000',
            J: '#5050ff',
            L: '#f0a000',
        },

        // --- 发光颜色 RGB（用于 Canvas shadow） ---
        GLOW: {
            I: '0, 240, 240',
            O: '240, 240, 0',
            T: '160, 0, 240',
            S: '0, 240, 0',
            Z: '240, 0, 0',
            J: '50, 50, 255',
            L: '240, 160, 0',
        },

        // --- 下落速度（毫秒/格），按等级递增 ---
        SPEED: {
            BASE_INTERVAL: 800,    // 等级1的下落间隔
            MIN_INTERVAL: 50,      // 最小间隔
            SPEED_FACTOR: 0.85,    // 每升一级速度乘数
        },

        // --- 计分规则 ---
        SCORING: {
            SINGLE: 100,    // 消1行
            DOUBLE: 300,    // 消2行
            TRIPLE: 500,    // 消3行
            TETRIS: 800,    // 消4行
            SOFT_DROP: 1,   // 软降每格
            HARD_DROP: 2,   // 硬降每格
            LEVEL_UP_LINES: 10,  // 每多少行升一级
        },

        // --- 操作延迟 ---
        DAS: {
            DELAY: 170,       // 长按触发延迟（ms）
            REPEAT: 50,       // 长按重复间隔（ms）
        },

        // --- 锁定延迟 ---
        LOCK: {
            DELAY: 500,       // 方块触底后锁定延迟（ms）
            MAX_MOVES: 15,    // 锁定前最大移动次数
        },

        // --- 触屏灵敏度 ---
        TOUCH: {
            SWIPE_THRESHOLD: 30,   // 滑动触发最小距离（px）
            SWIPE_TIMEOUT: 300,    // 滑动判定最大时间（ms）
        },
    };
})();
