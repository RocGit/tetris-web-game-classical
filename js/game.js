/**
 * game.js - 游戏主控制器
 * 游戏状态机、主循环、流程管理
 */

const Game = (() => {
    // 游戏状态枚举
    const STATE = {
        IDLE: 'idle',         // 未开始
        PLAYING: 'playing',   // 进行中
        PAUSED: 'paused',     // 暂停
        CLEARING: 'clearing', // 消行动画中
        GAME_OVER: 'game_over',
    };

    let currentState = STATE.IDLE;
    let currentPiece = null;
    let ghostRow = 0;
    let dropTimer = new Utils.Timer();
    let lockTimer = new Utils.Timer();
    let lockDelayActive = false;
    let animationFrameId = null;

    // UI 元素引用
    let uiElements = {};

    /**
     * 初始化游戏
     */
    function init() {
        Board.init();
        Score.init();

        // 缓存 UI 元素
        uiElements = {
            score: document.getElementById('score-value'),
            level: document.getElementById('level-value'),
            lines: document.getElementById('lines-value'),
            overlay: document.getElementById('game-overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlaySubtitle: document.getElementById('overlay-subtitle'),
            overlayBtn: document.getElementById('overlay-btn'),
        };

        // 绑定覆盖层按钮
        uiElements.overlayBtn.addEventListener('click', startGame);

        // 初始化输入
        Input.init(handleAction);

        // 初始化渲染器
        Renderer.init('game-canvas', 'preview-canvas');

        // 显示初始覆盖层
        showOverlay('俄罗斯方块', '按下方按钮或空格键开始', '开始游戏');

        // 渲染初始帧
        renderFrame();
    }

    /**
     * 开始游戏
     */
    function startGame() {
        Board.reset();
        Score.init();
        dropTimer.reset();
        lockTimer.reset();
        lockDelayActive = false;

        currentPiece = spawnPiece();
        currentState = STATE.PLAYING;
        Input.setEnabled(true);

        hideOverlay();
        updateUI();

        // 启动游戏循环
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        gameLoop(performance.now());
    }

    /**
     * 暂停/恢复
     */
    function togglePause() {
        if (currentState === STATE.PLAYING) {
            currentState = STATE.PAUSED;
            Input.setEnabled(false);
            showOverlay('暂停', '按 P 或 ESC 继续', '继续游戏');
        } else if (currentState === STATE.PAUSED) {
            currentState = STATE.PLAYING;
            Input.setEnabled(true);
            hideOverlay();
            dropTimer.reset();
            gameLoop(performance.now());
        }
    }

    /**
     * 游戏结束
     */
    function gameOver() {
        currentState = STATE.GAME_OVER;
        Input.setEnabled(false);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        showOverlay('游戏结束', `最终得分: ${Score.getScore()}`, '重新开始');
    }

    /**
     * 生成新方块
     */
    function spawnPiece() {
        const type = Score.getNextPiece();
        const pos = Piece.getSpawnPosition(type);
        const piece = Piece.create(type, pos.row, pos.col);

        if (Board.isGameOver(piece)) {
            gameOver();
            return null;
        }

        ghostRow = Board.getHardDropRow(piece);
        return piece;
    }

    /**
     * 游戏主循环
     */
    function gameLoop(timestamp) {
        if (currentState !== STATE.PLAYING && currentState !== STATE.CLEARING) return;

        const delta = dropTimer.update(timestamp);

        if (currentState === STATE.CLEARING) {
            // 消行动画
            const done = Renderer.updateClearAnimation(delta);
            if (done) {
                currentState = STATE.PLAYING;
                currentPiece = spawnPiece();
                if (!currentPiece) return;
            }
        } else if (currentState === STATE.PLAYING) {
            // 自动下落
            if (dropTimer.consume(Score.getDropInterval())) {
                moveDown();
            }

            // 锁定延迟
            if (lockDelayActive) {
                lockTimer.update(timestamp);
                if (lockTimer.accumulated >= GameConfig.LOCK.DELAY ||
                    currentPiece.lockMoves >= GameConfig.LOCK.MAX_MOVES) {
                    lockPiece();
                }
            }
        }

        renderFrame();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    /**
     * 处理用户操作
     */
    function handleAction(action) {
        if (currentState === STATE.GAME_OVER || currentState === STATE.CLEARING) return;

        if (action === Input.ACTIONS.PAUSE) {
            togglePause();
            return;
        }

        if (currentState === STATE.IDLE) {
            if (action === Input.ACTIONS.HARD_DROP || action === Input.ACTIONS.ROTATE_CW) {
                startGame();
            }
            return;
        }

        if (currentState !== STATE.PLAYING || !currentPiece) return;

        switch (action) {
            case Input.ACTIONS.MOVE_LEFT:
                moveHorizontal(-1);
                break;
            case Input.ACTIONS.MOVE_RIGHT:
                moveHorizontal(1);
                break;
            case Input.ACTIONS.SOFT_DROP:
                moveDown(true);
                break;
            case Input.ACTIONS.HARD_DROP:
                hardDrop();
                break;
            case Input.ACTIONS.ROTATE_CW:
                rotate(1);
                break;
            case Input.ACTIONS.ROTATE_CCW:
                rotate(-1);
                break;
        }
    }

    /**
     * 水平移动
     */
    function moveHorizontal(direction) {
        if (Board.isValid(currentPiece, currentPiece.row, currentPiece.col + direction)) {
            currentPiece.col += direction;
            currentPiece.lockMoves++;
            ghostRow = Board.getHardDropRow(currentPiece);
            resetLockDelay();
        }
    }

    /**
     * 向下移动
     */
    function moveDown(isSoftDrop) {
        if (Board.isValid(currentPiece, currentPiece.row + 1, currentPiece.col)) {
            currentPiece.row++;
            if (isSoftDrop) {
                Score.addSoftDrop(1);
                updateUI();
            }
            lockDelayActive = false;
            lockTimer.reset();
        } else {
            // 触底，启动锁定延迟
            if (!lockDelayActive) {
                lockDelayActive = true;
                lockTimer.reset();
            }
        }
    }

    /**
     * 硬降
     */
    function hardDrop() {
        const dropDistance = ghostRow - currentPiece.row;
        currentPiece.row = ghostRow;
        Score.addHardDrop(dropDistance);
        updateUI();
        lockPiece();
    }

    /**
     * 旋转（SRS 踢墙）
     */
    function rotate(direction) {
        const newRotation = (currentPiece.rotation + direction + 4) % 4;
        const newShape = Piece.getRotatedShape(currentPiece, direction);
        const kicks = Piece.getWallKicks(currentPiece.type, currentPiece.rotation, newRotation);

        for (const [rowOffset, colOffset] of kicks) {
            if (Board.isValid(currentPiece, currentPiece.row + rowOffset, currentPiece.col + colOffset, newShape)) {
                currentPiece.shape = newShape;
                currentPiece.row += rowOffset;
                currentPiece.col += colOffset;
                currentPiece.rotation = newRotation;
                currentPiece.lockMoves++;
                ghostRow = Board.getHardDropRow(currentPiece);
                resetLockDelay();
                return;
            }
        }
    }

    /**
     * 锁定当前方块并处理消行
     */
    function lockPiece() {
        Board.lockPiece(currentPiece);
        lockDelayActive = false;
        lockTimer.reset();

        const result = Board.clearLines();

        if (result.count > 0) {
            // 启动消行动画
            currentState = STATE.CLEARING;
            Renderer.startClearAnimation(result.clearedRows);
            const scoreResult = Score.addScore(result.count);
            updateUI();

            if (scoreResult.levelUp) {
                const levelEl = uiElements.level;
                levelEl.classList.add('level-up');
                setTimeout(() => levelEl.classList.remove('level-up'), 600);
            }
        } else {
            // 无消行，直接生成新方块
            currentPiece = spawnPiece();
            if (!currentPiece) return;
        }

        updateUI();
    }

    /**
     * 重置锁定延迟
     */
    function resetLockDelay() {
        if (lockDelayActive) {
            lockTimer.reset();
        }
    }

    /**
     * 渲染当前帧
     */
    function renderFrame() {
        Renderer.render({
            currentPiece: currentPiece,
            ghostRow: ghostRow,
            lockedCells: Board.getLockedCells(),
            previewType: Score.getPreviewQueue()[0],
        });
    }

    /**
     * 更新 UI 显示
     */
    function updateUI() {
        if (uiElements.score) uiElements.score.textContent = Score.getScore();
        if (uiElements.level) uiElements.level.textContent = Score.getLevel();
        if (uiElements.lines) uiElements.lines.textContent = Score.getLines();
    }

    /**
     * 显示覆盖层
     */
    function showOverlay(title, subtitle, btnText) {
        if (uiElements.overlayTitle) uiElements.overlayTitle.textContent = title;
        if (uiElements.overlaySubtitle) uiElements.overlaySubtitle.textContent = subtitle;
        if (uiElements.overlayBtn) uiElements.overlayBtn.textContent = btnText;
        if (uiElements.overlay) uiElements.overlay.classList.remove('hidden');
    }

    /**
     * 隐藏覆盖层
     */
    function hideOverlay() {
        if (uiElements.overlay) uiElements.overlay.classList.add('hidden');
    }

    return {
        init,
        startGame,
        togglePause,
        STATE,
    };
})();
