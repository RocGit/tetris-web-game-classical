/**
 * score.js - 计分与等级系统
 * 分数计算、等级提升、下落速度、下一个方块预览队列
 */

const Score = (() => {
    let score = 0;
    let level = 1;
    let lines = 0;
    let combo = -1;

    // 下一个方块预览队列
    const randomizer = new Utils.BagRandomizer();
    let previewQueue = [];

    /**
     * 初始化/重置
     */
    function init() {
        score = 0;
        level = 1;
        lines = 0;
        combo = -1;
        randomizer.bag = [];
        previewQueue = [];
        // 填充预览队列
        for (let i = 0; i < 3; i++) {
            previewQueue.push(randomizer.next());
        }
    }

    /**
     * 获取当前分数
     */
    function getScore() {
        return score;
    }

    /**
     * 获取当前等级
     */
    function getLevel() {
        return level;
    }

    /**
     * 获取已消除总行数
     */
    function getLines() {
        return lines;
    }

    /**
     * 处理消行计分
     * @param {number} clearedCount - 本次消除的行数
     * @returns {{ score: number, levelUp: boolean, combo: number }}
     */
    function addScore(clearedCount) {
        if (clearedCount === 0) {
            combo = -1;
            return { score: 0, levelUp: false, combo: -1 };
        }

        combo++;

        // 基础分
        const baseScores = {
            1: GameConfig.SCORING.SINGLE,
            2: GameConfig.SCORING.DOUBLE,
            3: GameConfig.SCORING.TRIPLE,
            4: GameConfig.SCORING.TETRIS,
        };
        let earned = baseScores[clearedCount] || 0;

        // 等级加成
        earned *= level;

        // 连击加成
        if (combo > 0) {
            earned += 50 * combo * level;
        }

        score += earned;
        lines += clearedCount;

        // 检查升级
        const oldLevel = level;
        level = Math.floor(lines / GameConfig.SCORING.LEVEL_UP_LINES) + 1;

        return {
            score: earned,
            levelUp: level > oldLevel,
            combo: combo,
        };
    }

    /**
     * 软降加分
     */
    function addSoftDrop(cells) {
        score += cells * GameConfig.SCORING.SOFT_DROP;
    }

    /**
     * 硬降加分
     */
    function addHardDrop(cells) {
        score += cells * GameConfig.SCORING.HARD_DROP;
    }

    /**
     * 获取当前等级对应的下落间隔（ms）
     */
    function getDropInterval() {
        const interval = GameConfig.SPEED.BASE_INTERVAL *
            Math.pow(GameConfig.SPEED.SPEED_FACTOR, level - 1);
        return Math.max(GameConfig.SPEED.MIN_INTERVAL, Math.round(interval));
    }

    /**
     * 获取下一个方块类型
     */
    function getNextPiece() {
        const type = previewQueue.shift();
        previewQueue.push(randomizer.next());
        return type;
    }

    /**
     * 获取预览队列（只读）
     */
    function getPreviewQueue() {
        return [...previewQueue];
    }

    return {
        init,
        getScore,
        getLevel,
        getLines,
        addScore,
        addSoftDrop,
        addHardDrop,
        getDropInterval,
        getNextPiece,
        getPreviewQueue,
    };
})();
