/**
 * board.js - 游戏面板管理
 * 网格状态、碰撞检测、消行判定
 */

const Board = (() => {
    let grid = [];
    let cols = GameConfig.BOARD.COLS;
    let rows = GameConfig.BOARD.ROWS;

    /**
     * 初始化空面板
     */
    function init() {
        grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = new Array(cols).fill(null);
        }
    }

    /**
     * 获取面板网格（只读引用）
     */
    function getGrid() {
        return grid;
    }

    /**
     * 检查方块在指定位置是否有效（不越界、不重叠）
     * @param {Object} piece - 方块对象
     * @param {number} row - 行偏移
     * @param {number} col - 列偏移
     * @param {Array} shape - 方块形状矩阵（可选，默认用 piece.shape）
     */
    function isValid(piece, row, col, shape) {
        const s = shape || piece.shape;
        for (let r = 0; r < s.length; r++) {
            for (let c = 0; c < s[r].length; c++) {
                if (s[r][c]) {
                    const newRow = row + r;
                    const newCol = col + c;
                    // 超出左右边界或底部
                    if (newCol < 0 || newCol >= cols || newRow >= rows) {
                        return false;
                    }
                    // 顶部以上允许（方块可以部分在屏幕外）
                    if (newRow < 0) continue;
                    // 与已锁定方块重叠
                    if (grid[newRow][newCol] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * 将方块锁定到面板上
     */
    function lockPiece(piece) {
        const cells = Piece.getCells(piece);
        cells.forEach(({ row, col }) => {
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                grid[row][col] = piece.type;
            }
        });
    }

    /**
     * 检测并消除已满的行
     * @returns {{ clearedRows: number[], count: number }}
     */
    function clearLines() {
        const clearedRows = [];
        for (let r = rows - 1; r >= 0; r--) {
            if (grid[r].every(cell => cell !== null)) {
                clearedRows.push(r);
            }
        }

        if (clearedRows.length > 0) {
            // 从上到下移除已满行
            clearedRows.sort((a, b) => a - b);
            for (let i = clearedRows.length - 1; i >= 0; i--) {
                grid.splice(clearedRows[i], 1);
            }
            // 在顶部补充空行
            for (let i = 0; i < clearedRows.length; i++) {
                grid.unshift(new Array(cols).fill(null));
            }
        }

        return {
            clearedRows: clearedRows,
            count: clearedRows.length,
        };
    }

    /**
     * 计算方块硬降的目标行
     */
    function getHardDropRow(piece) {
        let row = piece.row;
        while (isValid(piece, row + 1, piece.col)) {
            row++;
        }
        return row;
    }

    /**
     * 检查是否游戏结束（新方块无法放置）
     */
    function isGameOver(piece) {
        return !isValid(piece, piece.row, piece.col);
    }

    /**
     * 获取面板上所有已锁定方块的单元格
     */
    function getLockedCells() {
        const cells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== null) {
                    cells.push({ row: r, col: c, type: grid[r][c] });
                }
            }
        }
        return cells;
    }

    /**
     * 重置面板
     */
    function reset() {
        init();
    }

    return {
        init,
        getGrid,
        isValid,
        lockPiece,
        clearLines,
        getHardDropRow,
        isGameOver,
        getLockedCells,
        reset,
    };
})();
