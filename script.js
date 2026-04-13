/**
 * 류재정 로봇 자동화 포트폴리오 - 인터랙티브 엔진
 */

document.addEventListener('DOMContentLoaded', () => {
    initRevealAnimation();
    initAntiGravityControl();
    initBoardForm();
});

/**
 * 스크롤 감지에 따른 요소 등장 효과 (Intersection Observer)
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
 * 마우스 상호작용에 따른 부유 효과 제어
 */
function initAntiGravityControl() {
    const floatTarget = document.querySelector('.anti-gravity-wrapper');
    
    if (floatTarget) {
        floatTarget.addEventListener('mouseenter', () => {
            // 마우스 호버 시 엔진 출력 증가 (속도 상승)
            floatTarget.style.animationDuration = '2s';
        });

        floatTarget.addEventListener('mouseleave', () => {
            // 마우스 이탈 시 안정 모드 복귀
            floatTarget.style.animationDuration = '6s';
        });
    }
}

/**
 * 게시판 UI 제어 로직
 */
function toggleForm() {
    const form = document.getElementById('write-form');
    const isHidden = form.style.display === 'none';
    
    form.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

function submitPost() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;

    if (!title || !author) {
        alert('제목과 작성자 정보를 모두 입력해 주세요.');
        return;
    }

    // 테이블에 새 글을 화면 상에 추가 (새로고침 전까지는 유지됨)
    const boardList = document.getElementById('board-list');
    const rowCount = boardList.getElementsByTagName('tr').length + 1;
    
    // 현재 날짜 구하기
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 새 행(tr) 생성 및 내용 삽입
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td>${title}</td>
        <td>${author}</td>
        <td>${dateStr}</td>
    `;
    boardList.prepend(newRow); // 맨 위에 추가

    // 알림 메시지
    alert(`[시스템 알림] \n'${author}' 님의 게시글 "${title}"이(가) 등록되었습니다. \n(현재 데이터베이스가 연결되어 있지 않아 화면에만 임시 표시되며, 새로고침 시 초기화됩니다.)`);
    
    // 입력 폼 초기화 및 숨기기
    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('content').value = '';
    toggleForm();
}
