import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0GtGE5tQQpikwfxT2TCp3DCoLtn_vhMY",
  authDomain: "myweb-6bc43.firebaseapp.com",
  projectId: "myweb-6bc43",
  storageBucket: "myweb-6bc43.firebasestorage.app",
  messagingSenderId: "768257772155",
  appId: "1:768257772155:web:07979a738c71eaf9ae70de",
  measurementId: "G-23WPL35T12",
  databaseURL: "https://myweb-6bc43-default-rtdb.firebaseio.com" // 방금 만드신 주소입니다!
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const postsRef = ref(db, 'posts');

document.addEventListener('DOMContentLoaded', () => {
    initRevealAnimation();
    initAntiGravityControl();
    loadPosts(); 
});

/* --- 기존 애니메이션 함수 유지 --- */
function initRevealAnimation() {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function initAntiGravityControl() {
    const floatTarget = document.querySelector('.anti-gravity-wrapper');
    if (floatTarget) {
        floatTarget.addEventListener('mouseenter', () => floatTarget.style.animationDuration = '2s');
        floatTarget.addEventListener('mouseleave', () => floatTarget.style.animationDuration = '6s');
    }
}

/* --- Firebase 게시판 핵심 로직 --- */
window.toggleForm = function() {
    const form = document.getElementById('write-form');
    if (form) form.style.display = (form.style.display === 'none' || form.style.display === '') ? 'block' : 'none';
};

window.submitPost = function() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;

    if (!title || !author) return alert("제목과 작성자를 입력해 주세요.");

    push(postsRef, {
        title: title,
        author: author,
        content: content,
        date: new Date().toLocaleDateString('ko-KR')
    }).then(() => {
        alert("서버에 글이 등록되었습니다!");
        document.getElementById('title').value = '';
        document.getElementById('author').value = '';
        document.getElementById('content').value = '';
        window.toggleForm();
    });
};

function loadPosts() {
    const boardList = document.getElementById('board-list');
    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        boardList.innerHTML = '';
        if (!data) {
            boardList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">첫 게시글을 남겨보세요!</td></tr>';
            return;
        }
        Object.keys(data).reverse().forEach(key => {
            const post = data[key];
            boardList.innerHTML += `
                <tr>
                    <td>-</td>
                    <td style="cursor:pointer; font-weight:bold; color:#007bff;" onclick="alert('내용: ${post.content}')">${post.title}</td>
                    <td>${post.author}</td>
                    <td>${post.date}</td>
                </tr>`;
        });
    });
}
