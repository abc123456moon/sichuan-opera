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

  // ===== 细分行当身份卡 =====
  // key = 最高票行当 + '_' + 次高票行当,共12种细分结果:
  // 生行:老生/小生/武生  旦行:青衣/花旦/刀马旦/闺门旦
  // 净行:大花脸/二花脸  末行:末角  丑行:文丑/武丑
  var ROLES = {
    // —— 生行 ——
    sheng_mo: {
      tag: '生', name: '老生',
      keywords: '沉稳老练、胸有丘壑、定海神针',
      rep: '《空城计》诸葛亮',
      line: '你像川剧里的老生,髯口一捋,站在那儿就是台柱子——别人慌的时候,你最稳。',
      traits: '挂髯口、穿蟒袍、唱功苍劲',
      outro: '你的细分行当是老生,属生行,重唱功、重气度、重历练——下次看川剧,盯住那个胡子花白却最压得住台的人。'
    },
    sheng_dan: {
      tag: '生', name: '小生',
      keywords: '儒雅书卷、少年意气、温柔有礼',
      rep: '《柳荫记》梁山伯',
      line: '你像川剧里的小生,一把扇子摇出少年风流——文质彬彬,却藏着一腔热忱。',
      traits: '不挂髯、扇子功、真假嗓结合',
      outro: '你的细分行当是小生,属生行,重儒雅、重书卷气、重少年心性——台上那个眉目清朗的年轻书生,就是你的同类。'
    },
    sheng_chou: {
      tag: '生', name: '小生',
      keywords: '儒雅风趣、少年风流、松弛有度',
      rep: '《柳荫记》梁山伯',
      line: '你像川剧里的小生,一把扇子摇出少年风流——文质彬彬,还藏着几分俏皮。',
      traits: '不挂髯、扇子功、真假嗓结合',
      outro: '你的细分行当是小生,属生行,重儒雅、重书卷气、重少年心性——台上那个眉目清朗、谈笑风生的年轻书生,就是你的同类。'
    },
    sheng_jing: {
      tag: '生', name: '武生',
      keywords: '英武利落、敢打敢冲、行动派',
      rep: '《长坂坡》赵云',
      line: '你像川剧里的武生,靠把子功和身段说话——不啰嗦,该出手时就出手。',
      traits: '扎靠短打、把子功、翻打跌扑',
      outro: '你的细分行当是武生,属生行,重武功、重功架、重英气——台上那个银枪一亮、满堂喝彩的,就是你的同类。'
    },
    // —— 旦行 ——
    dan_sheng: {
      tag: '旦', name: '青衣',
      keywords: '端庄正派、外柔内刚、吃苦耐劳',
      rep: '《铡美案》秦香莲',
      line: '你像川剧里的青衣,一身素衫站在台中央,不抢不争却最重——苦也吃得,事也扛得。',
      traits: '着素褶、水袖功、唱腔婉转',
      outro: '你的细分行当是青衣(正旦),属旦行,重唱功、重端庄、重风骨——台上那个忍辱负重却绝不低头的女子,就是你的同类。'
    },
    dan_chou: {
      tag: '旦', name: '花旦',
      keywords: '俏丽伶俐、活泼爱笑、口齿生香',
      rep: '《西厢记》红娘',
      line: '你像川剧里的花旦,眼珠子一转就是戏——聪明、俏皮,走到哪儿哪儿热闹。',
      traits: '穿袄裙、手帕功、做功灵巧',
      outro: '你的细分行当是花旦,属旦行,重灵巧、重做派、重俏劲——台上那个笑声最亮、脚步最轻的姑娘,就是你的同类。'
    },
    dan_jing: {
      tag: '旦', name: '刀马旦',
      keywords: '巾帼不让、英气飒爽、能打能扛',
      rep: '《穆柯寨》穆桂英',
      line: '你像川剧里的刀马旦,靠旗一插、刀马娴熟——女子英气,不输须眉。',
      traits: '扎靠持枪、把子功、唱做武并重',
      outro: '你的细分行当是刀马旦,属旦行,重武功、重气派、重飒爽——台上那个横枪立马的女将,就是你的同类。'
    },
    dan_mo: {
      tag: '旦', name: '闺门旦',
      keywords: '含蓄温婉、心思细腻、大家闺秀',
      rep: '《柳荫记》祝英台',
      line: '你像川剧里的闺门旦,半垂眼帘全是心事——不说破的柔情,水袖一抖就懂。',
      traits: '穿帔着裙、身段含蓄、唱腔柔美',
      outro: '你的细分行当是闺门旦,属旦行,重含蓄、重眼神、重女儿情态——台上那个欲言又止、眉眼含春的小姐,就是你的同类。'
    },
    // —— 净行 ——
    jing_sheng: {
      tag: '净', name: '大花脸',
      keywords: '威严刚正、声若洪钟、一身正气',
      rep: '《包公赔情》包公',
      line: '你像川剧里的大花脸,脸谱一抹、嗓门一亮,全场都镇得住——正气是你的底色。',
      traits: '勾整脸、铜锤唱功、功架凝重',
      outro: '你的细分行当是大花脸(正净),属净行,重唱功、重威严、重功架——台上那个脸最花、声最沉、人最正的,就是你的同类。'
    },
    jing_mo: {
      tag: '净', name: '大花脸',
      keywords: '威严深沉、刚正不阿、不怒自威',
      rep: '《包公赔情》包公',
      line: '你像川剧里的大花脸,脸谱一抹、嗓门一亮,全场都镇得住——不说话时,也自有分量。',
      traits: '勾整脸、铜锤唱功、功架凝重',
      outro: '你的细分行当是大花脸(正净),属净行,重唱功、重威严、重功架——台上那个脸最花、声最沉、人最正的,就是你的同类。'
    },
    jing_chou: {
      tag: '净', name: '二花脸',
      keywords: '粗犷豪放、敢爱敢恨、烟火气足',
      rep: '《长坂坡》张飞',
      line: '你像川剧里的二花脸,粗中有细、烈得可爱——拍桌大笑也好,怒发冲冠也好,全是真性情。',
      traits: '勾花脸、架子做功、身段夸张',
      outro: '你的细分行当是二花脸(副净),属净行,重做派、重豪气、重性格——台上那个咋咋呼呼却忠义满腔的莽汉,就是你的同类。'
    },
    jing_dan: {
      tag: '净', name: '二花脸',
      keywords: '豪爽仗义、粗中有细、性情中人',
      rep: '《长坂坡》张飞',
      line: '你像川剧里的二花脸,粗中有细、烈得可爱——看着咋呼,实则心细如发、重情重义。',
      traits: '勾花脸、架子做功、身段夸张',
      outro: '你的细分行当是二花脸(副净),属净行,重做派、重豪气、重性格——台上那个咋咋呼呼却忠义满腔的莽汉,就是你的同类。'
    },
    // —— 末行 ——
    mo_sheng: {
      tag: '末', name: '末角',
      keywords: '沉稳低调、顾全大局、暖而不张扬',
      rep: '《群英会》鲁肃',
      line: '你像川剧里的末行,不当主角却是定盘星——戏里有你,别人心里才踏实。',
      traits: '着素袍、挂黑满、稳重托底',
      outro: '你的细分行当是末角,属末行,重分量、重分寸、重托底——台上那个不抢戏却让人安心的,就是你的同类。'
    },
    mo_dan: {
      tag: '末', name: '末角',
      keywords: '温和内敛、周全妥帖、幕后托底',
      rep: '《群英会》鲁肃',
      line: '你像川剧里的末行,不当主角却是定盘星——你顾着每一个人,戏才唱得圆。',
      traits: '着素袍、挂黑满、稳重托底',
      outro: '你的细分行当是末角,属末行,重分量、重分寸、重托底——台上那个不抢戏却让人安心的,就是你的同类。'
    },
    mo_jing: {
      tag: '末', name: '末角',
      keywords: '老成持重、不怒自威、压得住阵',
      rep: '《群英会》鲁肃',
      line: '你像川剧里的末行,不当主角却是定盘星——真到要紧处,还得看你。',
      traits: '着素袍、挂黑满、稳重托底',
      outro: '你的细分行当是末角,属末行,重分量、重分寸、重托底——台上那个不抢戏却让人安心的,就是你的同类。'
    },
    mo_chou: {
      tag: '末', name: '末角',
      keywords: '看透世事、低调风趣、不争不抢',
      rep: '《群英会》鲁肃',
      line: '你像川剧里的末行,不当主角却是定盘星——心里什么都明白,只是不爱说。',
      traits: '着素袍、挂黑满、稳重托底',
      outro: '你的细分行当是末角,属末行,重分量、重分寸、重托底——台上那个不抢戏却让人安心的,就是你的同类。'
    },
    // —— 丑行 ——
    chou_mo: {
      tag: '丑', name: '文丑',
      keywords: '机智幽默、看透人情、笑中带智',
      rep: '《群英会》蒋干',
      line: '你像川剧里的文丑,鼻子上一块白,心里一本账——嬉笑怒骂,都是文章。',
      traits: '豆腐块白脸、口齿伶俐、念白见长',
      outro: '你的细分行当是文丑,属丑行,重口条、重机趣、重烟火气——台上那个摇着扇子把人逗笑又戳心的,就是你的同类。'
    },
    chou_dan: {
      tag: '丑', name: '文丑',
      keywords: '幽默贴心、活络气氛、温柔搞笑',
      rep: '《秋江》艄翁',
      line: '你像川剧里的文丑,逗笑是真,暖心也是真——一团和气里,全是人情练达。',
      traits: '豆腐块白脸、口齿伶俐、念白见长',
      outro: '你的细分行当是文丑,属丑行,重口条、重机趣、重烟火气——台上那个几句话就把全场逗乐的,就是你的同类。'
    },
    chou_sheng: {
      tag: '丑', name: '武丑',
      keywords: '机灵敏捷、行动利落、侠气俏皮',
      rep: '《三岔口》刘利华',
      line: '你像川剧里的武丑,翻打跌扑样样行——机灵是你的本事,仗义是你的底色。',
      traits: '轻身功夫、翻打蹿跳、开口跳',
      outro: '你的细分行当是武丑,属丑行,重武功、重敏捷、重机灵——台上那个摸黑开打、满堂喝彩的小个子,就是你的同类。'
    },
    chou_jing: {
      tag: '丑', name: '武丑',
      keywords: '泼辣机灵、敢冲敢闹、身手不凡',
      rep: '《三岔口》刘利华',
      line: '你像川剧里的武丑,翻打跌扑样样行——又敢闹又能打,谁也抓不住你。',
      traits: '轻身功夫、翻打蹿跳、开口跳',
      outro: '你的细分行当是武丑,属丑行,重武功、重敏捷、重机灵——台上那个蹿蹦跳跃、满堂喝彩的小个子,就是你的同类。'
    }
  };

  // 兜底:万一组合缺失,回退到该行当默认细分
  var ROLE_FALLBACK = { sheng: 'sheng_mo', dan: 'dan_sheng', jing: 'jing_sheng', mo: 'mo_sheng', chou: 'chou_mo' };

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

  // ===== 统计票数前两名(平票时取更早被选中的) =====
  function topTwoRoles() {
    var keys = Object.keys(counts);
    keys.sort(function (a, b) {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      var fa = (firstPick[a] === undefined ? 999 : firstPick[a]);
      var fb = (firstPick[b] === undefined ? 999 : firstPick[b]);
      return fa - fb;
    });
    return [keys[0], keys[1]];
  }

  // ===== 显示行当身份卡 =====
  function showResult() {
    var top = topTwoRoles();
    var key = top[0] + '_' + top[1];
    if (!ROLES[key]) key = ROLE_FALLBACK[top[0]];
    var role = ROLES[key];
    lastResult = { key: key, role: role };
    // 行当形象图:按主行当(生/旦/净/末/丑)取 images/role_*.png
    var imgSrc = 'images/role_' + key.split('_')[0] + '.png';

    quizBox.style.display = 'none';
    resultBox.style.display = 'block';
    cardEl.innerHTML =
      '<div class="rq-card-top">✦ 你的行当身份卡 ✦</div>' +
      '<h3 class="rq-role-name">你是——<span class="rq-role-highlight">' + role.name + '</span></h3>' +
      '<img class="rq-role-img" src="' + imgSrc + '" alt="' + role.tag + '行·' + role.name + '" ' +
        'onerror="this.style.display=\'none\';" />' +
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

  // 以"contain"方式把图片完整绘入圆角矩形(按比例缩放,不裁剪、不变形)
  function drawContainImage(ctx, img, x, y, w, h, r) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var scale = Math.min(w / iw, h / ih);
    var dw = iw * scale, dh = ih * scale;
    var dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    ctx.save();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function shareCard(btn) {
    if (!lastResult) return;
    var oldText = btn.textContent;
    btn.textContent = '🎨 正在生成...';
    btn.disabled = true;

    // 预加载行当形象图;加载失败或超时也照常出卡(无图版)
    var imgSrc = 'images/role_' + lastResult.key.split('_')[0] + '.png';
    var roleImg = new Image();
    var finished = false;
    function finish(ok) {
      if (finished) return;
      finished = true;
      try {
        renderCard(ok ? roleImg : null);
        btn.textContent = '✅ 已保存,去分享吧';
        setTimeout(function () { btn.textContent = oldText; btn.disabled = false; }, 2200);
      } catch (e) {
        console.error('Role card share error:', e);
        alert('生成分享图失败: ' + e.message + '\n\n请通过本地服务器(localhost)访问本页后重试。');
        btn.textContent = oldText;
        btn.disabled = false;
      }
    }
    roleImg.onload = function () { finish(true); };
    roleImg.onerror = function () { finish(false); };
    roleImg.src = imgSrc;
    setTimeout(function () { finish(false); }, 3000);

    function renderCard(roleImg) {
      var hasImg = !!roleImg;
      var W = 750;
      var role = lastResult.role;
      var KAI = '"KaiTi","STKaiti","楷体",serif';

      // 先用临时画布测量文字实际换行行数,再据此决定海报总高(避免文字重叠/溢出)
      var measure = document.createElement('canvas').getContext('2d');
      measure.font = '28px ' + KAI;
      var lines = wrapText(measure, role.line, W - 200);
      measure.font = '24px ' + KAI;
      var outroLines = wrapText(measure, role.outro, W - 190);

      // ===== 纵向锚点(自上而下流式排布) =====
      var imgW = 220, imgH = 414, imgTop = 360;           // 竖版形象图
      var rowsY0 = hasImg ? 824 : 440;                     // 三行信息
      var tipY = rowsY0 + 3 * 56 + 50;                     // "一句话解读"标题
      var linesY0 = tipY + 52;                             // 解读正文首行
      var outroY0 = linesY0 + lines.length * 46 + 34;      // 结语首行
      var afterOutro = outroY0 + outroLines.length * 40;   // 结语末行基线
      var H = Math.ceil(afterOutro + 130);                 // 页脚区预留 130px

      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');

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

      // 行当形象图(竖版完整展示,有图时插入;无图时信息行上移沿用紧凑布局)
      if (hasImg) {
        var imgX = (W - imgW) / 2;
        drawContainImage(ctx, roleImg, imgX, imgTop, imgW, imgH, 14);
        ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 4;
        roundRectPath(ctx, imgX, imgTop, imgW, imgH, 14); ctx.stroke();
      }

      // 关键信息行
      var rows = [
        ['性格关键词', role.keywords],
        ['代表人物', role.rep],
        ['行当特征', role.traits]
      ];
      ctx.textAlign = 'left';
      rows.forEach(function (row, i) {
        var y = rowsY0 + i * 56;
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
      ctx.fillText('—— 一句话解读 ——', W / 2, tipY);
      ctx.fillStyle = '#E8D8B0';
      ctx.font = '28px ' + KAI;
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, W / 2, linesY0 + i * 46);
      });

      // 结语(自动换行)
      ctx.fillStyle = '#D8C49A';
      ctx.font = '24px ' + KAI;
      outroLines.forEach(function (ln, i) {
        ctx.fillText(ln, W / 2, outroY0 + i * 40);
      });

      // 分隔线 + 页脚
      ctx.strokeStyle = 'rgba(201,168,76,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(180, H - 118);
      ctx.lineTo(W - 180, H - 118);
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
    }
  }

  // ===== 事件绑定 =====
  shareBtn.addEventListener('click', function () { shareCard(shareBtn); });
  restartBtn.addEventListener('click', startQuiz);

  startQuiz();
})();
