/* ============ 川剧文化小站 共享脚本 ============ */
(function (global) {
  "use strict";

  // -------- 渲染顶部导航栏 --------
  // 4 个主入口:川剧百科、演出信息、趣味互动、AI 问答
  function renderNav(activePage) {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var links = [
      { key: "index",      href: "index.html",      label: "首页"    },
      { key: "knowledge", href: "knowledge.html",  label: "川剧百科" },
      { key: "shows",      href: "shows.html",      label: "川剧体验" },
      { key: "quiz",       href: "quiz.html",       label: "后台一夜" },
      { key: "aichat",     href: "ai-chat.html",    label: "AI 问答"  }
    ];

    // 川剧百科的下拉子导航(悬停展开,点击跳转到对应板块)
    var knowledgeSections = [
      { id: "kb-origin",       label: "历史起源" },
      { id: "kb-features",     label: "艺术特色" },
      { id: "kb-roles",        label: "行当详解" },
      { id: "kb-instruments",  label: "川剧乐器" },
      { id: "kb-costume",      label: "服饰规矩" },
      { id: "kb-mask",         label: "脸谱谱式" },
      { id: "kb-facechange",   label: "变脸方式" },
      { id: "kb-stunts",       label: "川剧绝活" },
      { id: "kb-plays",        label: "经典剧目" },
      { id: "kb-heritage",     label: "传承现状" }
    ];

    var linksHtml = links.map(function (l) {
      var cls = (l.key === activePage) ? "active" : "";
      // 川剧百科项:带下拉子菜单
      if (l.key === "knowledge") {
        var subHtml = knowledgeSections.map(function (s) {
          return '<li><a href="knowledge.html#' + s.id + '">' + s.label + "</a></li>";
        }).join("");
        return '<li class="nav-has-dropdown">' +
          '<a href="' + l.href + '" class="' + cls + '">' + l.label + '<span class="nav-caret">▾</span></a>' +
          '<ul class="nav-dropdown">' + subHtml + "</ul>" +
        "</li>";
      }
      return '<li><a href="' + l.href + '" class="' + cls + '">' + l.label + "</a></li>";
    }).join("");

    header.innerHTML =
      '<div class="nav-wrap">' +
        '<a href="index.html" class="brand">' +
          '<img src="images/logo_mask.png" alt="川剧" class="brand-logo-img" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\'" />' +
          '<span class="brand-mask" style="display:none;"><i></i></span>' +
          "<span>彩墨·川剧</span>" +
        "</a>" +
        '<button class="nav-toggle" aria-label="菜单">☰</button>' +
        '<ul class="nav-links">' + linksHtml + "</ul>" +
      "</div>";

    var toggle = header.querySelector(".nav-toggle");
    var menu = header.querySelector(".nav-links");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        menu.classList.toggle("open");
      });
    }

    // 滚动幕布:页面下滚超过阈值,导航栏由半透明渐变为实色
    var SCROLL_TRIGGER = 40;
    function onScroll() {
      if (window.pageYOffset > SCROLL_TRIGGER) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // 初始化(刷新后若已在中途)
  }

  // -------- 脸谱 SVG 生成 --------
  // 根据颜色键生成一个简化脸谱 SVG 字符串。charOverride 可覆盖额头字符
  var COLOR_HEX = {
    red: "#C41E3A", black: "#1A1A1A", white: "#F5F0E6",
    blue: "#1E5AA8", green: "#2E8B57", yellow: "#E5B500",
    purple: "#6B2D8C", gold: "#D4A017", silver: "#B8B8B8",
    pink: "#E8A0B5", gray: "#7A7A7A", orange: "#E5783A"
  };
  var FACE_DECOR = {
    red: "忠", black: "正", white: "奸", blue: "强",
    green: "勇", yellow: "骁", purple: "毅", gold: "神",
    silver: "疑", pink: "老", gray: "苍", orange: "刚"
  };

  function maskSVG(colorKey, charOverride) {
    var hex = COLOR_HEX[colorKey] || "#C41E3A";
    var decor = charOverride || FACE_DECOR[colorKey] || "戏";
    var strokeColor = colorKey === "white" || colorKey === "silver" ? "#1A1A1A" : "#fff";
    var textColor = colorKey === "white" ? "#C41E3A" : "#fff";
    return '' +
      '<svg class="face-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="脸谱-' + colorKey + '">' +
        '<circle cx="50" cy="50" r="48" fill="' + hex + '" stroke="' + strokeColor + '" stroke-width="2"/>' +
        // 眼眶
        '<ellipse cx="34" cy="42" rx="9" ry="6" fill="none" stroke="' + strokeColor + '" stroke-width="2"/>' +
        '<ellipse cx="66" cy="42" rx="9" ry="6" fill="none" stroke="' + strokeColor + '" stroke-width="2"/>' +
        // 眼珠
        '<circle cx="34" cy="43" r="2.5" fill="' + strokeColor + '"/>' +
        '<circle cx="66" cy="43" r="2.5" fill="' + strokeColor + '"/>' +
        // 眉
        '<path d="M24,32 Q34,26 44,32" fill="none" stroke="' + strokeColor + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M56,32 Q66,26 76,32" fill="none" stroke="' + strokeColor + '" stroke-width="2.5" stroke-linecap="round"/>' +
        // 额头纹饰
        '<path d="M50,18 Q44,28 50,38 Q56,28 50,18" fill="' + strokeColor + '" opacity="0.35"/>' +
        // 鼻
        '<path d="M50,48 L46,58 L54,58 Z" fill="' + strokeColor + '" opacity="0.6"/>' +
        // 嘴
        '<path d="M40,68 Q50,76 60,68" fill="none" stroke="' + strokeColor + '" stroke-width="2.5" stroke-linecap="round"/>' +
        // 脸颊纹
        '<path d="M18,55 Q26,60 22,68" fill="none" stroke="' + strokeColor + '" stroke-width="1.5" opacity="0.6"/>' +
        '<path d="M82,55 Q74,60 78,68" fill="none" stroke="' + strokeColor + '" stroke-width="1.5" opacity="0.6"/>' +
        // 字符
        '<text x="50" y="92" text-anchor="middle" font-size="9" fill="' + textColor + '" font-family="serif" font-weight="bold">' + decor + '</text>' +
      "</svg>";
  }

  // -------- 首页中央脸谱 Logo(大尺寸、装饰更丰富) --------
  function faceLogoSVG(colorKey) {
    var c = COLOR_HEX[colorKey] || "#C41E3A";
    // 浅色脸(白/黄/粉)用深色描边,深色脸用浅色描边,保证对比度
    var light = (colorKey === "white" || colorKey === "yellow" || colorKey === "pink");
    var line = light ? "#1A1A1A" : "#F5F0E6";
    var lineDark = light ? "#1A1A1A" : "#1A1A1A";
    return '' +
      '<svg class="face-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="川剧脸谱 Logo">' +
        // 外圈金边
        '<circle cx="50" cy="50" r="49" fill="none" stroke="#D4A017" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="48" fill="' + c + '" stroke="' + line + '" stroke-width="1.5"/>' +
        // 眼眶
        '<ellipse cx="33" cy="42" rx="10" ry="6.5" fill="none" stroke="' + line + '" stroke-width="2.2"/>' +
        '<ellipse cx="67" cy="42" rx="10" ry="6.5" fill="none" stroke="' + line + '" stroke-width="2.2"/>' +
        // 眼珠
        '<circle cx="33" cy="43" r="3" fill="#1A1A1A"/>' +
        '<circle cx="67" cy="43" r="3" fill="#1A1A1A"/>' +
        '<circle cx="34" cy="42" r="1" fill="#fff"/>' +
        '<circle cx="68" cy="42" r="1" fill="#fff"/>' +
        // 眉(剑眉上扬)
        '<path d="M20,30 Q33,22 46,31" fill="none" stroke="' + lineDark + '" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M54,31 Q67,22 80,30" fill="none" stroke="' + lineDark + '" stroke-width="3" stroke-linecap="round"/>' +
        // 额头火焰纹
        '<path d="M50,12 Q42,26 50,40 Q58,26 50,12 Z" fill="#D4A017" opacity="0.9"/>' +
        '<path d="M50,16 Q45,28 50,38 Q55,28 50,16 Z" fill="' + line + '" opacity="0.6"/>' +
        // 鼻
        '<path d="M50,46 L45,58 L55,58 Z" fill="#1A1A1A" opacity="0.85"/>' +
        // 嘴
        '<path d="M38,67 Q50,78 62,67" fill="none" stroke="' + lineDark + '" stroke-width="3" stroke-linecap="round"/>' +
        // 脸颊纹
        '<path d="M16,54 Q24,60 20,70" fill="none" stroke="' + line + '" stroke-width="2" opacity="0.7"/>' +
        '<path d="M84,54 Q76,60 80,70" fill="none" stroke="' + line + '" stroke-width="2" opacity="0.7"/>' +
      "</svg>";
  }

  // -------- 数据加载 --------
  function loadData(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "data.json?v=" + Date.now(), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          try { cb(null, JSON.parse(xhr.responseText)); }
          catch (e) { cb(e); }
        } else {
          cb(new Error("加载 data.json 失败: " + xhr.status));
        }
      }
    };
    xhr.send();
  }

  // -------- 脸谱图片(真实图片 + SVG 兜底) --------
  // 优先用 data.json 中指向 images/*.jpg 的真实图片,加载失败时回退到内联 SVG
  function maskImgHTML(colorKey, imgPath, opts) {
    opts = opts || {};
    var size = opts.size || 80;
    var cls = opts.className || "face-img";
    var svg = maskSVG(colorKey);
    return '' +
      '<span class="face-img-wrap" style="display:inline-block;width:' + size + 'px;height:' + size + 'px;position:relative;vertical-align:middle;">' +
        svg +
        '<img src="' + imgPath + '" alt="脸谱-' + colorKey + '" class="' + cls + '" ' +
            'style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;position:absolute;left:0;top:0;" ' +
            'onload="this.previousElementSibling.style.display=\'none\';" ' +
            'onerror="this.style.display=\'none\';" />' +
      "</span>";
  }

  // -------- Q 版川剧旦角吉祥物「川小旦」 --------
  function mascotSVG(mood) {
    mood = mood || "happy";
    var mouth = "";
    if (mood === "talk") {
      mouth = '<ellipse cx="60" cy="95" rx="6" ry="7" fill="#8B1A1A"/>';
    } else if (mood === "think") {
      mouth = '<path d="M54,96 Q60,93 66,96" fill="none" stroke="#8B1A1A" stroke-width="2.5" stroke-linecap="round"/>';
    } else {
      mouth = '<path d="M50,94 Q60,106 70,94" fill="none" stroke="#8B1A1A" stroke-width="3" stroke-linecap="round"/>';
    }
    // 表情眼
    var eyeL, eyeR;
    if (mood === "happy") {
      eyeL = '<path d="M38,60 Q44,56 50,60" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round"/>';
      eyeR = '<path d="M70,60 Q76,56 82,60" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round"/>';
    } else {
      eyeL = '<g><circle cx="44" cy="62" r="3.5" fill="#1A1A1A"/><circle cx="45" cy="61" r="1.2" fill="#fff"/></g>';
      eyeR = '<g><circle cx="76" cy="62" r="3.5" fill="#1A1A1A"/><circle cx="77" cy="61" r="1.2" fill="#fff"/></g>';
    }
    return '' +
      '<svg class="mascot-svg" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" aria-label="川小旦">' +
        // 阴影
        '<ellipse cx="60" cy="152" rx="32" ry="5" fill="rgba(0,0,0,0.18)"/>' +
        // 身体(红色戏服 + 金色领)
        '<path d="M32,142 Q32,112 46,106 L74,106 Q88,112 88,142 Z" fill="#C41E3A" stroke="#7a0e22" stroke-width="1.5"/>' +
        '<path d="M46,106 L60,124 L74,106" fill="#D4AF37" stroke="#7a5a08" stroke-width="1.5"/>' +
        '<circle cx="60" cy="119" r="2.5" fill="#C41E3A" stroke="#7a0e22" stroke-width="0.8"/>' +
        // 水袖
        '<path d="M32,142 Q18,140 10,152" fill="none" stroke="#F5F0E6" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M88,142 Q102,140 110,152" fill="none" stroke="#F5F0E6" stroke-width="7" stroke-linecap="round"/>' +
        // 左手持脸谱扇(旦角标志)
        (mood === "wave"
          ? '<g>' +
              '<path d="M88,118 Q108,110 112,92" fill="none" stroke="#C41E3A" stroke-width="9" stroke-linecap="round"/>' +
              '<circle cx="112" cy="90" r="6" fill="#FFE4C4" stroke="#3a1a1a" stroke-width="1"/>' +
            '</g>'
          : '<path d="M88,118 Q100,126 102,140" fill="none" stroke="#C41E3A" stroke-width="9" stroke-linecap="round"/>') +
        // 右手持小扇子(脸谱图案)
        '<g transform="translate(30,118)">' +
          '<path d="M0,0 Q-4,-6 -2,-14 L12,-14 Q14,-6 10,0 Z" fill="#F5F0E6" stroke="#1A1A1A" stroke-width="1"/>' +
          '<path d="M2,-12 Q6,-10 10,-12" stroke="#C41E3A" stroke-width="1" fill="none"/>' +
          '<circle cx="6" cy="-8" r="1.5" fill="#C41E3A"/>' +
          '<line x1="6" y1="0" x2="6" y2="12" stroke="#8B4513" stroke-width="1.5"/>' +
        '</g>' +
        // 脖子
        '<rect x="54" y="100" width="12" height="10" fill="#FFE4C4"/>' +
        // 头(鹅蛋脸)
        '<ellipse cx="60" cy="62" rx="36" ry="38" fill="#FFE4C4" stroke="#3a1a1a" stroke-width="1.2"/>' +
        // 头发(旦角包头)
        '<path d="M24,56 Q28,22 60,18 Q92,22 96,56 Q88,36 60,34 Q32,36 24,56 Z" fill="#1A1A1A"/>' +
        '<path d="M22,60 Q26,40 60,38 Q94,40 98,60" fill="none" stroke="#0a0a0a" stroke-width="1.5"/>' +
        // 右侧垂下的发带
        '<path d="M92,58 Q96,78 90,96" fill="none" stroke="#1A1A1A" stroke-width="3"/>' +
        // 额头小红痣
        '<circle cx="60" cy="40" r="2" fill="#C41E3A"/>' +
        // 眉(细蛾眉)
        '<path d="M36,52 Q44,46 52,52" fill="none" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M68,52 Q76,46 84,52" fill="none" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round"/>' +
        // 眼睛
        eyeL + eyeR +
        // 腮红
        '<circle cx="36" cy="78" r="6" fill="#ff9eb5" opacity="0.55"/>' +
        '<circle cx="84" cy="78" r="6" fill="#ff9eb5" opacity="0.55"/>' +
        // 嘴(樱桃小口)
        mouth +
        // 旦角头饰:顶部红珠
        '<circle cx="60" cy="22" r="7" fill="#C41E3A" stroke="#7a0e22" stroke-width="1"/>' +
        '<circle cx="60" cy="22" r="3" fill="#FFE4E4"/>' +
        // 头饰:两侧金珠
        '<circle cx="38" cy="28" r="3.5" fill="#D4AF37" stroke="#7a5a08" stroke-width="0.8"/>' +
        '<circle cx="82" cy="28" r="3.5" fill="#D4AF37" stroke="#7a5a08" stroke-width="0.8"/>' +
        // 头饰:垂下的珍珠串
        '<circle cx="30" cy="42" r="2.2" fill="#F5F0E6" stroke="#ccc" stroke-width="0.5"/>' +
        '<circle cx="90" cy="42" r="2.2" fill="#F5F0E6" stroke="#ccc" stroke-width="0.5"/>' +
        // 耳坠
        '<circle cx="26" cy="70" r="2.5" fill="#D4AF37"/>' +
        '<circle cx="94" cy="70" r="2.5" fill="#D4AF37"/>' +
      "</svg>";
  }

  // -------- 彩带/烟花庆祝效果 --------
  function launchConfetti(container, opts) {
    opts = opts || {};
    var count = opts.count || 60;
    var duration = opts.duration || 4000;
    var colors = ["#C41E3A", "#D4A017", "#1A1A1A", "#2E8B57", "#1E5AA8", "#E8A0B5"];
    var root = document.createElement("div");
    root.className = "confetti-root";
    root.setAttribute("data-confetti", "launched");
    root.style.cssText = "position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:50;";
    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      var c = colors[i % colors.length];
      var left = Math.random() * 100;
      var delay = Math.random() * 1.5;
      var dur = 3.5 + Math.random() * 2.5;   // 单片下落时长 3.5-6s,持续可见
      var size = 7 + Math.random() * 9;
      var rot = Math.random() * 360;
      var shape = Math.random() > 0.5 ? "50%" : "2px";
      p.style.cssText =
        "position:absolute;top:-20px;left:" + left + "%;" +
        "width:" + size + "px;height:" + size + "px;" +
        "background:" + c + ";" +
        "border-radius:" + shape + ";" +
        "opacity:0.95;transform:rotate(" + rot + "deg);" +
        "animation:confetti-fall " + dur + "s linear " + delay + "s forwards;";
      root.appendChild(p);
    }
    // 烟花闪光
    for (var f = 0; f < 3; f++) {
      var fl = document.createElement("span");
      fl.className = "firework";
      fl.style.cssText =
        "left:" + (20 + Math.random() * 60) + "%;" +
        "top:" + (20 + Math.random() * 40) + "%;" +
        "animation-delay:" + (f * 0.4) + "s;";
      root.appendChild(fl);
    }
    container.style.position = container.style.position || "relative";
    container.appendChild(root);
    setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, duration);
  }

  // -------- FAQ 关键词匹配(离线兜底回答) --------
  function matchFAQ(question, faqList) {
    if (!faqList || !faqList.length) return null;
    var q = question.toLowerCase().replace(/\s/g, "");
    if (!q) return null;
    var best = null, bestScore = 0;
    // 停用 bigram:在多个 FAQ 中都出现,无区分度(如"川剧""什么")
    var stop = { "川剧": 1, "什么": 1, "怎么": 1, "哪些": 1, "可以": 1,
                 "以及": 1, "中国": 1, "一些": 1, "的话": 1 };
    faqList.forEach(function (item) {
      var a = item.question.toLowerCase().replace(/\s/g, "");
      var score = 0;
      for (var i = 0; i + 2 <= a.length; i++) {
        var bi = a.substr(i, 2);
        if (stop[bi]) continue;        // 跳过停用 bigram
        if (q.indexOf(bi) >= 0) score++;
      }
      if (score > bestScore) { bestScore = score; best = item; }
    });
    // 阈值 1:只要有一个有意义的关键词重合即视为命中
    if (bestScore >= 1) return best.answer;
    return null;
  }

  // -------- AI API 调用(可配置) --------
  var AI_CONFIG = {
    enabled: false,           // 默认关闭,启用真实 AI 需在页面设置
    endpoint: "",             // 例如 https://aip.baidubce.com/... 或 https://dashscope.aliyuncs.com/...
    apiKey: "",               // 注意:前端暴露密钥有风险,仅用于本地演示
    model: "",
    buildBody: null           // function(prompt) 返回请求体
  };

  function callAI(prompt, cb) {
    // 1. 未启用真实 API -> 用 FAQ 兜底
    if (!AI_CONFIG.enabled || !AI_CONFIG.endpoint || !AI_CONFIG.apiKey) {
      setTimeout(function () {
        cb(null, "（离线模式）这个问题我暂时无法连线 AI,请先在 data.json 中查阅 FAQ 或配置 AI API。");
      }, 400);
      return;
    }
    // 2. 真实 API 调用
    var body = AI_CONFIG.buildBody
      ? AI_CONFIG.buildBody(prompt)
      : JSON.stringify({ prompt: prompt });
    fetch(AI_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + AI_CONFIG.apiKey
      },
      body: body
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      var text = (data && (data.result || data.text || (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content))) || "（AI 未返回有效内容）";
      cb(null, text);
    }).catch(function (err) {
      cb(err);
    });
  }

  // -------- 音效(Web Audio API 合成,无需外部音频文件) --------
  var soundCtx = null;
  function getSoundCtx() {
    if (!soundCtx) {
      try { soundCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { soundCtx = null; }
    }
    return soundCtx;
  }
  function playTone(freq, duration, type, volume, delay) {
    var c = getSoundCtx();
    if (!c) return;
    if (c.state === "suspended") { c.resume().catch(function () {}); }
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    var start = c.currentTime + (delay || 0);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume || 0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }
  function playSweep(fromFreq, toFreq, duration, type, volume) {
    var c = getSoundCtx();
    if (!c) return;
    if (c.state === "suspended") { c.resume().catch(function () {}); }
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(fromFreq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(toFreq, c.currentTime + duration);
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(volume || 0.2, c.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration + 0.05);
  }
  var sound = {
    // 答对:上升的悦耳音 C5-E5-G5
    correct: function () {
      playTone(523.25, 0.15, "sine", 0.22, 0);
      playTone(659.25, 0.15, "sine", 0.22, 0.1);
      playTone(783.99, 0.25, "sine", 0.22, 0.2);
    },
    // 答错:下降低沉 buzz
    wrong: function () {
      playTone(220, 0.18, "sawtooth", 0.15, 0);
      playTone(165, 0.35, "sawtooth", 0.15, 0.12);
    },
    // 轻点按
    click: function () {
      playTone(660, 0.05, "square", 0.08, 0);
    },
    // 变脸:上扬 whoosh
    faceChange: function () {
      playSweep(300, 1100, 0.3, "sine", 0.2);
    },
    // 通关庆祝:欢快音阶 C-E-G-C(高八度)
    celebrate: function () {
      playTone(523.25, 0.15, "triangle", 0.22, 0);
      playTone(659.25, 0.15, "triangle", 0.22, 0.15);
      playTone(783.99, 0.15, "triangle", 0.22, 0.3);
      playTone(1046.5, 0.45, "triangle", 0.25, 0.45);
    }
  };

  // -------- 用户头像:高度抽象的脸谱侧影(深红底 + 金色线条,似光影投射的影子) --------
  function userAvatarSVG() {
    return '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="用户头像">' +
      '<defs>' +
        '<radialGradient id="uavBg" cx="32%" cy="26%" r="85%">' +
          '<stop offset="0%" stop-color="#A3152E"/>' +
          '<stop offset="100%" stop-color="#6E0C1B"/>' +
        '</radialGradient>' +
      '</defs>' +
      // 深红底
      '<circle cx="20" cy="20" r="20" fill="url(#uavBg)"/>' +
      // 光影投射的脸谱侧影剪影(面向右侧)
      '<path d="M19 6.5 C11.5 7.5 8 13 8.5 20 C9 27.5 13.5 32.8 19.5 33.2 ' +
        'C21.5 33.3 23 32.9 24.2 32 C23.2 30.8 22.9 29.6 23.4 28.7 ' +
        'C25 28.3 25.6 27.5 25.2 26.7 C27 26.4 27.7 25.7 27.4 25 ' +
        'C29.3 24.1 29.8 23.1 28.9 22.4 C28.2 19.5 26.8 16.8 24.4 14.9 ' +
        'C23 11 21.5 7.5 19 6.5 Z" fill="rgba(40,4,12,0.5)"/>' +
      // 金色线条:眉 / 眼 / 鼻梁
      '<path d="M15.5 16.8 Q19.5 14.8 23.6 15.7" stroke="#E8C87A" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M16.2 19.9 Q19.7 18.3 23.4 19.1" stroke="#E8C87A" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M24 15.2 C26.2 17.3 27.7 19.8 28.4 22.2" stroke="#E8C87A" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
    '</svg>';
  }

  // -------- 锚点跳转校准 --------
  // 从其他页面带锚点进入,或站内切换锚点时,待版面稳定(图片加载)后重新对准目标板块,
  // 避免吸顶导航遮挡或图片未加载导致的落点偏差
  function realignHash() {
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ block: "start" });
  }
  window.addEventListener("hashchange", function () { setTimeout(realignHash, 100); });
  window.addEventListener("load", function () {
    setTimeout(realignHash, 250);
    setTimeout(realignHash, 1200);
  });

  // -------- 公开 API --------
  var App = {
    renderNav: renderNav,
    maskSVG: maskSVG,
    maskImgHTML: maskImgHTML,
    faceLogoSVG: faceLogoSVG,
    mascotSVG: mascotSVG,
    userAvatarSVG: userAvatarSVG,
    launchConfetti: launchConfetti,
    matchFAQ: matchFAQ,
    callAI: callAI,
    AI_CONFIG: AI_CONFIG,
    COLOR_HEX: COLOR_HEX,
    loadData: loadData,
    sound: sound
  };
  global.SCU = App;
})(window);
