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

    // 데모 버전 메시지
    alert(`[시스템 알림] \n'${author}' 님의 게시글 "${title}"이(가) 성공적으로 임시 등록되었습니다. \n(포트폴리오 데모 버전은 실제 DB와 연동되지 않습니다.)`);
    
    // 입력 폼 초기화 및 숨기기
    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('content').value = '';
    toggleForm();
}
