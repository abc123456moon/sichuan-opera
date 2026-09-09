# 揭脸谱 3D 交互体验区 — 实施计划

## Context
用户想在 knowledge.html 的"变脸方式"板块下方，用变色水袖分隔，嵌入一个 Three.js 3D 交互体验区。用户拖拽揭下脸谱，逐层变换（素白→红→金→黑→素白），每层配剧情旁白，完成后显示用时。要求不用图片，用程序化 3D 建模 + 卡通渲染实现"原神感"。

## 技术方案

### 3D 引擎
- Three.js r160+ 通过 CDN `<script type="importmap">` 引入（ES Module 模式， unpkg/jsdelivr）
- 单独文件 `mask-peel.js`（ES Module），避免污染现有脚本

### 3D 脸谱建模（程序化生成，无外部资源）
- 用 `LatheGeometry` 旋转一条脸谱纵截面轮廓线 → 形成凸曲面具
- 截取前半面（角度范围 0~π），背面开放，模拟真实脸谱壳体
- 边缘加一圈微微外翻的"沿"（轮廓线末端向外弯），方便看到厚度
- 4 层脸谱：素白(#F5F0E6)、红(#C43028)、金(#D4A017)、黑(#1A1614)，每层独立 Mesh，叠放

### 卡通渲染（原神风格）
- `MeshToonMaterial` + 自定义 gradientMap（3级色阶）实现色块化
- 添加 RimLight 边缘光（自定义着色器注入）
- 后处理 OutlinePass 或简化版：克隆几何体放大 1.03 倍 + BackSide 黑色描边
- 深色渐变背景 + 底部聚光灯（SpotLight 暖光）营造舞台氛围

### 揭脸交互
- 4 层脸谱 Mesh 叠放在同一位置，z 轴略有偏移
- `Raycaster` 检测用户是否抓到当前最上层脸谱的边缘区域
- 鼠标/触摸向下或侧方拖拽时，更新 `peelProgress`（0→1）
- 顶点着色器（onBeforeCompile 注入）根据 peelProgress：
  - 卷曲效果：沿 Y 轴旋转 + 沿拖拽方向位移 + 法线翻折
  - 透明度渐变：揭到一半后 alpha 降低
- peelProgress > 0.85 时自动完成揭下，当前层淡出消失，露出下一层
- 重置：第 4 层揭完回到素白，显示结语 + 用时

### 剧情系统
- 4 层对应旁白（红/金/黑/素白），揭下后底部浮现旁白文字
- 旁白用打字机效果逐字显示（复用现有打字机模式）
- 全部完成后显示结语 + 用时对比

## 文件改动

### 1. knowledge.html
- **L393 后**（变脸方式 `</div>` 之后）：插入变色水袖 ribbon-divider（复用 ribbonGradMask 渐变）+ 新 knowledge-block `#kb-mask-peel`
- 体验区 HTML：`<canvas id="maskPeelCanvas">` + 旁白容器 + 提示文字 + 计时器
- **`</head>` 前**：加 `<script type="importmap">` 引入 three
- **底部脚本区**：加 `<script type="module" src="mask-peel.js?v=1"></script>`

### 2. mask-peel.js（新建）
- 模块结构：Scene 初始化 → 脸谱生成 → 卡通材质 → 揭脸着色器 → 拖拽交互 → 剧情状态机 → 计时器
- 约 400-500 行

### 3. style.css
- `.mask-peel-block` 体验区容器样式（深色背景、圆角、阴影）
- `#maskPeelCanvas` canvas 样式（宽高、touch-action: none）
- `.peel-narration` 旁白文字样式（金色素底、打字机光标）
- `.peel-hint` / `.peel-timer` 提示与计时样式
- 版本号升至 v=99

## 交互流程
1. 用户滚动到体验区 → 3D 场景加载，素白脸谱悬浮
2. 提示"按住脸谱边缘，向下拉——"
3. 用户按住拖拽 → 顶层脸谱卷起剥离 → 露出下一层
4. 旁白浮现 → 用户继续揭 → 4 层全部揭完
5. 显示结语 + 用时"你用了 X 秒"

## 验证方式
- 启动本地服务器，打开 http://127.0.0.1:8000/knowledge.html#kb-mask-peel
- 确认 3D 脸谱渲染、可拖拽揭下、旁白出现、计时正确
- 移动端触控测试
- 性能：FPS > 40（简化几何体 + ToonMaterial 轻量渲染）
