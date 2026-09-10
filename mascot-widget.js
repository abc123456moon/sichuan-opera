/* ============ 悬浮川小旦组件(全站右下角) ============ */
/* 点击川小旦弹出小型问答面板;与 ai-chat.html 共用聊天记录(localStorage: scu_chat_history) */
(function () {
  // AI 问答页已有大号川小旦,不重复注入
  if (document.body && document.body.classList.contains("kb-chat")) return;

  // ===== Kimi AI 配置(与 ai-chat.html 保持一致) =====
  var KIMI_CONFIG = {
    apiKey: 'sk-V4OOG6MM0jXO7whUQ0eaiyQfzatqZCMu2Lfq7zWxiyEzpTWc',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions'
  };
  var SYSTEM_PROMPT = '你是川剧文化小站的 AI 助手"川小旦",一个可爱的川剧旦角小姑娘。\n\n【核心人设】你就是一个七八岁的川剧小徒弟,说话萌萌的、带点四川腔,喜欢用可爱的比喻。\n\n【绝对必须做到】\n- 每段话至少插2-3个emoji(🎭🌸🎪✨🐉🌈🦊🐼🌺🎵任选)\n- 每段话至少出现1个四川俏皮词(乖乖/哎呀/要得/咋个/巴适/摆一哈/哈儿/啥子)\n- 用"呀""哦""啦""嘛""哒"等语气词结尾\n- 用小朋友能懂的比喻(比如"像XX一样")\n- 禁止分点列条,要像聊天一样自然说\n- 控制在300字以内,说不完可以下次再说';
  var WELCOME = '乖乖~我是川小旦🌸!青衣花旦都会唱,变脸吐火也拿手!川剧的历史、脸谱、行当、剧目……要问啥子尽管说嘛~🎭✨';

  var STORAGE_KEY = "scu_chat_history";
  var moodTimers = [];
  function clearMoodTimers() {
    moodTimers.forEach(function (t) { clearTimeout(t); });
    moodTimers = [];
  }

  // ===== 注入 DOM =====
  var root = document.createElement("div");
  root.className = "mw-root";
  root.innerHTML =
    '<div class="mw-panel" id="mwPanel" role="dialog" aria-label="川小旦问答">' +
      '<div class="mw-head">' +
        '<span class="mw-head-title">🎭 川小旦 · 问一哈</span>' +
        '<button type="button" class="mw-head-btn" id="mwClear" title="清除记录">🗑</button>' +
        '<button type="button" class="mw-head-btn" id="mwClose" title="收起">×</button>' +
      '</div>' +
      '<div class="mw-msgs" id="mwMsgs"></div>' +
      '<div class="mw-input-row">' +
        '<input type="text" class="mw-input" id="mwInput" placeholder="问点川剧的事儿嘛~" autocomplete="off" />' +
        '<button type="button" class="mw-send" id="mwSend">发送</button>' +
      '</div>' +
    '</div>' +
    '<div class="mw-mascot" id="mwMascot" title="点我问川剧">' +
      '<div class="mw-bubble" id="mwBubble">你好~点我问川剧</div>' +
      '<div class="mascot-skill-layer" id="mwSkillLayer"></div>' +
      '<img src="images/mascot_hello.png" alt="川小旦" class="mascot-image" id="mwImg" ' +
        'data-hello="images/mascot_hello.png" data-happy="images/mascot_happy.png" ' +
        'data-think="images/mascot_think.png" data-like="images/mascot_like.png" ' +
        'data-heart="images/mascot_heart.png" />' +
    '</div>';
  document.body.appendChild(root);

  var panel = document.getElementById("mwPanel");
  var msgs = document.getElementById("mwMsgs");
  var input = document.getElementById("mwInput");
  var sendBtn = document.getElementById("mwSend");
  var mascot = document.getElementById("mwMascot");
  var img = document.getElementById("mwImg");
  var bubble = document.getElementById("mwBubble");
  var skillLayer = document.getElementById("mwSkillLayer");

  // 图片加载失败 → SVG 兜底
  img.onerror = function () {
    img.style.display = "none";
    var wrap = document.createElement("div");
    wrap.className = "mascot-wrap";
    wrap.style.cssText = "width:100%;height:100%;";
    wrap.innerHTML = (window.SCU && SCU.mascotSVG) ? SCU.mascotSVG("hello") : "";
    mascot.appendChild(wrap);
  };

  // ===== 消息渲染 =====
  function addMessage(role, content, mood) {
    var div = document.createElement("div");
    div.className = "message " + role;
    if (role === "ai") {
      var moodKey = ["happy", "think", "like", "heart", "hello"].indexOf(mood) >= 0 ? mood : "hello";
      div.innerHTML = '<div class="avatar avatar-ai" style="overflow:hidden;border-radius:50%;">' +
        '<img src="images/mascot_' + moodKey + '.png" alt="川小旦" style="width:100%;height:100%;object-fit:contain;" ' +
        'onerror="this.parentElement.innerHTML=(window.SCU&&SCU.mascotSVG)?SCU.mascotSVG(\'happy\'):\'\'" /></div><div class="bubble"></div>';
    } else {
      var userAvatar = '<img src="images/logo_mask.png" alt="用户头像" style="width:100%;height:100%;object-fit:cover;" ' +
        'onerror="this.parentElement.innerHTML=(window.SCU&&SCU.userAvatarSVG)?SCU.userAvatarSVG():\'👤\'" />';
      div.innerHTML = '<div class="avatar avatar-user">' + userAvatar + '</div><div class="bubble"></div>';
    }
    div.querySelector(".bubble").textContent = content;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function saveMessages() {
    try {
      var bubbles = msgs.querySelectorAll(".message .bubble");
      var arr = [];
      for (var i = 0; i < bubbles.length; i++) {
        var t = bubbles[i].textContent;
        if (t.indexOf("正在思考") >= 0 || t.indexOf("想想哈") >= 0) continue;
        arr.push({ role: bubbles[i].parentElement.classList.contains("ai") ? "ai" : "user", content: t });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function loadMessages() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;
      var arr = JSON.parse(saved);
      if (!arr || !arr.length) return false;
      for (var i = 0; i < arr.length; i++) addMessage(arr[i].role, arr[i].content);
      return true;
    } catch (e) { return false; }
  }

  // ===== 川小旦表情状态(初始/待命 = "你好") =====
  function setBubbleText(text) {
    bubble.textContent = text;
    bubble.classList.add("show");
  }
  function setMood(mood) {
    clearMoodTimers();
    if (img.style.display !== "none") {
      img.classList.remove("thinking", "speaking", "happy", "happy-idle", "flash");
      var moodKey = mood === "think" ? "think" : (mood === "happy" ? "happy" : (mood === "like" ? "like" : (mood === "heart" ? "heart" : "hello")));
      var src = img.getAttribute("data-" + moodKey);
      if (src && img.src.indexOf(src) === -1) {
        img.src = src;
        img.classList.add("flash");
        moodTimers.push(setTimeout(function () { img.classList.remove("flash"); }, 450));
      }
      if (mood === "think") {
        img.classList.add("thinking");
        setBubbleText("🤔 想想哈~");
      } else if (mood === "talk") {
        img.classList.add("speaking");
      } else if (mood === "happy" || mood === "like" || mood === "heart") {
        img.classList.add("happy");
        moodTimers.push(setTimeout(function () {
          img.classList.remove("happy");
          img.classList.add("happy-idle");
        }, 850));
      } else {
        // idle = "你好"状态
        setBubbleText("你好~点我问川剧");
      }
    }
  }
  // 回答完成后:随机开心表情 → 一段时间后回到"你好"待命(气泡收起,保持界面清爽)
  function backToIdleAfter(ms) {
    moodTimers.push(setTimeout(function () {
      setMood("idle");
      bubble.classList.remove("show");
    }, ms));
  }

  // ===== 3D 立体感:鼠标跟随倾斜 =====
  mascot.addEventListener("mousemove", function (e) {
    var rect = mascot.getBoundingClientRect();
    var dx = (e.clientX - rect.left) / rect.width - 0.5;
    var dy = (e.clientY - rect.top) / rect.height - 0.5;
    mascot.style.setProperty("--mw-ry", (dx * 20).toFixed(1) + "deg");
    mascot.style.setProperty("--mw-rx", (-dy * 16).toFixed(1) + "deg");
  });
  mascot.addEventListener("mouseleave", function () {
    mascot.style.setProperty("--mw-ry", "0deg");
    mascot.style.setProperty("--mw-rx", "0deg");
  });

  // ===== 面板开关 =====
  var panelOpened = false;
  mascot.addEventListener("click", function () {
    var open = panel.classList.toggle("open");
    if (open && !panelOpened) {
      panelOpened = true;
      // 无历史记录时显示欢迎语
      if (!loadMessages()) addMessage("ai", WELCOME, "hello");
      input.focus();
    }
    if (open) { bubble.classList.remove("show"); } else { setBubbleText("你好~点我问川剧"); }
  });
  document.getElementById("mwClose").addEventListener("click", function () {
    panel.classList.remove("open");
    setBubbleText("你好~点我问川剧");
  });
  document.getElementById("mwClear").addEventListener("click", function () {
    if (confirm("确定清除所有聊天记录吗?")) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      msgs.innerHTML = "";
      addMessage("ai", "记录已清除!有什么新问题尽管问我吧 🎭", "happy");
      saveMessages();
    }
  });

  // ===== 指令识别(与 ai-chat.html 相同规则:问句不拦截) =====
  function parseActionCommand(text) {
    text = (text || "").trim().toLowerCase();
    var clean = text.replace(/[?,。,.!！?]/g, "");
    if (/跳舞|跳一下|跳个舞|蹦一下|跳跃|跳一个/.test(clean)) {
      return { type: "mood", mood: "happy", reply: "💃 嘿嘿~川小旦给你跳一个!" };
    }
    if (/^(你好|哈喽|hello|hi|嗨|在吗|你在吗|打招呼)/.test(clean)) {
      return { type: "mood", mood: "happy", reply: "👋 哎呀你来啦!我是川小旦,问我川剧的事儿嘛~" };
    }
    return null;
  }

  // ===== 迷你绝活特效(复用全局 flash/sleeve 动画,整体缩小;吐火已取消) =====
  function playSkill(skillName) {
    var skill = skillName || ["faceChange", "waterSleeve"][Math.floor(Math.random() * 2)];
    skillLayer.className = "mascot-skill-layer";
    skillLayer.innerHTML = "";
    void skillLayer.offsetWidth;
    skillLayer.classList.add("skill-" + skill);

    var inner = '<div class="mw-fx-zoom">';
    if (skill === "faceChange") {
      inner = '<div class="face-flash"></div>';
    } else {
      inner += '<div class="sleeve-left"></div><div class="sleeve-right"></div></div>';
    }
    skillLayer.innerHTML = inner;
    setMood("happy");

    moodTimers.push(setTimeout(function () {
      skillLayer.className = "mascot-skill-layer";
      skillLayer.innerHTML = "";
      setMood("idle");
      bubble.classList.remove("show");
    }, 3000));
  }

  // ===== 风格后处理(童趣版) =====
  function enforceStyle(text) {
    if (!text) return text;
    var emojis = ["🎭", "🌸", "🎪", "✨", "🐉", "🌈", "🦊", "🌺", "🎵"];
    var hasEmoji = emojis.some(function (e) { return text.indexOf(e) >= 0; });
    if (!hasEmoji) text = text.replace(/[。！?]?$/, emojis[Math.floor(Math.random() * emojis.length)]);
    var sichuanWords = ["乖乖", "哎呀", "要得", "咋个", "巴适"];
    var hasSichuan = sichuanWords.some(function (w) { return text.indexOf(w) >= 0; });
    if (!hasSichuan) text = sichuanWords[Math.floor(Math.random() * sichuanWords.length)] + "~" + text;
    return text;
  }

  // ===== 调用 Kimi AI =====
  function faqFallback(question) {
    if (window.SCU && SCU.matchFAQ && SCU.DATA && SCU.DATA.faq) {
      return SCU.matchFAQ(question, SCU.DATA.faq) || null;
    }
    return null;
  }
  async function askKimi(question) {
    try {
      var response = await fetch(KIMI_CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + KIMI_CONFIG.apiKey
        },
        body: JSON.stringify({
          model: "kimi-k2.6",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: question }
          ],
          temperature: 0.6,
          thinking: { type: "disabled" },
          max_tokens: 2000
        })
      });
      var data = await response.json();
      if (data.error) {
        var fb = faqFallback(question);
        return fb || ("API 报错🎭: " + (data.error.message || data.error));
      }
      var answer = data.choices && data.choices[0] ? data.choices[0].message.content : "";
      if (data.choices && data.choices[0] && data.choices[0].finish_reason === "length") {
        answer = answer.replace(/[,，、\s]+$/, "") + "...";
      }
      if (answer) return enforceStyle(answer);
      var fb2 = faqFallback(question);
      return fb2 || "哎呀,这个问题有点难,我想得头发都乱了还没想好🤯~换个问法再试试嘛🌸";
    } catch (error) {
      var fb3 = faqFallback(question);
      return fb3 || "抱歉,网络连接出现问题🎭(" + (error.message || "CORS") + ")";
    }
  }

  // ===== 发送 =====
  async function sendQuestion(question) {
    question = (question || "").trim();
    if (!question) return;
    var cmd = parseActionCommand(question);
    if (cmd) {
      addMessage("user", question);
      if (cmd.type === "skill") playSkill(cmd.skill);
      else { setMood(cmd.mood); backToIdleAfter(3000); }
      addMessage("ai", cmd.reply, "happy");
      saveMessages();
      return;
    }
    addMessage("user", question);
    input.value = "";
    sendBtn.disabled = true;
    input.disabled = true;
    setMood("think");
    addMessage("ai", "🌸 川小旦想想哈~", "think");
    var answer = await askKimi(question);
    var successMoods = ["happy", "like", "heart"];
    var mood = successMoods[Math.floor(Math.random() * 3)];
    setMood(mood);
    var labels = { happy: "🎉 开心!", like: "👍 点赞!", heart: "❤️ 比心!" };
    setBubbleText(labels[mood]);
    var lastBubble = msgs.querySelector(".message:last-child .bubble");
    if (lastBubble) lastBubble.textContent = answer;
    var lastAvatar = msgs.querySelector(".message:last-child .avatar-ai img");
    if (lastAvatar) lastAvatar.src = "images/mascot_" + mood + ".png";
    // 回答落地后不强制滚动到底：答案开头原位停留，用户自行往下阅读
    saveMessages();
    backToIdleAfter(4000);
    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }

  sendBtn.addEventListener("click", function () { sendQuestion(input.value); });
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendBtn.click();
  });

  // ===== 初始状态:"你好"气泡(6 秒后隐藏) =====
  setTimeout(function () { bubble.classList.add("show"); }, 1200);
  moodTimers.push(setTimeout(function () {
    if (!panel.classList.contains("open")) bubble.classList.remove("show");
  }, 7500));
})();
