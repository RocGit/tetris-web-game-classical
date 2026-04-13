/**
 * utils.js - 通用工具函数
 * 矩阵操作、深拷贝、7-Bag 随机算法等
 */

const Utils = (() => {

    /**
     * 深拷贝二维数组
     */
    function deepCopy(matrix) {
        return matrix.map(row => [...row]);
    }

    /**
     * 顺时针旋转矩阵 90 度
     */
    function rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        for (let c = 0; c < cols; c++) {
            rotated[c] = [];
            for (let r = rows - 1; r >= 0; r--) {
                rotated[c].push(matrix[r][c]);
            }
        }
        return rotated;
    }

    /**
     * 7-Bag 随机生成器
     * 每7个方块为一组，组内随机排列，保证分布均匀
     */
    class BagRandomizer {
        constructor() {
            this.bag = [];
        }

        next() {
            if (this.bag.length === 0) {
                this.bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
                // Fisher-Yates 洗牌
                for (let i = this.bag.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
                }
            }
            return this.bag.pop();
        }
    }

    /**
     * 限制值在指定范围内
     */
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 简单的帧率独立的计时器
     */
    class Timer {
        constructor() {
            this.lastTime = 0;
            this.accumulated = 0;
        }

        reset() {
            this.lastTime = 0;
            this.accumulated = 0;
        }

        update(currentTime) {
            if (this.lastTime === 0) {
                this.lastTime = currentTime;
                return 0;
            }
            const delta = currentTime - this.lastTime;
            this.lastTime = currentTime;
            this.accumulated += delta;
            return delta;
        }

        consume(interval) {
            if (this.accumulated >= interval) {
                this.accumulated -= interval;
                return true;
            }
            return false;
        }
    }

    return {
        deepCopy,
        rotateMatrix,
        BagRandomizer,
        clamp,
        Timer,
    };
})();
