const locale = document.body.dataset.locale === 'zh' ? 'zh' : 'en';
const zh = locale === 'zh';
const ui = zh ? {
  open: '打开导航', close: '关闭导航', copying: '正在复制…', copied: '已复制', copy: '复制命令', fallback: '请按 ⌘C 复制',
  empty: '没有找到相关文档，试试“权限”“录屏”或“快捷键”。', unavailable: '搜索暂时不可用，请使用下方目录浏览文档。',
  found: count => `找到 ${count} 篇文档`, pause: '暂停动效', resume: '继续动效', reduced: '已减少动态效果', replay: '重播这段动效',
  capture: '单击选窗口，拖动框区域。重点，直接标出来。', style: '留一点白，加一层轻影。顺手就能发出去。', demo: '录制真实操作，完成后调整镜头焦点与缩放。',
  captureAlt: '真实 XShot 框选和浮动标注工具栏，Launchboard 为演示内容。', styleAlt: '真实 XShot 编辑器中的标注工具栏与截图美化面板。', demoAlt: '真实 XShot 产品演示编辑器与自动聚焦片段。', pinAlt: '真实 XShot 桌面贴图，浮在其他窗口上方。'
} : {
  open: 'Open navigation', close: 'Close navigation', copying: 'Copying…', copied: 'Copied', copy: 'Copy command', fallback: 'Press ⌘C to copy',
  empty: 'No matching articles. Try “permissions”, “recording”, or “shortcuts”.', unavailable: 'Search is unavailable. Browse the documentation below.',
  found: count => count === 1 ? '1 article found' : `${count} articles found`, pause: 'Pause motion', resume: 'Resume motion', reduced: 'Reduced motion is on', replay: 'Replay the moment',
  capture: 'Pick a window. Draw an area. Put the point right on it.', style: 'A little padding, a softer shadow. Ready to share.', demo: 'Record a real workflow. Fine-tune the focus afterwards.',
  captureAlt: 'The real XShot window selection and annotation toolbar. Launchboard is sample content.', styleAlt: 'The real XShot editor and screenshot styling controls.', demoAlt: 'The real XShot demo editor with automatic focus segments.', pinAlt: 'An actual pinned XShot image floating above other windows.'
};
const root = document.body.dataset.base || '.';
const localeRoot = document.body.dataset.localeBase || '.';
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu() {
  if (!menuToggle || !mobileNav) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', ui.open);
  mobileNav.hidden = true;
}
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? ui.close : ui.open);
  mobileNav.hidden = !open;
});
mobileNav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') { closeMenu(); menuToggle.focus(); }
});
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

// Locale links remain ordinary static routes, with the current section retained.
document.querySelectorAll('[data-locale-link]').forEach(link => {
  const target = new URL(link.href);
  target.hash = location.hash;
  link.href = target.href;
});
window.addEventListener('hashchange', () => document.querySelectorAll('[data-locale-link]').forEach(link => {
  const target = new URL(link.href); target.hash = location.hash; link.href = target.href;
}));

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const paperStage = document.querySelector('.paper-stage');
const paperFront = document.querySelector('.paper-front');
const peelControl = document.getElementById('paper-peel');
const layerControls = [...document.querySelectorAll('[data-paper-layer]')];
const motionToggle = document.getElementById('motion-toggle');
const motionReplay = document.getElementById('motion-replay');
let motionPaused = false;
let paperFrame = 0;
let peelFrame = 0;
let manualPaper = false;
let currentPeel = 1;
let targetPeel = 1;
let gesture = null;
let suppressPeelClick = false;
try { motionPaused = sessionStorage.getItem('xshot-motion-paused') === 'true'; } catch {}
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
function drawPaper(value) {
  currentPeel = clamp(value, 0, 2.2);
  window.XShotPaper?.render(currentPeel);
  if (!paperStage) return;
  const reveal = clamp((currentPeel - 1) / 1.2, 0, 1);
  paperStage.style.setProperty('--paper-reveal', reveal.toFixed(4));
  paperStage.dataset.peelProgress = currentPeel.toFixed(4);
  paperFront.style.setProperty('--paper-reveal', reveal.toFixed(4));
}
function stopPaperLoop() { cancelAnimationFrame(paperFrame); paperFrame = 0; }
function stopPeelLoop() { cancelAnimationFrame(peelFrame); peelFrame = 0; }
function takePaperControl() {
  manualPaper = true;
  stopPaperLoop(); stopPeelLoop();
  hero?.classList.remove('is-playing');
}
function markLayer(layer) {
  if (!paperStage) return;
  paperStage.dataset.layer = layer;
  layerControls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paperLayer === layer)));
}
function settlePeel(value) {
  takePaperControl();
  targetPeel = clamp(value, 1, 2.2);
  peelControl?.setAttribute('aria-expanded', String(targetPeel > 1.5));
  if (targetPeel === 1) markLayer('finish');
  if (reducedMotion.matches || motionPaused || document.hidden || hero?.classList.contains('motion-suspended')) { drawPaper(targetPeel); return; }
  const from = currentPeel;
  if (Math.abs(from - targetPeel) < .002) { drawPaper(targetPeel); return; }
  const start = performance.now();
  const duration = 420;
  function step(now) {
    const time = Math.min((now - start) / duration, 1);
    drawPaper(from + (targetPeel - from) * (1 - Math.pow(1 - time, 4)));
    if (time < 1) peelFrame = requestAnimationFrame(step);
    else { peelFrame = 0; drawPaper(targetPeel); }
  }
  peelFrame = requestAnimationFrame(step);
}
function chooseLayer(layer) {
  markLayer(layer);
  settlePeel(layer === 'finish' ? 1 : 2.2);
}
function updatePaper() {
  paperFrame = 0;
  if (!hero || manualPaper || document.hidden || hero.classList.contains('motion-suspended')) return;
  const animation = hero.querySelector('.paper-timeline')?.getAnimations()[0];
  if (!hero.classList.contains('is-playing') || !animation) { drawPaper(1); return; }
  const time = Number(animation.currentTime || 0) / 4800;
  drawPaper(.04 + .96 * (1 - Math.pow(1 - Math.min(time / .8, 1), 3)));
  if (time < 1 && !motionPaused && !reducedMotion.matches) paperFrame = requestAnimationFrame(updatePaper);
}
function startPaperLoop() { if (!manualPaper && !paperFrame) paperFrame = requestAnimationFrame(updatePaper); }
function applyMotionPreference() {
  document.body.classList.toggle('motion-paused', motionPaused);
  if (!motionToggle) return;
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  motionToggle.disabled = reducedMotion.matches;
  motionToggle.querySelector('span').textContent = reducedMotion.matches ? ui.reduced : (motionPaused ? ui.resume : ui.pause);
  motionReplay.disabled = reducedMotion.matches;
  motionReplay.querySelector('span').textContent = ui.replay;
  if (reducedMotion.matches) { hero?.classList.remove('is-playing'); stopPaperLoop(); stopPeelLoop(); drawPaper(manualPaper ? targetPeel : 1); }
  else if (motionPaused) { stopPaperLoop(); stopPeelLoop(); }
  else if (manualPaper) settlePeel(targetPeel);
  else startPaperLoop();
}
function resetSheetOffsets() {
  document.querySelectorAll('.paper-sheet').forEach(sheet => {
    sheet.style.removeProperty('--sheet-x'); sheet.style.removeProperty('--sheet-y');
    sheet.classList.remove('is-dragging');
  });
}
function finishGesture(cancelled = false) {
  if (!gesture) return;
  const previous = gesture;
  gesture = null;
  paperStage.classList.remove('is-dragging');
  previous.element.classList.remove('is-dragging');
  if (previous.element.hasPointerCapture(previous.id)) previous.element.releasePointerCapture(previous.id);
  resetSheetOffsets();
  suppressPeelClick = !cancelled && previous.moved;
  setTimeout(() => { suppressPeelClick = false; }, 0);
  if (cancelled) settlePeel(previous.returnTo);
  else if (previous.kind === 'peel') settlePeel(currentPeel > 1.48 ? 2.2 : 1);
}
function replayHero() {
  if (!hero || reducedMotion.matches) return;
  finishGesture(true); stopPeelLoop(); resetSheetOffsets();
  manualPaper = false; targetPeel = 1;
  markLayer('finish'); peelControl?.setAttribute('aria-expanded', 'false');
  stopPaperLoop(); hero.classList.remove('is-playing'); void hero.offsetWidth;
  drawPaper(.04); hero.classList.add('is-playing'); startPaperLoop();
}
function beginGesture(event, kind) {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || gesture) return;
  const element = event.currentTarget;
  const rect = paperFront.getBoundingClientRect();
  takePaperControl();
  const layer = kind === 'sheet' ? element.dataset.paperLayer : paperStage.dataset.layer === 'capture' ? 'capture' : 'mark';
  const returnTo = targetPeel > 1.5 ? 2.2 : 1;
  markLayer(layer);
  gesture = { element, kind, id:event.pointerId, x:event.clientX, y:event.clientY, progress:Math.max(currentPeel,1), width:rect.width, height:rect.height, moved:false, returnTo };
  paperStage.classList.add('is-dragging'); element.classList.add('is-dragging');
  element.setPointerCapture(event.pointerId);
  if (kind === 'sheet') settlePeel(2.2);
}
function moveGesture(event) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
  if (Math.hypot(dx,dy) > 5) gesture.moved = true;
  if (gesture.kind === 'peel') {
    const pull = (-dx / gesture.width - dy / gesture.height) * 1.65;
    drawPaper(clamp(gesture.progress + pull, 1, 2.2));
    targetPeel = currentPeel;
  } else {
    gesture.element.style.setProperty('--sheet-x', `${clamp(dx,-45,45)}px`);
    gesture.element.style.setProperty('--sheet-y', `${clamp(dy,-35,35)}px`);
  }
}
function bindGesture(element, kind) {
  element.addEventListener('pointerdown', event => beginGesture(event,kind));
  element.addEventListener('pointermove', moveGesture);
  element.addEventListener('pointerup', () => finishGesture());
  element.addEventListener('pointercancel', () => finishGesture(true));
  element.addEventListener('lostpointercapture', () => finishGesture(true));
  element.addEventListener('dragstart', event => event.preventDefault());
}
if (peelControl) {
  bindGesture(peelControl,'peel');
  peelControl.addEventListener('click', () => { if (!suppressPeelClick) { if (currentPeel > 1.5) chooseLayer('finish'); else chooseLayer('mark'); } });
  peelControl.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || gesture || targetPeel > 1.4 || hero.classList.contains('is-playing') || reducedMotion.matches || motionPaused) return;
    settlePeel(1.12);
  });
  peelControl.addEventListener('pointerleave', () => { if (!gesture && targetPeel < 1.4) settlePeel(1); });
  peelControl.addEventListener('keydown', event => {
    if (['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Home','End','Escape'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Escape' || event.key === 'Home') chooseLayer('finish');
      else { markLayer('mark'); settlePeel(event.key === 'End' ? 2.2 : clamp(currentPeel + (['ArrowLeft','ArrowUp'].includes(event.key) ? .24 : -.24),1,2.2)); }
    }
  });
  document.querySelectorAll('.paper-sheet').forEach(sheet => bindGesture(sheet,'sheet'));
  layerControls.forEach(button => button.addEventListener('click', () => { if (!suppressPeelClick) chooseLayer(button.dataset.paperLayer); }));
  paperStage.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); finishGesture(true); chooseLayer('finish'); peelControl.focus({preventScroll:true}); } });
  window.addEventListener('blur', () => finishGesture(true));
  window.addEventListener('resize', () => finishGesture(true), { passive:true });
}
motionToggle?.addEventListener('click', () => { motionPaused = !motionPaused; try {sessionStorage.setItem('xshot-motion-paused',String(motionPaused));} catch {} applyMotionPreference(); });
motionReplay?.addEventListener('click', () => { motionPaused=false; applyMotionPreference(); replayHero(); });
hero?.addEventListener('animationend', event => { if (event.animationName === 'paper-unfurl' && !manualPaper) { hero.classList.remove('is-playing'); stopPaperLoop(); drawPaper(1); } });
reducedMotion.addEventListener('change',applyMotionPreference);
applyMotionPreference();
if (hero) { Promise.all([document.fonts.ready,document.getElementById('hero-image').decode().catch(()=>{}),window.XShotPaper?.ready]).then(() => { drawPaper(manualPaper ? currentPeel : 1); if (!manualPaper && !motionPaused && !reducedMotion.matches) requestAnimationFrame(replayHero); }); }
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('motion-suspended',document.hidden);
  if (document.hidden) { finishGesture(true); stopPaperLoop(); stopPeelLoop(); }
  else if (manualPaper) settlePeel(targetPeel);
  else startPaperLoop();
});
if (hero && 'IntersectionObserver' in window) { new IntersectionObserver(([entry]) => {
  hero.classList.toggle('motion-suspended',!entry.isIntersecting);
  if (!entry.isIntersecting) { finishGesture(true); stopPaperLoop(); stopPeelLoop(); }
  else if (manualPaper) settlePeel(targetPeel);
  else startPaperLoop();
},{threshold:.05}).observe(hero); }

const featureButtons = [...document.querySelectorAll('[data-feature]')];
const features = {
  capture: { image: 'selection.webp', alt: ui.captureAlt, href: 'screenshots.html' },
  style: { image: 'beauty.webp', alt: ui.styleAlt, href: 'beautification.html' },
  pin: { image: 'pin.webp', alt: ui.pinAlt, href: 'beautification.html#pin' }
};
let featureRequest = 0;
async function showFeature(button, focus = false) {
  if (focus) button.focus();
  const request = ++featureRequest;
  const feature = features[button.dataset.feature];
  const panel = document.getElementById('feature-panel');
  panel.classList.add('is-changing'); panel.setAttribute('aria-busy', 'true');
  const image = new Image(); image.src = `${root}/assets/${feature.image}`;
  try { await image.decode(); } catch {
    if (request === featureRequest) { panel.classList.remove('is-changing'); panel.removeAttribute('aria-busy'); }
    return;
  }
  if (request !== featureRequest) return;
  featureButtons.forEach(item => { const selected = item === button; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
  const photo = document.getElementById('feature-image'); photo.src = image.src; photo.alt = feature.alt;
  document.getElementById('feature-guide').href = `./docs/${feature.href}`;
  panel.setAttribute('aria-labelledby', button.id);
  panel.classList.remove('is-changing', 'is-entering'); panel.removeAttribute('aria-busy');
  void panel.offsetWidth; panel.classList.add('is-entering');
}
featureButtons.forEach((button, index) => {
  button.addEventListener('click', () => showFeature(button));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % featureButtons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + featureButtons.length - 1) % featureButtons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = featureButtons.length - 1;
    if (next !== undefined) { event.preventDefault(); showFeature(featureButtons[next], true); }
  });
});
const folderToggle = document.getElementById('folder-toggle');
folderToggle?.addEventListener('click', () => {
  const expanded = folderToggle.getAttribute('aria-expanded') !== 'true';
  folderToggle.setAttribute('aria-expanded', String(expanded));
  document.getElementById('folder-content').hidden = !expanded;
});

const copyTimers = new WeakMap();
document.querySelectorAll('[data-copy]').forEach(button => {
  button.setAttribute('aria-live', 'polite');
  button.addEventListener('click', async () => {
    clearTimeout(copyTimers.get(button));
    const code = document.getElementById(button.dataset.copy);
    button.disabled = true; button.textContent = ui.copying;
    let timeout;
    try {
      await Promise.race([navigator.clipboard.writeText(code.textContent), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Clipboard unavailable')), 1500); })]);
      button.textContent = ui.copied;
    } catch {
      const selection = getSelection(); const range = document.createRange();
      range.selectNodeContents(code); selection.removeAllRanges(); selection.addRange(range);
      button.textContent = ui.fallback;
    }
    clearTimeout(timeout); button.disabled = false;
    copyTimers.set(button, setTimeout(() => { button.textContent = ui.copy; }, 2600));
  });
});
const docsDirectory = document.querySelector('.docs-sidebar details');
const narrowScreen = matchMedia('(max-width: 760px)');
if (docsDirectory) { docsDirectory.open = !narrowScreen.matches; narrowScreen.addEventListener('change', event => { docsDirectory.open = !event.matches; }); }
const searchInput = document.getElementById('docs-search');
const searchResults = document.getElementById('search-results');
let searchIndex;
if (searchInput && searchResults) {
  const status = document.getElementById('search-status');
  async function search() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    searchResults.replaceChildren(); searchResults.hidden = !query;
    if (!query) { status.textContent = ''; return; }
    try {
      searchIndex ??= await fetch(`${localeRoot}/search-index.json`).then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); });
      if (query !== searchInput.value.trim().toLocaleLowerCase()) return;
      const words = query.split(/\s+/);
      const matches = searchIndex.filter(item => words.every(word => `${item.title} ${item.description} ${item.text}`.toLocaleLowerCase().includes(word)));
      status.textContent = matches.length ? ui.found(matches.length) : ui.empty;
      matches.forEach(item => {
        const link = document.createElement('a'); link.href = `${localeRoot}/docs/${item.slug}.html`;
        const title = document.createElement('strong'); title.textContent = item.title;
        const description = document.createElement('span'); description.textContent = item.description;
        link.append(title, description); searchResults.append(link);
      });
    } catch { status.textContent = ui.unavailable; }
  }
  searchInput.addEventListener('input', search);
  searchInput.addEventListener('keydown', event => { if (event.key === 'Escape') { searchInput.value = ''; search(); } });
}
const tocLinks = [...document.querySelectorAll('.page-toc a')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      tocLinks.forEach(link => { if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    }
  }, { rootMargin: '-12% 0px -65% 0px' });
  document.querySelectorAll('.doc-article h2[id]').forEach(heading => observer.observe(heading));
}
