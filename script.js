// =============================
// Mouse-follow XYZ Robot Arm Simulator - Canvas 3D Projection
// =============================
const canvas = document.getElementById('robotCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const resetBtn = document.getElementById('resetBtn');
const xValue = document.getElementById('xValue');
const yValue = document.getElementById('yValue');
const zValue = document.getElementById('zValue');
const coordReadout = document.getElementById('coordReadout');

const armLengths = { upper: 145, lower: 125 };
const defaultTarget = { x: 145, y: 55, z: 80 };
let desiredTarget = { ...defaultTarget };
let currentTarget = { ...defaultTarget };
let pointerActive = false;
let animationStarted = false;

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t){
  return a + (b - a) * t;
}

function resizeCanvas(){
  if(!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(320, Math.floor(rect.width * dpr));
  canvas.height = Math.max(240, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawRobot();
}

function getCanvasSize(){
  const rect = canvas.getBoundingClientRect();
  return { w: rect.width, h: rect.height };
}

function pointerToTarget(event){
  if(!canvas) return { ...defaultTarget };
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX) ?? rect.left + rect.width / 2;
  const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY) ?? rect.top + rect.height / 2;
  const nx = clamp((clientX - rect.left) / rect.width, 0, 1);
  const ny = clamp((clientY - rect.top) / rect.height, 0, 1);

  // 2D pointer position을 간단한 3D 작업공간 좌표로 변환합니다.
  // 가로 이동 → X, 세로 이동 → Y 깊이 + Z 높이 변화
  return {
    x: Math.round(40 + nx * 215),
    y: Math.round(125 - ny * 245),
    z: Math.round(180 - ny * 175)
  };
}

function project3D(point){
  const { w, h } = getCanvasSize();
  const scale = Math.min(w / 520, h / 360);
  const originX = w * 0.46;
  const originY = h * 0.72;
  return {
    x: originX + (point.x - point.y) * 0.78 * scale,
    y: originY + (point.x + point.y) * 0.30 * scale - point.z * 0.92 * scale
  };
}

function drawLine3D(a, b, color, width = 3){
  const pa = project3D(a);
  const pb = project3D(b);
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawPoint3D(point, radius, fill, stroke = 'rgba(255,255,255,.95)'){
  const pnt = project3D(point);
  ctx.beginPath();
  ctx.arc(pnt.x, pnt.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawText3D(text, point, color){
  const pnt = project3D(point);
  ctx.font = '800 14px Arial';
  ctx.fillStyle = color;
  ctx.fillText(text, pnt.x + 8, pnt.y - 8);
}

function solveIK(target){
  const L1 = armLengths.upper;
  const L2 = armLengths.lower;
  const yaw = Math.atan2(target.y, target.x);
  const r = Math.sqrt(target.x * target.x + target.y * target.y);
  const z = target.z;
  const rawDistance = Math.sqrt(r * r + z * z);
  const distance = Math.min(rawDistance, L1 + L2 - 2);
  const ratio = distance / Math.max(rawDistance, 1);
  const clampedR = Math.max(r * ratio, 1);
  const clampedZ = z * ratio;

  let cosElbow = (distance * distance - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  cosElbow = Math.max(-1, Math.min(1, cosElbow));
  const elbow = -Math.acos(cosElbow);
  const shoulder = Math.atan2(clampedZ, clampedR) - Math.atan2(L2 * Math.sin(elbow), L1 + L2 * Math.cos(elbow));

  const p0 = { x: 0, y: 0, z: 0 };
  const p1 = {
    x: Math.cos(yaw) * Math.cos(shoulder) * L1,
    y: Math.sin(yaw) * Math.cos(shoulder) * L1,
    z: Math.sin(shoulder) * L1
  };
  const p2 = {
    x: p1.x + Math.cos(yaw) * Math.cos(shoulder + elbow) * L2,
    y: p1.y + Math.sin(yaw) * Math.cos(shoulder + elbow) * L2,
    z: p1.z + Math.sin(shoulder + elbow) * L2
  };
  return { p0, p1, p2, yaw, shoulder, elbow };
}

function drawGrid(){
  const gridColor = 'rgba(255,255,255,.08)';
  for(let i = -200; i <= 260; i += 40){
    drawLine3D({x:i,y:-160,z:0},{x:i,y:180,z:0},gridColor,1);
    drawLine3D({x:-80,y:i,z:0},{x:270,y:i,z:0},gridColor,1);
  }
  drawLine3D({x:0,y:0,z:0},{x:250,y:0,z:0},'rgba(255,70,70,.95)',4);
  drawLine3D({x:0,y:0,z:0},{x:0,y:170,z:0},'rgba(80,255,80,.95)',4);
  drawLine3D({x:0,y:0,z:0},{x:0,y:0,z:190},'rgba(0,230,255,.95)',4);
  drawText3D('X', {x:255,y:0,z:0}, 'rgba(255,90,90,1)');
  drawText3D('Y', {x:0,y:178,z:0}, 'rgba(90,255,90,1)');
  drawText3D('Z', {x:0,y:0,z:198}, 'rgba(0,230,255,1)');
}

function drawRobot(){
  if(!ctx || !canvas) return;
  const { w, h } = getCanvasSize();
  ctx.clearRect(0, 0, w, h);

  const target = currentTarget;
  const ik = solveIK(target);

  drawGrid();

  // mouse target marker and guide line
  drawLine3D({x:target.x,y:target.y,z:0}, target, 'rgba(124,255,58,.35)', 2);
  drawPoint3D({x:target.x,y:target.y,z:0}, 4, 'rgba(124,255,58,.35)', 'rgba(124,255,58,.6)');
  drawPoint3D(target, pointerActive ? 10 : 8, 'rgba(124,255,58,1)', 'rgba(255,255,255,.95)');
  drawText3D(pointerActive ? 'Mouse Target' : 'Target', {x:target.x,y:target.y,z:target.z + 18}, 'rgba(124,255,58,1)');

  // robot shadow
  const base2D = project3D({x:0,y:0,z:0});
  ctx.beginPath();
  ctx.ellipse(base2D.x, base2D.y + 16, 76, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fill();

  // robot links with dark outline + metallic highlight
  drawLine3D(ik.p0, ik.p1, 'rgba(29,43,62,.98)', 24);
  drawLine3D(ik.p0, ik.p1, 'rgba(230,239,248,.96)', 15);
  drawLine3D(ik.p1, ik.p2, 'rgba(29,43,62,.98)', 21);
  drawLine3D(ik.p1, ik.p2, 'rgba(230,239,248,.96)', 13);

  drawPoint3D(ik.p0, 19, 'rgba(211,226,242,1)', 'rgba(18,30,45,1)');
  drawPoint3D(ik.p1, 17, 'rgba(211,226,242,1)', 'rgba(18,30,45,1)');
  drawPoint3D(ik.p2, 13, 'rgba(124,255,58,1)', 'rgba(255,255,255,.95)');

  const end = project3D(ik.p2);
  ctx.strokeStyle = 'rgba(124,255,58,.9)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(end.x + 8, end.y - 10);
  ctx.lineTo(end.x + 34, end.y - 22);
  ctx.moveTo(end.x + 8, end.y + 10);
  ctx.lineTo(end.x + 34, end.y + 22);
  ctx.stroke();

  const sx = Math.round(ik.p2.x);
  const sy = Math.round(ik.p2.y);
  const sz = Math.round(ik.p2.z);
  if(xValue) xValue.textContent = Math.round(target.x);
  if(yValue) yValue.textContent = Math.round(target.y);
  if(zValue) zValue.textContent = Math.round(target.z);
  if(coordReadout) coordReadout.textContent = `End Effector : X ${sx} · Y ${sy} · Z ${sz}`;
}

function animateRobot(){
  currentTarget.x = lerp(currentTarget.x, desiredTarget.x, .16);
  currentTarget.y = lerp(currentTarget.y, desiredTarget.y, .16);
  currentTarget.z = lerp(currentTarget.z, desiredTarget.z, .16);
  drawRobot();
  requestAnimationFrame(animateRobot);
}

function handlePointerMove(event){
  desiredTarget = pointerToTarget(event);
  pointerActive = true;
}

if(canvas){
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerdown', event => {
    canvas.setPointerCapture?.(event.pointerId);
    handlePointerMove(event);
  });
  canvas.addEventListener('pointerleave', () => { pointerActive = false; });
  canvas.addEventListener('focus', () => { pointerActive = true; });
  canvas.addEventListener('blur', () => { pointerActive = false; });
  canvas.addEventListener('keydown', event => {
    const step = event.shiftKey ? 18 : 8;
    if(event.key === 'ArrowRight') desiredTarget.x = clamp(desiredTarget.x + step, 40, 255);
    if(event.key === 'ArrowLeft') desiredTarget.x = clamp(desiredTarget.x - step, 40, 255);
    if(event.key === 'ArrowUp') desiredTarget.z = clamp(desiredTarget.z + step, 5, 180);
    if(event.key === 'ArrowDown') desiredTarget.z = clamp(desiredTarget.z - step, 5, 180);
    if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();
      pointerActive = true;
    }
  });
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  if(!animationStarted){
    animationStarted = true;
    requestAnimationFrame(animateRobot);
  }
}

if(resetBtn){
  resetBtn.addEventListener('click', () => {
    desiredTarget = { ...defaultTarget };
    currentTarget = { ...defaultTarget };
    pointerActive = false;
    drawRobot();
  });
}

// =============================
// Scroll Reveal Animation
// =============================
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) entry.target.classList.add('show');
  });
}, { threshold: .12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// =============================
// Firebase Realtime Database Q&A Board + Separated Gmail Contact
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyC0GtGE5tQQpikwfxT2TCp3DCoLtn_vhMY",
  authDomain: "myweb-6bc43.firebaseapp.com",
  databaseURL: "https://myweb-6bc43-default-rtdb.firebaseio.com",
  projectId: "myweb-6bc43",
  storageBucket: "myweb-6bc43.firebasestorage.app",
  messagingSenderId: "768257772155",
  appId: "1:768257772155:web:07979a738c71eaf9ae70de",
  measurementId: "G-23WPL35T12"
};

const boardForm = document.getElementById('boardForm');
const boardStatus = document.getElementById('boardStatus');
const feedbackList = document.getElementById('feedbackList');
const boardNameInput = document.getElementById('boardNameInput');
const boardPasswordInput = document.getElementById('boardPasswordInput');
const boardTitleInput = document.getElementById('boardTitleInput');
const boardMessageInput = document.getElementById('boardMessageInput');

const gmailForm = document.getElementById('gmailForm');
const mailStatus = document.getElementById('mailStatus');
const mailNameInput = document.getElementById('mailNameInput');
const mailEmailInput = document.getElementById('mailEmailInput');
const mailSubjectInput = document.getElementById('mailSubjectInput');
const mailMessageInput = document.getElementById('mailMessageInput');

let commentsRef = null;
let firebaseReady = false;
let currentComments = {};

function setBoardStatus(message, isError = false){
  if(!boardStatus) return;
  boardStatus.textContent = message;
  boardStatus.style.color = isError ? '#ff7b7b' : 'var(--point)';
}

function setMailStatus(message, isError = false){
  if(!mailStatus) return;
  mailStatus.textContent = message;
  mailStatus.style.color = isError ? '#ff7b7b' : 'var(--point)';
}

function escapeHTML(text){
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(time){
  try{
    return new Date(time).toLocaleString('ko-KR', {
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit'
    });
  }catch(e){
    return '';
  }
}

async function hashPassword(password){
  const value = String(password || '');
  if(window.crypto && window.crypto.subtle){
    const data = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  return btoa(unescape(encodeURIComponent(value)));
}

function getLocalComments(){
  return JSON.parse(localStorage.getItem('physicalAIQnAComments') || '[]');
}

function setLocalComments(items){
  localStorage.setItem('physicalAIQnAComments', JSON.stringify(items));
}

function renderComments(items){
  if(!feedbackList) return;

  currentComments = {};
  items.forEach(item => {
    currentComments[item.id] = item;
  });

  if(!items.length){
    feedbackList.innerHTML = '<div class="feedback-empty">아직 등록된 Q&A가 없습니다. 첫 질문을 남겨보세요.</div>';
    return;
  }

  feedbackList.innerHTML = items.map(item => `
    <article class="feedback-item" data-id="${escapeHTML(item.id)}">
      <header>
        <div class="feedback-meta">
          <b>${escapeHTML(item.name)}</b>
          <span>${formatDate(item.createdAt)}</span>
        </div>
      </header>
      <strong class="feedback-title">${escapeHTML(item.title || '제목 없음')}</strong>
      <p>${escapeHTML(item.message)}</p>
      <div class="feedback-actions">
        <button type="button" class="delete-button" data-id="${escapeHTML(item.id)}">삭제</button>
      </div>
    </article>
  `).join('');
}

function loadLocalFallback(){
  const saved = getLocalComments();
  renderComments(saved);
}

function saveLocalFallback(comment){
  const saved = getLocalComments();
  saved.unshift(comment);
  setLocalComments(saved);
  renderComments(saved);
}

function deleteLocalFallback(id){
  const saved = getLocalComments().filter(item => item.id !== id);
  setLocalComments(saved);
  renderComments(saved);
}

function initFirebaseBoard(){
  if(!boardForm || !feedbackList) return;

  try{
    if(typeof firebase === 'undefined'){
      setBoardStatus('Firebase 스크립트를 불러오지 못해 임시 저장 방식으로 동작합니다.', true);
      loadLocalFallback();
      return;
    }

    firebase.initializeApp(firebaseConfig);
    commentsRef = firebase.database().ref('physical_ai_qna_board');
    firebaseReady = true;

    commentsRef.orderByChild('createdAt').limitToLast(50).on('value', snapshot => {
      const data = snapshot.val() || {};
      const items = Object.keys(data)
        .map(key => ({ id:key, ...data[key] }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderComments(items);
    });

    setBoardStatus('Firebase Q&A 게시판이 연결되었습니다.');
  }catch(error){
    console.error(error);
    setBoardStatus('Firebase 연결에 실패해 임시 저장 방식으로 동작합니다.', true);
    loadLocalFallback();
  }
}

if(boardForm){
  boardForm.addEventListener('submit', async event => {
    event.preventDefault();

    const name = boardNameInput.value.trim();
    const password = boardPasswordInput.value.trim();
    const title = boardTitleInput.value.trim();
    const message = boardMessageInput.value.trim();

    if(!name || !password || !title || !message){
      setBoardStatus('이름, 비밀번호, 제목, 내용을 모두 입력해주세요.', true);
      return;
    }

    const comment = {
      id: `local_${Date.now()}`,
      name,
      title,
      message,
      passwordHash: await hashPassword(password),
      createdAt: Date.now()
    };

    try{
      if(firebaseReady && commentsRef){
        const firebaseComment = { ...comment };
        delete firebaseComment.id;
        await commentsRef.push(firebaseComment);
        setBoardStatus('Q&A 게시판에 등록되었습니다.');
      }else{
        saveLocalFallback(comment);
        setBoardStatus('임시 저장소에 등록되었습니다.');
      }
      boardForm.reset();
    }catch(error){
      console.error(error);
      setBoardStatus('등록에 실패했습니다. Firebase Database 규칙을 확인해주세요.', true);
    }
  });
}

if(feedbackList){
  feedbackList.addEventListener('click', async event => {
    const deleteButton = event.target.closest('.delete-button');
    if(!deleteButton) return;

    const id = deleteButton.dataset.id;
    const item = currentComments[id];
    if(!item){
      setBoardStatus('삭제할 게시글 정보를 찾을 수 없습니다.', true);
      return;
    }

    const password = window.prompt('게시글 작성 시 입력한 비밀번호를 입력하세요.');
    if(password === null) return;

    const inputHash = await hashPassword(password.trim());
    if(inputHash !== item.passwordHash){
      setBoardStatus('비밀번호가 일치하지 않습니다.', true);
      return;
    }

    try{
      if(firebaseReady && commentsRef && !String(id).startsWith('local_')){
        await commentsRef.child(id).remove();
      }else{
        deleteLocalFallback(id);
      }
      setBoardStatus('게시글이 삭제되었습니다.');
    }catch(error){
      console.error(error);
      setBoardStatus('삭제에 실패했습니다. Firebase Database 규칙을 확인해주세요.', true);
    }
  });
}

// =============================
// Gmail Compose Form
// =============================
if(gmailForm){
  gmailForm.addEventListener('submit', event => {
    event.preventDefault();

    const name = mailNameInput.value.trim() || '방문자';
    const email = mailEmailInput.value.trim();
    const subject = mailSubjectInput.value.trim() || 'Physical AI 홈페이지 문의';
    const message = mailMessageInput.value.trim();

    if(!message){
      setMailStatus('Gmail로 보낼 내용을 먼저 입력해주세요.', true);
      mailMessageInput.focus();
      return;
    }

    const body = `이름: ${name}\n답장 이메일: ${email || '미입력'}\n\n문의 내용:\n${message}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=jerryryu0902@dongyang.ac.kr&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    setMailStatus('Gmail 작성창을 열었습니다. 전송 버튼은 Gmail에서 직접 눌러주세요.');
  });
}

initFirebaseBoard();

// =============================
// Active navigation highlight for scroll storytelling
// =============================
const navLinks = document.querySelectorAll('.nav-link');
const navSections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateActiveNav(){
  const scrollPoint = window.scrollY + 140;
  let currentId = navSections[0] ? navSections[0].id : '';
  navSections.forEach(section => {
    if(section.offsetTop <= scrollPoint) currentId = section.id;
  });
  navLinks.forEach(link => {
    const isActive = link.getAttribute('href') === `#${currentId}`;
    link.classList.toggle('active', isActive);
    if(isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', updateActiveNav, { passive:true });
window.addEventListener('load', updateActiveNav);
updateActiveNav();
