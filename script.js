import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyC0GtGE5tQQpikwfxT2TCp3DCoLtn_vhMY",
  authDomain: "myweb-6bc43.firebaseapp.com",
  projectId: "myweb-6bc43",
  storageBucket: "myweb-6bc43.firebasestorage.app",
  messagingSenderId: "768257772155",
  appId: "1:768257772155:web:07979a738c71eaf9ae70de",
  measurementId: "G-23WPL35T12",
  databaseURL: "https://myweb-6bc43-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const postsRef = ref(db, 'posts');

// 모든 페이지 공통 초기화
document.addEventListener('DOMContentLoaded', () => {
    initRevealAnimation();
    initAntiGravityControl();
    // 게시판 리스트가 있는 페이지(board.html)에서만 실행
    if (document.getElementById('board-list')) {
        loadPosts();
    }
});

/* --- 1. 애니메이션 & 효과 (Home, Projects, Class 공통) --- */
function initRevealAnimation() {
    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, observerOptions);
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function initAntiGravityControl() {
    const floatTarget = document.querySelector('.anti-gravity-wrapper');
    if (floatTarget) {
        floatTarget.addEventListener('mouseenter', () => floatTarget.style.animationDuration = '2s');
        floatTarget.addEventListener('mouseleave', () => floatTarget.style.animationDuration = '6s');
    }
}

/* --- 2. 게시판 기능 (window 객체에 등록하여 전역 사용 가능하게 함) --- */
window.toggleForm = function() {
    const form = document.getElementById('write-form');
    if (!form) return;
    const isHidden = (form.style.display === 'none' || form.style.display === '');
    form.style.display = isHidden ? 'block' : 'none';
    if (isHidden) form.scrollIntoView({ behavior: 'smooth' });
};

window.submitPost = function() {
    const titleEl = document.getElementById('title');
    const authorEl = document.getElementById('author');
    const contentEl = document.getElementById('content');

    if (!titleEl.value || !authorEl.value) {
        alert('제목과 작성자를 입력해주세요.');
        return;
    }

    push(postsRef, {
        title: titleEl.value,
        author: authorEl.value,
        content: contentEl.value,
        date: new Date().toLocaleDateString('ko-KR')
    }).then(() => {
        alert("성공적으로 등록되었습니다!");
        titleEl.value = '';
        authorEl.value = '';
        contentEl.value = '';
        window.toggleForm();
    }).catch(err => {
        console.error(err);
        alert("오류 발생: " + err.message);
    });
};

function loadPosts() {
    const boardList = document.getElementById('board-list');
    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        boardList.innerHTML = '';
        if (!data) {
            boardList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">게시글이 없습니다.</td></tr>';
            return;
        }
        Object.keys(data).reverse().forEach(key => {
            const post = data[key];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>-</td>
                <td style="cursor:pointer; font-weight:bold; color:#007bff;" onclick="alert('내용: ${post.content}')">${post.title}</td>
                <td>${post.author}</td>
                <td>${post.date}</td>
            `;
            boardList.appendChild(row);
        });
    });
}
