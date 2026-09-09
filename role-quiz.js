/* ============ 测测你是川剧哪个行当 ============ */
(function () {
  var quizBox = document.getElementById('rqQuiz');
  if (!quizBox) return;

  var progressEl = document.getElementById('rqProgress');
  var progressFill = document.getElementById('rqProgressFill');
  var questionEl = document.getElementById('rqQuestion');
  var optionsEl = document.getElementById('rqOptions');
  var resultBox = document.getElementById('rqResult');
  var cardEl = document.getElementById('rqCard');
  var shareBtn = document.getElementById('rqShare');
  var restartBtn = document.getElementById('rqRestart');

  // ===== 关键词 → 行当映射(用于"其他"自填匹配) =====
  var KEYWORD_MAP = {
    sheng: [
      '主意','决定','决策','主导','领头','带头','靠谱','稳重','扛事','掌舵','定盘','主心骨','拿主意','拍板',
      '负责','担当','统筹','规划','组织','条理','计划','执行','落实',
      '运动','跑步','健身','锻炼','探险','冒险','户外','爬山','游泳','武术','功夫',
      '冷静','理性','沉着','果断','坚毅','踏实','认真','自律','规矩',
      '将军','诸葛亮','主角','领导','队长','老大','带头人'
    ],
    dan: [
      '照顾','关心','体贴','温柔','细腻','包容','协调','顾及','同理','倾听','呵护','心疼','安慰','陪伴',
      '感受','情绪','共情','体谅','善解人意','贴心','心软','敏感','多愁','感性',
      '做饭','烹饪','烘焙','手作','花茶','插花','收拾','整理','布置','装扮','打扮','穿搭','护肤',
      '聊天','倾诉','开导','调解','和事佬','圆场','说和','闺蜜','逛街',
      '精致','好看','漂亮','优雅','文艺','浪漫','审美','品味'
    ],
    jing: [
      '翻脸','硬刚','霸气','气场','怼','拍桌','当场','硬来','直来直去','拳头','打架',
      '大声','嗓门','吼','威猛','爆','脾气','怒','愤','义愤','看不惯',
      '冲在前','牵头','站出来','挡','护','保护','出头',
      '豪爽','豪迈','仗义','义气','江湖','哥们','兄弟','直率','爽快','敞亮',
      '威严','震','压','不服'
    ],
    mo: [
      '看书','独处','安静','低调','平静','宅','观察','沉默','旁观','后台','幕后','不说话','一个人','独自',
      '不争','不抢','看透','不说透','收敛','内敛','含蓄','退让',
      '思考','琢磨','反思','冥想','发呆','放空','淡定','从容','泰然',
      '读书','写日记','散步','遛弯','闲逛','晒太阳','种花','钓鱼','下棋','收藏',
      '配角','定盘星','鲁肃','参谋','顾问'
    ],
    chou: [
      '活跃','气氛','搞笑','有趣','幽默','热闹','开心','段子','调侃','玩笑','插科打诨','逗乐','气氛组','逗',
      '聚会','派对','社交','人多的','一堆人','嗨','party','饭局','唱k','k歌',
      '松弛','随性','佛系','躺平','摆烂','快乐','乐观','逗比','活宝','开心果','段子手','表情包',
      '表演','模仿','才艺','讲笑话','相声','脱口秀','唱跳','整活','搞怪','恶搞',
      '笑中带泪','不正经','嬉皮笑脸','嘻嘻哈哈','乐天','无所谓','都行','看开','洒脱','自在'
    ]
  };

  // ===== 自填文本 → 行当倾向 =====
  function matchCustomInput(text) {
    text = (text || '').trim().toLowerCase();
    if (!text) return [];
    var hits = {};
    Object.keys(KEYWORD_MAP).forEach(function (role) {
      KEYWORD_MAP[role].forEach(function (kw) {
        if (text.indexOf(kw.toLowerCase()) >= 0) {
          hits[role] = (hits[role] || 0) + 1;
        }
      });
    });
    // 按命中次数排序,取前1-2个
    var arr = Object.keys(hits).sort(function (a, b) { return hits[b] - hits[a]; });
    if (arr.length === 0) return []; // 匹配不到→不影响分数,保持已选行当的差异
    if (arr.length === 1) return [arr[0]];
    // 前两名都有命中:主命+1,次命+0.5(用数组长度模拟权重)
    return [arr[0], arr[1]];
  }

  // ===== 题库:5 题,每题5选项各对应单一行当,增大区分度 =====
  var QUESTIONS = [
    {
      q: '和一群人一起做事时,你通常觉得自己更擅长哪种角色?',
      options: [
        { text: '拿主意、做决策', roles: ['sheng'] },
        { text: '冲在最前面、拍板定调', roles: ['jing'] },
        { text: '活跃气氛、逗大家开心', roles: ['chou'] },
        { text: '照顾每个人的感受', roles: ['dan'] },
        { text: '默默观察、关键时刻才说话', roles: ['mo'] }
      ]
    },
    {
      q: '遇到不公平的事,你第一反应是?',
      options: [
        { text: '当场翻脸', roles: ['jing'] },
        { text: '用脑子解决', roles: ['sheng'] },
        { text: '先不吭声,再想办法', roles: ['dan'] },
        { text: '冷眼旁观,心里有数', roles: ['mo'] },
        { text: '讲个段子化解尴尬', roles: ['chou'] }
      ]
    },
    {
      q: '周末你更可能出现在?',
      options: [
        { text: '和朋友们热闹聚会上', roles: ['chou'] },
        { text: '自己一个人待着看书', roles: ['mo'] },
        { text: '去运动/出门探险', roles: ['sheng'] },
        { text: '约一两个好友喝茶聊天', roles: ['dan'] },
        { text: '组织一场活动当牵头人', roles: ['jing'] }
      ]
    },
    {
      q: '你觉得自己最像哪种人?',
      options: [
        { text: '靠谱稳重的', roles: ['sheng'] },
        { text: '有趣好玩的', roles: ['chou'] },
        { text: '精致细腻的', roles: ['dan'] },
        { text: '有气场的', roles: ['jing'] },
        { text: '不争不抢、看透不说透的', roles: ['mo'] }
      ]
    },
    {
      q: '你更喜欢哪种结局?',
      options: [
        { text: '英雄凯旋', roles: ['jing'] },
        { text: '智者运筹帷幄', roles: ['sheng'] },
        { text: '大团圆', roles: ['dan'] },
        { text: '笑中带泪', roles: ['chou'] },
        { text: '一切都归于平静', roles: ['mo'] }
      ]
    }
  ];

  // ===== 五大行当身份卡 =====
  var ROLES = {
    sheng: {
      tag: '生', name: '老生',
      keywords: '稳重、靠谱、话少但扛事',
      rep: '《空城计》诸葛亮',
      line: '你像川剧里的老生,不是最爱出风头的那个,却是台柱子——有你在,戏就稳得住。',
      traits: '挂髯口、穿蟒袍、唱功见长',
      outro: '你的行当是生,重唱功、重身段、重气度——下次看川剧,盯住台上那个最稳的人,那就是你的同类。'
    },
    dan: {
      tag: '旦', name: '青衣花旦',
      keywords: '温柔细腻、有同理心、柔中带刚',
      rep: '《白蛇传》白素贞',
      line: '你像川剧里的旦角,看似温柔,骨子里最硬——水袖一甩,百转千回都是戏。',
      traits: '舞水袖、身段柔美、唱腔婉转',
      outro: '你的行当是旦,重眼神、重身段、重细腻——下次看川剧,留意那双会说话的眼睛,那就是你的同类。'
    },
    jing: {
      tag: '净', name: '花脸',
      keywords: '气场全开、爱憎分明、敢作敢当',
      rep: '《包公赔情》包公',
      line: '你像川剧里的花脸,嗓门亮、气场足,喜怒哀乐全写在脸上——活得敞亮。',
      traits: '勾脸谱、亮嗓门、做功霸气',
      outro: '你的行当是净,重脸谱、重气势、重功架——下次看川剧,那个脸最花、声最亮的就是你的同类。'
    },
    mo: {
      tag: '末', name: '末角',
      keywords: '沉稳低调、顾全大局、暖而不张扬',
      rep: '三国戏里的鲁肃',
      line: '你像川剧里的末行,不当主角却是定盘星——戏里有你,别人心里才踏实。',
      traits: '着素袍、挂黑满、稳重见长',
      outro: '你的行当是末,重分量、重分寸、重托底——下次看川剧,留意那个不抢戏却让人安心的角色。'
    },
    chou: {
      tag: '丑', name: '丑角',
      keywords: '幽默机智、松弛感拉满、人间清醒',
      rep: '《秋江》艄翁',
      line: '你像川剧里的丑角,台上插科打诨,台下看透人情——快乐是你的本事,也是你的智慧。',
      traits: '豆腐块白脸、口齿伶俐、身段灵活',
      outro: '你的行当是丑,重口条、重机趣、重烟火气——下次看川剧,鼻子上一块白的那位,就是你的同类。'
    }
  };

  var step = 0;
  var counts = null;
  var firstPick = null; // 平票裁决:记录每个行当首次被选中的题号
  var lastResult = null;

  // ===== 开始/重置 =====
  function startQuiz() {
    step = 0;
    counts = { sheng: 0, dan: 0, jing: 0, mo: 0, chou: 0 };
    firstPick = {};
    resultBox.style.display = 'none';
    quizBox.style.display = 'block';
    renderQuestion();
  }

  // ===== 渲染当前题目 =====
  function renderQuestion() {
    var item = QUESTIONS[step];
    progressEl.textContent = '第 ' + (step + 1) + ' / ' + QUESTIONS.length + ' 题';
    progressFill.style.width = (step / QUESTIONS.length) * 100 + '%';
    questionEl.textContent = item.q;
    optionsEl.innerHTML = '';

    // 预设选项
    var letters = ['A','B','C','D','E','F'];
    item.options.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.className = 'rq-option';
      btn.type = 'button';
      btn.textContent = (letters[i] || '') + '. ' + opt.text.replace(/^[A-D]\.\s*/, '');
      btn.addEventListener('click', function () { pick(opt.roles); });
      optionsEl.appendChild(btn);
    });

    // "其他"选项 → 展开自填输入
    var otherBtn = document.createElement('button');
    otherBtn.className = 'rq-option rq-other-btn';
    otherBtn.type = 'button';
    otherBtn.textContent = '✎ 其他（自己说）';
    var otherWrap = document.createElement('div');
    otherWrap.className = 'rq-other-wrap';
    otherWrap.style.display = 'none';
    otherWrap.innerHTML =
      '<input type="text" class="rq-other-input" placeholder="输入你的答案，比如：我喜欢观察大家" maxlength="40" />' +
      '<button type="button" class="rq-other-submit">确认</button>';
    optionsEl.appendChild(otherBtn);
    optionsEl.appendChild(otherWrap);

    var inputEl = otherWrap.querySelector('.rq-other-input');
    var submitEl = otherWrap.querySelector('.rq-other-submit');

    otherBtn.addEventListener('click', function () {
      var shown = otherWrap.style.display !== 'none';
      otherWrap.style.display = shown ? 'none' : 'block';
      otherBtn.textContent = shown ? '✎ 其他（自己说）' : '收起';
      if (!shown) inputEl.focus();
    });

    function submitCustom() {
      var val = inputEl.value.trim();
      if (!val) { inputEl.focus(); return; }
      var roles = matchCustomInput(val);
      pick(roles, val);
    }
    submitEl.addEventListener('click', submitCustom);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitCustom(); }
    });
  }

  // ===== 选择 → 计票 → 下一题 =====
  // roles: 行当key数组; customText: 自填原文(可选,用于匹配不到时的提示)
  function pick(roles, customText) {
    if (!roles || roles.length === 0) {
      // 匹配不到的自填:所有行当各+1(轻微影响,不破坏已有差距)
      roles = ['sheng','dan','jing','mo','chou'];
    }
    // 多个行当中命:首个全票(2分),第二个半票(1分),拉大差距
    roles.forEach(function (r, i) {
      var w = (i === 0) ? 2 : 1;
      counts[r] = (counts[r] || 0) + w;
      if (!(r in firstPick)) firstPick[r] = step;
    });
    if (customText) {
      console.log('[行当测试] 第' + (step+1) + '题自填: "' + customText + '" → 匹配: ' + roles.join(', '));
    }
    step++;
    if (step < QUESTIONS.length) {
      renderQuestion();
    } else {
      progressFill.style.width = '100%';
      showResult();
    }
  }

  // ===== 统计最高票行当(平票时取更早被选中的) =====
  function bestRole() {
    var best = null;
    Object.keys(counts).forEach(function (k) {
      if (best === null) { best = k; return; }
      if (counts[k] > counts[best] ||
          (counts[k] === counts[best] && firstPick[k] < firstPick[best])) {
        best = k;
      }
    });
    return best;
  }

  // ===== 显示行当身份卡 =====
  function showResult() {
    var key = bestRole();
    var role = ROLES[key];
    lastResult = { key: key, role: role };

    quizBox.style.display = 'none';
    resultBox.style.display = 'block';
    cardEl.innerHTML =
      '<div class="rq-card-top">✦ 你的行当身份卡 ✦</div>' +
      '<h3 class="rq-role-name">你是——<span class="rq-role-highlight">' + role.name + '</span></h3>' +
      '<div class="rq-rows">' +
        '<div class="rq-row"><span class="rq-label">性格关键词</span><span class="rq-value">' + role.keywords + '</span></div>' +
        '<div class="rq-row"><span class="rq-label">代表人物</span><span class="rq-value">' + role.rep + '</span></div>' +
        '<div class="rq-row"><span class="rq-label">行当特征</span><span class="rq-value">' + role.traits + '</span></div>' +
      '</div>' +
      '<p class="rq-line">「' + role.line + '」</p>' +
      '<p class="rq-outro">' + role.outro + '</p>';
  }

  // ===== 分享:生成行当身份卡海报并下载 =====
  function wrapText(ctx, text, maxWidth) {
    var lines = [];
    var line = '';
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = text[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shareCard(btn) {
    if (!lastResult) return;
    var oldText = btn.textContent;
    btn.textContent = '🎨 正在生成...';
    btn.disabled = true;
    try {
      var W = 750, H = 1060;
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');
      var role = lastResult.role;
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

      // 头部
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D8C49A';
      ctx.font = '26px ' + KAI;
      ctx.fillText('川剧文化小站 · 川剧体验', W / 2, 92);
      ctx.fillStyle = '#F4D98A';
      ctx.font = 'bold 52px ' + KAI;
      ctx.fillText('我的川剧行当身份卡', W / 2, 162);

      // 大字行当
      ctx.fillStyle = '#F0E4D0';
      ctx.font = '30px ' + KAI;
      ctx.fillText('你是——', W / 2, 236);
      ctx.fillStyle = '#F4D98A';
      ctx.font = 'bold 96px ' + KAI;
      ctx.fillText(role.tag + ' · ' + role.name, W / 2, 346);

      // 关键信息行
      var rows = [
        ['性格关键词', role.keywords],
        ['代表人物', role.rep],
        ['行当特征', role.traits]
      ];
      ctx.textAlign = 'left';
      rows.forEach(function (row, i) {
        var y = 440 + i * 56;
        // 行标签底牌
        ctx.fillStyle = 'rgba(201,168,76,0.16)';
        roundRectPath(ctx, 96, y - 30, 158, 42, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(201,168,76,0.5)'; ctx.lineWidth = 1;
        roundRectPath(ctx, 96, y - 30, 158, 42, 8); ctx.stroke();
        ctx.fillStyle = '#C9A84C';
        ctx.font = '24px ' + KAI;
        ctx.fillText(row[0], 118, y);
        ctx.fillStyle = '#F0E4D0';
        ctx.font = '26px ' + KAI;
        ctx.fillText(row[1], 274, y);
      });

      // 一句话解读(自动换行)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#C9A84C';
      ctx.font = '26px ' + KAI;
      ctx.fillText('—— 一句话解读 ——', W / 2, 648);
      ctx.fillStyle = '#E8D8B0';
      ctx.font = '28px ' + KAI;
      var lines = wrapText(ctx, role.line, W - 200);
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, W / 2, 700 + i * 46);
      });
      var afterLine = 700 + lines.length * 46 + 18;

      // 结语(自动换行)
      ctx.fillStyle = '#D8C49A';
      ctx.font = '24px ' + KAI;
      var outroLines = wrapText(ctx, role.outro, W - 190);
      outroLines.forEach(function (ln, i) {
        ctx.fillText(ln, W / 2, afterLine + i * 40);
      });
      var afterOutro = afterLine + outroLines.length * 40;

      // 分隔线 + 页脚
      ctx.strokeStyle = 'rgba(201,168,76,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(180, Math.max(afterOutro + 14, H - 118));
      ctx.lineTo(W - 180, Math.max(afterOutro + 14, H - 118));
      ctx.stroke();
      ctx.fillStyle = '#B89A5E';
      ctx.font = '24px ' + KAI;
      ctx.fillText('做五个选择,看看你是川剧哪个行当', W / 2, H - 72);
      ctx.fillStyle = '#8f7448';
      ctx.font = '20px ' + KAI;
      ctx.fillText('* 本测试仅供娱乐 · 川剧文化小站', W / 2, H - 38);

      // 下载
      var url = canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = '川剧行当身份卡-' + role.name + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      btn.textContent = '✅ 已保存,去分享吧';
      setTimeout(function () { btn.textContent = oldText; btn.disabled = false; }, 2200);
    } catch (e) {
      console.error('Role card share error:', e);
      alert('生成分享图失败: ' + e.message + '\n\n请通过本地服务器(localhost)访问本页后重试。');
      btn.textContent = oldText;
      btn.disabled = false;
    }
  }

  // ===== 事件绑定 =====
  shareBtn.addEventListener('click', function () { shareCard(shareBtn); });
  restartBtn.addEventListener('click', startQuiz);

  startQuiz();
})();
