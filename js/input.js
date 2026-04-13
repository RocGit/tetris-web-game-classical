/**
 * input.js - 输入管理器
 * 键盘事件监听 + 触屏手势/虚拟按钮，统一输出游戏操作指令
 */

const Input = (() => {
    // 游戏操作枚举
    const ACTIONS = {
        MOVE_LEFT: 'move_left',
        MOVE_RIGHT: 'move_right',
        SOFT_DROP: 'soft_drop',
        HARD_DROP: 'hard_drop',
        ROTATE_CW: 'rotate_cw',     // 顺时针旋转
        ROTATE_CCW: 'rotate_ccw',    // 逆时针旋转
        PAUSE: 'pause',
        HOLD: 'hold',                // 暂留（保留接口）
    };

    // 操作回调
    let onAction = null;

    // DAS（延迟自动移位）状态
    let dasState = {
        key: null,
        timer: null,
        repeatTimer: null,
        isRepeating: false,
    };

    // 触屏状态
    let touchState = {
        startX: 0,
        startY: 0,
        startTime: 0,
        isActive: false,
    };

    /**
     * 初始化输入监听
     * @param {Function} callback - 操作回调 function(action: string)
     */
    function init(callback) {
        onAction = callback;
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        initTouchControls();
    }

    /**
     * 销毁输入监听
     */
    function destroy() {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        clearDAS();
    }

    // --- 键盘处理 ---

    function handleKeyDown(e) {
        if (!onAction) return;

        const action = keyToAction(e.code);
        if (!action) return;

        e.preventDefault();

        if (action === ACTIONS.PAUSE || action === ACTIONS.HARD_DROP ||
            action === ACTIONS.ROTATE_CW || action === ACTIONS.ROTATE_CCW) {
            // 立即触发，不重复
            onAction(action);
            return;
        }

        // 可重复操作（左右移动、软降）使用 DAS
        if (dasState.key !== e.code) {
            clearDAS();
            dasState.key = e.code;
            onAction(action);
            dasState.timer = setTimeout(() => {
                dasState.isRepeating = true;
                dasState.repeatTimer = setInterval(() => {
                    onAction(action);
                }, GameConfig.DAS.REPEAT);
            }, GameConfig.DAS.DELAY);
        }
    }

    function handleKeyUp(e) {
        if (dasState.key === e.code) {
            clearDAS();
        }
    }

    function clearDAS() {
        if (dasState.timer) {
            clearTimeout(dasState.timer);
            dasState.timer = null;
        }
        if (dasState.repeatTimer) {
            clearInterval(dasState.repeatTimer);
            dasState.repeatTimer = null;
        }
        dasState.key = null;
        dasState.isRepeating = false;
    }

    function keyToAction(code) {
        const keyMap = {
            'ArrowLeft': ACTIONS.MOVE_LEFT,
            'ArrowRight': ACTIONS.MOVE_RIGHT,
            'ArrowDown': ACTIONS.SOFT_DROP,
            'ArrowUp': ACTIONS.ROTATE_CW,
            'Space': ACTIONS.HARD_DROP,
            'KeyX': ACTIONS.ROTATE_CW,
            'KeyZ': ACTIONS.ROTATE_CCW,
            'KeyP': ACTIONS.PAUSE,
            'Escape': ACTIONS.PAUSE,
        };
        return keyMap[code] || null;
    }

    // --- 触屏控制 ---

    function initTouchControls() {
        // 绑定虚拟按钮
        const buttons = {
            'touch-left': ACTIONS.MOVE_LEFT,
            'touch-right': ACTIONS.MOVE_RIGHT,
            'touch-down': ACTIONS.SOFT_DROP,
            'touch-rotate': ACTIONS.ROTATE_CW,
            'touch-drop': ACTIONS.HARD_DROP,
            'touch-pause': ACTIONS.PAUSE,
        };

        Object.entries(buttons).forEach(([id, action]) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            // 支持长按重复（仅移动和软降）
            let interval = null;
            const repeatable = [ACTIONS.MOVE_LEFT, ACTIONS.MOVE_RIGHT, ACTIONS.SOFT_DROP].includes(action);

            const startHandler = (e) => {
                e.preventDefault();
                if (onAction) onAction(action);
                if (repeatable) {
                    interval = setInterval(() => {
                        if (onAction) onAction(action);
                    }, GameConfig.DAS.REPEAT);
                }
            };

            const endHandler = (e) => {
                e.preventDefault();
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            };

            btn.addEventListener('touchstart', startHandler, { passive: false });
            btn.addEventListener('touchend', endHandler, { passive: false });
            btn.addEventListener('touchcancel', endHandler, { passive: false });
            btn.addEventListener('mousedown', startHandler);
            btn.addEventListener('mouseup', endHandler);
            btn.addEventListener('mouseleave', endHandler);
        });
    }

    /**
     * 暂停/恢复输入
     */
    function setEnabled(enabled) {
        // 可用于暂停时禁用输入
        if (!enabled) {
            clearDAS();
        }
    }

    return {
        ACTIONS,
        init,
        destroy,
        setEnabled,
    };
})();
