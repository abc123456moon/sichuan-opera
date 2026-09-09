/* ============ 锣鼓经 ============ */
(function () {
  var initDiv = document.getElementById('drumInit');
  if (!initDiv) return;

  var gameDiv = document.getElementById('drumGame');
  var resultDiv = document.getElementById('drumResult');
  var resultCard = document.getElementById('drumResultCard');
  var retryBtn = document.getElementById('drumRetry');
  var shareBtn = document.getElementById('drumShare');
  var notationEl = document.getElementById('drumNotation');
  var patternNameEl = document.getElementById('drumPatternName');
  var statusEl = document.getElementById('drumStatus');
  var metronomeEl = document.getElementById('drumMetronome');
  var pads = document.querySelectorAll('.drum-pad');

  // ===== 锣鼓经谱面(按难度分级) =====
  // 咚=鼓, 锵=锣, 才=钹, 卜/扎=板
  var PATTERNS = {
    easy: [
      { name: '慢长锤', desc: '文官出行、从容迈步', notation: ['咚','锵','咚','才','咚','锵','咚','才'], bpm: 55 },
      { name: '一锤锣', desc: '开场上场、单声亮锣', notation: ['咚','咚','锵','咚','咚','锵'], bpm: 50 }
    ],
    medium: [
      { name: '长锤', desc: '文官出行、从容迈步', notation: ['咚','锵','咚','才','咚','锵','咚','才','咚','锵','咚','才'], bpm: 65 },
      { name: '撞天婚', desc: '欢庆喜闹、热闹非凡', notation: ['咚','锵','才','锵','咚','咚','锵','才','锵','咚','锵','才','锵'], bpm: 75 }
    ],
    hard: [
      { name: '急急风', desc: '武将上场、紧张激烈', notation: ['咚','咚','锵','咚','咚','锵','咚','锵','咚','锵','咚','咚','锵'], bpm: 85 },
      { name: '水底鱼', desc: '行路赶场、短促紧凑', notation: ['咚','咚','锵','咚','锵','咚','锵','咚','咚','锵'], bpm: 95 }
    ]
  };

  var LEVEL_NAMES = { easy: '入门', medium: '中等', hard: '较难' };

  // 音符 → 乐器映射
  var NOTE_MAP = { '咚':'鼓', '锵':'锣', '才':'钹', '卜':'板', '扎':'板' };
  var NOTE_KEY = { '咚':'D', '锵':'L', '才':'B', '卜':'K', '扎':'K' };

  // ===== 渲染曲目选择列表 =====
  function renderTrackList() {
    Object.keys(PATTERNS).forEach(function (level) {
      var container = initDiv.querySelector('.drum-level-tracks[data-level="' + level + '"]');
      if (!container) return;
      container.innerHTML = '';
      PATTERNS[level].forEach(function (p, i) {
        var btn = document.createElement('button');
        btn.className = 'drum-track-btn';
        btn.innerHTML =
          '<span class="drum-track-name">「' + p.name + '」</span>' +
          '<span class="drum-track-desc">' + p.desc + '</span>' +
          '<span class="drum-track-meta">' + p.notation.length + '拍 · ' + p.bpm + ' BPM</span>';
        btn.addEventListener('click', function () { startGame(level, i); });
        container.appendChild(btn);
      });
    });
  }

  // ===== WebAudio 合成锣鼓音效 =====
  var audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { console.warn('AudioContext 不可用', e); }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // 主输出节点(所有音效经过这里,方便统一控音)
  var masterGain = null;
  function getMaster() {
    var ctx = ensureAudio();
    if (!ctx) return null;
    if (!masterGain) {
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(ctx.destination);
    }
    return masterGain;
  }

  function playDrum(drum, volume) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var master = getMaster();
    var now = ctx.currentTime;
    var vol = (volume === undefined) ? 1.0 : volume;

    if (drum === '鼓') {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.frequency.setValueAtTime(75, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      g.gain.setValueAtTime(0.6 * vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      o.connect(g); g.connect(master);
      o.start(now); o.stop(now + 0.3);
    } else if (drum === '锣') {
      var o2 = ctx.createOscillator();
      var g2 = ctx.createGain();
      o2.type = 'square';
      o2.frequency.setValueAtTime(800, now);
      o2.frequency.setValueAtTime(740, now + 0.02);
      g2.gain.setValueAtTime(0.25 * vol, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      o2.connect(g2); g2.connect(master);
      o2.start(now); o2.stop(now + 0.65);
    } else if (drum === '钹') {
      var bufferSize = ctx.sampleRate * 0.3;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, now);
      var g3 = ctx.createGain();
      g3.gain.setValueAtTime(0.3 * vol, now);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(filter); filter.connect(g3); g3.connect(master);
      noise.start(now); noise.stop(now + 0.4);
    } else if (drum === '板') {
      var o4 = ctx.createOscillator();
      var g4 = ctx.createGain();
      o4.type = 'triangle';
      o4.frequency.setValueAtTime(1200, now);
      g4.gain.setValueAtTime(0.3 * vol, now);
      g4.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o4.connect(g4); g4.connect(master);
      o4.start(now); o4.stop(now + 0.1);
    }
  }

  // ===== 背景伴奏:五声音阶旋律 + 低音量锣鼓 =====
  var accompanimentTimer = null;
  var melodyTimer = null;
  var accompanimentGain = null;

  function startAccompaniment() {
    stopAccompaniment();
    var ctx = ensureAudio();
    if (!ctx) return;
    var master = getMaster();
    if (!accompanimentGain) {
      accompanimentGain = ctx.createGain();
      accompanimentGain.gain.value = 0.5;
      accompanimentGain.connect(master);
    }

    // ---- 旋律层:五声音阶循环(宫商角徵羽) ----
    // C4=262 D4=294 E4=330 G4=392 A4=440 C5=523
    var MELODY = [
      392, 440, 523, 440, 392, 330, 294, 262,
      294, 330, 392, 523, 440, 392, 330, 294,
      523, 440, 392, 330, 294, 262, 294, 330,
      392, 523, 440, 392, 330, 294, 262, 262
    ];
    var melodyIdx = 0;
    var beatInterval = 60000 / pattern.bpm;

    function playMelodyNote() {
      if (step >= totalCount) { stopAccompaniment(); return; }
      var freq = MELODY[melodyIdx % MELODY.length];
      playMelodyTone(freq);
      melodyIdx++;
      melodyTimer = setTimeout(playMelodyNote, beatInterval);
    }

    // ---- 锣鼓层:低音量正确节奏 ----
    var accIdx = 0;
    function playAccNote() {
      if (accIdx >= pattern.notation.length) accIdx = 0;
      if (step >= totalCount) { stopAccompaniment(); return; }
      var note = pattern.notation[accIdx];
      var drum = NOTE_MAP[note] || '鼓';
      playDrumLow(drum);
      accIdx++;
      accompanimentTimer = setTimeout(playAccNote, beatInterval);
    }

    playMelodyNote();
    playAccNote();
  }

  // 合成旋律单音(笛子风格:正弦波+颤音)
  function playMelodyTone(freq) {
    var ctx = ensureAudio();
    if (!ctx || !accompanimentGain) return;
    var now = ctx.currentTime;
    var dur = 0.6;

    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, now);
    // 颤音
    var lfo = ctx.createOscillator();
    var lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5, now);
    lfoGain.gain.setValueAtTime(3, now);
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.05);
    g.gain.linearRampToValueAtTime(0.22, now + 0.15);
    g.gain.setValueAtTime(0.22, now + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    o.connect(g); g.connect(accompanimentGain);
    o.start(now); o.stop(now + dur);
    lfo.start(now); lfo.stop(now + dur);

    // 高八度泛音
    var o2 = ctx.createOscillator();
    var g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(freq * 2, now);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.1, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);
    o2.connect(g2); g2.connect(accompanimentGain);
    o2.start(now); o2.stop(now + dur);
  }

  function playDrumLow(drum) {
    var ctx = ensureAudio();
    if (!ctx || !accompanimentGain) return;
    var now = ctx.currentTime;
    var vol = 0.3;

    if (drum === '鼓') {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.frequency.setValueAtTime(75, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      g.gain.setValueAtTime(0.6 * vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      o.connect(g); g.connect(accompanimentGain);
      o.start(now); o.stop(now + 0.3);
    } else if (drum === '锣') {
      var o2 = ctx.createOscillator();
      var g2 = ctx.createGain();
      o2.type = 'square';
      o2.frequency.setValueAtTime(800, now);
      g2.gain.setValueAtTime(0.25 * vol, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      o2.connect(g2); g2.connect(accompanimentGain);
      o2.start(now); o2.stop(now + 0.65);
    } else if (drum === '钹') {
      var bufferSize = ctx.sampleRate * 0.3;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, now);
      var g3 = ctx.createGain();
      g3.gain.setValueAtTime(0.3 * vol, now);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(filter); filter.connect(g3); g3.connect(accompanimentGain);
      noise.start(now); noise.stop(now + 0.4);
    } else if (drum === '板') {
      var o4 = ctx.createOscillator();
      var g4 = ctx.createGain();
      o4.type = 'triangle';
      o4.frequency.setValueAtTime(1200, now);
      g4.gain.setValueAtTime(0.3 * vol, now);
      g4.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o4.connect(g4); g4.connect(accompanimentGain);
      o4.start(now); o4.stop(now + 0.1);
    }
  }

  function stopAccompaniment() {
    if (accompanimentTimer) { clearTimeout(accompanimentTimer); accompanimentTimer = null; }
    if (melodyTimer) { clearTimeout(melodyTimer); melodyTimer = null; }
  }

  // ===== 游戏状态 =====
  var pattern = null;
  var step = 0;
  var correctCount = 0;
  var totalCount = 0;
  var expectedDrum = null;
  var beatTimer = null;
  var startTime = 0;
  var lastBeatTime = 0;
  var timingWindow = 1000;
  var currentLevel = null;
  var gameActive = false; // 仅正式游戏阶段为true,示范和倒计时期间为false

  // ===== 开始游戏 =====
  function startGame(level, trackIdx) {
    ensureAudio();
    currentLevel = level;
    pattern = PATTERNS[level][trackIdx];
    step = 0;
    correctCount = 0;
    totalCount = pattern.notation.length;
    gameActive = false;

    initDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    gameDiv.style.display = 'block';

    patternNameEl.innerHTML =
      '<span class="drum-pattern-title">「' + pattern.name + '」</span>' +
      '<span class="drum-pattern-tag">' + LEVEL_NAMES[level] + '</span>' +
      '<span class="drum-pattern-desc">' + pattern.desc + '</span>';

    renderNotation();
    metronomeEl.innerHTML = '';
    statusEl.innerHTML = '🎵 先听一遍示范,记住节奏和音色';
    setTimeout(playDemo, 2000);
  }

  // ===== 示范播放 =====
  function playDemo() {
    var demoIdx = 0;
    var beatInterval = 60000 / pattern.bpm;
    statusEl.innerHTML = '♪ 示范播放中…仔细听';

    function playNext() {
      if (demoIdx >= pattern.notation.length) {
        var notes = notationEl.querySelectorAll('.drum-note');
        notes.forEach(function (n) { n.classList.remove('demo-current'); });
        statusEl.innerHTML = '👉 准备好了?跟着伴奏敲!';
        setTimeout(runCountdown, 1000);
        return;
      }
      var note = pattern.notation[demoIdx];
      var drum = NOTE_MAP[note] || '鼓';
      playDrum(drum, 1.0);
      var notes = notationEl.querySelectorAll('.drum-note');
      notes.forEach(function (n) { n.classList.remove('demo-current'); });
      if (notes[demoIdx]) notes[demoIdx].classList.add('demo-current');
      demoIdx++;
      setTimeout(playNext, beatInterval);
    }
    playNext();
  }

  // ===== 倒计时:3-2-1-开始! 倒计时结束启动伴奏 =====
  function runCountdown() {
    var count = 3;
    statusEl.innerHTML = '<span class="drum-countdown">' + count + '</span>';
    var ci = setInterval(function () {
      count--;
      if (count > 0) {
        statusEl.innerHTML = '<span class="drum-countdown">' + count + '</span>';
      } else {
        clearInterval(ci);
        statusEl.innerHTML = '<span class="drum-countdown drum-countdown-go">开始!</span>';
        beginRhythm();
      }
    }, 1000);
  }

  function renderNotation() {
    notationEl.innerHTML = '';
    pattern.notation.forEach(function (note, i) {
      var span = document.createElement('span');
      span.className = 'drum-note' + (i < step ? ' done' : '') + (i === step ? ' current' : '');
      span.dataset.idx = i;
      var key = NOTE_KEY[note] || '';
      span.innerHTML = note + '<span class="drum-note-key">' + key + '</span>';
      notationEl.appendChild(span);
    });
  }

  // ===== 开始正式游戏(启动伴奏) =====
  function beginRhythm() {
    var beatInterval = 60000 / pattern.bpm;
    startTime = Date.now();
    lastBeatTime = startTime;
    gameActive = true;
    statusEl.textContent = '敲起来!';
    // 启动背景伴奏
    startAccompaniment();
    advanceStep();
  }

  function advanceStep() {
    if (step >= totalCount) {
      finishGame();
      return;
    }
    var note = pattern.notation[step];
    expectedDrum = NOTE_MAP[note] || '鼓';
    renderNotation();

    var light = document.createElement('span');
    light.className = 'drum-beat-light';
    metronomeEl.appendChild(light);
    setTimeout(function () { light.classList.add('active'); }, 10);
    setTimeout(function () { light.classList.remove('active'); }, 200);

    lastBeatTime = Date.now();

    clearTimeout(beatTimer);
    var beatInterval = 60000 / pattern.bpm;
    beatTimer = setTimeout(function () {
      if (step < totalCount) {
        flashPad(expectedDrum, 'miss');
        step++;
        advanceStep();
      }
    }, beatInterval + timingWindow);
  }

  function handleHit(drum) {
    if (!pattern || !gameActive || step >= totalCount) return;
    playDrum(drum, 1.0);

    if (drum === expectedDrum) {
      correctCount++;
      flashPad(drum, 'hit');
    } else {
      flashPad(drum, 'wrong');
    }

    clearTimeout(beatTimer);
    step++;
    setTimeout(advanceStep, 120);
  }

  function flashPad(drum, type) {
    var pad = null;
    pads.forEach(function (p) {
      if (p.dataset.drum === drum) pad = p;
    });
    if (!pad) return;
    pad.classList.remove('flash-hit','flash-wrong','flash-miss');
    pad.classList.add('flash-' + type);
    setTimeout(function () { pad.classList.remove('flash-' + type); }, 300);
  }

  function finishGame() {
    clearTimeout(beatTimer);
    stopAccompaniment();
    gameActive = false;
    var accuracy = Math.round((correctCount / totalCount) * 100);
    var grade, comment;
    if (accuracy === 100) {
      grade = '满分!';
      comment = '好鼓师!这段「' + pattern.name + '」你一字不差地打下来了。';
    } else if (accuracy >= 80) {
      grade = '优秀';
      comment = '不错!这段「' + pattern.name + '」你打对了' + correctCount + '/' + totalCount + '拍。';
    } else if (accuracy >= 50) {
      grade = '合格';
      comment = '及格了。这段「' + pattern.name + '」打对' + correctCount + '/' + totalCount + '拍,多练几遍就熟了。';
    } else {
      grade = '再练练';
      comment = '这段「' + pattern.name + '」对' + correctCount + '/' + totalCount + '拍。别急,跟着节拍慢慢来。';
    }

    var knowledge = '你刚才敲的「' + pattern.name + '」,' + pattern.desc + '。';

    gameDiv.style.display = 'none';
    resultDiv.style.display = 'block';
    resultCard.innerHTML =
      '<div class="drum-result-top">✦ 锣鼓经成绩 ✦</div>' +
      '<h3 class="drum-result-grade">' + grade + '</h3>' +
      '<div class="drum-result-score">' +
        '<span class="drum-result-num">' + accuracy + '</span><span class="drum-result-unit">分</span>' +
        '<span class="drum-result-detail">(' + correctCount + '/' + totalCount + ' 拍正确)</span>' +
      '</div>' +
      '<p class="drum-result-pattern">谱面: 「' + pattern.name + '」(' + LEVEL_NAMES[currentLevel] + ')</p>' +
      '<p class="drum-result-comment">' + comment + '</p>' +
      '<p class="drum-result-knowledge">' + knowledge + '</p>';
  }

  // ===== 分享 =====
  function shareResult() {
    if (!pattern) return;
    var accuracy = Math.round((correctCount / totalCount) * 100);
    var W = 600, H = 400;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var KAI = '"KaiTi","STKaiti","楷体",serif';

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#4a2b16'); bg.addColorStop(1, '#38200f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 5;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#D8C49A'; ctx.font = '22px ' + KAI;
    ctx.fillText('川剧文化小站 · 锣鼓经', W / 2, 60);
    ctx.fillStyle = '#F4D98A'; ctx.font = 'bold 36px ' + KAI;
    ctx.fillText('我的锣鼓经成绩', W / 2, 110);

    ctx.fillStyle = '#F0E4D0'; ctx.font = '52px ' + KAI;
    ctx.fillText(accuracy + ' 分', W / 2, 185);

    ctx.fillStyle = '#C9A84C'; ctx.font = '24px ' + KAI;
    ctx.fillText('谱面: 「' + pattern.name + '」(' + LEVEL_NAMES[currentLevel] + ')', W / 2, 235);
    ctx.fillText(correctCount + '/' + totalCount + ' 拍正确', W / 2, 270);

    ctx.fillStyle = '#8f7448'; ctx.font = '18px ' + KAI;
    ctx.fillText('半台锣鼓半台戏', W / 2, 320);
    ctx.fillStyle = '#6B5A3E'; ctx.font = '14px ' + KAI;
    ctx.fillText('* 本互动仅供娱乐 · 川剧文化小站', W / 2, 360);

    var url = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = url; a.download = '锣鼓经成绩-' + pattern.name + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ===== 事件绑定 =====
  retryBtn.addEventListener('click', function () {
    gameDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    initDiv.style.display = 'block';
  });
  shareBtn.addEventListener('click', shareResult);

  pads.forEach(function (pad) {
    pad.addEventListener('click', function () {
      handleHit(pad.dataset.drum);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (gameDiv.style.display === 'none') return;
    var key = e.key.toUpperCase();
    var pad = null;
    pads.forEach(function (p) {
      if (p.dataset.key === key) pad = p;
    });
    if (pad) {
      e.preventDefault();
      handleHit(pad.dataset.drum);
    }
  });

  // 初始化:渲染曲目列表
  renderTrackList();
})();
