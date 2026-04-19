import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue, query, orderByKey } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 류재정님의 Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyC0GtGE5tQQpikwfxT2TCp3DCoLtn_vhMY",
  authDomain: "myweb-6bc43.firebaseapp.com",
  projectId: "myweb-6bc43",
  storageBucket: "myweb-6bc43.firebasestorage.app",
  messagingSenderId: "768257772155",
  appId: "1:768257772155:web:07979a738c71eaf9ae70de",
  measurementId: "G-23WPL35T12",
  databaseURL: "https://myweb-6bc43-default-rtdb.firebaseio.com" // 자동 생성되는 DB 주소 형식
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const postsRef = ref(db, 'posts');

document.addEventListener('DOMContentLoaded', () => {
    initRevealAnimation();
    initAntiGravityControl();
    loadPosts(); // 실시간 데이터 로드 시작
});

/* --- 기존 애니메이션 함수 (유지) --- */
function initRevealAnimation() {
    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
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

/* --- 게시판 제어 함수 (전역 등록 필수) --- */
// type="module"에서는 함수를 전역에서 쓰려면 window객체에 붙여줘야 합니다.
window.toggleForm = function() {
    const form = document.getElementById('write-form');
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    if (isHidden) form.scrollIntoView({ behavior: 'smooth' });
}

window.submitPost = function() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;

    if (!title || !author) {
        alert('제목과 작성자 정보를 모두 입력해 주세요.');
        return;
    }

    // Firebase Realtime Database에 저장
    push(postsRef, {
        title: title,
        author: author,
        content: content,
        date: new Date().toLocaleDateString('ko-KR')
    }).then(() => {
        alert("게시글이 전 서버에 공유되었습니다!");
        document.getElementById('title').value = '';
        document.getElementById('author').value = '';
        document.getElementById('content').value = '';
        window.toggleForm();
    }).catch((error) => {
        console.error("저장 실패:", error);
        alert("저장 실패! Firebase 콘솔에서 '보안 규칙'을 테스트 모드로 바꿨는지 확인하세요.");
    });
}

// 실시간 데이터 불러오기
function loadPosts() {
    const boardList = document.getElementById('board-list');
    if (!boardList) return;

    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        boardList.innerHTML = ''; 

        if (!data) {
            boardList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">등록된 게시글이 없습니다.</td></tr>';
            return;
        }

        // 데이터를 배열로 변환 후 최신순 정렬
        const postsArray = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();

        postsArray.forEach((post, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${postsArray.length - index}</td>
                <td style="cursor:pointer; color:#3498db; font-weight:bold;" onclick="alert('내용: ${post.content}')">${post.title}</td>
                <td>${post.author}</td>
                <td>${post.date}</td>
            `;
            boardList.appendChild(row);
        });
    });
}
