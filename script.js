/**
 * 류재정 로봇 자동화 포트폴리오 - 인터랙티브 엔진 (LocalStorage 통합 버전)
 */

document.addEventListener('DOMContentLoaded', () => {
    initRevealAnimation();
    initAntiGravityControl();
    // 페이지 로드 시 저장된 게시글 불러오기
    loadPosts(); 
});

/**
 * 1. 스크롤 애니메이션 (기존 기능 유지)
 */
function initRevealAnimation() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/**
 * 2. 마우스 상호작용 부유 효과 (기존 기능 유지)
 */
function initAntiGravityControl() {
    const floatTarget = document.querySelector('.anti-gravity-wrapper');
    if (floatTarget) {
        floatTarget.addEventListener('mouseenter', () => {
            floatTarget.style.animationDuration = '2s';
        });
        floatTarget.addEventListener('mouseleave', () => {
            floatTarget.style.animationDuration = '6s';
        });
    }
}

/**
 * 3. 게시판 기능 (LocalStorage 연동)
 */

// 글쓰기 폼 토글
function toggleForm() {
    const form = document.getElementById('write-form');
    if (!form) return;
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

// 게시글 저장
function submitPost() {
    const titleEl = document.getElementById('title');
    const authorEl = document.getElementById('author');
    const contentEl = document.getElementById('content');

    if (!titleEl.value || !authorEl.value) {
        alert('제목과 작성자 정보를 모두 입력해 주세요.');
        return;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const newPost = {
        id: Date.now(),
        title: titleEl.value,
        author: authorEl.value,
        content: contentEl.value,
        date: dateStr
    };

    // 로컬 스토리지 데이터 처리
    const posts = JSON.parse(localStorage.getItem('boardPosts')) || [];
    posts.unshift(newPost);
    localStorage.setItem('boardPosts', JSON.stringify(posts));

    alert(`[시스템] '${authorEl.value}' 님의 게시글이 등록되었습니다.`);
    
    // 초기화
    titleEl.value = '';
    authorEl.value = '';
    contentEl.value = '';
    toggleForm();
    loadPosts();
}

// 게시글 목록 불러오기
function loadPosts() {
    const boardList = document.getElementById('board-list');
    if (!boardList) return;

    const posts = JSON.parse(localStorage.getItem('boardPosts')) || [];
    boardList.innerHTML = '';

    if (posts.length === 0) {
        boardList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">등록된 게시글이 없습니다.</td></tr>';
        return;
    }

    posts.forEach((post, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${posts.length - index}</td>
            <td style="cursor:pointer; color:#3498db; font-weight:bold;" onclick="viewPost(${post.id})">${post.title}</td>
            <td>${post.author}</td>
            <td>${post.date}</td>
        `;
        boardList.appendChild(row);
    });
}

// 게시글 상세 보기
function viewPost(postId) {
    const posts = JSON.parse(localStorage.getItem('boardPosts')) || [];
    const post = posts.find(p => p.id === postId);
    if (post) {
        alert(`제목: ${post.title}\n작성자: ${post.author}\n날짜: ${post.date}\n\n내용:\n${post.content}`);
    }
}
