# 川剧体验页面改造计划

## Context
将"演出信息"页面改造为"川剧体验"页面，保留原有演出信息内容，新增两大互动体验：
1. 从 knowledge.html 迁移"揭脸谱 3D 体验区"
2. 新增"测测你是哪种川剧脸谱"摄像头人脸识别游戏

## 一、导航更名（4 处）
- **app.js L14**: `label: "演出信息"` → `label: "川剧体验"`
- **index.html L43**: `<a href="shows.html">演出信息</a>` → `川剧体验`
- **index.html L92-94**: `演出信息` → `川剧体验`，`时间·地点·票价` → `体验·互动·测脸`
- **shows.html L6**: `<title>近期演出 · 川剧文化小站</title>` → `川剧体验 · 川剧文化小站`

## 二、迁移揭脸谱体验区
### knowledge.html（删除）
- 删除 L419-L435 的 `#kb-mask-peel` HTML 块和水袖分隔
- 删除 head 中的 `<script type="importmap">` 
- 删除底部 `<script type="module" src="mask-peel.js?v=5">`
- 版本号升 v=100

### shows.html（新增）
- head 加 importmap（three 引入）
- 演出信息后加水袖分隔 + `#kb-mask-peel` 体验区 HTML（从 knowledge.html 复制）
- 底部加 `<script type="module" src="mask-peel.js?v=6">`
- mask-peel.js 不需要改（已自带懒加载兜底）

## 三、新游戏：测测你是哪种川剧脸谱？

### 人脸识别方案
- **face-api.js**（CDN: `https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js`）
- 加载模型：`tinyFaceDetector` + `faceLandmark68Net`（从 CDN 加载权重文件）
- 获取 68 个面部关键点 → 计算脸型宽高比、眉角、眼型比

### 新文件：face-mask-game.js
功能模块：
1. **摄像头启动**：`getUserMedia` 请求摄像头，`<video>` 预览
2. **人脸检测**：face-api.js 检测 68 点 landmarks，提取：
   - 脸宽高比（点1-17轮廓 → width/height）
   - 眉毛角度（点18-27 → 斜率 → 上扬/平直/下垂）
   - 眼睛宽高比（点36-47 → eyeWidth/eyeHeight）
3. **匹配逻辑**（预设规则）：
   - 脸型 → 行当（圆/方脸→花脸/净角，长/椭圆→丑角，其他→整脸）
   - 眉形 → 神韵（剑眉→牛角眉/勇猛，下垂→奸诈/滑稽，细长→卧蚕眉/儒雅）
   - 眼型 → 气势（大/圆→豹头环眼/威猛，细长→丹凤眼/威严，小/下垂→狡猾）
4. **颜色选择**：根据特征推荐 2-3 个主色（红/黑/白/蓝/金），用户选择
5. **结果卡片**：动态生成脸谱卡（行当+主色+性格标签+角色类比+文化注解）

### shows.html 新增 HTML
- 水袖分隔 + 新 knowledge-block `#kb-face-game`
- 游戏标题"测测你是哪种川剧脸谱？"
- `<video id="camVideo">` 摄像头预览区
- "开始测试"按钮 → 摄像头权限请求
- "正在看相..."加载动画
- 颜色选择区（分析后显示）
- 结果卡片容器

### style.css 新增
- `.face-game-block` 游戏区样式（深色舞台底）
- `#camVideo` 视频样式（圆角、镜像翻转）
- `.face-game-btn` 按钮（金边朱红）
- `.color-options` 颜色选择卡片
- `.mask-result-card` 结果卡片（脸谱图+标签+注解）
- `.analyzing-overlay` 看相动画
- 移动端适配
- 版本号 v=100

## 四、文件改动清单
| 文件 | 操作 |
|---|---|
| shows.html | 重命名标题、加 importmap、加揭脸谱 HTML、加脸谱游戏 HTML、加脚本引用 |
| knowledge.html | 删除揭脸谱 HTML 块、importmap、脚本引用、升版本号 |
| face-mask-game.js | 新建：摄像头+face-api+匹配逻辑+结果生成 |
| mask-peel.js | 不改（v=6 版本号在 shows.html 引用处更新） |
| app.js | 导航更名"演出信息"→"川剧体验" |
| index.html | 导航和功能卡更名 |
| style.css | 新增游戏区样式，升版本号 v=100 |

## 五、验证方式
1. 打开 http://127.0.0.1:8000/shows.html 确认：
   - 导航显示"川剧体验"
   - 演出信息正常
   - 揭脸谱 3D 体验区可用（拖拽揭脸谱）
   - "测脸谱"游戏：点开始→摄像头→检测→选色→结果卡
2. 打开 knowledge.html 确认揭脸谱区已删除
3. 首页导航和功能卡显示"川剧体验"
