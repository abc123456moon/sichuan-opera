import * as THREE from 'three';

(function () {
  var canvas = document.getElementById('maskPeelCanvas');
  var stage = document.getElementById('peelStage');
  var hintEl = document.getElementById('peelHint');
  var narrationEl = document.getElementById('peelNarration');
  var timerEl = document.getElementById('peelTimer');
  if (!canvas || !stage) return;

  // ===== 配置 =====
  var LAYERS = [
    { color: 0xF5F0E6, name: '素白', narration: '' },
    { color: 0xC43028, name: '红', narration: '红色。他立誓为兄报仇，忠勇之心如烈火。' },
    { color: 0xD4A017, name: '金', narration: '金色。途中他发现自己并非凡人，是神将转世。' },
    { color: 0x1A1614, name: '黑', narration: '黑色。他得知真相——陷害兄长的，正是他最信任的人。' },
    { color: 0xF5F0E6, name: '素面', narration: '素面。他卸下一切伪装与身份，以本来面目走向仇人。这才是他最终的决定。' }
  ];
  var TOTAL_PEELS = 4;
  var CONCLUSION = '四张脸谱，四次选择。变脸不是魔术，是心的颜色在变。';

  // ===== 场景（延迟初始化，避免 WebGL context 冲突） =====
  var renderer = null;
  var scene = null;
  var camera = null;
  var STAGE_H = 420;
  var initialized = false;

  function initRenderer() {
    if (initialized) return true;
    if (!stage || stage.clientWidth < 10) return false; // 宽度不够,等下次重试
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(stage.clientWidth, STAGE_H);
      renderer.setClearColor(0x0a0608, 1);
      canvas.style.touchAction = 'none';

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(45, stage.clientWidth / STAGE_H, 0.1, 100);
      camera.position.set(0, 0.02, 1.9);
      camera.lookAt(0, 0, 0);

      initialized = true;
      return true;
    } catch (e) {
      console.error('MaskPeel WebGL init failed:', e);
      return false;
    }
  }

  // ===== 灯光（在 initRenderer 中添加到 scene） =====
  function addLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    var keyLight = new THREE.DirectionalLight(0xfff0d0, 1.8);
    keyLight.position.set(0, 2, 5);
    scene.add(keyLight);
    var fillLight = new THREE.DirectionalLight(0xccddff, 0.6);
    fillLight.position.set(-3, 1, 3);
    scene.add(fillLight);
    var rimLight = new THREE.DirectionalLight(0xff8844, 0.5);
    rimLight.position.set(2, -1, -2);
    scene.add(rimLight);
  }

  // ===== 卡通色阶贴图 =====
  var gradColors = new Uint8Array([50, 130, 210]);
  var gradientMap = new THREE.DataTexture(gradColors, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;

  // ===== 脸谱纹理生成（Canvas 2D 绘制面部图案） =====
  // LatheGeometry UV：U=0~1 沿角度 0~π（左→中→右），V=0~1 沿轮廓从底到顶
  // 纹理以 U=0.5（面部正中）为对称轴，左右镜像
  function createMaskTexture(layerIdx) {
    var S = 512;
    var c = document.createElement('canvas');
    c.width = S; c.height = S;
    var ctx = c.getContext('2d');
    var cx = S / 2; // 面部正中

    // 辅助：对称绘制（在左右两侧各画一次）
    function drawSym(fn) {
      ctx.save(); ctx.translate(cx, 0); fn(ctx, 1); ctx.restore();
      ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); fn(ctx, -1); ctx.restore();
    }

    // 眉眼位置（V 轴从顶 0 到底 512，但 LatheGeometry 的 V=0 在底部）
    // 实际：V=0 → 下巴，V=1 → 额头。Canvas Y=0 → 顶部→额头
    var browY = S * 0.28;
    var eyeY = S * 0.38;
    var eyeDX = S * 0.10;
    var noseY = S * 0.50;
    var mouthY = S * 0.65;
    var cheekY = S * 0.52;

    if (layerIdx === 0) {
      // —— 素白脸谱：纯素底，仅极淡轮廓线 ——
      var grad0 = ctx.createLinearGradient(0, 0, 0, S);
      grad0.addColorStop(0, '#FAF5EB'); grad0.addColorStop(1, '#E8DDC8');
      ctx.fillStyle = grad0; ctx.fillRect(0, 0, S, S);
      // 淡淡的眉眼轮廓
      ctx.strokeStyle = 'rgba(180,165,140,0.25)'; ctx.lineWidth = 2;
      drawSym(function (ctx) {
        ctx.beginPath(); ctx.ellipse(-eyeDX, eyeY, 26, 12, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-eyeDX - 35, browY); ctx.quadraticCurveTo(-eyeDX, browY - 12, -eyeDX + 35, browY); ctx.stroke();
      });
      // 鼻梁淡线
      ctx.beginPath(); ctx.moveTo(cx, noseY - 30); ctx.lineTo(cx, noseY + 20); ctx.strokeStyle = 'rgba(180,165,140,0.2)'; ctx.stroke();

    } else if (layerIdx === 1) {
      // —— 红脸 · 忠勇：红底 + 白色火焰眉 + 白眼窝 + 黑眉线 ——
      var grad1 = ctx.createLinearGradient(0, 0, 0, S);
      grad1.addColorStop(0, '#D03028'); grad1.addColorStop(0.6, '#C02020'); grad1.addColorStop(1, '#9A1818');
      ctx.fillStyle = grad1; ctx.fillRect(0, 0, S, S);
      // 额头白色火焰纹
      ctx.fillStyle = 'rgba(245,240,230,0.92)';
      ctx.beginPath();
      ctx.moveTo(cx, S * 0.12); ctx.quadraticCurveTo(cx - 22, S * 0.20, cx - 40, S * 0.16);
      ctx.quadraticCurveTo(cx - 18, S * 0.24, cx, S * 0.26);
      ctx.quadraticCurveTo(cx + 18, S * 0.24, cx + 40, S * 0.16);
      ctx.quadraticCurveTo(cx + 22, S * 0.20, cx, S * 0.12);
      ctx.fill();
      // 白色眼窝
      drawSym(function (ctx) {
        ctx.fillStyle = 'rgba(245,240,230,0.88)';
        ctx.beginPath(); ctx.ellipse(-eyeDX, eyeY, 34, 22, 0, 0, Math.PI * 2); ctx.fill();
        // 黑色瞳孔
        ctx.fillStyle = '#1A1614';
        ctx.beginPath(); ctx.arc(-eyeDX, eyeY, 9, 0, Math.PI * 2); ctx.fill();
        // 黑色剑眉
        ctx.strokeStyle = '#1A1614'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-eyeDX - 38, browY); ctx.lineTo(-eyeDX + 22, browY - 10); ctx.stroke();
      });
      // 鼻梁白线
      ctx.strokeStyle = 'rgba(245,240,230,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, noseY - 35); ctx.lineTo(cx, noseY + 25); ctx.stroke();
      // 嘴部红唇
      ctx.fillStyle = '#6A1010';
      ctx.beginPath(); ctx.ellipse(cx, mouthY, 30, 10, 0, 0, Math.PI * 2); ctx.fill();

    } else if (layerIdx === 2) {
      // —— 金脸 · 神性：金底 + 额头佛眼 + 脸颊祥云 + 黑眉眼 ——
      var grad2 = ctx.createLinearGradient(0, 0, 0, S);
      grad2.addColorStop(0, '#E8B820'); grad2.addColorStop(0.5, '#D4A017'); grad2.addColorStop(1, '#A88010');
      ctx.fillStyle = grad2; ctx.fillRect(0, 0, S, S);
      // 额头第三只眼（佛眼）
      ctx.strokeStyle = '#6B4010'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, S * 0.16, 30, 16, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(245,240,230,0.9)';
      ctx.beginPath(); ctx.ellipse(cx, S * 0.16, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1A1614';
      ctx.beginPath(); ctx.arc(cx, S * 0.16, 7, 0, Math.PI * 2); ctx.fill();
      // 祥云纹（脸颊两侧）
      drawSym(function (ctx) {
        ctx.strokeStyle = '#6B4010'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-eyeDX - 50, cheekY); ctx.quadraticCurveTo(-eyeDX - 30, cheekY - 15, -eyeDX - 10, cheekY - 5);
        ctx.quadraticCurveTo(-eyeDX - 20, cheekY + 15, -eyeDX - 50, cheekY); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-eyeDX - 45, cheekY + 10); ctx.quadraticCurveTo(-eyeDX - 25, cheekY + 25, -eyeDX - 5, cheekY + 15); ctx.stroke();
      });
      // 黑色眼窝 + 瞳孔
      drawSym(function (ctx) {
        ctx.fillStyle = '#1A1614';
        ctx.beginPath(); ctx.ellipse(-eyeDX, eyeY, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#D4A017';
        ctx.beginPath(); ctx.arc(-eyeDX, eyeY, 7, 0, Math.PI * 2); ctx.fill();
      });
      // 金色剑眉
      ctx.strokeStyle = '#1A1614'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      drawSym(function (ctx) {
        ctx.beginPath(); ctx.moveTo(-eyeDX - 35, browY); ctx.lineTo(-eyeDX + 20, browY - 8); ctx.stroke();
      });
      // 鼻梁金线
      ctx.strokeStyle = '#6B4010'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, noseY - 30); ctx.lineTo(cx, noseY + 20); ctx.stroke();
      // 嘴部
      ctx.fillStyle = '#6B4010';
      ctx.beginPath(); ctx.ellipse(cx, mouthY, 24, 8, 0, 0, Math.PI * 2); ctx.fill();

    } else if (layerIdx === 3) {
      // —— 黑脸 · 愤怒：黑底 + 额头白色月牙 + 白三角眼窝 + 白獠牙 ——
      var grad3 = ctx.createLinearGradient(0, 0, 0, S);
      grad3.addColorStop(0, '#1A1614'); grad3.addColorStop(0.5, '#0F0D0B'); grad3.addColorStop(1, '#080606');
      ctx.fillStyle = grad3; ctx.fillRect(0, 0, S, S);
      // 额头白色月牙
      ctx.fillStyle = 'rgba(245,240,230,0.92)';
      ctx.beginPath();
      ctx.arc(cx, S * 0.14, 28, Math.PI * 0.2, Math.PI * 0.8, false);
      ctx.arc(cx, S * 0.14, 14, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.fill();
      // 白色三角眼窝
      drawSym(function (ctx) {
        ctx.fillStyle = 'rgba(245,240,230,0.88)';
        ctx.beginPath();
        ctx.moveTo(-eyeDX - 30, eyeY - 22); ctx.lineTo(-eyeDX + 30, eyeY - 22); ctx.lineTo(-eyeDX, eyeY + 20);
        ctx.closePath(); ctx.fill();
        // 黑色瞳孔
        ctx.fillStyle = '#080606';
        ctx.beginPath(); ctx.arc(-eyeDX, eyeY - 2, 8, 0, Math.PI * 2); ctx.fill();
      });
      // 白色怒眉
      drawSym(function (ctx) {
        ctx.strokeStyle = 'rgba(245,240,230,0.9)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-eyeDX - 35, browY + 4); ctx.lineTo(-eyeDX + 25, browY - 14); ctx.stroke();
      });
      // 鼻梁白线
      ctx.strokeStyle = 'rgba(245,240,230,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, noseY - 35); ctx.lineTo(cx, noseY + 25); ctx.stroke();
      // 嘴部白色獠牙
      ctx.fillStyle = 'rgba(245,240,230,0.85)';
      drawSym(function (ctx) {
        ctx.beginPath();
        ctx.moveTo(cx - 6, mouthY - 4); ctx.lineTo(cx - 18, mouthY - 4); ctx.lineTo(cx - 12, mouthY + 14); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 6, mouthY - 4); ctx.lineTo(cx + 6, mouthY - 4); ctx.lineTo(cx, mouthY + 14); ctx.closePath(); ctx.fill();
      });
      // 嘴部黑线
      ctx.strokeStyle = 'rgba(245,240,230,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 30, mouthY - 4); ctx.lineTo(cx + 30, mouthY - 4); ctx.stroke();

    } else if (layerIdx === 4) {
      // —— 素面 · 真我：回到素白，但有淡淡的光辉 ——
      var grad4 = ctx.createLinearGradient(0, 0, 0, S);
      grad4.addColorStop(0, '#FFFAF0'); grad4.addColorStop(0.5, '#F5F0E6'); grad4.addColorStop(1, '#E0D5C0');
      ctx.fillStyle = grad4; ctx.fillRect(0, 0, S, S);
      // 极淡的金色光辉纹
      ctx.strokeStyle = 'rgba(212,160,23,0.15)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, S * 0.50, 80, 0, Math.PI * 2); ctx.stroke();
      // 淡眉眼
      ctx.strokeStyle = 'rgba(160,140,110,0.3)'; ctx.lineWidth = 2;
      drawSym(function (ctx) {
        ctx.beginPath(); ctx.ellipse(-eyeDX, eyeY, 24, 10, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-eyeDX - 30, browY); ctx.quadraticCurveTo(-eyeDX, browY - 8, -eyeDX + 30, browY); ctx.stroke();
      });
      // 鼻梁
      ctx.beginPath(); ctx.moveTo(cx, noseY - 25); ctx.lineTo(cx, noseY + 15); ctx.stroke();
    }

    var tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    // LatheGeometry V=0 在底部（下巴），V=1 在顶部（额头）
    // Canvas Y=0 在顶部 → 需翻转 Y 轴使额头图案对应到几何体顶部
    tex.flipY = false;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  // ===== 脸谱几何体（LatheGeometry 旋转纵截面 → 半壳面具） =====
  // 宽度加大、高度略压缩，使正面看起来是完整脸形而非竖线
  var profile = [
    new THREE.Vector2(0.03, 1.3),
    new THREE.Vector2(0.65, 1.25),
    new THREE.Vector2(1.15, 1.0),
    new THREE.Vector2(1.42, 0.55),
    new THREE.Vector2(1.32, 0.05),
    new THREE.Vector2(0.98, -0.38),
    new THREE.Vector2(0.55, -0.68),
    new THREE.Vector2(0.03, -0.78)
  ];
  var maskGeo = new THREE.LatheGeometry(profile, 64, 0, Math.PI);
  maskGeo.computeVertexNormals();

  // 描边几何体（放大 1.05 倍，BackSide 黑色）
  var outlineGeo = maskGeo.clone();
  outlineGeo.scale(1.05, 1.05, 1.05);

  // ===== 揭脸着色器注入 =====
  function applyPeelShader(material, peelUniform) {
    material.onBeforeCompile = function (shader) {
      shader.uniforms.uPeelProgress = peelUniform;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        '#include <common>\nuniform float uPeelProgress;'
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n' +
        '  float peelLine = 1.4 - uPeelProgress * 2.25;\n' +
        '  if (transformed.y > peelLine) {\n' +
        '    float d = transformed.y - peelLine;\n' +
        '    float angle = d * uPeelProgress * 1.8;\n' +
        '    transformed.y = peelLine + d * cos(angle);\n' +
        '    transformed.z += sin(angle) * d * 0.85;\n' +
        '    transformed.x *= (1.0 - uPeelProgress * 0.12);\n' +
        '  }'
      );
    };
  }

  // ===== 状态 =====
  var currentLayerIdx = 0;
  var peelProgress = 0;
  var isDragging = false;
  var dragStartY = 0;
  var startTime = null;
  var peelCount = 0;
  var isComplete = false;
  var maskGroup = null;
  var nextMaskGroup = null;
  var animFrame = null;

  // ===== 创建脸谱 =====
  function createMask(layerIdx) {
    var layer = LAYERS[layerIdx];
    var group = new THREE.Group();
    var peelUniform = { value: 0 };
    var maskTex = createMaskTexture(layerIdx);

    // 主面具（带面部图案纹理）
    var mat = new THREE.MeshBasicMaterial({
      map: maskTex,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });
    applyPeelShader(mat, peelUniform);
    var mesh = new THREE.Mesh(maskGeo, mat);
    group.add(mesh);

    // 描边
    var outlineMat = new THREE.MeshBasicMaterial({
      color: 0x0d0a08,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.7
    });
    applyPeelShader(outlineMat, peelUniform);
    var outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
    group.add(outlineMesh);

    // 微微倾斜，像悬挂在架子上
    group.rotation.x = -0.08;
    group.rotation.z = 0.04;

    group.userData = {
      material: mat,
      outlineMaterial: outlineMat,
      peelUniform: peelUniform
    };
    return group;
  }

  // ===== 初始化/重置脸谱叠层 =====
  function initMasks() {
    if (!scene) return;
    if (maskGroup) { scene.remove(maskGroup); maskGroup = null; }
    if (nextMaskGroup) { scene.remove(nextMaskGroup); nextMaskGroup = null; }

    maskGroup = createMask(currentLayerIdx);
    scene.add(maskGroup);

    var nextIdx = (currentLayerIdx + 1) % LAYERS.length;
    nextMaskGroup = createMask(nextIdx);
    nextMaskGroup.position.z = -0.06;
    scene.add(nextMaskGroup);

    peelProgress = 0;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  }

  // ===== 交互 =====
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();

  function getPointer(e) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onDown(e) {
    if (isComplete || !maskGroup || !camera) return;
    getPointer(e);
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObject(maskGroup, true);
    if (hits.length > 0) {
      isDragging = true;
      dragStartY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      if (!startTime) startTime = Date.now();
      hintEl.style.opacity = '0.25';
    }
  }

  function onMove(e) {
    if (!isDragging || !maskGroup) return;
    var dy = e.clientY - dragStartY;
    var rect = canvas.getBoundingClientRect();
    peelProgress = Math.max(0, Math.min(1, dy / (rect.height * 0.5)));
    var pu = maskGroup.userData.peelUniform;
    if (pu) pu.value = peelProgress;

    // 超过 50% 开始淡出
    var fs = 0.5;
    if (peelProgress > fs) {
      var op = 1 - (peelProgress - fs) / (1 - fs);
      maskGroup.userData.material.opacity = op;
      maskGroup.userData.outlineMaterial.opacity = op * 0.7;
    }
  }

  function onUp(e) {
    if (!isDragging) return;
    isDragging = false;
    if (peelProgress > 0.35) animateComplete();
    else animateSnapBack();
  }

  // ===== 揭脸完成动画 =====
  function animateComplete() {
    var p = peelProgress;
    function step() {
      p += 0.045;
      if (p >= 1) {
        p = 1;
        var pu = maskGroup.userData.peelUniform;
        if (pu) pu.value = 1;
        maskGroup.userData.material.opacity = 0;
        maskGroup.userData.outlineMaterial.opacity = 0;

        peelCount++;
        var revealed = LAYERS[(currentLayerIdx + 1) % LAYERS.length];
        if (revealed.narration) typewriter(narrationEl, revealed.narration, 35);

        setTimeout(function () {
          currentLayerIdx = (currentLayerIdx + 1) % LAYERS.length;
          initMasks();
          if (peelCount >= TOTAL_PEELS) {
            showConclusion();
          } else {
            hintEl.style.opacity = '1';
            hintEl.textContent = '继续揭——';
          }
        }, 900);
        return;
      }
      var pu = maskGroup.userData.peelUniform;
      if (pu) pu.value = p;
      var fs = 0.5;
      if (p > fs) {
        var op = 1 - (p - fs) / (1 - fs);
        maskGroup.userData.material.opacity = op;
        maskGroup.userData.outlineMaterial.opacity = op * 0.7;
      }
      animFrame = requestAnimationFrame(step);
    }
    animFrame = requestAnimationFrame(step);
  }

  // ===== 回弹动画 =====
  function animateSnapBack() {
    var p = peelProgress;
    function step() {
      p -= 0.06;
      if (p <= 0) {
        p = 0;
        var pu = maskGroup.userData.peelUniform;
        if (pu) pu.value = 0;
        maskGroup.userData.material.opacity = 1;
        maskGroup.userData.outlineMaterial.opacity = 0.7;
        hintEl.style.opacity = '1';
        return;
      }
      var pu = maskGroup.userData.peelUniform;
      if (pu) pu.value = p;
      var fs = 0.5;
      if (p > fs) {
        var op = 1 - (p - fs) / (1 - fs);
        maskGroup.userData.material.opacity = op;
        maskGroup.userData.outlineMaterial.opacity = op * 0.7;
      } else {
        maskGroup.userData.material.opacity = 1;
        maskGroup.userData.outlineMaterial.opacity = 0.7;
      }
      animFrame = requestAnimationFrame(step);
    }
    animFrame = requestAnimationFrame(step);
  }

  // ===== 打字机 =====
  var twTimer = null;
  function typewriter(el, text, speed) {
    if (twTimer) clearInterval(twTimer);
    el.textContent = '';
    el.style.opacity = '1';
    var i = 0;
    twTimer = setInterval(function () {
      if (i >= text.length) { clearInterval(twTimer); return; }
      el.textContent += text[i];
      i++;
    }, speed || 35);
  }

  // ===== 通关结语 =====
  function showConclusion() {
    isComplete = true;
    var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setTimeout(function () {
      typewriter(narrationEl, CONCLUSION, 45);
      setTimeout(function () {
        timerEl.textContent = '你用了 ' + elapsed + ' 秒完成变脸。川剧演员最快 0.6 秒揭掉 8 张。';
        timerEl.style.opacity = '1';
      }, 2000);
    }, 600);
  }

  // ===== 渲染循环 =====
  function render() {
    requestAnimationFrame(render);
    if (!renderer || !scene || !camera) return;
    var t = Date.now() * 0.001;
    if (maskGroup && !isDragging) {
      maskGroup.position.y = Math.sin(t * 0.8) * 0.04;
      maskGroup.rotation.y = Math.sin(t * 0.5) * 0.03;
    }
    if (nextMaskGroup && !isDragging) {
      nextMaskGroup.position.y = Math.sin(t * 0.8 + 0.4) * 0.03;
      nextMaskGroup.rotation.y = Math.sin(t * 0.5 + 0.2) * 0.025;
    }
    renderer.render(scene, camera);
  }

  // ===== 窗口尺寸 =====
  function onResize() {
    if (!renderer || !camera) return;
    var w = stage.clientWidth;
    camera.aspect = w / STAGE_H;
    camera.updateProjectionMatrix();
    renderer.setSize(w, STAGE_H);
  }

  // ===== 事件 =====
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  window.addEventListener('resize', onResize);

  // ===== 直接初始化 + 懒加载兜底 =====
  function boot() {
    if (initRenderer()) {
      addLights();
      initMasks();
      render();
    }
  }

  // 尝试直接初始化
  boot();

  // 如果直接初始化失败，用 setTimeout 重试（模块从 CDN 异步加载,load 事件可能已过）
  if (!initialized) {
    var bootRetry = 0;
    var retryTimer = setInterval(function () {
      if (initialized || bootRetry > 20) { clearInterval(retryTimer); return; }
      bootRetry++;
      if (stage.clientWidth > 10) { boot(); if (initialized) clearInterval(retryTimer); }
    }, 200);
  }

  // IntersectionObserver 兜底（滚动可见时触发）
  if (!initialized) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        boot();
        io.disconnect();
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    io.observe(stage);
  }
})();
