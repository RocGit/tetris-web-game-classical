/**
 * renderer.js - Canvas 渲染引擎
 * 绘制方块、网格线、霓虹发光效果、动画
 */

const Renderer = (() => {
    let canvas = null;
    let ctx = null;
    let previewCanvas = null;
    let previewCtx = null;

    const CELL = GameConfig.BOARD.CELL_SIZE;
    const COLS = GameConfig.BOARD.COLS;
    const ROWS = GameConfig.BOARD.ROWS;

    // 消行动画状态
    let clearingRows = [];
    let clearAnimProgress = 0;
    let isClearAnimating = false;

    /**
     * 初始化渲染器
     * @param {string} canvasId - 主画布元素 ID
     * @param {string} previewCanvasId - 预览画布元素 ID
     */
    function init(canvasId, previewCanvasId) {
        canvas = document.getElementById(canvasId);
        ctx = canvas.getContext('2d');
        canvas.width = COLS * CELL;
        canvas.height = ROWS * CELL;

        previewCanvas = document.getElementById(previewCanvasId);
        previewCtx = previewCanvas.getContext('2d');
        previewCanvas.width = 4 * CELL;
        previewCanvas.height = 4 * CELL;
    }

    /**
     * 渲染完整帧
     * @param {Object} state - 游戏状态
     */
    function render(state) {
        if (!ctx) return;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制背景
        drawBackground();

        // 绘制网格线
        drawGrid();

        // 绘制已锁定的方块
        drawLockedCells(state.lockedCells);

        // 绘制消行动画
        if (isClearAnimating) {
            drawClearAnimation();
        }

        // 绘制幽灵方块（硬降投影）
        if (state.currentPiece && !isClearAnimating) {
            drawGhostPiece(state.currentPiece, state.ghostRow);
        }

        // 绘制当前活动方块
        if (state.currentPiece && !isClearAnimating) {
            drawPiece(state.currentPiece);
        }

        // 绘制预览方块
        drawPreview(state.previewType);
    }

    /**
     * 绘制背景
     */
    function drawBackground() {
        ctx.fillStyle = 'rgba(5, 5, 20, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * 绘制网格线
     */
    function drawGrid() {
        ctx.strokeStyle = 'rgba(60, 60, 120, 0.3)';
        ctx.lineWidth = 0.5;

        for (let c = 1; c < COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * CELL, 0);
            ctx.lineTo(c * CELL, canvas.height);
            ctx.stroke();
        }
        for (let r = 1; r < ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * CELL);
            ctx.lineTo(canvas.width, r * CELL);
            ctx.stroke();
        }
    }

    /**
     * 绘制单个方块单元格
     */
    function drawCell(context, row, col, type, alpha) {
        const a = alpha || 1;
        const x = col * CELL;
        const y = row * CELL;
        const color = GameConfig.COLORS[type];
        const glow = GameConfig.GLOW[type];
        const padding = 1;

        // 发光效果
        context.shadowColor = `rgba(${glow}, ${0.6 * a})`;
        context.shadowBlur = 8;

        // 方块主体（渐变）
        const gradient = context.createLinearGradient(x, y, x + CELL, y + CELL);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, adjustBrightness(color, -30));
        context.fillStyle = gradient;
        context.globalAlpha = a;

        context.fillRect(
            x + padding,
            y + padding,
            CELL - padding * 2,
            CELL - padding * 2
        );

        // 高光
        context.shadowBlur = 0;
        context.fillStyle = `rgba(255, 255, 255, ${0.2 * a})`;
        context.fillRect(
            x + padding,
            y + padding,
            CELL - padding * 2,
            3
        );

        context.globalAlpha = 1;
    }

    /**
     * 绘制已锁定方块
     */
    function drawLockedCells(cells) {
        cells.forEach(({ row, col, type }) => {
            drawCell(ctx, row, col, type);
        });
    }

    /**
     * 绘制当前活动方块
     */
    function drawPiece(piece) {
        const cells = Piece.getCells(piece);
        cells.forEach(({ row, col }) => {
            if (row >= 0) {
                drawCell(ctx, row, col, piece.type);
            }
        });
    }

    /**
     * 绘制幽灵方块（硬降投影）
     */
    function drawGhostPiece(piece, ghostRow) {
        const offset = ghostRow - piece.row;
        const cells = Piece.getCells(piece);
        cells.forEach(({ row, col }) => {
            const targetRow = row + offset;
            if (targetRow >= 0) {
                drawCell(ctx, targetRow, col, piece.type, 0.2);
            }
        });
    }

    /**
     * 绘制预览方块
     */
    function drawPreview(type) {
        if (!previewCtx || !type) return;

        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        const shape = Piece.SHAPES[type];
        const rows = shape.length;
        const cols = shape[0].length;
        const offsetX = Math.floor((4 - cols) / 2);
        const offsetY = Math.floor((4 - rows) / 2);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const x = (offsetX + c) * CELL;
                    const y = (offsetY + r) * CELL;
                    const color = GameConfig.COLORS[type];
                    const glow = GameConfig.GLOW[type];

                    previewCtx.shadowColor = `rgba(${glow}, 0.5)`;
                    previewCtx.shadowBlur = 6;

                    const gradient = previewCtx.createLinearGradient(x, y, x + CELL, y + CELL);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, adjustBrightness(color, -30));
                    previewCtx.fillStyle = gradient;
                    previewCtx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

                    previewCtx.shadowBlur = 0;
                    previewCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    previewCtx.fillRect(x + 1, y + 1, CELL - 2, 3);
                }
            }
        }
    }

    /**
     * 启动消行动画
     */
    function startClearAnimation(rows) {
        clearingRows = rows;
        clearAnimProgress = 0;
        isClearAnimating = true;
    }

    /**
     * 更新消行动画
     * @returns {boolean} 动画是否完成
     */
    function updateClearAnimation(deltaTime) {
        if (!isClearAnimating) return true;

        clearAnimProgress += deltaTime / 400; // 400ms 动画
        if (clearAnimProgress >= 1) {
            isClearAnimating = false;
            clearingRows = [];
            return true;
        }
        return false;
    }

    /**
     * 绘制消行动画
     */
    function drawClearAnimation() {
        const alpha = 1 - clearAnimProgress;
        clearingRows.forEach(row => {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            ctx.fillRect(0, row * CELL, canvas.width, CELL);
        });
    }

    /**
     * 调整颜色亮度
     */
    function adjustBrightness(hex, amount) {
        const num = parseInt(hex.slice(1), 16);
        let r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
        let g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
        let b = Math.max(0, Math.min(255, (num & 0xff) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    return {
        init,
        render,
        startClearAnimation,
        updateClearAnimation,
        isClearAnimating: () => isClearAnimating,
    };
})();
