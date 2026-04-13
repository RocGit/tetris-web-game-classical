/**
 * piece.js - 方块系统
 * 7种标准方块定义、SRS（Super Rotation System）旋转
 */

const Piece = (() => {

    // --- 方块形状矩阵定义（标准 SRS） ---
    const SHAPES = {
        I: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        O: [
            [1, 1],
            [1, 1],
        ],
        T: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        S: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
        Z: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
        J: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        L: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
    };

    // --- SRS 踢墙数据（Wall Kick Data） ---
    // 每次旋转尝试的偏移量 [row, col]
    // 0→R, R→2, 2→L, L→0
    const WALL_KICKS_JLSTZ = {
        '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    };

    // I 方块专用踢墙数据
    const WALL_KICKS_I = {
        '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    };

    /**
     * 创建方块实例
     * @param {string} type - 方块类型（I/O/T/S/Z/J/L）
     * @param {number} startRow - 起始行
     * @param {number} startCol - 起始列
     */
    function create(type, startRow, startCol) {
        const shape = SHAPES[type];
        return {
            type: type,
            shape: Utils.deepCopy(shape),
            rotation: 0,       // 0=初始, 1=R, 2=180, 3=L
            row: startRow,
            col: startCol,
            lockMoves: 0,      // 锁定前的移动次数
        };
    }

    /**
     * 获取方块的旋转后形状（不修改原方块）
     */
    function getRotatedShape(piece, direction) {
        let shape = Utils.deepCopy(piece.shape);
        if (direction === 1) {
            // 顺时针
            shape = Utils.rotateMatrix(shape);
        } else if (direction === -1) {
            // 逆时针：旋转3次顺时针
            shape = Utils.rotateMatrix(Utils.rotateMatrix(Utils.rotateMatrix(shape)));
        }
        return shape;
    }

    /**
     * 获取 SRS 踢墙偏移量
     * @param {string} type - 方块类型
     * @param {number} fromRotation - 当前旋转状态
     * @param {number} toRotation - 目标旋转状态
     * @returns {Array} 偏移量数组 [[row, col], ...]
     */
    function getWallKicks(type, fromRotation, toRotation) {
        const key = `${fromRotation}>${toRotation}`;
        if (type === 'I') {
            return WALL_KICKS_I[key] || [[0, 0]];
        } else if (type === 'O') {
            return [[0, 0]]; // O 方块不需要踢墙
        }
        return WALL_KICKS_JLSTZ[key] || [[0, 0]];
    }

    /**
     * 获取方块在面板上的所有单元格坐标
     */
    function getCells(piece) {
        const cells = [];
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    cells.push({
                        row: piece.row + r,
                        col: piece.col + c,
                    });
                }
            }
        }
        return cells;
    }

    /**
     * 获取方块的出生位置
     */
    function getSpawnPosition(type) {
        const shape = SHAPES[type];
        const cols = shape[0].length;
        return {
            row: type === 'I' ? -1 : 0,
            col: Math.floor((GameConfig.BOARD.COLS - cols) / 2),
        };
    }

    return {
        SHAPES,
        create,
        getRotatedShape,
        getWallKicks,
        getCells,
        getSpawnPosition,
    };
})();
