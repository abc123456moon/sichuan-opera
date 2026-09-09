(function () {
  var startBtn = document.getElementById('faceGameStart');
  var captureBtn = document.getElementById('faceGameCapture');
  var retryBtn = document.getElementById('faceGameRetry');
  var shareBtn = document.getElementById('faceGameShare');
  var backBtn = document.getElementById('faceGameBack');
  var uploadBtn = document.getElementById('faceGameUpload');
  var fileInput = document.getElementById('faceGameFile');
  var initDiv = document.getElementById('faceGameInit');
  var camDiv = document.getElementById('faceGameCamera');
  var colorsDiv = document.getElementById('faceGameColors');
  var resultDiv = document.getElementById('faceGameResult');
  var resultCard = document.getElementById('maskResultCard');
  var overlay = document.getElementById('faceGameOverlay');
  var analyzingOverlay = document.getElementById('analyzingOverlay');
  var analyzingSub = document.getElementById('analyzingSub');
  var camVideo = document.getElementById('camVideo');
  var colorOptions = document.getElementById('colorOptions');
  if (!startBtn) return;

  var stream = null;
  var modelsLoaded = false;
  var faceFeatures = null;
  var feat = null;

  // ===== 加载 face-api.js 模型 =====
  // vladmandic/face-api 模型权重（与 face-api.js 0.22.2 兼容）
  var MODEL_URLS = [
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model',
    'https://unpkg.com/@vladmandic/face-api@1.7.13/model',
    'https://cdn.jsdelivr.net/gh/vladmandic/face-api@master/model'
  ];
  var modelsLoaded = false;
  async function loadModels() {
    if (modelsLoaded) return;
    analyzingSub.textContent = '正在加载识别模型...';
    var lastErr = null;
    for (var i = 0; i < MODEL_URLS.length; i++) {
      try {
        analyzingSub.textContent = '正在加载模型(' + (i+1) + '/' + MODEL_URLS.length + ')...';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URLS[i]);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URLS[i]);
        modelsLoaded = true;
        return;
      } catch (e) {
        console.warn('Model load failed from ' + MODEL_URLS[i] + ':', e.message);
        lastErr = e;
      }
    }
    throw lastErr || new Error('所有模型 CDN 均加载失败');
  }

  // ===== 启动摄像头 =====
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
      camVideo.srcObject = stream;
      await new Promise(function (r) { camVideo.onloadedmetadata = r; });
      camVideo.style.display = '';
      camVideo.play();
      return true;
    } catch (e) {
      alert('摄像头启动失败: ' + e.message + '\n\n请确保:\n1. 使用 HTTPS 或 localhost 访问\n2. 已授权摄像头权限');
      return false;
    }
  }

  // ===== 人脸检测 + 特征提取 =====
  // source: 摄像头 video 元素或用户上传的 img 元素,face-api 对两者 API 相同
  async function detectFace(source) {
    var options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    var result = await faceapi
      .detectSingleFace(source, options)
      .withFaceLandmarks();

    if (!result) {
      alert('未检测到人脸,请确保:\n1. 面部正对镜头\n2. 光线充足\n3. 无遮挡(照片请用清晰的正面照)');
      return null;
    }

    var lm = result.landmarks.positions; // 68 点数组

    // --- 脸型宽高比 ---
    // 脸宽: 下颌轮廓两端(点1→点17)
    // 脸高: 眉间(点左右眉内端22/23的中点)到下巴(点9),这才是有效脸长
    var midBrow = {
      x: (lm[21].x + lm[22].x) / 2,
      y: (lm[21].y + lm[22].y) / 2
    };
    var faceWidth = Math.hypot(lm[16].x - lm[0].x, lm[16].y - lm[0].y);
    var faceHeight = Math.hypot(lm[8].x - midBrow.x, lm[8].y - midBrow.y);
    var faceRatio = faceWidth / faceHeight;

    // --- 眉毛角度 ---
    // 右眉: 外端17 → 内端21; 左眉: 内端22 → 外端26 (各自眉毛内比较,不跨眉)
    // 上扬(剑眉): 外端高于内端 → 斜率为正; 下垂(八字眉) → 斜率为负
    var rightBrowSlope = (lm[21].y - lm[17].y) / Math.max(1, lm[21].x - lm[17].x);
    var leftBrowSlope = (lm[22].y - lm[26].y) / Math.max(1, lm[26].x - lm[22].x);
    var browSlope = (rightBrowSlope + leftBrowSlope) / 2;

    // --- 眼睛宽高比 ---
    // 左眼: 点37(上) 到点41(下), 宽: 36→39
    // 右眼: 点44(上) 到点46(下), 宽: 42→45
    var leftEyeW = Math.hypot(lm[39].x - lm[36].x, lm[39].y - lm[36].y);
    var leftEyeH = Math.hypot(lm[41].x - lm[37].x, lm[41].y - lm[37].y);
    var rightEyeW = Math.hypot(lm[45].x - lm[42].x, lm[45].y - lm[42].y);
    var rightEyeH = Math.hypot(lm[46].x - lm[44].x, lm[46].y - lm[44].y);
    var eyeRatio = ((leftEyeW / leftEyeH) + (rightEyeW / rightEyeH)) / 2;

    return {
      faceRatio: faceRatio,
      browSlope: browSlope,
      eyeRatio: eyeRatio,
      landmarks: lm
    };
  }

  // ===== 匹配逻辑 =====
  function matchMask(feat) {
    var role, browType, eyeType;

    // 第一步: 脸型+眉形+眼形 综合评分 → 行当
    // v15: 脸型权重最高,眉/眼只对极端值轻微修正。
    // 修复"人人都是丑角":旧版眉斜率-0.12/眼比4.5阈值太松,
    // 多数人轻微下垂眉+略眯眼就累计-1分被划进丑角(丑角仅白色→跳过选色)。
    // 现丑角需 s<=-2 强证据,中性带归生角。
    var s = 0;
    if (feat.faceRatio >= 1.16) {
      s += 2;                                   // 明显宽脸盘,大气威武
    } else if (feat.faceRatio >= 1.10) {
      s += 1;                                   // 偏宽
    } else if (feat.faceRatio < 0.96) {
      s -= 2;                                   // 明显窄长脸
    } else if (feat.faceRatio < 1.02) {
      s -= 1;                                   // 偏窄
    }
    // 眉形辅助:只对明显剑眉/明显八字眉计分(阈值收紧)
    if (feat.browSlope > 0.15) s += 1;
    else if (feat.browSlope < -0.20) s -= 1;
    // 眼型辅助:只对极端圆眼/极端细长眼计分
    if (feat.eyeRatio < 2.8) s += 1;
    else if (feat.eyeRatio > 5.0) s -= 1;

    console.log('[脸谱诊断] 脸型宽高比=' + feat.faceRatio.toFixed(2) +
      ' | 眉斜率=' + feat.browSlope.toFixed(2) +
      ' | 眼宽高比=' + feat.eyeRatio.toFixed(2) +
      ' | 综合评分=' + s);

    if (s >= 2) {
      role = { name: '花脸', type: '净角', desc: '勇猛豪放,气宇轩昂' };
    } else if (s <= -2) {
      role = { name: '丑角', type: '丑角', desc: '诙谐机智,妙语连珠' };
    } else {
      role = { name: '整脸', type: '生角', desc: '庄重严肃,沉稳内敛' };
    }

    // 第二步: 眉形 → 神韵
    if (feat.browSlope > 0.12) {
      browType = { name: '剑眉', desc: '上扬如剑,勇猛直率,有英雄气' };
    } else if (feat.browSlope < -0.12) {
      browType = { name: '八字眉', desc: '下垂如八,多谋善思,机敏灵活' };
    } else {
      browType = { name: '卧蚕眉', desc: '形如卧蚕,儒雅忠义,有儒将风' };
    }

    // 第三步: 眼型 → 气势
    if (feat.eyeRatio < 3.0) {
      eyeType = { name: '豹头环眼', desc: '大而圆,威猛刚烈,气势如虹' };
    } else if (feat.eyeRatio > 4.5) {
      eyeType = { name: '丹凤眼', desc: '细长如凤,威严忠诚,气定神闲' };
    } else {
      eyeType = { name: '平眼', desc: '中正平和,藏而不露,沉稳内敛' };
    }

    // 推荐颜色:与科普页 8 种主色(红黑白蓝绿黄紫粉)保持一致,不含金色;
    // 蓝脸属净角,丑角以豆腐块白脸为主,每个组合都有对应角色
    // v17: 用眉形+眼型+脸型给每个颜色打分,只推荐最匹配的1-2个,增大指向性和区分度
    var ALL_COLORS = {
      '黑': { color: '黑', hex: '#1A1614', meaning: '刚直勇猛' },
      '红': { color: '红', hex: '#C43028', meaning: '忠勇正义' },
      '白': { color: '白', hex: '#E8DDC8', meaning: '深谋远虑' },
      '蓝': { color: '蓝', hex: '#2B4A8C', meaning: '刚强绿林' }
    };

    // 每种颜色根据面部特征打分(0~10),高分=更匹配
    function scoreColors(roleType, feat) {
      var scores = {};
      if (roleType === '净角') {
        // 黑(张飞型):宽脸+圆眼+剑眉 → 威猛刚直
        scores['黑'] = (feat.faceRatio >= 1.12 ? 3 : 1) +
                       (feat.eyeRatio < 3.2 ? 3 : 1) +
                       (feat.browSlope > 0.10 ? 2 : 0.5) + 1;
        // 红(关羽型):剑眉+中偏圆眼 → 忠义
        scores['红'] = (feat.browSlope > 0.08 ? 3 : 1) +
                       (feat.eyeRatio < 3.5 ? 2 : 1) +
                       (feat.faceRatio >= 1.05 ? 2 : 1) + 1;
        // 白(曹操型):八字眉+细长眼+偏窄脸 → 深谋
        scores['白'] = (feat.browSlope < -0.08 ? 3 : 0.5) +
                       (feat.eyeRatio > 3.8 ? 2 : 1) +
                       (feat.faceRatio < 1.08 ? 2 : 0.5) + 1;
        // 蓝(窦尔敦型):宽脸+八字/平眉 → 绿林豪气
        scores['蓝'] = (feat.faceRatio >= 1.10 ? 3 : 1) +
                       (feat.browSlope < 0.05 ? 2 : 0.5) +
                       (feat.eyeRatio > 3.0 ? 2 : 1) + 1;
      } else {
        // 生角: 红/黑/白 三色
        // 红(关羽型):剑眉+圆眼 → 忠义
        scores['红'] = (feat.browSlope > 0.08 ? 3 : 1) +
                       (feat.eyeRatio < 3.3 ? 3 : 1) + 2;
        // 黑(包公型):平眉+平眼 → 刚正
        scores['黑'] = (feat.browSlope >= -0.08 && feat.browSlope <= 0.12 ? 3 : 1) +
                       (feat.eyeRatio >= 3.0 && feat.eyeRatio <= 4.2 ? 3 : 1) + 2;
        // 白(陈世美型):八字眉+细长眼 → 复杂
        scores['白'] = (feat.browSlope < -0.06 ? 3 : 0.5) +
                       (feat.eyeRatio > 3.6 ? 3 : 1) + 2;
      }
      return scores;
    }

    // 丑角:只有豆腐块白脸,无需选色,直接返回
    if (role.type === '丑角') {
      var colors = [{ color: '白', hex: '#E8DDC8', meaning: '诙谐机敏' }];
      return { role: role, browType: browType, eyeType: eyeType, colors: colors };
    }

    var colorScores = scoreColors(role.type, feat);
    var rankedColors = Object.keys(colorScores).map(function (k) {
      return { color: k, score: colorScores[k] };
    }).sort(function (a, b) { return b.score - a.score; });

    console.log('[脸谱诊断] 颜色评分:', rankedColors.map(function (c) {
      return c.color + '=' + c.score.toFixed(1);
    }).join(' | '));

    // 只取得分最高1-2个:如果第1名领先第2名≥2分,只推1个;否则推2个
    var pickedColors;
    if (rankedColors.length === 1 || (rankedColors[0].score - rankedColors[1].score) >= 2) {
      pickedColors = [ALL_COLORS[rankedColors[0].color]];
    } else {
      pickedColors = [ALL_COLORS[rankedColors[0].color], ALL_COLORS[rankedColors[1].color]];
    }

    var colors = pickedColors;

    return { role: role, browType: browType, eyeType: eyeType, colors: colors };
  }

  // ===== 颜色选择 → 角色类比 =====
  function getCharacter(roleType, colorName) {
    var chars = {
      '净角-黑': { name: '张飞', quote: '义薄云天,勇猛无双', mask: 'zhangfei' },
      '净角-红': { name: '关羽', quote: '忠义赤诚,义薄云天', mask: 'guanyu' },
      '净角-白': { name: '曹操', quote: '深谋远虑,一代枭雄', mask: 'caocao' },
      '净角-蓝': { name: '窦尔敦', quote: '绿林好汉,刚强不屈', mask: 'douerdon' },
      '丑角-白': { name: '蒋干', quote: '机敏过人,心思活络', mask: 'jianggan' },
      '生角-红': { name: '关羽', quote: '义薄云天的关云长', mask: 'guanyu' },
      '生角-黑': { name: '包公', quote: '铁面无私,刚正不阿', mask: 'baogong' },
      '生角-白': { name: '陈世美', quote: '外表俊朗,内心复杂', mask: 'chenshimei' }
    };
    return chars[roleType + '-' + colorName] || { name: '无名好汉', quote: '形神兼备,意韵深远', mask: 'default' };
  }

  // ===== 生成结果卡片 =====
  var lastResult = null;

  // 渲染主色选择卡片(拍照流程与"返回选色"共用)
  function showColorOptions(colors) {
    backBtn.style.display = '';
    colorsDiv.style.display = 'block';
    colorOptions.innerHTML = '';
    colors.forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'color-card';
      card.innerHTML =
        '<div class="color-swatch" style="background:' + c.hex + '"></div>' +
        '<span class="color-name">' + c.color + '</span>' +
        '<span class="color-meaning">' + c.meaning + '</span>';
      card.addEventListener('click', function () {
        colorsDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        generateResult(faceFeatures, c);
      });
      colorOptions.appendChild(card);
    });
  }

  function generateResult(match, chosenColor) {
    var char = getCharacter(match.role.type, chosenColor.color);
    var maskSvg = generateMaskSvg(chosenColor.hex, match.role.name);

    lastResult = { match: match, color: chosenColor, char: char, photo: null };

    resultCard.innerHTML =
      '<div class="result-mask-visual" id="resultMaskVisual">' + maskSvg + '</div>' +
      '<div class="result-info">' +
        '<div class="result-color-tag" style="border-color:' + chosenColor.hex + '">' +
          '<span class="result-color-chip" style="background:' + chosenColor.hex + '"></span>' +
          chosenColor.color + '脸 · ' + chosenColor.meaning +
        '</div>' +
        '<h3 class="result-role-title">' + match.role.type + ' · ' + match.role.name + '</h3>' +
        '<div class="result-tags">' +
          '<span class="result-tag">' + match.role.desc + '</span>' +
          '<span class="result-tag">' + match.browType.name + ' · ' + match.browType.desc + '</span>' +
          '<span class="result-tag">' + match.eyeType.name + ' · ' + match.eyeType.desc + '</span>' +
        '</div>' +
        '<div class="result-character">' +
          '<span class="result-char-label">最像:</span>' +
          '<span class="result-char-name">' + char.name + '</span>' +
          '<span class="result-char-quote">「' + char.quote + '」</span>' +
        '</div>' +
        '<p class="result-culture">' +
          '你的脸谱气质,神似「' + char.quote + '」的' + char.name + '。' +
          '脸谱上' + match.browType.name + '象征' + match.browType.desc + '。' +
          chosenColor.color + '色在川剧中代表「' + chosenColor.meaning + '」。' +
        '</p>' +
        '<p class="result-disclaimer">* 本测试仅供娱乐，结果仅作趣味参考，请勿当真。</p>' +
      '</div>';

    // 尝试加载用户上传的实拍脸谱图(images/face_<角色>.jpg);
    // 图片不存在时保留程序化 SVG,不影响功能
    var photo = new Image();
    photo.className = 'result-mask-photo';
    photo.alt = char.name + '脸谱';
    photo.onload = function () {
      lastResult.photo = photo;
      var visual = document.getElementById('resultMaskVisual');
      if (visual) { visual.innerHTML = ''; visual.appendChild(photo); }
    };
    photo.src = 'images/face_' + char.mask + '.jpg';
  }

  // ===== 程序化脸谱 SVG =====
  function generateMaskSvg(color, roleName) {
    var id = 'mask' + Date.now();
    return '' +
      '<svg viewBox="0 0 200 260" class="result-mask-svg" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<radialGradient id="' + id + '" cx="50%" cy="40%" r="55%">' +
            '<stop offset="0%" stop-color="' + lightenColor(color, 30) + '" />' +
            '<stop offset="60%" stop-color="' + color + '" />' +
            '<stop offset="100%" stop-color="' + darkenColor(color, 30) + '" />' +
          '</radialGradient>' +
        '</defs>' +
        // 脸壳主体
        '<path d="M100 10 C140 12, 170 35, 175 75 C178 110, 168 160, 145 200 C130 225, 115 245, 100 250 C85 245, 70 225, 55 200 C32 160, 22 110, 25 75 C30 35, 60 12, 100 10 Z" fill="url(#' + id + ')" stroke="' + darkenColor(color, 40) + '" stroke-width="2"/>' +
        // 眉毛
        '<path d="M55 90 Q75 78, 95 88" stroke="' + darkenColor(color, 50) + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M105 88 Q125 78, 145 90" stroke="' + darkenColor(color, 50) + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        // 眼窝
        '<ellipse cx="78" cy="105" rx="16" ry="10" fill="' + lightenColor(color, 40) + '" opacity="0.6"/>' +
        '<ellipse cx="122" cy="105" rx="16" ry="10" fill="' + lightenColor(color, 40) + '" opacity="0.6"/>' +
        // 瞳孔
        '<circle cx="78" cy="105" r="5" fill="#1A1614"/>' +
        '<circle cx="122" cy="105" r="5" fill="#1A1614"/>' +
        // 鼻梁
        '<path d="M100 110 L100 150" stroke="' + darkenColor(color, 30) + '" stroke-width="3" stroke-linecap="round"/>' +
        // 嘴
        '<path d="M80 175 Q100 183, 120 175" stroke="' + darkenColor(color, 40) + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  function lightenColor(hex, amount) {
    var c = hex.replace('#', '');
    var r = parseInt(c.substr(0, 2), 16);
    var g = parseInt(c.substr(2, 2), 16);
    var b = parseInt(c.substr(4, 2), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
  }
  function darkenColor(hex, amount) {
    var c = hex.replace('#', '');
    var r = parseInt(c.substr(0, 2), 16);
    var g = parseInt(c.substr(2, 2), 16);
    var b = parseInt(c.substr(4, 2), 16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
  }

  // ===== 分享:生成结果海报图并下载 =====
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCover(ctx, img, x, y, w, h) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var scale = Math.max(w / iw, h / ih);
    var dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function svgToImage(svgEl) {
    var clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '400');
    clone.setAttribute('height', '520');
    var data = new XMLSerializer().serializeToString(clone);
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
    });
  }

  async function shareResult(btn) {
    if (!lastResult) return;
    var oldText = btn.textContent;
    btn.textContent = '🎨 正在生成...';
    btn.disabled = true;
    try {
      var W = 750, H = 1120;
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');
      var m = lastResult.match, c = lastResult.color, ch = lastResult.char;
      var KAI = '"KaiTi","STKaiti","楷体",serif';

      // 背景:深赭木色渐变
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#4a2b16');
      bg.addColorStop(0.55, '#5c3a1e');
      bg.addColorStop(1, '#38200f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 金边双线框
      ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 6;
      roundRectPath(ctx, 26, 26, W - 52, H - 52, 18); ctx.stroke();
      ctx.strokeStyle = 'rgba(201,168,76,0.35)'; ctx.lineWidth = 2;
      roundRectPath(ctx, 40, 40, W - 80, H - 80, 12); ctx.stroke();

      // 标题
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D8C49A';
      ctx.font = '26px ' + KAI;
      ctx.fillText('川剧文化小站 · 川剧体验', W / 2, 92);
      ctx.fillStyle = '#F4D98A';
      ctx.font = 'bold 54px ' + KAI;
      ctx.fillText('我的川剧脸谱', W / 2, 162);

      // 脸谱图(实拍图优先,否则用程序化 SVG)
      var maskImg = lastResult.photo;
      if (!maskImg) {
        var svgEl = resultCard.querySelector('.result-mask-svg');
        if (svgEl) maskImg = await svgToImage(svgEl);
      }
      var bx = 215, by = 198, bw = 320, bh = 320;
      if (maskImg) {
        ctx.save();
        roundRectPath(ctx, bx, by, bw, bh, 16);
        ctx.clip();
        ctx.fillStyle = '#F0E4D0';
        ctx.fillRect(bx, by, bw, bh);
        drawCover(ctx, maskImg, bx, by, bw, bh);
        ctx.restore();
        ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 4;
        roundRectPath(ctx, bx, by, bw, bh, 16); ctx.stroke();
      }

      // 主色标签(色块 + 文字)
      var tagText = c.color + '脸 · ' + c.meaning;
      ctx.font = '30px ' + KAI;
      var tw = ctx.measureText(tagText).width;
      var chipR = 12, gap = 14;
      var totalW = chipR * 2 + gap + tw;
      var sx = W / 2 - totalW / 2;
      var tagY = 586;
      ctx.fillStyle = c.hex;
      ctx.beginPath(); ctx.arc(sx + chipR, tagY - 10, chipR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#F0E4D0';
      ctx.fillText(tagText, sx + chipR * 2 + gap, tagY);

      // 行当
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F4D98A';
      ctx.font = 'bold 42px ' + KAI;
      ctx.fillText(m.role.type + ' · ' + m.role.name, W / 2, 652);

      // 最像角色
      ctx.fillStyle = '#E8D8B0';
      ctx.font = '34px ' + KAI;
      ctx.fillText('最像 ' + ch.name, W / 2, 718);
      ctx.fillStyle = '#D8C49A';
      ctx.font = 'italic 25px ' + KAI;
      ctx.fillText('「' + ch.quote + '」', W / 2, 762);

      // 三条五官特征
      var tags = [
        m.role.desc,
        m.browType.name + ' · ' + m.browType.desc,
        m.eyeType.name + ' · ' + m.eyeType.desc
      ];
      ctx.font = '24px ' + KAI;
      tags.forEach(function (t, i) {
        var y = 830 + i * 50;
        var w = ctx.measureText(t).width;
        ctx.fillStyle = '#C9A84C';
        ctx.beginPath(); ctx.arc(W / 2 - w / 2 - 18, y - 8, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#CBB58A';
        ctx.fillText(t, W / 2, y);
      });

      // 分隔线 + 页脚
      ctx.strokeStyle = 'rgba(201,168,76,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(180, 990); ctx.lineTo(W - 180, 990); ctx.stroke();
      ctx.fillStyle = '#B89A5E';
      ctx.font = '24px ' + KAI;
      ctx.fillText('拍一张照片,测测你是哪种川剧脸谱', W / 2, 1036);
      ctx.fillStyle = '#8f7448';
      ctx.font = '20px ' + KAI;
      ctx.fillText('* 本测试仅供娱乐 · 川剧文化小站', W / 2, 1074);

      // 下载
      var url = canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = '川剧脸谱测试-' + ch.name + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      btn.textContent = '✅ 已保存,去分享吧';
      setTimeout(function () { btn.textContent = oldText; btn.disabled = false; }, 2200);
    } catch (e) {
      console.error('Share poster error:', e);
      alert('生成分享图失败: ' + e.message + '\n\n请通过本地服务器(localhost)访问本页后重试。');
      btn.textContent = oldText;
      btn.disabled = false;
    }
  }

  // ===== 统一分析流程 =====
  // 摄像头拍照与上传照片共用:检测 → 匹配 → 选色/出结果
  async function analyzeSource(source) {
    analyzingOverlay.style.display = 'flex';
    analyzingSub.textContent = '正在分析五官特征...';
    var steps = ['正在识别脸型...', '正在测量眉形...', '正在分析眼型...'];
    var stepIdx = 0;
    var stepTimer = setInterval(function () {
      analyzingSub.textContent = steps[stepIdx] || '匹配脸谱中...';
      stepIdx++;
    }, 800);

    try {
      await new Promise(function (r) { setTimeout(r, 600); });
      feat = await detectFace(source);
      clearInterval(stepTimer);

      if (!feat) {
        analyzingOverlay.style.display = 'none';
        return false;
      }

      faceFeatures = matchMask(feat);

      // 停止摄像头(如已开启)
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      camDiv.style.display = 'none';

      // 仅一个可选主色时(如丑角)跳过选色,直接出结果,且不显示返回键
      if (faceFeatures.colors.length === 1) {
        backBtn.style.display = 'none';
        generateResult(faceFeatures, faceFeatures.colors[0]);
        resultDiv.style.display = 'block';
        return true;
      }

      showColorOptions(faceFeatures.colors);
      return true;
    } catch (e) {
      clearInterval(stepTimer);
      console.error('Face detection error:', e);
      alert('分析失败: ' + e.message);
      analyzingOverlay.style.display = 'none';
      return false;
    }
  }

  // ===== 事件:开始测试 =====
  startBtn.addEventListener('click', async function () {
    initDiv.style.display = 'none';
    camDiv.style.display = 'flex';
    analyzingOverlay.style.display = 'flex';

    try {
      await loadModels();
    } catch (e) {
      analyzingSub.textContent = '模型加载失败: ' + e.message;
      setTimeout(function () {
        analyzingOverlay.style.display = 'none';
        camDiv.style.display = 'none';
        initDiv.style.display = 'block';
      }, 3000);
      return;
    }
    var camOk = await startCamera();
    if (!camOk) {
      analyzingOverlay.style.display = 'none';
      camDiv.style.display = 'none';
      initDiv.style.display = 'block';
      return;
    }
    analyzingOverlay.style.display = 'none';
    captureBtn.style.display = 'block';
  });

  // ===== 事件:拍照分析 =====
  captureBtn.addEventListener('click', async function () {
    captureBtn.style.display = 'none';
    var ok = await analyzeSource(camVideo);
    if (!ok) captureBtn.style.display = 'block';
  });

  // ===== 事件:上传照片识别 =====
  uploadBtn.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', async function () {
    var file = fileInput.files && fileInput.files[0];
    fileInput.value = ''; // 允许下次选择同一张照片
    if (!file) return;
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = async function () {
      initDiv.style.display = 'none';
      camDiv.style.display = 'flex';    // 借用摄像头区域展示分析动画
      camVideo.style.display = 'none';  // 上传模式不显示视频画面
      analyzingOverlay.style.display = 'flex';
      try {
        await loadModels();
      } catch (e) {
        analyzingSub.textContent = '模型加载失败: ' + e.message;
        setTimeout(function () {
          analyzingOverlay.style.display = 'none';
          camDiv.style.display = 'none';
          initDiv.style.display = 'block';
        }, 3000);
        URL.revokeObjectURL(url);
        return;
      }
      var ok = await analyzeSource(img);
      URL.revokeObjectURL(url);
      if (!ok) {
        camDiv.style.display = 'none';
        initDiv.style.display = 'block';
      }
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      alert('照片读取失败,请换一张试试');
    };
    img.src = url;
  });

  // ===== 事件:分享结果 =====
  shareBtn.addEventListener('click', function () {
    shareResult(shareBtn);
  });

  // ===== 事件:再测一次 =====
  retryBtn.addEventListener('click', function () {
    resultDiv.style.display = 'none';
    initDiv.style.display = 'block';
    faceFeatures = null;
    lastResult = null;
    shareBtn.textContent = '分享结果';
    shareBtn.disabled = false;
  });

  // ===== 事件:返回选色 =====
  // 回到主色选择页,切换查看同一行当下不同主色对应的角色
  backBtn.addEventListener('click', function () {
    resultDiv.style.display = 'none';
    if (faceFeatures && faceFeatures.colors.length > 1) {
      showColorOptions(faceFeatures.colors);
    } else if (lastResult) {
      resultDiv.style.display = 'block';
    }
  });
})();
