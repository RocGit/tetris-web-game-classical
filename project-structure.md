# 俄罗斯方块网页游戏 — 项目目录结构

## 项目概述

- **技术栈**：纯 HTML / CSS / JavaScript（无构建工具，浏览器直接运行）
- **游戏模式**：经典模式（标准方块、旋转、消行、计分、等级递增、预览）
- **视觉风格**：现代霓虹风（渐变色彩、流畅动画、深色背景）
- **操作方式**：键盘 + 触屏

---

## 目录结构

```
tetris-web-game/
│
├── index.html                    # 游戏主入口页面
│
├── css/
│   ├── reset.css                 # 样式重置（浏览器兼容性）
│   ├── layout.css                # 页面布局与响应式适配
│   ├── neon-theme.css            # 霓虹主题（发光效果、渐变色、深色背景）
│   └── animations.css            # 动画效果（消行闪烁、方块落地、粒子特效）
│
├── js/
│   ├── config.js                 # 游戏配置常量（网格尺寸、速度、颜色映射等）
│   ├── board.js                  # 游戏面板管理（网格状态、碰撞检测、消行判定）
│   ├── piece.js                  # 方块系统（7种标准方块定义、SRS旋转系统）
│   ├── renderer.js               # Canvas 渲染引擎（绘制方块、网格、特效）
│   ├── input.js                  # 输入管理器（键盘事件 + 触屏手势/虚拟按钮）
│   ├── score.js                  # 计分与等级系统（分数计算、速度递增、预览队列）
│   ├── game.js                   # 游戏主控制器（状态机、游戏循环、流程管理）
│   ├── main.js                   # 入口文件（初始化、启动游戏）
│   └── utils.js                  # 通用工具函数（矩阵操作、随机生成等）
│
├── assets/
│   ├── fonts/                    # 自定义字体文件（可选）
│   └── sounds/                   # 音效文件（可选）
│
└── README.md                     # 项目说明文档
```

---

## 模块职责说明

| 模块 | 职责 | 依赖 |
|------|------|------|
| `config.js` | 集中管理所有游戏常量，便于调参 | 无 |
| `board.js` | 10×20 网格的创建、方块放置、碰撞检测、消行 | `config.js` |
| `piece.js` | I/O/T/S/Z/J/L 七种方块的形状矩阵与 SRS 旋转 | `config.js` |
| `renderer.js` | Canvas 绘制：方块渲染、网格线、霓虹发光、动画 | `config.js`, `board.js`, `piece.js` |
| `input.js` | 键盘监听 + 触屏滑动/虚拟按钮，统一输出操作指令 | 无 |
| `score.js` | 消行计分、等级提升、下落速度计算、下一个方块预览 | `config.js` |
| `game.js` | 游戏状态机（就绪/进行/暂停/结束），主循环协调 | 所有模块 |
| `main.js` | DOM 加载后初始化所有模块并启动游戏 | `game.js` |
| `utils.js` | 矩阵旋转、深拷贝、7-bag 随机算法等 | 无 |

---

## 数据流与依赖关系

```
main.js → game.js ←→ board.js ←→ piece.js
                ↕                    ↕
            score.js            renderer.js
                ↕
            input.js ← 用户操作
                ↕
            config.js（全局配置）
```

---

## CSS 文件加载顺序

```html
<link rel="stylesheet" href="css/reset.css">
<link rel="stylesheet" href="css/neon-theme.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/animations.css">
```

> 加载顺序：reset → 主题变量 → 布局 → 动画（后者覆盖前者）

---

## JS 文件加载顺序

```html
<script src="js/config.js"></script>
<script src="js/utils.js"></script>
<script src="js/piece.js"></script>
<script src="js/board.js"></script>
<script src="js/score.js"></script>
<script src="js/input.js"></script>
<script src="js/renderer.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>
```

> 加载顺序：无依赖模块 → 基础模块 → 功能模块 → 控制器 → 入口

---

## 关键设计决策

1. **模块化但无构建工具**：通过 `<script>` 标签按依赖顺序加载，每个 JS 文件暴露全局对象/函数
2. **Canvas 渲染**：使用 HTML5 Canvas 绘制游戏画面，支持霓虹发光等特效
3. **配置集中化**：所有可调参数集中在 `config.js`，便于后续调整游戏体验
4. **输入抽象层**：`input.js` 将键盘和触屏事件统一转换为标准游戏操作指令，降低耦合
5. **SRS 旋转系统**：采用标准 Super Rotation System，确保方块旋转行为符合经典体验
6. **7-Bag 随机算法**：每7个方块为一组随机排列，保证方块分布均匀
